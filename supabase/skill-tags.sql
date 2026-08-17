-- =============================================================================
-- SALingo — Skill Engine foundation: skill_tag on activity_log.
-- Additive migration: run AFTER job-outcomes.sql.
-- Lets the Skill Engine know WHICH sub-skill an activity touched (e.g.
-- "grammar:past-simple", "vocab:customer-service") instead of only the
-- broad category ("grammar"). Nullable — existing rows and any caller that
-- doesn't pass a tag keep working exactly as before. Safe to re-run.
-- =============================================================================

alter table public.activity_log
  add column if not exists skill_tag text;

create index if not exists activity_log_skill_tag_idx
  on public.activity_log (user_id, skill_tag)
  where skill_tag is not null;
