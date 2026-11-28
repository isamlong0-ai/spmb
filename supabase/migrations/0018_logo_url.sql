-- ============================================================
-- 0018_logo_url.sql
-- Logo sekolah bisa diubah dari admin
-- ============================================================
alter table public.web_info add column if not exists logo_url text;