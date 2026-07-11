-- ═══════════════════════════════════════════════════════════════════════════
-- OFM (Off-Market Private Exchange) RLS LOCKDOWN (2026-07-11)
-- ═══════════════════════════════════════════════════════════════════════════
-- PROBLEM: every ofm_* table (listings, requests, matches, messages, media)
-- was created with SELECT/UPDATE/DELETE policies of `USING (true)` with no
-- ownership check at all. Since there's no real Supabase Auth session behind
-- these anonymous lister/requester tokens (they're plain client-generated
-- strings), any unauthenticated REST call could:
--   - dump every listing's Title Deed/Emirates ID scans and phone numbers
--     (GET /ofm_listings?select=doc1_base64,doc2_base64,phone)
--   - read every private negotiation chat message platform-wide
--   - advance/reject/complete any match, or delete any lister's photos
--   - post chat messages under a false sender_role/sender_token
-- This directly contradicts the OFM's own "hidden, never publicly
-- browsable" design.
--
-- FIX:
--   - Reads that need an ownership check now go through SECURITY DEFINER
--     RPCs that take the caller's token as an explicit parameter and verify
--     it against the row before returning anything (same pattern as the
--     admin_* RPCs). Direct anon SELECT on the base tables is revoked.
--   - The one read that's *intentionally* public (the blind-matching scan
--     across all active listings/requests) is exposed through narrow
--     column-limited views instead of the full table.
--   - Inserts that need an ownership check (chat messages, media uploads)
--     are enforced with a plain WITH CHECK subquery against ofm_matches —
--     no RPC or client change needed for those.
--   - Match mutation (approve/reject/advance stage) goes through a single
--     ofm_update_match() RPC that verifies the caller is a party to the
--     match before applying any change.
--
-- Run this in Supabase Dashboard → SQL Editor. Safe to re-run (idempotent).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- ofm_listings: revoke direct anon SELECT, add narrow public scan view +
-- owner-only RPCs.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS ofm_listings_anon_read ON ofm_listings;
CREATE POLICY ofm_listings_anon_read ON ofm_listings FOR SELECT TO anon USING (false);

CREATE OR REPLACE VIEW ofm_listings_scan AS
SELECT id, lister_token, building, beds, asking_price, purpose
FROM ofm_listings
WHERE active = true;
GRANT SELECT ON ofm_listings_scan TO anon, authenticated;

CREATE OR REPLACE FUNCTION ofm_my_listings(p_token text)
RETURNS SETOF ofm_listings
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM ofm_listings WHERE lister_token = p_token ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION ofm_my_listings(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION ofm_listing_detail(p_listing_id uuid, p_token text)
RETURNS SETOF ofm_listings
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM ofm_listings WHERE id = p_listing_id AND lister_token = p_token;
$$;
GRANT EXECUTE ON FUNCTION ofm_listing_detail(uuid, text) TO anon, authenticated;

-- Cross-party read: lister views the anonymized requirements of a requester
-- they've actually been matched with (not just any request in the system).
CREATE OR REPLACE FUNCTION ofm_request_via_match(p_request_id uuid, p_lister_token text)
RETURNS SETOF ofm_requests
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT r.* FROM ofm_requests r
  WHERE r.id = p_request_id
    AND EXISTS (
      SELECT 1 FROM ofm_matches m
      WHERE m.request_id = r.id AND m.lister_token = p_lister_token
    );
$$;
GRANT EXECUTE ON FUNCTION ofm_request_via_match(uuid, text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ofm_requests: revoke direct anon SELECT, add narrow public scan view +
-- owner-only RPC. (ofm_request_via_match above covers the cross-party case.)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS ofm_requests_anon_read ON ofm_requests;
CREATE POLICY ofm_requests_anon_read ON ofm_requests FOR SELECT TO anon USING (false);

CREATE OR REPLACE VIEW ofm_requests_scan AS
SELECT id, requester_token, building, beds, max_budget, purpose
FROM ofm_requests
WHERE active = true;
GRANT SELECT ON ofm_requests_scan TO anon, authenticated;

CREATE OR REPLACE FUNCTION ofm_my_requests(p_token text)
RETURNS SETOF ofm_requests
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM ofm_requests WHERE requester_token = p_token ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION ofm_my_requests(text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ofm_matches: revoke direct anon SELECT/UPDATE. Insert stays open but can no
-- longer fabricate a row in a non-initial stage. Reads + mutations go through
-- RPCs that verify the caller is lister_token or requester_token on the row.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS ofm_matches_anon_read   ON ofm_matches;
DROP POLICY IF EXISTS ofm_matches_anon_update ON ofm_matches;
DROP POLICY IF EXISTS ofm_matches_anon_insert ON ofm_matches;
CREATE POLICY ofm_matches_anon_read   ON ofm_matches FOR SELECT TO anon USING (false);
CREATE POLICY ofm_matches_anon_insert ON ofm_matches FOR INSERT TO anon WITH CHECK (stage = 'matched');

CREATE OR REPLACE FUNCTION ofm_matches_for_listing(p_listing_id uuid, p_token text)
RETURNS SETOF ofm_matches
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM ofm_matches
  WHERE listing_id = p_listing_id AND lister_token = p_token AND stage <> 'rejected'
  ORDER BY ai_score DESC;
$$;
GRANT EXECUTE ON FUNCTION ofm_matches_for_listing(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION ofm_matches_for_request(p_request_id uuid, p_token text)
RETURNS SETOF ofm_matches
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT * FROM ofm_matches
  WHERE request_id = p_request_id AND requester_token = p_token AND stage <> 'rejected'
  ORDER BY created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION ofm_matches_for_request(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION ofm_update_match(p_match_id uuid, p_token text, p_updates jsonb)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM ofm_matches
    WHERE id = p_match_id AND (lister_token = p_token OR requester_token = p_token)
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE ofm_matches SET
    stage           = COALESCE(p_updates->>'stage', stage),
    lister_seen     = COALESCE((p_updates->>'lister_seen')::boolean, lister_seen),
    requester_seen  = COALESCE((p_updates->>'requester_seen')::boolean, requester_seen),
    rejected_by     = COALESCE(p_updates->>'rejected_by', rejected_by),
    rejection_note  = COALESCE(p_updates->>'rejection_note', rejection_note),
    offer_amount    = COALESCE((p_updates->>'offer_amount')::bigint, offer_amount),
    closing_notes   = COALESCE(p_updates->>'closing_notes', closing_notes),
    updated_at      = now()
  WHERE id = p_match_id;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION ofm_update_match(uuid, text, jsonb) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ofm_messages: revoke direct anon SELECT. INSERT stays open but now requires
-- sender_token to actually match the claimed sender_role's token on the
-- referenced match — closes the "post as the other party" spoofing hole
-- without needing an RPC.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS ofm_messages_anon_read   ON ofm_messages;
DROP POLICY IF EXISTS ofm_messages_anon_insert ON ofm_messages;
CREATE POLICY ofm_messages_anon_read ON ofm_messages FOR SELECT TO anon USING (false);
CREATE POLICY ofm_messages_anon_insert ON ofm_messages FOR INSERT TO anon WITH CHECK (
  EXISTS (
    SELECT 1 FROM ofm_matches m
    WHERE m.id = match_id
      AND ((sender_role = 'lister'    AND m.lister_token    = sender_token)
        OR (sender_role = 'requester' AND m.requester_token = sender_token))
  )
);

CREATE OR REPLACE FUNCTION ofm_get_messages(p_match_id uuid, p_token text)
RETURNS SETOF ofm_messages
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT msg.* FROM ofm_messages msg
  WHERE msg.match_id = p_match_id
    AND EXISTS (
      SELECT 1 FROM ofm_matches m
      WHERE m.id = msg.match_id AND (m.lister_token = p_token OR m.requester_token = p_token)
    )
  ORDER BY msg.created_at ASC
  LIMIT 200;
$$;
GRANT EXECUTE ON FUNCTION ofm_get_messages(uuid, text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ofm_media: revoke direct anon SELECT + DELETE (no delete feature exists in
-- the app today; removed rather than left as an open door). INSERT stays
-- open but now requires lister_token to match the match's actual lister.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS ofm_media_anon_read   ON ofm_media;
DROP POLICY IF EXISTS ofm_media_anon_insert ON ofm_media;
DROP POLICY IF EXISTS ofm_media_anon_delete ON ofm_media;
CREATE POLICY ofm_media_anon_read ON ofm_media FOR SELECT TO anon USING (false);
CREATE POLICY ofm_media_anon_insert ON ofm_media FOR INSERT TO anon WITH CHECK (
  EXISTS (SELECT 1 FROM ofm_matches m WHERE m.id = match_id AND m.lister_token = lister_token)
);
-- Anon DELETE intentionally not recreated.

CREATE OR REPLACE FUNCTION ofm_get_media(p_match_id uuid, p_token text)
RETURNS SETOF ofm_media
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT med.* FROM ofm_media med
  WHERE med.match_id = p_match_id
    AND EXISTS (
      SELECT 1 FROM ofm_matches m
      WHERE m.id = med.match_id AND (m.lister_token = p_token OR m.requester_token = p_token)
    )
  ORDER BY med.created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION ofm_get_media(uuid, text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Platform stats: aggregate counts only (no row-level data), used by the
-- public "N listings / N requests / N completed deals" overview. Safe to
-- expose since it reveals nothing beyond three numbers.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ofm_platform_stats()
RETURNS TABLE(listings bigint, requests bigint, completed bigint)
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT
    (SELECT count(*) FROM ofm_listings WHERE active = true),
    (SELECT count(*) FROM ofm_requests WHERE active = true),
    (SELECT count(*) FROM ofm_matches WHERE stage = 'completed');
$$;
GRANT EXECUTE ON FUNCTION ofm_platform_stats() TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- After running this, confirm no stale permissive policy remains:
--   select tablename, policyname, cmd, qual from pg_policies
--   where tablename like 'ofm_%' order by tablename, cmd;
-- Every SELECT/UPDATE row for ofm_listings/ofm_requests/ofm_matches/
-- ofm_messages/ofm_media should show qual = 'false' (all reads/updates now
-- go through the RPCs above); ofm_media should have no DELETE row at all.
-- ═══════════════════════════════════════════════════════════════════════════
