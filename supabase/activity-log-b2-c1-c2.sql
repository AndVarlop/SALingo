-- =============================================================================
-- SALingo — widen activity_log.type for the B2/C1/C2 expansion.
-- Run this in the Supabase SQL Editor. Safe to re-run (drop + re-add the
-- same constraint is idempotent). Does not touch existing rows.
--
-- Adds two new ActivityLogEntry types used by the new Reading module and
-- the new B2/C1/C2 Final Assessments:
--   'reading'          — the new standalone Reading practice module
--   'final-assessment' — the B2/C1/C2 level-unlock exam (exam-registry.service.ts)
-- =============================================================================

alter table public.activity_log drop constraint if exists activity_log_type_check;
alter table public.activity_log add constraint activity_log_type_check
  check (type in (
    'lesson', 'review', 'grammar', 'listening', 'reading', 'speaking', 'writing',
    'placement-test', 'final-assessment', 'interview'
  ));
