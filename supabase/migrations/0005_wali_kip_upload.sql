-- =============================================================================
-- Migrasi 0005 — Perbaikan data wali & KIP
-- Jalankan di Supabase SQL Editor setelah 0004_auto_tahun.sql
-- =============================================================================

-- Wali kini memiliki field yang sama seperti ayah/ibu (satu set saja).
alter table public.pendaftar
  add column if not exists status_wali text,
  add column if not exists tempat_lahir_wali text,
  add column if not exists tanggal_lahir_wali date,
  add column if not exists nik_wali text,
  add column if not exists pendidikan_wali text,
  add column if not exists penghasilan_wali text;

-- (Kolom no_kip sudah bertipe text dan tidak punya constraint angka,
--  jadi nomor KIP boleh berisi huruf, angka, dan karakter lain.)

-- Kolom foto lama (foto_kk, foto_akta, foto_rapor) dibiarkan agar data lama
-- tetap terbaca, walaupun form sekarang hanya mengunggah foto 3x4.
