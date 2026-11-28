-- ============================================================
-- 0014_roles_split.sql
-- Pisahkan admin website vs SPMB + superadmin
-- ============================================================

-- 1. Lepas constraint lama dulu agar bisa migrasi role
alter table public.web_roles drop constraint if exists web_roles_role_check;

-- 2. Migrasi role lama 'admin' -> 'superadmin'
update public.web_roles set role = 'superadmin' where role = 'admin';

-- 3. Pasang constraint baru
alter table public.web_roles
  add constraint web_roles_role_check
  check (role in ('superadmin','admin_web','admin_spmb','editor'));

-- 3. RLS web_roles: hanya superadmin yang kelola semua; user lihat dirinya
drop policy if exists "web_roles_select" on public.web_roles;
create policy "web_roles_select" on public.web_roles
  for select to authenticated
  using (auth.uid() = user_id or public.web_role() = 'superadmin');

drop policy if exists "web_roles_admin_all" on public.web_roles;
create policy "web_roles_admin_all" on public.web_roles
  for all to authenticated
  using (public.web_role() = 'superadmin') with check (public.web_role() = 'superadmin');

-- 4. Website tables: berita (superadmin, admin_web, editor); info/daftar (superadmin, admin_web)
drop policy if exists "editor_admin_tulis_berita" on public.web_berita;
create policy "editor_admin_tulis_berita" on public.web_berita
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_web','editor'))
  with check (public.web_role() in ('superadmin','admin_web','editor'));

drop policy if exists "admin_tulis_info" on public.web_info;
create policy "admin_tulis_info" on public.web_info
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_web'))
  with check (public.web_role() in ('superadmin','admin_web'));

drop policy if exists "admin_tulis_daftar" on public.web_daftar;
create policy "admin_tulis_daftar" on public.web_daftar
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_web'))
  with check (public.web_role() in ('superadmin','admin_web'));

-- 5. SPMB tables: superadmin + admin_spmb
drop policy if exists "admin_all_pendaftar" on public.pendaftar;
create policy "admin_all_pendaftar" on public.pendaftar
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb'))
  with check (public.web_role() in ('superadmin','admin_spmb'));

drop policy if exists "admin_all_nilai" on public.nilai_rapor;
create policy "admin_all_nilai" on public.nilai_rapor
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb'))
  with check (public.web_role() in ('superadmin','admin_spmb'));

drop policy if exists "admin_pengaturan" on public.pengaturan;
create policy "admin_pengaturan" on public.pengaturan
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb'))
  with check (public.web_role() in ('superadmin','admin_spmb'));

drop policy if exists "admin_landing" on public.landing;
create policy "admin_landing" on public.landing
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb'))
  with check (public.web_role() in ('superadmin','admin_spmb'));

drop policy if exists "admin_dinas_info" on public.dinas_info;
create policy "admin_dinas_info" on public.dinas_info
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb'))
  with check (public.web_role() in ('superadmin','admin_spmb'));

drop policy if exists "admin_dinas_hasil" on public.dinas_hasil;
create policy "admin_dinas_hasil" on public.dinas_hasil
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb'))
  with check (public.web_role() in ('superadmin','admin_spmb'));

-- 6. Seed superadmin (akun utama)
insert into public.web_roles (user_id, role)
select id, 'superadmin' from auth.users where email = 'admin@smkn1tk.sch.id'
on conflict (user_id) do update set role = 'superadmin';