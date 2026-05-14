-- Run this in your Supabase SQL editor to set up the database

create table if not exists public.evaluations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  candidate_name text not null,
  college text not null,
  pass_out_year text not null,
  cgpa text not null,
  score integer not null check (score >= 0 and score <= 100),
  category text not null check (category in ('Beginner', 'Intermediate', 'Expert')),
  summary text not null,
  roadmap jsonb not null default '[]'::jsonb,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.evaluations enable row level security;

-- Users can only read their own evaluations
create policy "Users can read own evaluations"
  on public.evaluations for select
  using (auth.uid() = user_id);

-- Users can insert their own evaluations
create policy "Users can insert own evaluations"
  on public.evaluations for insert
  with check (auth.uid() = user_id);

-- Users can delete their own evaluations
create policy "Users can delete own evaluations"
  on public.evaluations for delete
  using (auth.uid() = user_id);
