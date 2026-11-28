# Panduan Deploy ke cPanel Shared Hosting

## 1. Siapkan domain & DNS
- Di cPanel, arahkan domain `smkn1-tk.my.id` ke IP hosting (A record) atau CNAME sesuai instruksi provider.
- Tunggu propagasi DNS (1–24 jam).
- Aktifkan **SSL** di cPanel (AutoSSL / Let's Encrypt). `.htaccess` sudah memaksa HTTPS.

## 2. Upload file
Upload **seluruh isi repo** ke `public_html`, kecuali folder yang tidak perlu di server:
- `.git/`
- `supabase/` (migration & function; backend tetap di Supabase)
- `scripts/`, `apps-script/`
- `.env`, `node_modules/`

Struktur Minimal di `public_html`:
```
index.html
akses.html
dashboard.html
alumni.html
berita.html
profil-sekolah.html
assets/
spmb/
.htaccess
```

## 3. Pastikan .htaccess aktif
File `.htaccess` sudah disiapkan di root repo. Jika disembunyikan di File Manager cPanel, aktifkan "Show Hidden Files".

Fungsi `.htaccess`:
- Paksa HTTPS
- Redirect `/admin.html` → `/akses.html`, `/admin-web.html` → `/dashboard.html`
- URL bersih: `/kelola` atau `/masuk` → halaman login; `/dashboard` → dashboard
- Blokir akses ke folder/file sensitif
- Kompresi & cache statis

## 4. Backend Supabase (tidak berubah)
- Project, DB, Storage, Auth, dan Edge Function `web-kelola-user` tetap di Supabase.
- Tidak ada yang perlu dipindah ke cPanel.

## 5. Uji setelah deploy
- `https://smkn1-tk.my.id/` → web sekolah
- `https://smkn1-tk.my.id/kelola` → login admin
- `https://smkn1-tk.my.id/dashboard` → dashboard web
- `https://smkn1-tk.my.id/spmb/` → modul SPMB
- Coba login, upload gambar, approve berita/galeri/alumni.

## 6. Update otomatis dari GitHub (opsional)
Bisa dibuat GitHub Actions dengan FTP/SFTP deploy ke cPanel. Secrets yang dibutuhkan:
`FTP_HOST`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_SERVER_DIR`.

Saya bisa buatkan workflow-nya jika Anda mau.
