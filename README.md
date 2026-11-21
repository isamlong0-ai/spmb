# SPMB SMK Negeri 1 Teluk Keramat — 2026/2027

Aplikasi pendaftaran siswa baru berbasis **HTML + CSS + JavaScript (ES modules)**, dengan:

- **Supabase** sebagai database & autentikasi admin (Postgres + RLS)
- **Google Apps Script Web App** sebagai proxy unggah foto ke **Google Drive**
- Antarmuka modern, responsif, dan ramah HP maupun komputer

---

## Struktur proyek

```
.
├── index.html                    # BERANDA / landing page (konten bisa diatur di admin)
├── pendaftaran.html              # Form pendaftaran (wizard 6 langkah)
├── admin.html                    # Panel admin (login + CRUD + editor beranda)
├── assets/
│   ├── css/styles.css            # Design system & responsive layout
│   └── js/
│       ├── config.js             # Konfigurasi Supabase, Drive, jurusan
│       ├── tahun.js              # Tahun pelajaran otomatis (sekarang + depan)
│       ├── wilayah.js            # Autocomplete wilayah nasional (kalbar offline)
│       ├── landing.js            # Render konten beranda & status/hitung mundur
│       ├── form.js               # Logika wizard, validasi, upload, submit
│       └── admin.js              # Logika CRUD panel admin
├── supabase/migrations/
│   ├── 0001_init.sql             # Skema tabel, RLS, RPC, akun admin
│   ├── 0002_tahun_pelajaran.sql  # Pemisahan data per tahun pelajaran
│   ├── 0003_landing.sql          # Tabel konten beranda
│   ├── 0004_auto_tahun.sql       # Mode tahun pelajaran otomatis
│   └── 0005_wali_kip_upload.sql  # Field wali lengkap & penyesuaian form
├── apps-script/
│   ├── Code.gs                   # Web App upload foto ke Google Drive
│   └── PANDUAN.md                # Cara deploy Apps Script
└── README.md
```

---

## Fitur utama

### Beranda (`index.html`)
- Halaman utama yang menarik: hero, kartu informasi, kata sambutan, alur pendaftaran, dan panduan
- **Seluruh teks utama bisa diatur dari panel admin** (judul, tagline, sambutan, tahun pelajaran, waktu pendaftaran, tanggal mulai/selesai)
- Status pendaftaran (**Akan Datang / Dibuka / Ditutup**) dan hitung mundur dihitung otomatis dari tanggal
- Tombol menuju formulir dan pencarian data

### Form pendaftar (`pendaftaran.html`)
- Wizard **6 langkah** dengan progress bar dan navigasi bebas ke langkah sebelumnya
- **Alamat terpisah per wilayah**: provinsi → kabupaten → kecamatan → desa → RT → RW → kode pos → patokan → alamat lengkap
- **Autocomplete provinsi & kabupaten**, dengan default **Kalimantan Barat / Kabupaten Sambas**
- Daftar kecamatan & desa (Sambas tersedia offline; kabupaten lain diambil dari `wilayah.id` saat online)
- Validasi per langkah, pesan error inline, dan pencegahan duplikat jurusan
- Tabel nilai rapor 5 mapel × 5 semester dengan kalkulasi rata-rata otomatis
- Upload satu foto 3x4 siswa dengan kompresi sisi klien, **opsional**, tersimpan di subfolder Google Drive sesuai tahun pelajaran
- Nomor KIP bebas huruf/angka/tanda baca; orang tua meninggal otomatis menyembunyikan isian rinciannya
- Data wali lengkap seperti ayah/ibu (satu set), ikut tersembunyi bila status meninggal
- Cek status pendaftaran berdasarkan NISN (hanya menampilkan field terbatas)
- Bukti pendaftaran bisa dicetak / diunduh sebagai PDF
- Tombol bantuan WhatsApp panitia

### Panel admin (`admin.html`)
- Login dengan Supabase Auth
- Dashboard statistik (total, menunggu, diterima, ditolak)
- Pencarian & filter status, pagination "muat lebih banyak"
- **CRUD lengkap**: lihat, edit seluruh field + nilai rapor, ubah status, hapus data
- Export **Excel (.xlsx)** dengan 2 sheet: Pendaftar & Nilai Rapor (tetap tersedia CSV)
- **Editor Konten Beranda**: mengatur judul, tagline, sambutan, tahun pelajaran, waktu & tanggal pendaftaran
- Pengatur tahun pelajaran aktif untuk form publik

### Keamanan
- RLS: `anon` hanya bisa **INSERT**; tidak bisa membaca data pendaftar
- Fungsi `cek_nisn` (SECURITY DEFINER) hanya mengembalikan nama, sekolah, 3 jurusan, status, dan waktu — tidak mengekspos NIK/foto/alamat
- Admin memakai role `authenticated` dengan hak CRUD penuh

---

## Instalasi

### 1. Supabase
Project yang sudah dibuat:

| Keterangan | Nilai |
|---|---|
| Nama project | `spmb-smkn1tk` |
| Project ref | `eyugtyqppolmynhxccot` |
| Region | `ap-southeast-1` (Singapore) |
| URL | `https://eyugtyqppolmynhxccot.supabase.co` |
| DB password | `SpMb2026#TkSambas!Kbr` |

✅ **Sudah aktif:** migration `supabase/migrations/0001_init.sql` telah dijalankan dan tabel/RLS/RPC/akun admin sudah terbentuk. ✅ **Anon key juga sudah terisi** di `assets/js/config.js`.

✅ **Sudah aktif:** migration `supabase/migrations/0002_tahun_pelajaran.sql` juga sudah dijalankan (kolom tahun, tabel pengaturan, RPC terbaru).

✅ **Sudah aktif:** migration `supabase/migrations/0003_landing.sql` juga sudah dijalankan (tabel `landing` + RLS + konten awal).

✅ **Sudah aktif:** migration `supabase/migrations/0004_auto_tahun.sql` (mode tahun otomatis + RLS publik untuk kedua kunci pengaturan).

⚠️ **Perlu dijalankan:** `supabase/migrations/0005_wali_kip_upload.sql` (field wali tambahan).

Jika project dibuat ulang dari nol, langkahnya:

1. Buka Supabase SQL Editor untuk project tersebut.
2. Jalankan berurutan: `0001_init.sql`, `0002_tahun_pelajaran.sql`, `0003_landing.sql`, `0004_auto_tahun.sql`, `0005_wali_kip_upload.sql`.
3. Di **Project Settings → API**, salin **anon / publishable key**.
4. Isi ke `assets/js/config.js`:

```js
SUPABASE_ANON_KEY: "sb_publishable_...",
```

Migration juga membuat akun admin:

```
Email    : admin@smkn1tk.sch.id
Password : AdminSPMB2026!
```

> **Segera ganti password admin** setelah login pertama (Supabase → Authentication → Users).

### 2. Google Apps Script
✅ **Sudah aktif:** Web App Apps Script sudah di-deploy, diuji (GET + POST upload berhasil), dan `DRIVE_UPLOAD_URL` sudah terisi di `assets/js/config.js`.

Jika perlu deploy ulang, ikuti `apps-script/PANDUAN.md`.

Folder Drive tujuan:
`https://drive.google.com/drive/folders/1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT`

### 3. Menjalankan aplikasi
Karena aplikasi memakai ES module, buka melalui web server statis (bukan `file://`):

```bash
# Pilih salah satu
python -m http.server 8000
npx serve .
```

Lalu buka:
- Beranda: `http://localhost:8000/index.html`
- Form: `http://localhost:8000/pendaftaran.html`
- Admin: `http://localhost:8000/admin.html`

Untuk produksi, host sebagai static site (GitHub Pages, Netlify, Vercel, atau server sekolah). Pastikan `index.html` dan `admin.html` berada di root yang sama dengan folder `assets/`.

---

## Kontinuitas Tahun Pelajaran

Tahun pelajaran dihitung **otomatis dari tanggal** (mulai bulan Juli):
bulan Januari–Juni 2026 → `2025/2026`, bulan Juli–Desember 2026 → `2026/2027`.

- Form, beranda, dan admin semuanya memakai fungsi `tahunPelajaran()` di `assets/js/tahun.js`.
- Setiap pendaftar tersimpan dengan kolom `tahun_pelajaran`; kode pendaftaran mengikuti tahun, mis. `SPMB-2026-2027-XXXXXXXX`.
- Secara default mode = **Otomatis**, sehingga berganti tahun dengan sendirinya tanpa edit kode/SQL.
- Di **panel admin → Dashboard**, dropdown tahun menyediakan:
  - **Otomatis (tahun berjalan)** — kembali ke mode otomatis
  - **Tahun sekarang** dan **tahun depan** — untuk membuka pendaftaran tahun depan lebih awal (mode manual)
  - Tahun-tahun yang sudah ada di database
- Dropdown **filter tahun** di tabel dipakai untuk melihat/mengekspor data per tahun. Data lama tetap tersimpan dan bisa dilihat lewat **Semua Tahun**.

## Catatan penting

- Kunci **anon** aman untuk disimpan di frontend karena aksesnya dibatasi RLS. **Jangan pernah** menaruh `service_role key` di kode frontend.
- Jika NIK/NISN sudah terdaftar, form akan menolak dengan pesan yang ramah (kunci unik di database).
- Autocomplete wilayah (provinsi → kabupaten → kecamatan → desa) bekerja untuk **seluruh Indonesia** via [wilayah.id](https://wilayah.id). Data Kalimantan Barat/Sambas juga tersimpan lokal sebagai fallback saat offline.
- Jika ingin mengubah daftar jurusan, edit `CONFIG.JURUSAN` di `assets/js/config.js` **dan** sesuaii constraint/opsi di database bila diperlukan.

---

## Lisensi

Dibuat untuk keperluan SPMB SMKN 1 Teluk Keramat.
