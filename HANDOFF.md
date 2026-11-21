# Status & Langkah Lanjutan (internal)

## Sudah selesai
- Project Supabase: `spmb-smkn1tk`, ref `eyugtyqppolmynhxccot`, region `ap-southeast-1`.
  - DB password: `SpMb2026#TkSambas!Kbr`
- ✅ SQL migration **sudah dijalankan** (tabel `pendaftar`, `nilai_rapor`, RLS, RPC `simpan_pendaftaran`/`cek_nisn`, akun admin semua sudah ada & teruji).
- ✅ Anon/publishable key sudah terisi di `assets/js/config.js`.
- ✅ Tes end-to-end berhasil: insert via RPC → cek NISN → hapus data dummy (DB bersih).
- ✅ Login admin Supabase Auth berhasil.
- Aplikasi: `index.html` (beranda/landing, konten bisa diatur admin), `pendaftaran.html` (formulir pengumpulan data calon siswa, wizard 6 langkah), `cek.html` (cek data + cetak ulang), `admin.html` (CRUD + editor beranda), CSS/JS responsif.
- ⚠️ Posisi: halaman ini **bukan pendaftaran resmi**; pendaftaran resmi di portal dinas https://spmb-dikbud.kalbarprov.go.id/ (tautan tampil di beranda di bawah waktu pengisian, di form, dan di bukti).
- Alamat terstruktur + autocomplete wilayah (default Kalimantan Barat / Kabupaten Sambas).
- Apps Script proxy upload Drive: `apps-script/Code.gs` + `PANDUAN.md`.
- ✅ Sudah di-push ke https://github.com/isamlong0-ai/spmb.git (branch `main`).
- Konfigurasi MCP Supabase ditulis ke `~/.config/opencode/opencode.json` (opsional, tidak dipakai).

## Yang masih perlu
- Hapus 5 file uji di Drive: `foto_test_koneksi.jpg`, `foto_test_cors_browser.jpg`, `foto_test_folder_tahun.jpg`, `foto_test_folder_final.jpg`, `foto_test_url_baru.jpg`. (1x1 pixel) dari Drive: `foto_test_koneksi.jpg`, `foto_test_cors_browser.jpg`, `foto_test_folder_tahun.jpg` (folder utama), dan `foto_test_folder_final.jpg` (dalam subfolder `2026-2027`).
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
- Kolom `tahun_pelajaran` di `pendaftar`; kode pengiriman data mengikuti tahun.
- Tabel `pengaturan` menyimpan `tahun_pelajaran_aktif` untuk form publik.
- Admin: ubah tahun aktif lewat dropdown di Dashboard + filter tahun di tabel & export Excel/CSV.
- Export Excel: 2 sheet (Calon Siswa, Nilai Rapor) via SheetJS; sudah diuji menghasilkan `.xlsx`.
- `cek_nisn` mengembalikan `tahun_pelajaran`.

## Perubahan terakhir 8 — Pembersihan beranda
- Kartu "Distribusi Pilihan Jurusan" dihapus dari beranda (RPC `statistik_minat_jurusan` tidak lagi dipanggil).
- Seksi CTA "Siap Mengisi Data Calon Siswa?" dihapus.
- "Jumlah Validasi" dihapus total dari UI (field admin & bar diagram) karena tidak bisa diambil otomatis. Kolom DB `minat_validasi` dibiarkan tapi tidak dipakai.
- Persentase minat dikembalikan ke angka besar (129,59%) + nama sekolah + 508/392.

## Perubahan terakhir 7 — Jadwal & diagram validasi
- Hero: caption "Status formulir diatur oleh panitia." dan kotak hitung mundur dihapus.
- Kartu Jadwal Lengkap sekarang menampilkan timeline per jalur (SMK default) dari `/jadwal`, diambil via proxy saat Tarik Info, disimpan di `jadwal_data`.
- Diagram baru: Jumlah Daftar / Jumlah Kuota / Jumlah Validasi (503) dari halaman `/statsekolah/school` (POST+CSRF, tidak bisa diakses browser → diisi manual di admin, seeded via migration).
- Data angka: SMKN 1 Teluk Keramat = 508 daftar / 392 kuota / 503 validasi.

## Perubahan terakhir 6 — Scrape lewat browser
- Apps Script `scrape_dinas` Gagal: izin `script.external_request` tidak bisa diperoleh (sudah coba Run, revoke, manifest, deployment baru — tetap ditolak).
- Solusi: `tarikInfoDinas()` di admin.js mengambil langsung dari browser via `https://r.jina.ai/` (proxy baca-saja, CORS OK) untuk halaman utama & endpoint JSON portal.
- Parser markdown: 8 pengumuman, URL PDF SPTJM (%20), URL video SMK, "Terakhir diperbarui"; parser JSON: 508/392/129,59% untuk SMKN 1 Teluk Keramat.
- Sudah diuji penuh: Tarik → draft terisi → Simpan → beranda menampilkan 4 pengumuman + minat + tautan. Alur seksi "alur" sudah dihapus.
- `DRIVE_UPLOAD_URL` diperbarui ke deployment baru (upload foto teruji, folder `2026-2027`).
- Asset diberi `?v=12` untuk menghindari cache browser.

## Perubahan terakhir 5 — Info portal dinas
- Beranda: seksi "Alur Pengumpulan Data" dihapus; diganti seksi "Info dari Portal Dinas" (6 kartu) setelah Sambutan. Hero/Sambutan tetap dipertahankan.
- Strip ringkas di bawah "Waktu Pengisian Formulir" menampilkan sumber/update + minat sekolah.
- Apps Script: aksi `scrape_dinas` (UrlFetchApp) → ekstrak 8 pengumuman, URL PDF SPTJM, URL video SMK, JSON minat sekolah. Logika regex sudah diuji terhadap portal asli (8 pengumuman, 508/392 = 129,59%).
- Admin Konten Beranda: tombol "Tarik Info dari Portal Dinas" → draft editable → "Simpan Info Dinas" ke tabel `dinas_info`.
- Video dibuka di tab baru; PDF taut langsung ke sumber resmi dinas.
- Distribusi jurusan: RPC `statistik_minat_jurusan(p_tahun)` (agregat, tanpa PII) → chart di beranda.

## Perubahan terakhir 4 — Rekosakataan
- Posisi aplikasi ditegaskan: **pengumpulan data calon siswa**, bukan pendaftaran resmi.
- Pendaftaran resmi = portal dinas https://spmb-dikbud.kalbarprov.go.id/, ditampilkan:
  - di beranda tepat di bawah "Waktu Pengisian Formulir" (`.lp-dinas-link`),
  - di hero formulir, di banner pengunci (gate/notice), dan di CATATAN PENTING bukti (form & cek).
- Istilah publik diganti: "Formulir Pengumpulan Data Calon Siswa", "Isi Formulir", "Waktu Pengisian Formulir", "Status Formulir", "Cek Data Calon Siswa", "Bukti Pengiriman Data Calon Siswa", "Kode Pengiriman Data".
- Admin: "Data Calon Siswa", "Total Calon Siswa", sheet Excel "Calon Siswa".
- Identifier DB/JS (pendaftar, kode_pendaftaran, status_pendaftaran, formPendaftaran) sengaja tidak diubah → tanpa migrasi baru.
- Sudah diuji di browser: beranda, form, cek, admin — tanpa error.

## Perubahan terakhir 3
- Status formulir manual (migration 0008): kolom `status_pendaftaran` di tabel `landing`.
- Admin → Konten Beranda → dropdown Status Formulir (Dibuka / Akan Datang / Ditutup).
- `status.js` memakai nilai manual; tanggal hanya fallback & catatan. Countdown disembunyikan saat manual.
- `cek.html` juga terkunci bila status bukan Dibuka.
- Sudah diuji: ubah ke Ditutup → 8 tautan beranda terkunci + guard form + guard cek muncul → dikembalikan ke Dibuka.

## Perubahan terakhir 2
- Halaman `cek.html` mandiri: cari by NISN + Cetak Ulang + Unduh PDF (sudah diuji, PDF 172 KB terunduh).
- Migration 0007 aktif: `cek_nisn` mengembalikan `kode_pendaftaran`.
- Form: menu "Area Admin" dihapus.
- Admin: tombol Excel/CSV pindah ke toolbar Data Calon Siswa; tombol Simpan tahun & pemilih tahun hanya di Dashboard; tombol Muat Ulang dihapus.
- Dashboard kini hanya grafik + 4 kartu atas (Total + top 3 jurusan); tabel tidak tampil di Dashboard.
- Statistik dashboard scoped per tahun lewat dropdown `#statTahun` (default tahun aktif + opsi Semua Tahun). Sudah diuji: 2026/2027 → 0, 2027/2028 → 1, Semua Tahun → 1. Grafik per tahun tetap memakai semuaData.

## Perubahan terakhir
- Tabel admin: kolom "Pilihan Jurusan" menampilkan ke-3 jurusan; kolom status dihapus dari UI.
- Halaman beranda mengunci 8 tautan form saat status Akan Datang/Ditutup; `guard.js` memblokir form.
  Sudah diuji untuk ketiga kondisi lalu jadwal dikembalikan ke 2026-11-01 s.d. 2026-12-31 (Dibuka).
- Menu Ganti Password ditambahkan & diuji (verifikasi password lama + updateUser), lalu password dikembalikan.

## Kredensial
- Anon key: `sb_publishable_XBST_lVhiVHsq6FpFAmx-A_ddN0JB1K`
- Admin: `admin@smkn1tk.sch.id` / `AdminSPMB2026!`
- Folder Drive: `1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT`
