-- =============================================================================
-- SALingo — Company Prep history + Interview Tips checklist persistence.
-- Additive migration: run AFTER mistakes.sql.
-- Closes two gaps flagged in SALINGO_FULL_AUDIT.md: Company Prep analyses
-- were lost on refresh, and the Interview Tips pre-interview checklist reset
-- every time the page reloaded. Safe to re-run.
-- =============================================================================

create table if not exists public.company_prep_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text not null default '',
  position text,
  job_description text not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists company_prep_analyses_user_id_idx on public.company_prep_analyses (user_id);

alter table public.company_prep_analyses enable row level security;

drop policy if exists "company_prep_analyses_owner" on public.company_prep_analyses;
create policy "company_prep_analyses_owner" on public.company_prep_analyses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.interview_tips_checklist (
  user_id uuid primary key references auth.users (id) on delete cascade,
  checked_indices jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.interview_tips_checklist enable row level security;

drop policy if exists "interview_tips_checklist_owner" on public.interview_tips_checklist;
create policy "interview_tips_checklist_owner" on public.interview_tips_checklist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
