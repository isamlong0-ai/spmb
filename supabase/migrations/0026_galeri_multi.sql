-- ============================================================
-- 0026_galeri_multi.sql
-- Galeri: satu post bisa banyak foto
-- ============================================================
alter table public.web_galeri
  add column if not exists fotos jsonb not null default '[]'::jsonb;