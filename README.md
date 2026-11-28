# SMKN 1 Teluk Keramat — Website Sekolah + SPMB

Proyek ini berisi dua modul:

- **Website Sekolah** (root `/`) — halaman one-page (W3.CSS) menampilkan profil, berita & kegiatan, informasi, dan kontak sekolah. Admin: `admin-web.html`.
- **SPMB** (folder `spmb/`) — aplikasi pengumpulan data calon siswa (formulir, cek data, pengumuman, panel admin). Admin: `spmb/admin.html`.

## Peta URL (GitHub Pages + domain `smkn1-tk.my.id`)

| URL | Isi |
|---|---|
| `https://smkn1-tk.my.id/` | Website Sekolah (beranda) |
| `https://smkn1-tk.my.id/spmb/` | Beranda SPMB |
| `https://smkn1-tk.my.id/admin.html` | Login admin (satu akun untuk kedua modul) |
| `https://smkn1-tk.my.id/admin-web.html` | Dashboard Website Sekolah |
| `https://smkn1-tk.my.id/spmb/admin.html` | Dashboard SPMB |

## Login & hak akses

- Satu akun Supabase Auth untuk admin (email `admin@smkn1tk.sch.id`).
- **Superadmin**: akses penuh kedua dashboard (Website + SPMB) + kelola akun.
- **Admin Website** (`admin_web`): hanya dashboard Website Sekolah (berita, informasi, daftar).
- **Admin SPMB** (`admin_spmb`): hanya dashboard SPMB (data calon siswa, pengumuman, konten SPMB).
- **Editor**: hanya bisa menambah/edit/hapus/publish **berita** di Website Sekolah.

## Menjalankan lokal

```bash
python -m http.server 8000
# buka http://localhost:8000/index.html
```

## Database (Supabase)

Project: `spmb-smkn1tk` (`eyugtyqppolmynhxccot`, region Singapore).

Jalankan migration secara berurutan di SQL Editor Supabase, termasuk yang baru:

- `supabase/migrations/0001_init.sql` … `0012_pengumuman_publish.sql`
- `supabase/migrations/0013_web_sekolah.sql` (tabel web_berita, web_info, web_daftar, web_roles, RLS, storage bucket, pengetatan policy SPMB)

Deploy Edge Function untuk kelola akun editor:

```bash
supabase functions deploy web-kelola-user
```

Setelah migration dijalankan, akun admin otomatis mendapat role `admin` lewat seed SQL. Akun editor dibuat dari tab **Pengguna** di `admin-web.html`.

## Modul SPMB

Dokumentasi lengkap modul SPMB ada di `spmb/README.md`. Semua path internal modul bersifat relatif sehingga tetap berjalan di `/spmb/`.