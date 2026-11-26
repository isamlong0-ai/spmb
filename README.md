# SPMB SMK Negeri 1 Teluk Keramat — 2026/2027

Aplikasi **pengumpulan data calon siswa** untuk SPMB berbasis **HTML + CSS + JavaScript (ES modules)**, dengan:

- **Supabase** sebagai database & autentikasi admin (Postgres + RLS)
- **Google Apps Script Web App** sebagai proxy unggah foto ke **Google Drive**
- Antarmuka modern, responsif, dan ramah HP maupun komputer

> ⚠️ **Posisi aplikasi:** halaman-halaman di repo ini **hanya untuk pengumpulan data calon siswa** di sekolah. **Bukan pendaftaran resmi.** Pendaftaran resmi SPMB dilakukan di portal Dinas Pendidikan Provinsi Kalimantan Barat: https://spmb-dikbud.kalbarprov.go.id/ — tautan ini ditampilkan di beranda (tepat di bawah waktu pengisian), di halaman formulir, dan di bukti pengiriman data.

---

## Struktur proyek

```
.
├── index.html                    # BERANDA / landing page (konten bisa diatur di admin)
├── pendaftaran.html              # Formulir pengumpulan data calon siswa (wizard 6 langkah)
├── cek.html                      # Halaman cek data + cetak ulang bukti
├── admin.html                    # Panel admin (dashboard grafik + CRUD + editor beranda)
├── assets/
│   ├── css/styles.css            # Design system & responsive layout
│   └── js/
│       ├── config.js             # Konfigurasi Supabase, Drive, jurusan
│       ├── tahun.js              # Tahun pelajaran otomatis (sekarang + depan)
│       ├── wilayah.js            # Autocomplete wilayah nasional (kalbar offline)
│       ├── cek.js                # Logika halaman cek data & cetak ulang
│       ├── landing.js            # Render konten beranda, status & kunci akses
│       ├── status.js             # Status formulir (dibuka/tutup) dari pengaturan admin
│       ├── guard.js              # Pengunci halaman form saat formulir ditutup
│       ├── form.js               # Logika wizard, validasi, upload, submit
│       └── admin.js              # Logika CRUD panel admin
├── supabase/migrations/
│   ├── 0001_init.sql             # Skema tabel, RLS, RPC, akun admin
│   ├── 0002_tahun_pelajaran.sql  # Pemisahan data per tahun pelajaran
│   ├── 0003_landing.sql          # Tabel konten beranda
│   ├── 0004_auto_tahun.sql       # Mode tahun pelajaran otomatis
│   ├── 0005_wali_kip_upload.sql  # Field wali lengkap & penyesuaian form
│   ├── 0007_cek_nisn_kode.sql    # Kode pengiriman data pada hasil cek NISN
│   ├── 0008_status_manual.sql    # Buka/tutup formulir diatur manual
│   ├── 0009_dinas_info.sql       # Info portal dinas + RPC minat jurusan
│   ├── 0010_jadwal_validasi.sql  # Jadwal lengkap & jumlah validasi sekolah
│   └── 0011_dinas_hasil.sql      # Tabel terpisah hasil siswa diterima
├── apps-script/
│   ├── Code.gs                   # Web App upload foto ke Google Drive
│   └── PANDUAN.md                # Cara deploy Apps Script
└── README.md
```

---

## Fitur utama

### Beranda (`index.html`)
- Halaman utama: hero/selamat datang, kata sambutan, **Kanal Resmi Dinas Pendidikan dan Kebudayaan Provinsi Kalimantan Barat**, informasi & panduan
- Seksi berita resmi berisi: pengumuman, **jadwal lengkap per jalur dengan timeline**, SPTJM, **video panduan SMK & video panduan pembuatan akun**, **persentase minat & diagram jumlah daftar/kuota** — diambil semi-otomatis lewat tombol di admin (browser → proxy baca-saja `r.jina.ai`), lalu ditinjau sebelum tayang
- Persentase minat & diagram memakai angka SMKN 1 Teluk Keramat dari portal dinas (508 pendaftar / 392 kuota = **129,59%**)
- Tautan portal resmi tetap tersedia di seksi berita resmi & kartu "Portal Pendaftaran Resmi (Dinas)"
- **Seluruh teks utama bisa diatur dari panel admin** (judul, tagline, sambutan, tahun pelajaran, waktu pengisian, status formulir, tanggal catatan)
- Status formulir (**Dibuka / Akan Datang / Ditutup**) diatur **manual** dari panel admin → menu Konten Beranda (tidak bergantung tanggal)
- Saat **belum dibuka / sudah ditutup**, semua tautan ke formulir & pengecekan otomatis terkunci (abu-abu + gembok), dan halaman form maupun cek data menampilkan layar pengunci
- Tombol menuju formulir dan pencarian data

### Cek data (`cek.html`)
- Halaman mandiri untuk mencari data calon siswa berdasarkan NISN
- Jika data ditemukan, tersedia tombol **🖨 Cetak Ulang Bukti** dan **⬇ Unduh PDF**
- Bisa dibuka langsung dengan `cek.html?nisn=0071234567`

### Formulir pengumpulan data calon siswa (`pendaftaran.html`)
- Wizard **6 langkah** dengan progress bar dan navigasi bebas ke langkah sebelumnya
- **Alamat terpisah per wilayah**: provinsi → kabupaten → kecamatan → desa → RT → RW → kode pos → patokan → alamat lengkap
- **Autocomplete provinsi & kabupaten**, dengan default **Kalimantan Barat / Kabupaten Sambas**
- Daftar kecamatan & desa (Sambas tersedia offline; kabupaten lain diambil dari `wilayah.id` saat online)
- Validasi per langkah, pesan error inline, dan pencegahan duplikat jurusan
- Tabel nilai rapor 5 mapel × 5 semester dengan kalkulasi rata-rata otomatis
- Upload satu foto 3x4 siswa dengan kompresi sisi klien, **opsional**, tersimpan di subfolder Google Drive sesuai tahun pelajaran
- Nomor KIP bebas huruf/angka/tanda baca; orang tua meninggal otomatis menyembunyikan isian rinciannya
- Data wali lengkap seperti ayah/ibu (satu set), ikut tersembunyi bila status meninggal
- Cek data calon siswa berdasarkan NISN (hanya menampilkan field terbatas)
- Bukti pengiriman data bisa dicetak / diunduh sebagai PDF
- Tombol bantuan WhatsApp panitia

### Panel admin (`admin.html`)
- Login dengan Supabase Auth
- **Dashboard khusus grafik**: total calon siswa, 3 jurusan paling banyak dipilih, grafik jurusan/KIP/tahun — **tanpa tabel data**
- Statistik dihitung **per tahun pelajaran** lewat dropdown **"Statistik tahun"** (default: tahun aktif; ada opsi **Semua Tahun**). Grafik "per tahun" tetap menampilkan semua tahun untuk perbandingan
- Tabel data calon siswa hanya tampil di menu **Data Calon Siswa**, lengkap dengan tombol Excel/CSV di toolbar
- Pengatur tahun pelajaran & tombol Simpan hanya ada di Dashboard
- Pencarian & filter tahun, pagination "muat lebih banyak"
- Tabel menampilkan **ketiga pilihan jurusan** dalam satu kolom
- **CRUD lengkap**: lihat, edit seluruh field + nilai rapor, hapus data
- Export **Excel (.xlsx)** dengan 2 sheet: Calon Siswa & Nilai Rapor (tetap tersedia CSV)
- **Editor Konten Beranda**: mengatur judul, tagline, sambutan, tahun pelajaran, waktu, **status buka/tutup formulir**, dan tanggal sebagai catatan
- Menu **🎓 Data Siswa Diterima**: tab per jurusan, tabel siswa hasil dinas, tombol **Upload Dokumen Dinas** (file HTML ekspor portal), **Tambah dari Formulir**, **Mutasi/Pindah Jurusan**, **Nonaktifkan/Aktifkan** siswa (tetap tersimpan, tidak dihitung aktif), export Excel per jurusan & universal
- Tombol **🔄 Tarik Info dari Portal Dinas** → draft bisa diedit → **Simpan Info Dinas** → tampil di beranda (data lama tetap tampil bila gagal)
- Pengatur tahun pelajaran aktif untuk form publik
- **Ganti password** akun admin langsung dari panel (menu 🔑 Ganti Password)

### Keamanan
- RLS: `anon` hanya bisa **INSERT**; tidak bisa membaca data calon siswa
- Fungsi `cek_nisn` (SECURITY DEFINER) hanya mengembalikan nama, sekolah, 3 jurusan, tahun, dan waktu — tidak mengekspos NIK/foto/alamat
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

✅ **Sudah aktif:** migration `supabase/migrations/0001_init.sql` telah dijalankan dan tabel/RLS/RPC/akun admin sudah terbentuk. ✅ **Anon key juga sudah terisi** di `assets/js/config.js`.

✅ **Sudah aktif:** migration `supabase/migrations/0002_tahun_pelajaran.sql` juga sudah dijalankan (kolom tahun, tabel pengaturan, RPC terbaru).

✅ **Sudah aktif:** migration `supabase/migrations/0003_landing.sql` juga sudah dijalankan (tabel `landing` + RLS + konten awal).

✅ **Sudah aktif:** migration `supabase/migrations/0004_auto_tahun.sql` (mode tahun otomatis + RLS publik untuk kedua kunci pengaturan).

✅ **Sudah aktif:** migration `supabase/migrations/0005_wali_kip_upload.sql` (field wali tambahan).

✅ **Sudah aktif:** migration `supabase/migrations/0007_cek_nisn_kode.sql` (kode pengiriman data pada hasil cek, dipakai cetak ulang).

✅ **Sudah aktif:** migration `supabase/migrations/0008_status_manual.sql` (status buka/tutup formulir diatur manual dari admin).

✅ **Sudah aktif:** migration `supabase/migrations/0009_dinas_info.sql` (tabel `dinas_info` + RPC `statistik_minat_jurusan`).

✅ **Sudah aktif:** migration `supabase/migrations/0010_jadwal_validasi.sql` (kolom `jadwal_data` & data jadwal awal). Kolom `minat_validasi` sudah tidak dipakai di UI.

⚠️ **Perlu dijalankan:** `supabase/migrations/0011_dinas_hasil.sql` (tabel terpisah `dinas_hasil` untuk hasil siswa diterima).

Jika project dibuat ulang dari nol, langkahnya:

1. Buka Supabase SQL Editor untuk project tersebut.
2. Jalankan berurutan: `0001_init.sql`, `0002_tahun_pelajaran.sql`, `0003_landing.sql`, `0004_auto_tahun.sql`, `0005_wali_kip_upload.sql`, `0007_cek_nisn_kode.sql`, `0008_status_manual.sql`, `0009_dinas_info.sql`, `0010_jadwal_validasi.sql`, `0011_dinas_hasil.sql`.
3. Di **Project Settings → API**, salin **anon / publishable key**.
4. Isi ke `assets/js/config.js`:

```js
SUPABASE_ANON_KEY: "sb_publishable_...",
```

> **Segera ganti password admin** setelah login pertama lewat menu **🔑 Ganti Password** di panel admin (cukup isi password lama, password baru, dan konfirmasinya).

### 2. Google Apps Script
✅ **Sudah aktif:** Web App Apps Script versi terbaru sudah di-deploy, diuji (upload foto berhasil masuk subfolder `2026-2027`), dan `DRIVE_UPLOAD_URL` sudah diperbarui di `assets/js/config.js`.

> Catatan: aksi `scrape_dinas` di Apps Script **tidak dipakai** karena akun tidak bisa memperoleh izin `script.external_request`. Penarikan info portal dilakukan dari browser admin lewat proxy baca-saja. Kode Apps Script tetap ada dan tidak mengganggu upload foto.

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
- Formulir data calon siswa: `http://localhost:8000/pendaftaran.html`
- Cek data: `http://localhost:8000/cek.html`
- Admin: `http://localhost:8000/admin.html`

Untuk produksi, host sebagai static site (GitHub Pages, Netlify, Vercel, atau server sekolah). Pastikan `index.html` dan `admin.html` berada di root yang sama dengan folder `assets/`.

---

## Kontinuitas Tahun Pelajaran

Tahun pelajaran dihitung **otomatis dari tanggal** (mulai bulan Juli):
bulan Januari–Juni 2026 → `2025/2026`, bulan Juli–Desember 2026 → `2026/2027`.

- Form, beranda, dan admin semuanya memakai fungsi `tahunPelajaran()` di `assets/js/tahun.js`.
- Setiap calon siswa tersimpan dengan kolom `tahun_pelajaran`; kode pengiriman data mengikuti tahun, mis. `SPMB-2026-2027-XXXXXXXX`.
- Secara default mode = **Otomatis**, sehingga berganti tahun dengan sendirinya tanpa edit kode/SQL.
- Di **panel admin → Dashboard**, dropdown tahun menyediakan:
  - **Otomatis (tahun berjalan)** — kembali ke mode otomatis
  - **Tahun sekarang** dan **tahun depan** — untuk membuka formulir tahun depan lebih awal (mode manual)
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
