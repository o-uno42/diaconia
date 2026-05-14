-- ============================================================
-- Admin feature toggles
-- ============================================================
-- Eight boolean flags on the profiles row that let an admin
-- enable/disable parts of the platform either for themselves
-- (use_* columns) or for the ragazzi they own (ragazzi_can_*).
-- All default to true: existing admins keep every feature on
-- until they explicitly opt out.
-- Frontend conditional rendering is intentionally NOT applied
-- in this migration — only the storage is added.
-- ============================================================

alter table profiles
  add column if not exists use_weekly_tasks_calendar       boolean not null default true,
  add column if not exists use_weekly_commitments_calendar boolean not null default true,
  add column if not exists use_weekly_activities_calendar  boolean not null default true,
  add column if not exists use_monthly_task_stats          boolean not null default true,
  add column if not exists use_washing_machine             boolean not null default true,
  add column if not exists use_monthly_reports             boolean not null default true,
  add column if not exists ragazzi_can_see_task_scores         boolean not null default true,
  add column if not exists ragazzi_can_see_weekly_activities   boolean not null default true;
