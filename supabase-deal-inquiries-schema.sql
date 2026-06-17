-- DubaiVal Deal Inquiries — run ONCE in the Supabase SQL Editor.
-- Anonymous contact system: buyers send interest without seeing seller phone.

-- Add contact_mode to deal_board (run as ALTER since table already exists)
alter table deal_board add column if not exists
  contact_mode text not null default 'whatsapp'
  check (contact_mode in ('whatsapp','private'));

-- Inquiry table: stores "Send Interest" messages
create table if not exists deal_inquiries (
  id bigint generated always as identity primary key,
  deal_id bigint not null references deal_board(id) on delete cascade,
  sender_name text not null,
  sender_phone text,
  sender_email text,
  message text,
  read boolean default false,
  created_at timestamptz not null default now()
);

alter table deal_inquiries enable row level security;

-- Anyone can insert inquiries
create policy "insert_inquiries" on deal_inquiries
  for insert with check (true);

-- Anyone can read (filtered client-side by edit_token ownership)
create policy "read_inquiries" on deal_inquiries
  for select using (true);

-- Index for fast lookup by deal
create index if not exists idx_deal_inquiries_deal on deal_inquiries (deal_id);
