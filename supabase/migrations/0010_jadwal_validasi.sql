-- =============================================================================
-- Migrasi 0010 — Jadwal lengkap portal dinas & jumlah validasi sekolah
-- Jalankan di Supabase SQL Editor setelah 0009_dinas_info.sql
-- =============================================================================

alter table public.dinas_info
  add column if not exists jadwal_data jsonb not null default '[]'::jsonb,
  add column if not exists minat_validasi integer;

-- Isi awal: jadwal dari portal dinas per 21 Nov 2026 + angka SMKN 1 Teluk Keramat
-- (508 daftar / 392 kuota / 503 validasi). Bisa diperbarui lagi dari panel admin.
update public.dinas_info
set
  jadwal_data = $$
[
  {"jalur":"SMK","items":[
    {"tahap":"Pembuatan akun dan Pendaftaran","tanggal":"22 Juni - 12 Juli 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Masa Sanggah","tanggal":"13 - 14 Juli 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"},
    {"tahap":"Pengumuman","tanggal":"15 Juli 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Daftar Ulang","tanggal":"16 - 17 Juli 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"}
  ]},
  {"jalur":"Prestasi","items":[
    {"tahap":"Pembuatan akun dan Pendaftaran","tanggal":"10 - 12 Juli 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Masa Sanggah","tanggal":"13 - 14 Juli 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"},
    {"tahap":"Pengumuman","tanggal":"15 Juli 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Daftar Ulang","tanggal":"16 - 17 Juli 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"}
  ]},
  {"jalur":"Domisili","items":[
    {"tahap":"Pembuatan akun dan Pendaftaran","tanggal":"30 Juni - 2 Juli 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Masa Sanggah","tanggal":"3 - 6 Juli 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"},
    {"tahap":"Pengumuman","tanggal":"7 Juli 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Daftar Ulang","tanggal":"8 - 9 Juli 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"}
  ]},
  {"jalur":"Mutasi","items":[
    {"tahap":"Pembuatan akun dan Pendaftaran","tanggal":"22 - 23 Juni 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Masa Sanggah","tanggal":"24 Juni 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"},
    {"tahap":"Pengumuman","tanggal":"25 Juni 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Daftar Ulang","tanggal":"26 - 29 Juni 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"}
  ]},
  {"jalur":"Afirmasi/Disabilitas","items":[
    {"tahap":"Pembuatan akun dan Pendaftaran","tanggal":"22 - 23 Juni 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Masa Sanggah","tanggal":"24 Juni 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"},
    {"tahap":"Pengumuman","tanggal":"25 Juni 2026","jam":"00:00 - 23:59 WIB","status":"Selesai"},
    {"tahap":"Daftar Ulang","tanggal":"26 - 29 Juni 2026","jam":"08:00 - 14:00 WIB","status":"Selesai"}
  ]}
]
$$::jsonb,
  minat_validasi = 503
where id = 1;
