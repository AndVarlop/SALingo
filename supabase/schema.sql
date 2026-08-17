-- =============================================================================
-- Lingo App — Supabase schema (user data only; lesson/vocab/grammar content
-- stays static in the Angular app for now).
--
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles: 1 row per auth user. Mirrors core/models/user.model.ts AppUser.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  avatar_emoji text not null default '🙂',
  primary_language text not null default 'en',
  level text not null default 'A1'
    check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  started_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- user_settings: 1 row per user. Mirrors UserSettings.
-- -----------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  daily_goal_minutes int not null default 20 check (daily_goal_minutes between 5 and 240),
  notifications_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  difficulty text not null default 'normal' check (difficulty in ('easy', 'normal', 'hard')),
  learning_language text not null default 'en'
);

-- -----------------------------------------------------------------------------
-- user_streak: 1 row per user. Streak/XP-adjacent state that isn't per-language.
-- -----------------------------------------------------------------------------
create table if not exists public.user_streak (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date
);

-- -----------------------------------------------------------------------------
-- language_progress: 1 row per (user, language). Mirrors LanguageProgress.
-- skills and level_progress kept as jsonb — small, always read/written together.
-- -----------------------------------------------------------------------------
create table if not exists public.language_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  language text not null,
  level text not null default 'A1'
    check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  xp int not null default 0,
  words_learned int not null default 0,
  total_study_minutes int not null default 0,
  average_accuracy int not null default 0,
  skills jsonb not null default '[]'::jsonb,
  level_progress jsonb not null default '{"A1":0,"A2":0,"B1":0,"B2":0,"C1":0,"C2":0}'::jsonb,
  primary key (user_id, language)
);

-- -----------------------------------------------------------------------------
-- lesson_completions: which lessons a user has finished. Lesson content
-- (title, exercises...) stays static in the app; only the id is stored here.
-- -----------------------------------------------------------------------------
create table if not exists public.lesson_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- -----------------------------------------------------------------------------
-- daily_activity: 1 row per (user, date). Mirrors DailyActivity — powers the
-- streak calendar and "today's goal" widget.
-- -----------------------------------------------------------------------------
create table if not exists public.daily_activity (
  user_id uuid not null references auth.users (id) on delete cascade,
  activity_date date not null default current_date,
  minutes_studied int not null default 0,
  xp_earned int not null default 0,
  goal_met boolean not null default false,
  primary key (user_id, activity_date)
);

-- -----------------------------------------------------------------------------
-- activity_log: append-only feed. Mirrors ActivityLogEntry.
-- -----------------------------------------------------------------------------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  type text not null
    check (type in ('lesson', 'review', 'grammar', 'listening', 'speaking', 'writing', 'placement-test')),
  title text not null,
  xp_earned int not null default 0,
  accuracy int
);

create index if not exists activity_log_user_id_occurred_at_idx
  on public.activity_log (user_id, occurred_at desc);

-- -----------------------------------------------------------------------------
-- review_items: spaced-repetition state per (user, word). Mirrors ReviewItem.
-- word_id references the static vocabulary id from the app's mock data today;
-- becomes a real FK once vocabulary moves into its own table.
-- -----------------------------------------------------------------------------
create table if not exists public.review_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id text not null,
  times_studied int not null default 0,
  times_correct int not null default 0,
  times_incorrect int not null default 0,
  last_reviewed_at timestamptz,
  next_review_at timestamptz not null default now(),
  difficulty int not null default 3 check (difficulty between 1 and 5),
  interval_days int not null default 1,
  primary key (user_id, word_id)
);

-- -----------------------------------------------------------------------------
-- user_achievements: which achievements a user has unlocked. Achievement
-- definitions (title, icon, goal) stay static in the app.
-- -----------------------------------------------------------------------------
create table if not exists public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- =============================================================================
-- Row Level Security — every table is private to its owning user.
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_streak enable row level security;
alter table public.language_progress enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.daily_activity enable row level security;
alter table public.activity_log enable row level security;
alter table public.review_items enable row level security;
alter table public.user_achievements enable row level security;

-- profiles uses "id" as the owner column; everything else uses "user_id".
drop policy if exists "profiles_owner" on public.profiles;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'user_settings', 'user_streak', 'language_progress', 'lesson_completions',
      'daily_activity', 'activity_log', 'review_items', 'user_achievements'
    ])
  loop
    execute format('drop policy if exists "%s_owner" on public.%I;', t, t);
    execute format(
      'create policy "%s_owner" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t, t
    );
  end loop;
end $$;

-- =============================================================================
-- Bootstrap: when a new auth user signs up, seed their profile/settings/streak
-- and an initial English language_progress row so the app has something to
-- render immediately (matches the mock data shape used before Supabase).
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_emoji, primary_language, level, started_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    '🙂',
    'en',
    'A1',
    current_date
  );

  insert into public.user_settings (user_id) values (new.id);
  insert into public.user_streak (user_id) values (new.id);
  insert into public.language_progress (user_id, language) values (new.id, 'en');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
