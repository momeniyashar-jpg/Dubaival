-- User Profiles & Cloud Portfolio Sync
-- Run in Supabase SQL Editor

create table if not exists user_profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  email text,
  phone text,
  role text not null default 'user' check (role in ('user','agent','admin')),
  preferred_lang text default 'en',
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;

create policy "Users can read own profile"
  on user_profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on user_profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on user_profiles for update using (auth.uid() = id);


create table if not exists user_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  portfolio_data jsonb default '[]'::jsonb,
  goals_data jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table user_portfolios enable row level security;

create policy "Users can read own portfolio"
  on user_portfolios for select using (auth.uid() = user_id);

create policy "Users can insert own portfolio"
  on user_portfolios for insert with check (auth.uid() = user_id);

create policy "Users can update own portfolio"
  on user_portfolios for update using (auth.uid() = user_id);

create unique index if not exists idx_user_portfolios_user on user_portfolios(user_id);
