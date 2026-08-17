-- =============================================================================
-- SALingo — Job Outcomes (Top 20 #8 from the audit).
-- Additive migration: run AFTER company-prep-and-tips.sql.
-- Closes the audit's most important long-term gap: nothing in the app ever
-- captured whether a user actually got an interview or a job, so the Job
-- Ready Score could never be validated against a real result. This
-- migration only adds the capture -- calibrating the score against these
-- outcomes is future work, not done here. Safe to re-run.
-- =============================================================================

create table if not exists public.job_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text not null default '',
  position text,
  outcome text not null check (
    outcome in ('applied', 'interview_scheduled', 'interview_completed', 'rejected', 'got_offer', 'accepted_job')
  ),
  notes text,
  event_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists job_outcomes_user_id_idx on public.job_outcomes (user_id);

alter table public.job_outcomes enable row level security;

drop policy if exists "job_outcomes_owner" on public.job_outcomes;
create policy "job_outcomes_owner" on public.job_outcomes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
