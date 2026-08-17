-- =============================================================================
-- Lingo App — Mock Interview session history (Interview Prep, Phase 7-9).
-- Additive migration: run this AFTER interview-prep.sql.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_position text,
  started_at timestamptz not null default now(),
  duration_seconds int not null default 0,
  question_count int not null default 0,
  overall_score int not null default 0,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  mode text not null default 'guided' check (mode in ('guided', 'real'))
);

create index if not exists interview_sessions_user_id_started_at_idx
  on public.interview_sessions (user_id, started_at desc);

alter table public.interview_sessions enable row level security;

drop policy if exists "interview_sessions_owner" on public.interview_sessions;
create policy "interview_sessions_owner" on public.interview_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
