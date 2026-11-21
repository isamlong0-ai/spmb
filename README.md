# SPMB SMK Negeri 1 Teluk Keramat — 2026/2027

Aplikasi pendaftaran siswa baru berbasis **HTML + CSS + JavaScript (ES modules)**, dengan:

- **Supabase** sebagai database & autentikasi admin (Postgres + RLS)
- **Google Apps Script Web App** sebagai proxy unggah foto ke **Google Drive**
- Antarmuka modern, responsif, dan ramah HP maupun komputer

---

## Struktur proyek

```
.
├── index.html                    # Form pendaftaran (wizard 6 langkah)
├── admin.html                    # Panel admin (login + CRUD)
├── assets/
│   ├── css/styles.css            # Design system & responsive layout
│   └── js/
│       ├── config.js             # Konfigurasi Supabase, Drive, jurusan
│       ├── wilayah.js            # Data provinsi/kabupaten/kecamatan/desa + autocomplete
│       ├── form.js               # Logika wizard, validasi, upload, submit
│       └── admin.js              # Logika CRUD panel admin
├── supabase/migrations/
│   └── 0001_init.sql             # Skema tabel, RLS, RPC, akun admin
├── apps-script/
│   ├── Code.gs                   # Web App upload foto ke Google Drive
│   └── PANDUAN.md                # Cara deploy Apps Script
└── README.md
```

---

## Fitur utama

### Form pendaftar (`index.html`)
- Wizard **6 langkah** dengan progress bar dan navigasi bebas ke langkah sebelumnya
- **Alamat terpisah per wilayah**: provinsi → kabupaten → kecamatan → desa → RT → RW → kode pos → patokan → alamat lengkap
- **Autocomplete provinsi & kabupaten**, dengan default **Kalimantan Barat / Kabupaten Sambas**
- Daftar kecamatan & desa (Sambas tersedia offline; kabupaten lain diambil dari `wilayah.id` saat online)
- Validasi per langkah, pesan error inline, dan pencegahan duplikat jurusan
- Tabel nilai rapor 5 mapel × 5 semester dengan kalkulasi rata-rata otomatis
- Upload 4 foto (siswa wajib, KK/Akta/Rapor opsional) dengan kompresi sisi klien
- Cek status pendaftaran berdasarkan NISN (hanya menampilkan field terbatas)
- Bukti pendaftaran bisa dicetak / diunduh sebagai PDF
- Tombol bantuan WhatsApp panitia

### Panel admin (`admin.html`)
- Login dengan Supabase Auth
- Dashboard statistik (total, menunggu, diterima, ditolak)
- Pencarian & filter status, pagination "muat lebih banyak"
- **CRUD lengkap**: lihat, edit seluruh field + nilai rapor, ubah status, hapus data
- Export CSV

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

1. Buka Supabase SQL Editor untuk project tersebut.
2. Jalankan seluruh isi `supabase/migrations/0001_init.sql`.
3. Di **Project Settings → API**, salin **anon / publishable key**.
4. Isi ke `assets/js/config.js`:

```js
SUPABASE_ANON_KEY: "KUNCI_ANON_DISINI",
```

Migration juga membuat akun admin:

```
Email    : admin@smkn1tk.sch.id
Password : AdminSPMB2026!
```

> **Segera ganti password admin** setelah login pertama (Supabase → Authentication → Users).

### 2. Google Apps Script
Ikuti `apps-script/PANDUAN.md`, lalu isi `DRIVE_UPLOAD_URL` di `assets/js/config.js` dengan Web App URL hasil deployment.

Folder Drive tujuan:
`https://drive.google.com/drive/folders/1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT`

### 3. Menjalankan aplikasi
Karena aplikasi memakai ES module, buka melalui web server statis (bukan `file://`):

```bash
# Pilih salah satu
python -m http.server 8000
npx serve .
```

Lalu buka `http://localhost:8000/index.html` dan `http://localhost:8000/admin.html`.

Untuk produksi, host sebagai static site (GitHub Pages, Netlify, Vercel, atau server sekolah). Pastikan `index.html` dan `admin.html` berada di root yang sama dengan folder `assets/`.

---

## Catatan penting

- Kunci **anon** aman untuk disimpan di frontend karena aksesnya dibatasi RLS. **Jangan pernah** menaruh `service_role key` di kode frontend.
- Jika NIK/NISN sudah terdaftar, form akan menolak dengan pesan yang ramah (kunci unik di database).
- Data wilayah bersumber dari [wilayah.id](https://wilayah.id) (update 2025-07-04) dan disimpan lokal agar tetap berfungsi offline untuk Kalimantan Barat.
- Jika ingin mengubah daftar jurusan, edit `CONFIG.JURUSAN` di `assets/js/config.js` **dan** sesuaii constraint/opsi di database bila diperlukan.

---

## Lisensi

Dibuat untuk keperluan SPMB SMKN 1 Teluk Keramat.
