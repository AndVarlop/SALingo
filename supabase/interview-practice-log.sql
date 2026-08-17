-- =============================================================================
-- Lingo App — Roleplay & Scenario completion log (Interview Prep).
-- Additive migration: run AFTER interview-sessions.sql.
-- Closes the gap noted in DEVELOPMENT_REPORT.md: Roleplay and Customer Service
-- Scenarios awarded XP and logged to activity_log, but had no dedicated,
-- unbounded record — so the Preparation Plan couldn't check off Day 4/5 and
-- achievements couldn't count "roleplays completed" reliably.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.roleplay_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  score int not null default 0,
  completed_at timestamptz not null default now()
);

create index if not exists roleplay_sessions_user_id_idx on public.roleplay_sessions (user_id);

alter table public.roleplay_sessions enable row level security;

drop policy if exists "roleplay_sessions_owner" on public.roleplay_sessions;
create policy "roleplay_sessions_owner" on public.roleplay_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.scenario_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  accuracy int not null default 0,
  completed_at timestamptz not null default now()
);

create index if not exists scenario_sessions_user_id_idx on public.scenario_sessions (user_id);

alter table public.scenario_sessions enable row level security;

drop policy if exists "scenario_sessions_owner" on public.scenario_sessions;
create policy "scenario_sessions_owner" on public.scenario_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
