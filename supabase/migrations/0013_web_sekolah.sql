-- ============================================================
-- 0013_web_sekolah.sql
-- Web sekolah (one-page) + role admin/editor
-- ============================================================

-- ---------- web_roles ----------
create table if not exists public.web_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','editor')),
  created_at timestamptz not null default now()
);

create or replace function public.web_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.web_roles where user_id = auth.uid();
$$;

grant execute on function public.web_role() to anon, authenticated;

alter table public.web_roles enable row level security;

drop policy if exists "web_roles_select" on public.web_roles;
create policy "web_roles_select" on public.web_roles
  for select to authenticated
  using (auth.uid() = user_id or public.web_role() = 'admin');

drop policy if exists "web_roles_admin_all" on public.web_roles;
create policy "web_roles_admin_all" on public.web_roles
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

-- ---------- web_berita ----------
create table if not exists public.web_berita (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  kategori text,
  ringkasan text,
  isi text,
  gambar_url text,
  tanggal date not null default current_date,
  penulis text,
  is_published boolean not null default false,
  urutan int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.web_berita enable row level security;

drop policy if exists "publik_baca_berita" on public.web_berita;
create policy "publik_baca_berita" on public.web_berita
  for select to anon using (is_published = true);

drop policy if exists "auth_baca_berita" on public.web_berita;
create policy "auth_baca_berita" on public.web_berita
  for select to authenticated using (true);

drop policy if exists "editor_admin tulis_berita" on public.web_berita;
drop policy if exists "editor_admin_tulis_berita" on public.web_berita;
create policy "editor_admin_tulis_berita" on public.web_berita
  for all to authenticated
  using (public.web_role() in ('admin','editor'))
  with check (public.web_role() in ('admin','editor'));

-- ---------- web_info (satu baris) ----------
create table if not exists public.web_info (
  id int primary key default 1,
  nama_sekolah text,
  tagline text,
  tentang text,
  visi text,
  misi text,
  alamat text,
  telepon text,
  email text,
  whatsapp text,
  maps_embed_url text,
  hero_url text,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.web_info enable row level security;

drop policy if exists "publik_baca_info" on public.web_info;
create policy "publik_baca_info" on public.web_info
  for select to anon using (true);

drop policy if exists "auth_baca_info" on public.web_info;
create policy "auth_baca_info" on public.web_info
  for select to authenticated using (true);

drop policy if exists "admin_tulis_info" on public.web_info;
create policy "admin_tulis_info" on public.web_info
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

insert into public.web_info (id, nama_sekolah, tagline, tentang, visi, misi, alamat, telepon, email, whatsapp, maps_embed_url, stats)
values (1,
  'SMK Negeri 1 Teluk Keramat',
  'Membangun generasi cerdas, terampil, dan berakhlak.',
  'SMK Negeri 1 Teluk Keramat adalah sekolah vokasi yang berkomitmen mencetak lulusan siap kerja dan berwirausaha.',
  'Menjadi sekolah vokasi unggul yang menghasilkan lulusan kompeten dan berkarakter.',
  E'1. Menyelenggarakan pendidikan vokasi berkualitas.\n2. Mengembangkan potensi peserta didik secara optimal.\n3. Membangun karakter disiplin dan bertanggung jawab.',
  'Jl. Raya Teluk Keramat, Kabupaten Sambas, Kalimantan Barat',
  '(0562) 123456',
  'info@smkn1telukkeramat.sch.id',
  '6281234567890',
  'https://www.google.com/maps?q=Teluk+Keramat+Sambas&output=embed',
  '{"tahun_berdiri":"1998","jumlah_siswa":"-","jumlah_guru":"-","jumlah_jurusan":"7"}'::jsonb
)
on conflict (id) do nothing;

-- ---------- web_daftar ----------
create table if not exists public.web_daftar (
  id uuid primary key default gen_random_uuid(),
  jenis text not null check (jenis in ('jurusan','fasilitas','ekstrakurikuler','agenda')),
  judul text not null,
  deskripsi text,
  tanggal date,
  ikon text,
  urutan int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.web_daftar enable row level security;

drop policy if exists "publik_baca_daftar" on public.web_daftar;
create policy "publik_baca_daftar" on public.web_daftar
  for select to anon using (is_published = true);

drop policy if exists "auth_baca_daftar" on public.web_daftar;
create policy "auth_baca_daftar" on public.web_daftar
  for select to authenticated using (true);

drop policy if exists "admin_tulis_daftar" on public.web_daftar;
create policy "admin_tulis_daftar" on public.web_daftar
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

-- seed jurusan contoh
insert into public.web_daftar (jenis, judul, deskripsi, ikon, urutan, is_published) values
  ('jurusan','Teknik Komputer dan Jaringan','Program keahlian bidang teknologi informasi.','💻',1,true),
  ('jurusan','Akuntansi','Program keahlian bidang keuangan dan akuntansi.','📊',2,true),
  ('jurusan','Desain Komunikasi Visual','Program keahlian bidang desain dan multimedia.','🎨',3,true);

-- ---------- sample berita ----------
insert into public.web_berita (judul, kategori, ringkasan, isi, tanggal, penulis, is_published) values
  ('Selamat Datang di Website Resmi Sekolah','Pengumuman','Website resmi SMK Negeri 1 Teluk Keramat kini hadir untuk informasi sekolah.','Website ini menampilkan berita, kegiatan, dan informasi sekolah. Pantau terus untuk update terbaru.', current_date, 'Admin', true),
  ('Kegiatan Awal Tahun Pelajaran','Kegiatan','Rangkaian kegiatan awal tahun pelajaran berjalan lancar.','Seluruh siswa dan guru mengikuti kegiatan pembukaan tahun pelajaran dengan antusias.', current_date, 'Admin', true);

-- ---------- Tighten SPMB policies: hanya admin (bukan semua authenticated) ----------
drop policy if exists "admin_all_pendaftar" on public.pendaftar;
create policy "admin_all_pendaftar" on public.pendaftar
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

drop policy if exists "admin_all_nilai" on public.nilai_rapor;
create policy "admin_all_nilai" on public.nilai_rapor
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

drop policy if exists "admin_pengaturan" on public.pengaturan;
create policy "admin_pengaturan" on public.pengaturan
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

drop policy if exists "admin_landing" on public.landing;
create policy "admin_landing" on public.landing
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

drop policy if exists "admin_dinas_info" on public.dinas_info;
create policy "admin_dinas_info" on public.dinas_info
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

drop policy if exists "admin_dinas_hasil" on public.dinas_hasil;
create policy "admin_dinas_hasil" on public.dinas_hasil
  for all to authenticated
  using (public.web_role() = 'admin') with check (public.web_role() = 'admin');

-- RPC publik: cabut dari authenticated (editor tidak perlu), anon tetap
revoke execute on function public.simpan_pendaftaran(jsonb, jsonb) from authenticated;
revoke execute on function public.cek_nisn(text) from authenticated;
revoke execute on function public.statistik_minat_jurusan(text) from authenticated;

-- ---------- Seed admin role ----------
insert into public.web_roles (user_id, role)
select id, 'admin' from auth.users where email = 'admin@smkn1tk.sch.id'
on conflict (user_id) do nothing;

-- ---------- Storage bucket ----------
insert into storage.buckets (id, name, public)
values ('web-sekolah','web-sekolah', true)
on conflict (id) do nothing;

drop policy if exists "publik_baca_web_sekolah" on storage.objects;
create policy "publik_baca_web_sekolah" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'web-sekolah');

drop policy if exists "editor_admin_upload_web_sekolah" on storage.objects;
create policy "editor_admin_upload_web_sekolah" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'web-sekolah' and public.web_role() in ('admin','editor'));

drop policy if exists "admin_hapus_web_sekolah" on storage.objects;
create policy "admin_hapus_web_sekolah" on storage.objects
  for delete to authenticated
  using (bucket_id = 'web-sekolah' and public.web_role() = 'admin');