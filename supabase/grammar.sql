-- =============================================================================
-- Lingo App — Grammar progress (Phase 5).
-- Additive migration: run this AFTER schema.sql and vocabulary.sql.
-- Grammar topic content (explanation, examples, exercises) stays static in
-- the Angular app, same as lessons; only per-user progress lives here.
-- Safe to re-run.
-- =============================================================================

create table if not exists public.grammar_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null,
  completed boolean not null default false,
  best_score int not null default 0,
  attempts int not null default 0,
  primary key (user_id, topic_id)
);

alter table public.grammar_progress enable row level security;

drop policy if exists "grammar_progress_owner" on public.grammar_progress;
create policy "grammar_progress_owner" on public.grammar_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
