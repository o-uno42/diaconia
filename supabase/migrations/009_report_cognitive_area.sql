-- ============================================================
-- report_entries: add cognitive_area column
-- ============================================================

alter table report_entries
  add column cognitive_area text default '';
