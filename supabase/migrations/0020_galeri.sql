-- ============================================================
-- 0020_galeri.sql
-- Portal galeri foto sekolah (dikelola admin)
-- ============================================================
create table if not exists public.web_galeri (
  id uuid primary key default gen_random_uuid(),
  judul text,
  kategori text,
  gambar_url text not null,
  tanggal date not null default current_date,
  is_published boolean not null default true,
  urutan int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.web_galeri enable row level security;

drop policy if exists "publik_baca_galeri" on public.web_galeri;
create policy "publik_baca_galeri" on public.web_galeri
  for select to anon using (is_published = true);

drop policy if exists "auth_baca_galeri" on public.web_galeri;
create policy "auth_baca_galeri" on public.web_galeri
  for select to authenticated using (true);

drop policy if exists "admin_kelola_galeri" on public.web_galeri;
create policy "admin_kelola_galeri" on public.web_galeri
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_web'))
  with check (public.web_role() in ('superadmin','admin_web'));