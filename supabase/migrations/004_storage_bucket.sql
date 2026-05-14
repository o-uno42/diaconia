-- ============================================================
-- Create private storage bucket for ragazzo photos/documents.
-- Files are uploaded by the backend via service_role (bypasses
-- storage RLS) and served to clients through 60s signed URLs.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('ragazzo_photos', 'ragazzo_photos', false)
on conflict (id) do nothing;
