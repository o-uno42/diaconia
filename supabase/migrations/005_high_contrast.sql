-- ============================================================
-- User accessibility preference: high-contrast theme toggle.
-- Available to all roles (admin + ragazzo). Defaults to false
-- so the standard pastel palette is the default experience.
-- ============================================================

alter table profiles
  add column if not exists high_contrast boolean not null default false;
