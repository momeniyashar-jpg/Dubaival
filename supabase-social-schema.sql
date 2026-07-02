-- =============================================================================
-- DubaiVal PropTech Video Platform — Supabase Schema
-- Tables: agent_profiles, agent_videos, video_likes, area_follows, agent_follows
-- =============================================================================

-- 1. Agent Profiles
create table if not exists agent_profiles (
  id          bigint primary key generated always as identity,
  user_id     text unique not null,
  name        text not null,
  photo       text,                              -- base64 small avatar, max ~50KB
  rera_no     text,
  phone       text,
  bio         text,
  areas       text[],                            -- area names they specialize in
  specialties text[],                            -- e.g. {'luxury','off-plan','commercial'}
  subscription text default 'free',              -- free / gold / platinum
  rating      numeric default 0,
  video_count integer default 0,
  follower_count integer default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. Agent Videos
create table if not exists agent_videos (
  id            bigint primary key generated always as identity,
  agent_id      bigint references agent_profiles(id) on delete cascade,
  title         text not null,
  description   text,
  video_url     text not null,                   -- YouTube / Instagram / TikTok link
  thumbnail     text,                            -- base64 small thumbnail or auto-extracted
  area          text not null,                   -- area name from AREAS database
  category      text not null,                   -- walkthrough / market-update / tips / review / new-launch
  property_type text,                            -- apartment / villa / office / land / retail
  tags          text[],
  views         integer default 0,
  likes         integer default 0,
  created_at    timestamptz default now()
);

-- 3. Video Likes
create table if not exists video_likes (
  id         bigint primary key generated always as identity,
  video_id   bigint references agent_videos(id) on delete cascade,
  user_id    text not null,
  created_at timestamptz default now(),
  unique(video_id, user_id)
);

-- 4. Area Follows
create table if not exists area_follows (
  id         bigint primary key generated always as identity,
  user_id    text not null,
  area       text not null,
  created_at timestamptz default now(),
  unique(user_id, area)
);

-- 5. Agent Follows
create table if not exists agent_follows (
  id         bigint primary key generated always as identity,
  user_id    text not null,
  agent_id   bigint references agent_profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, agent_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================
create index if not exists idx_agent_videos_agent on agent_videos(agent_id);
create index if not exists idx_agent_videos_area on agent_videos(area);
create index if not exists idx_agent_videos_category on agent_videos(category);
create index if not exists idx_agent_videos_created on agent_videos(created_at desc);
create index if not exists idx_video_likes_video on video_likes(video_id);
create index if not exists idx_area_follows_user on area_follows(user_id);
create index if not exists idx_agent_follows_user on agent_follows(user_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

-- agent_profiles
alter table agent_profiles enable row level security;
create policy "anon_read_agent_profiles" on agent_profiles for select using (true);
create policy "anon_insert_agent_profiles" on agent_profiles for insert with check (true);
create policy "anon_update_own_agent_profiles" on agent_profiles for update using (user_id = current_setting('request.header.x-user-id', true));
create policy "anon_delete_own_agent_profiles" on agent_profiles for delete using (user_id = current_setting('request.header.x-user-id', true));

-- agent_videos
alter table agent_videos enable row level security;
create policy "anon_read_agent_videos" on agent_videos for select using (true);
create policy "anon_insert_agent_videos" on agent_videos for insert with check (true);
create policy "anon_update_agent_videos" on agent_videos for update using (true);
create policy "anon_delete_agent_videos" on agent_videos for delete using (true);

-- video_likes
alter table video_likes enable row level security;
create policy "anon_read_video_likes" on video_likes for select using (true);
create policy "anon_insert_video_likes" on video_likes for insert with check (true);
create policy "anon_delete_video_likes" on video_likes for delete using (true);

-- area_follows
alter table area_follows enable row level security;
create policy "anon_read_area_follows" on area_follows for select using (true);
create policy "anon_insert_area_follows" on area_follows for insert with check (true);
create policy "anon_delete_area_follows" on area_follows for delete using (true);

-- agent_follows
alter table agent_follows enable row level security;
create policy "anon_read_agent_follows" on agent_follows for select using (true);
create policy "anon_insert_agent_follows" on agent_follows for insert with check (true);
create policy "anon_delete_agent_follows" on agent_follows for delete using (true);
