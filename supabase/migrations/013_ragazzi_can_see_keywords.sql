-- ============================================================
-- Ragazzi can see own keywords — admin toggle
-- ============================================================
-- New per-admin flag controlling whether the keywords card is
-- visible to ragazzi when they look at their own profile.
-- Defaults to true so existing admins keep current behaviour.
-- ============================================================

alter table profiles
  add column if not exists ragazzi_can_see_keywords boolean not null default true;
