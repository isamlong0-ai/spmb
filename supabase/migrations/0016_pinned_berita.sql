-- ============================================================
-- 0016_pinned_berita.sql
-- Berita yang bisa disematkan (pinned) di portal
-- ============================================================
alter table public.web_berita add column if not exists is_pinned boolean not null default false;
create index if not exists web_berita_pinned_idx on public.web_berita (is_pinned, tanggal desc);