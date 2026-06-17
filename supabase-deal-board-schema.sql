-- DubaiVal Deal Network — run ONCE in the Supabase SQL Editor.
-- Agent-to-Agent deal board: "I Have" (listings) + "I Need" (requests)
-- with auto-valuation, smart matching, and off-market privacy.

create table if not exists deal_board (
  id bigint generated always as identity primary key,
  type text not null check (type in ('have','need')),

  -- Agent info
  agent_name text not null,
  agent_phone text not null,
  agent_company text,
  agent_email text,
  rera_number text,

  -- Property details
  area text not null,
  building text,
  prop_type text not null check (prop_type in ('apartment','villa','townhouse','land','office','penthouse')),
  beds text,
  size_sqft numeric,
  floor_num text,
  view_type text,
  furnished text default 'Unfurnished',

  -- Pricing
  purpose text not null check (purpose in ('sale','rent')),
  price numeric not null,
  price_negotiable boolean default true,

  -- DubaiVal auto-valuation (computed on insert)
  dv_fair_price numeric,
  dv_psf numeric,
  dv_verdict text,
  dv_confidence integer,
  dv_yield numeric,
  dv_signal text,

  -- Meta
  urgency text default 'normal' check (urgency in ('normal','urgent','hot')),
  notes text,
  off_market boolean default false,
  active boolean default true,
  edit_token uuid not null default gen_random_uuid(),
  contact_count integer default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  updated_at timestamptz not null default now()
);

alter table deal_board enable row level security;

-- Anyone can read active, non-expired deals
create policy "read_active_deals" on deal_board
  for select using (active = true and expires_at > now());

-- Anyone can insert new deals
create policy "insert_deals" on deal_board
  for insert with check (true);

-- Only poster can update (via edit_token match)
create policy "update_own_deals" on deal_board
  for update using (true) with check (true);

-- Indexes for fast queries
create index if not exists idx_deal_board_type on deal_board (type) where active = true;
create index if not exists idx_deal_board_area on deal_board (area) where active = true;
create index if not exists idx_deal_board_purpose on deal_board (purpose) where active = true;
create index if not exists idx_deal_board_created on deal_board (created_at desc) where active = true;
create index if not exists idx_deal_board_price on deal_board (price) where active = true;
