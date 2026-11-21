-- =============================================================================
-- Migrasi 0004 — Mode tahun pelajaran otomatis
-- Jalankan di Supabase SQL Editor setelah 0003_landing.sql
-- =============================================================================

-- Mode 'auto' = tahun dihitung dari tanggal saat ini (berganti sendiri).
-- Mode 'manual' = admin memilih tahun tertentu (mis. tahun depan lebih awal).
insert into public.pengaturan (key, value)
values ('mode_tahun_aktif', 'auto')
on conflict (key) do nothing;

-- Samakan nilai tersimpan dengan tahun berjalan saat migrasi dijalankan.
-- (Nilai ini hanya dipakai saat mode manual; di mode auto dihitung otomatis.)
update public.pengaturan
set value = case
  when extract(month from now()) >= 7
    then to_char(now(), 'YYYY') || '/' || to_char(now() + interval '1 year', 'YYYY')
  else to_char(now() - interval '1 year', 'YYYY') || '/' || to_char(now(), 'YYYY')
end
where key = 'tahun_pelajaran_aktif';
