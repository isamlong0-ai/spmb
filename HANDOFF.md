# Status & Langkah Lanjutan (internal)

## Sudah selesai
- Project Supabase: `spmb-smkn1tk`, ref `eyugtyqppolmynhxccot`, region `ap-southeast-1`.
  - DB password: `SpMb2026#TkSambas!Kbr`
- ✅ SQL migration **sudah dijalankan** (tabel `pendaftar`, `nilai_rapor`, RLS, RPC `simpan_pendaftaran`/`cek_nisn`, akun admin semua sudah ada & teruji).
- ✅ Anon/publishable key sudah terisi di `assets/js/config.js`.
- ✅ Tes end-to-end berhasil: insert via RPC → cek NISN → hapus data dummy (DB bersih).
- ✅ Login admin Supabase Auth berhasil.
- Aplikasi: `index.html` (wizard 6 langkah), `admin.html` (CRUD), CSS/JS responsif.
- Alamat terstruktur + autocomplete wilayah (default Kalimantan Barat / Kabupaten Sambas).
- Apps Script proxy upload Drive: `apps-script/Code.gs` + `PANDUAN.md`.
- ✅ Sudah di-push ke https://github.com/isamlong0-ai/spmb.git (branch `main`).
- Konfigurasi MCP Supabase ditulis ke `~/.config/opencode/opencode.json` (opsional, tidak dipakai).

## Yang masih perlu
- Hapus 1 file uji `foto_test_koneksi.jpg` (1x1 pixel) dari folder Drive — dibuat saat tes koneksi.
- Ganti password admin default `AdminSPMB2026!` setelah login pertama.

Apps Script Web App sudah aktif & teruji (GET + POST upload ke Drive berhasil), URL terisi di config.

## Kredensial
- Anon key: `sb_publishable_XBST_lVhiVHsq6FpFAmx-A_ddN0JB1K`
- Admin: `admin@smkn1tk.sch.id` / `AdminSPMB2026!`
- Folder Drive: `1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT`
