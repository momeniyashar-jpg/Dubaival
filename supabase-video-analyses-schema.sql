-- Agent Video Analyses
-- Run in Supabase SQL Editor

create table if not exists agent_video_analyses (
  id uuid primary key default gen_random_uuid(),
  agent_id bigint not null references dv_agents(id) on delete cascade,
  deal_id bigint references deal_board(id) on delete set null,
  video_url text not null,
  title text not null,
  summary text check (char_length(summary) <= 500),
  views_count int default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

alter table agent_video_analyses enable row level security;

create policy "Anyone can read approved videos"
  on agent_video_analyses for select using (status = 'approved');

create policy "Service role full access"
  on agent_video_analyses for all using (true);

create index idx_video_analyses_agent on agent_video_analyses(agent_id);
create index idx_video_analyses_deal on agent_video_analyses(deal_id);
create index idx_video_analyses_status on agent_video_analyses(status);

-- Add video_analyses counter to dv_agents if not exists
do $$ begin
  alter table dv_agents add column if not exists video_analyses int default 0;
exception when others then null;
end $$;
