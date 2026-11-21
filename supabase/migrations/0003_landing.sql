-- =============================================================================
-- Migrasi 0003 — Konten Beranda (bisa diatur dari panel admin)
-- Jalankan di Supabase SQL Editor setelah 0002_tahun_pelajaran.sql
-- =============================================================================

create table if not exists public.landing (
  id integer primary key default 1 check (id = 1),
  judul text not null default 'Selamat Datang di SPMB SMKN 1 Teluk Keramat',
  tagline text not null default 'Raih masa depanmu bersama kami. Pendaftaran siswa baru telah dibuka.',
  sambutan text not null default 'Assalamu''alaikum wr. wb.\n\nDengan hormat, kami menyampaikan sambutan hangat kepada seluruh calon siswa dan orang tua/wali. Semoga Anda dalam keadaan sehat dan dilimpahi keberkahan.\n\nPenerimaan Murid Baru (SPMB) merupakan langkah awal menuju masa depan yang cerah. Kami mengundang putra-putri terbaik untuk bergabung bersama keluarga besar SMK Negeri 1 Teluk Keramat.',
  tahun_pelajaran text not null default '2026/2027',
  waktu_pendaftaran text not null default '01 November 2026 – 31 Desember 2026',
  tanggal_mulai date,
  tanggal_selesai date,
  updated_at timestamptz not null default now()
);

alter table public.landing enable row level security;

drop policy if exists "publik_baca_landing" on public.landing;
create policy "publik_baca_landing"
  on public.landing for select to anon
  using (true);

drop policy if exists "admin_landing" on public.landing;
create policy "admin_landing"
  on public.landing for all to authenticated
  using (true) with check (true);

insert into public.landing (
  id, judul, tagline, sambutan, tahun_pelajaran, waktu_pendaftaran, tanggal_mulai, tanggal_selesai
) values (
  1,
  'Selamat Datang di Penerimaan Murid Baru',
  'Raih masa depanmu bersama keluarga besar SMK Negeri 1 Teluk Keramat. Pendaftaran tahun pelajaran 2026/2027 telah dibuka.',
  'Assalamu''alaikum wr. wb.\n\nDengan hormat, kami menyampaikan sambutan hangat kepada seluruh calon siswa serta orang tua/wali. Semoga senantiasa dalam keadaan sehat dan dilimpahi keberkahan dari Allah Swt.\n\nPenerimaan Murid Baru (SPMB) adalah langkah awal menuju masa depan yang cerah. Di SMK Negeri 1 Teluk Keramat, kami berkomitmen membentuk generasi yang kompeten, berkarakter, dan siap menghadapi dunia kerja maupun melanjutkan pendidikan.\n\nKami mengundang putra-putri terbaik untuk bergabung bersama keluarga besar kami. Isilah formulir pendaftaran dengan jujur dan lengkap. Selamat bergabung!',
  '2026/2027',
  '01 November 2026 – 31 Desember 2026',
  '2026-11-01',
  '2026-12-31'
)
on conflict (id) do nothing;
