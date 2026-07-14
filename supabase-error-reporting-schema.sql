-- =============================================================================
-- DubaiVal — Automatic + manual error-reporting admin read access
-- Run this once in Supabase Dashboard -> SQL Editor, AFTER
-- supabase-analytics-events-schema.sql and supabase-admin-security-fix.sql
-- (this migration reuses _admin_password_ok() defined there).
-- =============================================================================
-- Beta-launch readiness item requested by the site owner: automatic capture of
-- uncaught JS errors/promise rejections (js/core.js's dvTrackError(), wired
-- from index.html's window.onerror/unhandledrejection handlers) and a manual
-- "Report an Issue" widget (js/core.js renderReportIssueWidget()) both write
-- to the existing analytics_events table (event_name='js_error'/'user_report')
-- — no new table needed. That table's RLS is anon-INSERT-only with no SELECT
-- policy (supabase-analytics-events-schema.sql), so this migration adds two
-- admin-only, password-gated RPCs (same pattern as every other admin RPC in
-- this project) to read those two event types back for the Admin dashboard.
-- =============================================================================

-- Recent rows for the Admin dashboard's live list (most recent first).
create or replace function admin_get_event_reports(p_admin_password text, p_limit integer default 100)
returns setof analytics_events
language plpgsql
security definer
as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'Not authorized';
  end if;

  return query
    select * from analytics_events
    where event_name in ('js_error','user_report')
    order by created_at desc
    limit greatest(1, least(p_limit, 500));
end;
$$;

grant execute on function admin_get_event_reports(text, integer) to anon, authenticated;

-- Accurate 24h/7d counts (independent of the row limit above, so a busy day
-- with more errors than the list shows still reports a true total).
create or replace function admin_get_event_counts(p_admin_password text)
returns table(window_label text, js_error_count bigint, user_report_count bigint)
language plpgsql
security definer
as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'Not authorized';
  end if;

  return query
    select '24h'::text,
      count(*) filter (where event_name = 'js_error' and created_at > now() - interval '24 hours'),
      count(*) filter (where event_name = 'user_report' and created_at > now() - interval '24 hours')
    from analytics_events
    union all
    select '7d'::text,
      count(*) filter (where event_name = 'js_error' and created_at > now() - interval '7 days'),
      count(*) filter (where event_name = 'user_report' and created_at > now() - interval '7 days')
    from analytics_events;
end;
$$;

grant execute on function admin_get_event_counts(text) to anon, authenticated;
