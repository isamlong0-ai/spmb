-- ============================================================
-- 0025_storage_repair.sql
-- Pastikan bucket & policy upload gambar berfungsi
-- ============================================================
insert into storage.buckets (id, name, public)
values ('web-sekolah','web-sekolah', true)
on conflict (id) do update set public = true;

drop policy if exists "publik_baca_web_sekolah" on storage.objects;
create policy "publik_baca_web_sekolah" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'web-sekolah');

drop policy if exists "editor_admin_upload_web_sekolah" on storage.objects;
create policy "editor_admin_upload_web_sekolah" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'web-sekolah' and public.web_role() in ('superadmin','admin_web','editor'));

drop policy if exists "admin_hapus_web_sekolah" on storage.objects;
create policy "admin_hapus_web_sekolah" on storage.objects
  for delete to authenticated
  using (bucket_id = 'web-sekolah' and public.web_role() in ('superadmin','admin_web'));