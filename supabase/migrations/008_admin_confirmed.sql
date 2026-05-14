-- ============================================================
-- task_completions: add admin_confirmed flag
-- ============================================================
--
-- Two-stage completion workflow:
--   1. Ragazzo (or admin) creates a completion → admin_confirmed = false
--      (when the admin creates it directly, it's auto-confirmed)
--   2. Admin reviews: "Sì, confermo" → admin_confirmed = true
--                     "No"            → row is deleted

alter table task_completions
  add column admin_confirmed boolean not null default false;

-- Backfill: all pre-existing completions are considered already confirmed.
update task_completions set admin_confirmed = true;
