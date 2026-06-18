-- DubaiVal Deal Media & Inquiry Approval — run ONCE in the Supabase SQL Editor.
-- Privacy-first media sharing: owners upload photos/videos, approve buyer access.

-- Add status to deal_inquiries for approve/reject workflow
alter table deal_inquiries add column if not exists
  status text not null default 'pending'
  check (status in ('pending','approved','rejected'));

-- Deal media table: stores property photos (base64) and video URLs
create table if not exists deal_media (
  id bigint generated always as identity primary key,
  deal_id bigint not null references deal_board(id) on delete cascade,
  media_type text not null check (media_type in ('photo','video')),
  data text not null,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

alter table deal_media enable row level security;

-- Anyone can read media (access controlled client-side by inquiry approval)
create policy "read_media" on deal_media
  for select using (true);

-- Anyone can insert media (owner identified client-side by edit_token)
create policy "insert_media" on deal_media
  for insert with check (true);

-- Anyone can delete (owner identified client-side by edit_token)
create policy "delete_media" on deal_media
  for delete using (true);

-- Allow updating inquiry status
create policy "update_inquiries" on deal_inquiries
  for update using (true) with check (true);

-- Index for fast media lookup by deal
create index if not exists idx_deal_media_deal on deal_media (deal_id);
