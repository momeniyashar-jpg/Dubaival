-- ═══════════════════════════════════════════════════════════════════════════
-- OFM (Off-Market Exchange) TRUST & SAFETY (2026-07-12)
-- ═══════════════════════════════════════════════════════════════════════════
-- PROBLEM 1: ofm_listings.doc_verified (added in supabase-ofm-schema.sql)
-- defaults to false and is NEVER set to true anywhere — no admin review
-- workflow exists in js/deals.js at all. Meanwhile the listing-submission UI
-- literally tells every seller "Admin-verified badge confirms authenticity"
-- (js/deals.js _ofmPostListing step 2). That's a false claim in production:
-- title deed / Emirates ID uploads are collected and stored, but nobody ever
-- looks at them, and no badge is ever shown to a buyer based on real review.
--
-- PROBLEM 2: there is no way for either party in a match to report a scam
-- attempt, a no-show, or fraudulent behavior. The chat/match pipeline has no
-- safety net beyond the two parties silently abandoning the conversation.
--
-- FIX: a real admin document-review queue (reusing the existing
-- _admin_password_ok() plaintext-password check from
-- supabase-admin-security-fix.sql — same secure pattern, no new auth
-- mechanism invented) that can approve (sets doc_verified/verified_at) or
-- reject (deactivates the listing + records why) pending submissions, and a
-- lightweight report table + admin queue for in-chat abuse reports.
--
-- Run this in Supabase Dashboard → SQL Editor. Safe to re-run (idempotent).
-- Requires supabase-admin-security-fix.sql and supabase-ofm-rls-lockdown.sql
-- to have already been run (uses _admin_password_ok(), ofm_listings,
-- ofm_matches).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- ofm_listings: add verification metadata (doc_verified itself already exists).
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE ofm_listings ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE ofm_listings ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Expose doc_verified on the public blind-matching scan view (boolean only —
-- no document content — so buyers can see a real verified signal instead of
-- nothing at all).
CREATE OR REPLACE VIEW ofm_listings_scan AS
SELECT id, lister_token, building, beds, asking_price, purpose, doc_verified
FROM ofm_listings
WHERE active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- Admin document-review queue.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_pending_doc_listings(p_admin_password text)
RETURNS SETOF ofm_listings
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT _admin_password_ok(p_admin_password) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM ofm_listings
    WHERE doc_verified = false AND active = true
    ORDER BY created_at ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_pending_doc_listings(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION admin_review_listing_doc(
  p_admin_password text,
  p_listing_id uuid,
  p_approve boolean,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT _admin_password_ok(p_admin_password) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_approve THEN
    UPDATE ofm_listings SET doc_verified = true, verified_at = now()
    WHERE id = p_listing_id;
  ELSE
    UPDATE ofm_listings SET active = false, rejection_reason = p_reason
    WHERE id = p_listing_id;
  END IF;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_review_listing_doc(text, uuid, boolean, text) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- In-chat abuse/scam reports. Anon INSERT is allowed only if the reporter's
-- token actually belongs to one of the two parties on the referenced match
-- (same ownership-check pattern as ofm_messages in the RLS lockdown migration)
-- — prevents a stranger from filing reports against matches they're not
-- party to. Reads/resolution are admin-only via RPC.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ofm_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES ofm_matches(id),
  reporter_role text NOT NULL CHECK (reporter_role IN ('lister','requester')),
  reporter_token text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ofm_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ofm_reports_anon_read ON ofm_reports;
CREATE POLICY ofm_reports_anon_read ON ofm_reports FOR SELECT TO anon USING (false);

DROP POLICY IF EXISTS ofm_reports_anon_insert ON ofm_reports;
CREATE POLICY ofm_reports_anon_insert ON ofm_reports FOR INSERT TO anon WITH CHECK (
  EXISTS (
    SELECT 1 FROM ofm_matches m
    WHERE m.id = match_id
      AND ((reporter_role = 'lister'    AND m.lister_token    = reporter_token)
        OR (reporter_role = 'requester' AND m.requester_token = reporter_token))
  )
);

CREATE OR REPLACE FUNCTION admin_pending_reports(p_admin_password text)
RETURNS SETOF ofm_reports
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NOT _admin_password_ok(p_admin_password) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT * FROM ofm_reports WHERE status = 'open' ORDER BY created_at ASC;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_pending_reports(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION admin_resolve_report(
  p_admin_password text,
  p_report_id uuid,
  p_action text -- 'dismiss' or 'deactivate_listing'
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_match_id uuid;
  v_listing_id uuid;
BEGIN
  IF NOT _admin_password_ok(p_admin_password) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT match_id INTO v_match_id FROM ofm_reports WHERE id = p_report_id;

  IF p_action = 'deactivate_listing' THEN
    SELECT listing_id INTO v_listing_id FROM ofm_matches WHERE id = v_match_id;
    IF v_listing_id IS NOT NULL THEN
      UPDATE ofm_listings SET active = false, rejection_reason = 'Deactivated after abuse report'
      WHERE id = v_listing_id;
    END IF;
    UPDATE ofm_reports SET status = 'reviewed' WHERE id = p_report_id;
  ELSE
    UPDATE ofm_reports SET status = 'dismissed' WHERE id = p_report_id;
  END IF;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_resolve_report(text, uuid, text) TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- After running this, confirm:
--   select * from pg_policies where tablename = 'ofm_reports';
-- should show SELECT qual='false' and one INSERT policy with the ownership
-- WITH CHECK above.
-- ═══════════════════════════════════════════════════════════════════════════
