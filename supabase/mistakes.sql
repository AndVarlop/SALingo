-- =============================================================================
-- SALingo — My Mistakes (Fase 3 P1).
-- Additive migration: run AFTER interview-practice-log.sql.
-- Stores recurring language mistakes detected in Mock Interview / Roleplay
-- answers, keyed by (user_id, wrong_text) so repeats increment a counter
-- instead of duplicating rows. Safe to re-run.
-- =============================================================================

create table if not exists public.user_mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  wrong_text text not null,
  correct_text text not null,
  category text not null check (category in ('grammar', 'vocabulary', 'interview', 'speaking', 'customer-service')),
  source text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  occurrences int not null default 1,
  unique (user_id, wrong_text)
);

create index if not exists user_mistakes_user_id_idx on public.user_mistakes (user_id);

alter table public.user_mistakes enable row level security;

drop policy if exists "user_mistakes_owner" on public.user_mistakes;
create policy "user_mistakes_owner" on public.user_mistakes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
