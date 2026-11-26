-- =============================================================================
-- Migrasi 0012 — Pengumuman kelulusan: draft/publish & akses publik
-- Jalankan di Supabase SQL Editor setelah 0011_dinas_hasil.sql
-- =============================================================================

alter table public.dinas_hasil
  add column if not exists is_published boolean not null default false;

-- Publik hanya boleh melihat baris hasil impor dinas yang sudah dipublish
-- dan tidak nonaktif. Data formulir/manual tidak pernah tampil di pengumuman.
drop policy if exists "publik_baca_pengumuman" on public.dinas_hasil;
create policy "publik_baca_pengumuman"
  on public.dinas_hasil for select to anon
  using (is_published and sumber = 'import' and status <> 'nonaktif');

comment on column public.dinas_hasil.is_published is
  ' true = tampil di halaman pengumuman publik; false = masih draft';
