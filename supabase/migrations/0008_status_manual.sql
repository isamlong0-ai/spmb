-- =============================================================================
-- Migrasi 0008 — Buka/tutup pendaftaran diatur manual dari panel admin
-- Jalankan di Supabase SQL Editor setelah 0007_cek_nisn_kode.sql
-- =============================================================================

alter table public.landing
  add column if not exists status_pendaftaran text not null default 'dibuka';

alter table public.landing drop constraint if exists landing_status_check;
alter table public.landing add constraint landing_status_check
  check (status_pendaftaran in ('dibuka', 'akan-datang', 'ditutup'));

update public.landing set status_pendaftaran = 'dibuka' where id = 1;
