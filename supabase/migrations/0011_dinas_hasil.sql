-- =============================================================================
-- Migrasi 0011 — Tabel terpisah untuk hasil kelulusan dari dinas
-- Jalankan di Supabase SQL Editor setelah 0010_jadwal_validasi.sql
-- =============================================================================

create table if not exists public.dinas_hasil (
  id uuid primary key default gen_random_uuid(),
  tahun_pelajaran text not null default '2026/2027',
  no_pendaftaran_dinas text,
  nama text not null,
  nisn text,
  nik text,
  kk text,
  jurusan_diterima text not null,
  jalur text not null default 'Reguler SMK',
  status text not null default 'diterima',
  urutan integer,
  pilihan smallint,
  total_nilai numeric(10, 2),
  bobot_nilai numeric(10, 2),
  bobot_tka numeric(10, 2),
  bobot_prestasi numeric(10, 2),
  keterangan text,
  catatan_verifikasi text,
  alasan_nonaktif text,
  catatan_mutasi text,
  sumber text not null default 'import',
  pendaftar_id uuid references public.pendaftar (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tahun_pelajaran, nisn)
);

-- Catatan: unique di atas mencegah duplikat NISN per tahun pelajaran.
-- Import memakai cek-ada-dulu lalu update/insert (bukan ON CONFLICT),
-- supaya tetap bekerja juga pada database yang dibuat dengan index partial.

create index if not exists idx_dinas_hasil_tahun on public.dinas_hasil (tahun_pelajaran);
create index if not exists idx_dinas_hasil_jurusan on public.dinas_hasil (jurusan_diterima);

alter table public.dinas_hasil enable row level security;

-- Internal sekolah: anon tidak punya akses sama sekali
drop policy if exists "admin_dinas_hasil" on public.dinas_hasil;
create policy "admin_dinas_hasil"
  on public.dinas_hasil for all to authenticated
  using (true) with check (true);
