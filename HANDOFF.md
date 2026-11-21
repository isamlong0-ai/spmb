# Status & Langkah Lanjutan (internal)

## Sudah selesai
- Project Supabase: `spmb-smkn1tk`, ref `eyugtyqppolmynhxccot`, region `ap-southeast-1`.
  - DB password: `SpMb2026#TkSambas!Kbr`
- ✅ SQL migration **sudah dijalankan** (tabel `pendaftar`, `nilai_rapor`, RLS, RPC `simpan_pendaftaran`/`cek_nisn`, akun admin semua sudah ada & teruji).
- ✅ Anon/publishable key sudah terisi di `assets/js/config.js`.
- ✅ Tes end-to-end berhasil: insert via RPC → cek NISN → hapus data dummy (DB bersih).
- ✅ Login admin Supabase Auth berhasil.
- Aplikasi: `index.html` (beranda/landing, konten bisa diatur admin), `pendaftaran.html` (wizard 6 langkah), `admin.html` (CRUD + editor beranda), CSS/JS responsif.
- Alamat terstruktur + autocomplete wilayah (default Kalimantan Barat / Kabupaten Sambas).
- Apps Script proxy upload Drive: `apps-script/Code.gs` + `PANDUAN.md`.
- ✅ Sudah di-push ke https://github.com/isamlong0-ai/spmb.git (branch `main`).
- Konfigurasi MCP Supabase ditulis ke `~/.config/opencode/opencode.json` (opsional, tidak dipakai).

## Yang masih perlu
- ⚠️ **Jalankan `supabase/migrations/0007_cek_nisn_kode.sql`** di SQL Editor (tambah kode pendaftaran pada RPC cek_nisn, dipakai cetak ulang).
- Hapus 4 file uji (1x1 pixel) dari Drive: `foto_test_koneksi.jpg`, `foto_test_cors_browser.jpg`, `foto_test_folder_tahun.jpg` (folder utama), dan `foto_test_folder_final.jpg` (dalam subfolder `2026-2027`).
- Opsional: hapus 1 data dummy `asdfghjk` (NISN `347689054`, kode `SPMB-2027-2028-507682B3`) — bukan dibuat oleh agent, kemungkinan uji manual.
- Ganti password admin default `AdminSPMB2026!` setelah login pertama — sekarang tersedia menu 🔑 Ganti Password di panel admin (sudah diuji, password dikembalikan ke semula setelah uji).

Apps Script Web App sudah aktif & teruji (GET + POST upload ke Drive berhasil), URL terisi di config.

## Beranda (baru)
- Tabel `landing` sudah aktif; konten awal terisi & sambutan sudah memakai baris baru asli.
- Admin → menu "Konten Beranda" untuk mengatur judul, tagline, sambutan, tahun, waktu & tanggal.
- Status & hitung mundur otomatis dari tanggal mulai/selesai. Sudah diuji edit → tampil di beranda → dikembalikan.

## Otomatisasi terbaru
- Tahun pelajaran dihitung dari tanggal (mulai Juli) via `assets/js/tahun.js`.
- Opsi admin: Otomatis / tahun sekarang / tahun depan + tahun dari database.
- Autocomplete wilayah nasional dari data lokal `wilayah-data.js` (generate via `scripts/generate-wilayah.ps1`); Kalbar/Sambas juga fallback offline. Tidak bergantung CORS.

## Fitur tahun pelajaran
- Kolom `tahun_pelajaran` di `pendaftar`; kode pendaftaran mengikuti tahun.
- Tabel `pengaturan` menyimpan `tahun_pelajaran_aktif` untuk form publik.
- Admin: ubah tahun aktif lewat dropdown di Dashboard + filter tahun di tabel & export Excel/CSV.
- Export Excel: 2 sheet (Pendaftar, Nilai Rapor) via SheetJS; sudah diuji menghasilkan `.xlsx`.
- `cek_nisn` mengembalikan `tahun_pelajaran`.

## Perubahan terakhir
- Tabel admin: kolom "Pilihan Jurusan" menampilkan ke-3 jurusan; kolom status dihapus dari UI.
- Halaman beranda mengunci 8 tautan form saat status Akan Datang/Ditutup; `guard.js` memblokir form.
  Sudah diuji untuk ketiga kondisi lalu jadwal dikembalikan ke 2026-11-01 s.d. 2026-12-31 (Dibuka).
- Menu Ganti Password ditambahkan & diuji (verifikasi password lama + updateUser), lalu password dikembalikan.

## Kredensial
- Anon key: `sb_publishable_XBST_lVhiVHsq6FpFAmx-A_ddN0JB1K`
- Admin: `admin@smkn1tk.sch.id` / `AdminSPMB2026!`
- Folder Drive: `1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT`
