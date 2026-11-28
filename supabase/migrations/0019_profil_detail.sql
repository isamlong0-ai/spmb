-- ============================================================
-- 0019_profil_detail.sql
-- Data profil sekolah detail (seperti portal Kemendikdasmen), dikelola admin
-- ============================================================
alter table public.web_info add column if not exists detail jsonb not null default '{}'::jsonb;