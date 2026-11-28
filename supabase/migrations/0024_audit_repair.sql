-- ============================================================
-- 0024_audit_repair.sql
-- Perbaikan menyeluruh (idempoten): kolom, policy, trigger, role
-- ============================================================

-- ---------- web_role (kompatibilitas admin lama) ----------
create or replace function public.web_role()
returns text language sql stable security definer set search_path = public as $$
  select case role when 'admin' then 'superadmin' else role end
  from public.web_roles where user_id = auth.uid();
$$;
grant execute on function public.web_role() to anon, authenticated;

-- ---------- pastikan kolom ada ----------
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='web_info' and column_name='logo_url') then
    alter table public.web_info add column logo_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='web_info' and column_name='hero_url') then
    alter table public.web_info add column hero_url text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='web_info' and column_name='alumni_form_aktif') then
    alter table public.web_info add column alumni_form_aktif boolean not null default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='web_info' and column_name='detail') then
    alter table public.web_info add column detail jsonb not null default '{}'::jsonb;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='web_berita' and column_name='is_pinned') then
    alter table public.web_berita add column is_pinned boolean not null default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='web_berita' and column_name='status') then
    alter table public.web_berita add column status text not null default 'draft';
  end if;
  if not exists (select 1 from pg_constraint where conname='web_berita_status_check' and conrelid='public.web_berita'::regclass) then
    alter table public.web_berita add constraint web_berita_status_check check (status in ('draft','pending','published'));
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='web_galeri' and column_name='status') then
    alter table public.web_galeri add column status text not null default 'draft';
  end if;
  if not exists (select 1 from pg_constraint where conname='web_galeri_status_check' and conrelid='public.web_galeri'::regclass) then
    alter table public.web_galeri add constraint web_galeri_status_check check (status in ('draft','pending','published'));
  end if;
end $$;

-- sinkron status lama
update public.web_berita set status='published' where is_published is true and status is distinct from 'published';
update public.web_galeri set status='published' where is_published is true and status is distinct from 'published';

-- ---------- web_berita ----------
drop policy if exists "publik_baca_berita" on public.web_berita;
create policy "publik_baca_berita" on public.web_berita for select to anon using (is_published = true);
drop policy if exists "auth_baca_berita" on public.web_berita;
create policy "auth_baca_berita" on public.web_berita for select to authenticated using (true);
drop policy if exists "editor_admin_tulis_berita" on public.web_berita;
create policy "editor_admin_tulis_berita" on public.web_berita for all to authenticated
  using (public.web_role() in ('superadmin','admin_web','editor'))
  with check (public.web_role() in ('superadmin','admin_web','editor'));

-- ---------- web_info ----------
drop policy if exists "publik_baca_info" on public.web_info;
create policy "publik_baca_info" on public.web_info for select to anon using (true);
drop policy if exists "auth_baca_info" on public.web_info;
create policy "auth_baca_info" on public.web_info for select to authenticated using (true);
drop policy if exists "admin_tulis_info" on public.web_info;
create policy "admin_tulis_info" on public.web_info for all to authenticated
  using (public.web_role() in ('superadmin','admin_web')) with check (public.web_role() in ('superadmin','admin_web'));

-- ---------- web_daftar ----------
drop policy if exists "publik_baca_daftar" on public.web_daftar;
create policy "publik_baca_daftar" on public.web_daftar for select to anon using (is_published = true);
drop policy if exists "auth_baca_daftar" on public.web_daftar;
create policy "auth_baca_daftar" on public.web_daftar for select to authenticated using (true);
drop policy if exists "admin_tulis_daftar" on public.web_daftar;
create policy "admin_tulis_daftar" on public.web_daftar for all to authenticated
  using (public.web_role() in ('superadmin','admin_web')) with check (public.web_role() in ('superadmin','admin_web'));

-- ---------- web_galeri ----------
drop policy if exists "publik_baca_galeri" on public.web_galeri;
create policy "publik_baca_galeri" on public.web_galeri for select to anon using (is_published = true);
drop policy if exists "auth_baca_galeri" on public.web_galeri;
create policy "auth_baca_galeri" on public.web_galeri for select to authenticated using (true);
drop policy if exists "admin_kelola_galeri" on public.web_galeri;
create policy "admin_kelola_galeri" on public.web_galeri for all to authenticated
  using (public.web_role() in ('superadmin','admin_web','editor'))
  with check (public.web_role() in ('superadmin','admin_web','editor'));

-- ---------- alumni ----------
drop policy if exists "publik_baca_alumni" on public.alumni;
create policy "publik_baca_alumni" on public.alumni for select to anon using (is_published = true);
drop policy if exists "auth_baca_alumni" on public.alumni;
create policy "auth_baca_alumni" on public.alumni for select to authenticated using (true);
drop policy if exists "alumni_submit_publik" on public.alumni;
create policy "alumni_submit_publik" on public.alumni for insert to anon
  with check (is_published = false and nama is not null and tahun_lulus is not null and (nisn is not null or nis is not null));
drop policy if exists "admin_kelola_alumni" on public.alumni;
create policy "admin_kelola_alumni" on public.alumni for all to authenticated
  using (public.web_role() in ('superadmin','admin_web')) with check (public.web_role() in ('superadmin','admin_web'));

-- ---------- SPMB ----------
drop policy if exists "admin_all_pendaftar" on public.pendaftar;
create policy "admin_all_pendaftar" on public.pendaftar for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb')) with check (public.web_role() in ('superadmin','admin_spmb'));
drop policy if exists "admin_all_nilai" on public.nilai_rapor;
create policy "admin_all_nilai" on public.nilai_rapor for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb')) with check (public.web_role() in ('superadmin','admin_spmb'));
drop policy if exists "admin_pengaturan" on public.pengaturan;
create policy "admin_pengaturan" on public.pengaturan for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb')) with check (public.web_role() in ('superadmin','admin_spmb'));
drop policy if exists "admin_landing" on public.landing;
create policy "admin_landing" on public.landing for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb')) with check (public.web_role() in ('superadmin','admin_spmb'));
drop policy if exists "admin_dinas_info" on public.dinas_info;
create policy "admin_dinas_info" on public.dinas_info for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb')) with check (public.web_role() in ('superadmin','admin_spmb'));
drop policy if exists "admin_dinas_hasil" on public.dinas_hasil;
create policy "admin_dinas_hasil" on public.dinas_hasil for all to authenticated
  using (public.web_role() in ('superadmin','admin_spmb')) with check (public.web_role() in ('superadmin','admin_spmb'));

-- ---------- trigger verifikasi publish ----------
create or replace function public.guard_berita_publish()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.web_role() not in ('superadmin','admin','admin_web') then
    if new.is_published is true and old.is_published is distinct from true then
      raise exception 'Hanya admin yang dapat mempublikasikan berita';
    end if;
    if new.status = 'published' and old.status is distinct from 'published' then
      raise exception 'Hanya admin yang dapat mempublikasikan berita';
    end if;
    new.status := case when new.status = 'published' then 'pending' else new.status end;
  end if;
  new.is_published := (new.status = 'published');
  return new;
end; $$;
drop trigger if exists trg_guard_berita_publish on public.web_berita;
create trigger trg_guard_berita_publish before insert or update on public.web_berita
  for each row execute function public.guard_berita_publish();

create or replace function public.guard_galeri_publish()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.web_role() not in ('superadmin','admin','admin_web') then
    if new.is_published is true and old.is_published is distinct from true then
      raise exception 'Hanya admin yang dapat mempublikasikan galeri';
    end if;
    if new.status = 'published' and old.status is distinct from 'published' then
      raise exception 'Hanya admin yang dapat mempublikasikan galeri';
    end if;
    new.status := case when new.status = 'published' then 'pending' else new.status end;
  end if;
  new.is_published := (new.status = 'published');
  return new;
end; $$;
drop trigger if exists trg_guard_galeri_publish on public.web_galeri;
create trigger trg_guard_galeri_publish before insert or update on public.web_galeri
  for each row execute function public.guard_galeri_publish();

-- ---------- seed role admin ----------
insert into public.web_roles (user_id, role)
select id, 'superadmin' from auth.users where email = 'admin@smkn1tk.sch.id'
on conflict (user_id) do update set role = 'superadmin';
