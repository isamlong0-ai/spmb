-- ============================================================
-- 0023_audit_fixes.sql
-- Audit fixes:
-- 1) izinkan anon mengirim data alumni (formulir publik)
-- 2) editor boleh menambah/menyunting galeri (publish tetap admin)
-- ============================================================

-- 1. Formulir alumni publik: INSERT hanya dengan is_published=false
drop policy if exists "alumni_submit_publik" on public.alumni;
create policy "alumni_submit_publik" on public.alumni
  for insert to anon
  with check (
    is_published = false
    and (nisn is not null or nis is not null)
    and nama is not null
    and tahun_lulus is not null
  );

-- 2. Editor boleh kelola galeri, tapi trigger 0021 tetap mencegah publish
drop policy if exists "admin_kelola_galeri" on public.web_galeri;
create policy "admin_kelola_galeri" on public.web_galeri
  for all to authenticated
  using (public.web_role() in ('superadmin','admin_web','editor'))
  with check (public.web_role() in ('superadmin','admin_web','editor'));