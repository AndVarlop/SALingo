-- =============================================================================
-- Lingo App — Call Center Interview Prep module.
-- Additive migration: run this AFTER schema.sql, vocabulary.sql and grammar.sql.
-- Question/vocabulary/phrase CONTENT stays static in the Angular app; only
-- per-user state lives here.
-- Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- activity_log.type only allowed the original 7 activity kinds. Widen it so
-- interview practice can log real activity through the same table.
-- -----------------------------------------------------------------------------
alter table public.activity_log drop constraint if exists activity_log_type_check;
alter table public.activity_log add constraint activity_log_type_check
  check (type in ('lesson', 'review', 'grammar', 'listening', 'speaking', 'writing', 'placement-test', 'interview'));

-- -----------------------------------------------------------------------------
-- interview_profile: 1 row per user. Captures the onboarding questionnaire
-- and drives dashboard personalization (target position, readiness weighting).
-- -----------------------------------------------------------------------------
create table if not exists public.interview_profile (
  user_id uuid primary key references auth.users (id) on delete cascade,
  target_position text,
  has_experience boolean,
  english_level text check (english_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  struggle_area text,
  interview_date date,
  onboarded boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.interview_profile enable row level security;

drop policy if exists "interview_profile_owner" on public.interview_profile;
create policy "interview_profile_owner" on public.interview_profile
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- interview_answers: the user's own written answer per question. A row
-- existing here is what "practiced" means — no separate tracking table.
-- -----------------------------------------------------------------------------
create table if not exists public.interview_answers (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null,
  answer_text text not null default '',
  source text not null default 'practice' check (source in ('practice', 'answer-builder')),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.interview_answers enable row level security;

drop policy if exists "interview_answers_owner" on public.interview_answers;
create policy "interview_answers_owner" on public.interview_answers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- interview_vocab_progress: which call-center words/phrases the user has
-- marked as known. word_id references the static content id in the app.
-- -----------------------------------------------------------------------------
create table if not exists public.interview_vocab_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id text not null,
  known boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

alter table public.interview_vocab_progress enable row level security;

drop policy if exists "interview_vocab_progress_owner" on public.interview_vocab_progress;
create policy "interview_vocab_progress_owner" on public.interview_vocab_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
