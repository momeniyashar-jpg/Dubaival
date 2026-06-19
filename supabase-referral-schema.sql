-- DubaiVal Agent Referral Program — run ONCE in the Supabase SQL Editor.
-- Agent marketplace with Gold subscription tiers and referral commission tracking.

-- Registered agents in the referral pool
create table if not exists dv_agents (
  id bigint generated always as identity primary key,
  agent_name text not null,
  agent_phone text not null,
  agent_email text,
  agent_company text,
  rera_number text not null,
  areas_text text,
  specialties text,
  bio text,
  subscription text not null default 'free'
    check (subscription in ('free','gold','platinum')),
  video_analyses integer default 0,
  profile_photo text,
  active boolean default true,
  rating numeric default 0,
  deals_closed integer default 0,
  referral_commission_pct numeric default 2.0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table dv_agents enable row level security;

create policy "read_agents" on dv_agents
  for select using (active = true);

create policy "insert_agents" on dv_agents
  for insert with check (true);

create policy "update_agents" on dv_agents
  for update using (true) with check (true);

-- Referral tracking: buyer → agent → deal
create table if not exists dv_referrals (
  id bigint generated always as identity primary key,
  buyer_deal_id bigint references deal_board(id) on delete set null,
  seller_deal_id bigint references deal_board(id) on delete set null,
  assigned_agent_id bigint references dv_agents(id) on delete set null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_area text,
  buyer_budget numeric,
  buyer_prop_type text,
  status text not null default 'pending'
    check (status in ('pending','assigned','connected','negotiating','closed','cancelled')),
  commission_pct numeric default 2.0,
  deal_value numeric,
  commission_earned numeric,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table dv_referrals enable row level security;

create policy "read_referrals" on dv_referrals
  for select using (true);

create policy "insert_referrals" on dv_referrals
  for insert with check (true);

create policy "update_referrals" on dv_referrals
  for update using (true) with check (true);

-- Indexes
create index if not exists idx_dv_agents_sub on dv_agents (subscription) where active = true;
create index if not exists idx_dv_referrals_status on dv_referrals (status);
create index if not exists idx_dv_referrals_agent on dv_referrals (assigned_agent_id);
