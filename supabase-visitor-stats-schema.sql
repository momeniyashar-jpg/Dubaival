-- =============================================================================
-- DubaiVal — Admin-only real traffic + funnel analytics, backed by the
-- existing analytics_events table (no new table, no new tracking).
-- Run this once in Supabase Dashboard -> SQL Editor, AFTER
-- supabase-analytics-events-schema.sql and supabase-admin-security-fix.sql
-- (this migration reuses _admin_password_ok() defined there).
-- =============================================================================
-- Closes a real gap found 2026-07-21: the site owner's only way to see
-- visitor counts was Google Analytics (GA4), which under-counts real traffic
-- whenever a visitor has an ad-blocker/privacy browser (very common). This
-- app already writes a real, first-party session_id + event_name into
-- analytics_events on every render()/dvTrack() call (js/core.js) — that
-- table's RLS is anon-INSERT-only with no SELECT policy, so — same pattern
-- as supabase-error-reporting-schema.sql's two RPCs — this migration adds
-- two admin-only, password-gated, security-definer RPCs to read real
-- unique-visitor + funnel-event counts back out for the Admin Dashboard.
-- =============================================================================

-- Real unique-session (visitor) counts across a few standard windows, plus a
-- total-event count for a quick sense of overall activity/engagement depth.
create or replace function admin_get_traffic_stats(p_admin_password text)
returns table(
  unique_sessions_today bigint,
  unique_sessions_7d bigint,
  unique_sessions_30d bigint,
  unique_sessions_all bigint,
  total_events_30d bigint
)
language plpgsql
security definer
as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'Not authorized';
  end if;

  return query
    select
      (select count(distinct session_id) from analytics_events where created_at > now() - interval '1 day'),
      (select count(distinct session_id) from analytics_events where created_at > now() - interval '7 days'),
      (select count(distinct session_id) from analytics_events where created_at > now() - interval '30 days'),
      (select count(distinct session_id) from analytics_events),
      (select count(*) from analytics_events
        where created_at > now() - interval '30 days' and event_name not in ('js_error','user_report'));
end;
$$;

grant execute on function admin_get_traffic_stats(text) to anon, authenticated;

-- Per-event-name breakdown over a caller-chosen window (default 30 days,
-- clamped 1-365) — the real funnel: which meaningful actions actually
-- happened, and how often. Excludes the 2 error-reporting event types
-- (those have their own dedicated admin RPCs already).
create or replace function admin_get_funnel_breakdown(p_admin_password text, p_days integer default 30)
returns table(event_name text, event_count bigint)
language plpgsql
security definer
as $$
begin
  if not _admin_password_ok(p_admin_password) then
    raise exception 'Not authorized';
  end if;

  return query
    select ae.event_name, count(*)::bigint as event_count
    from analytics_events ae
    where ae.created_at > now() - (greatest(1, least(p_days, 365))::text || ' days')::interval
      and ae.event_name not in ('js_error','user_report')
    group by ae.event_name
    order by count(*) desc;
end;
$$;

grant execute on function admin_get_funnel_breakdown(text, integer) to anon, authenticated;
