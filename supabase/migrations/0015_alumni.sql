-- ============================================================
-- 0015_alumni.sql
-- Modul tracking lulusan siswa
-- ============================================================

create table if not exists public.alumni (
  id uuid primary key default gen_random_uuid(),
  nisn text,
  nis text,
  nama text not null,
  jurusan text,
  tahun_lulus int not null,
  status text not null default 'belum_dilacak'
    check (status in ('belum_dilacak','kuliah','kerja','wirausaha','mencari','lainnya')),
  institusi text,
  kota text,
  kontak text,
  catatan text,
  sumber text default 'manual',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists alumni_nisn_tahun_uq on public.alumni (nisn, tahun_lulus) where nisn is not null;
create unique index if not exists alumni_nis_tahun_uq on public.alumni (nis, tahun_lulus) where nis is not null;

-- toggle formulir alumni di web_info
alter table public.web_info add column if not exists alumni_form_aktif boolean not null default true;

alter table public.alumni enable row level security;

-- publik hanya baca yang dipublish
drop policy if exists "publik_baca_alumni" on public.alumni;
create policy "publik_baca_alumni" on public.alumni
  for select to anon using (is_published = true);

drop policy if exists "auth_baca_alumni" on public.alumni;
create policy "auth_baca_alumni" on public.alumni
  for select to authenticated using (true);

-- kelola: superadmin + admin_web
drop policy if exists "admin_kelola_alumni" on public.alumni;
create policy "admin_kelola_alumni" on public.alumni
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_web'))
  with check (public.web_role() in ('superadmin','admin_web'));

-- trigger updated_at
create or replace function public.set_updated_at_alumni()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_alumni_updated on public.alumni;
create trigger trg_alumni_updated before update on public.alumni
  for each row execute function public.set_updated_at_alumni();