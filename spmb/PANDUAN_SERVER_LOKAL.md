# Panduan Sinkronisasi ke Server Lokal Sekolah

Skrip ini **tidak dijalankan dari komputer pengembang**. Ia dijalankan di **server lokal sekolah** yang bisa terhubung ke internet dan ke MySQL lokal.

Alur: server lokal → Edge Function Supabase `/functions/v1/tarik-data` → pengecekan & pencocokan di portal → JSON → **UPSERT langsung ke MySQL lokal**. Tidak ada file perantara.

---

## A. Siapkan Edge Function di Supabase (done oleh panitia IT, sekali saja)

Di komputer yang sudah terpasang **Supabase CLI**:

```bash
supabase login
supabase link --project-ref eyugtyqppolmynhxccot
supabase functions deploy tarik-data --no-verify-jwt
```

> `--no-verify-jwt` diperlukan karena autorisasi memakai service role key lewat header `Authorization`, bukan JWT user.

Cek cepat dari browser/terminal:

```bash
curl -i "https://eyugtyqppolmynhxccot.supabase.co/functions/v1/tarik-data" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"tahun":"2026/2027"}'
```

Harus balas JSON dengan `meta`, `data`, `warnings`. Kalau `401` → service role key salah. Kalau `404` → function belum di-deploy.

---

## B. Siapkan MySQL lokal

Masuk ke MySQL/MariaDB sekolah, lalu jalankan:

```bash
mysql -u root -p < scripts/schema_lokal.sql
```

Ini membuat database `spmb_sekolah` dan dua tabel:
- `siswa_diterima` — data utama (kunci unik: `nisn` + `tahun_pelajaran`)
- `sync_warnings` — log peringatan sinkronisasi

---

## C. Siapkan skrip di server lokal

1. Copy folder `scripts/` dari repo ke server sekolah.
2. Di folder `scripts/`, install dependency:

```bash
npm install
```

3. Buat file `.env` dari contoh:

```bash
cp .env.example .env
```

4. Isi `.env` dengan nilai asli:

```env
SUPABASE_URL=https://eyugtyqppolmynhxccot.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service role key (rahasia!)
TAHUN_PELAJARAN=2026/2027
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=spmb
DB_PASSWORD=...
DB_NAME=spmb_sekolah
```

⚠️ **Jangan pernah** memasukkan service role key ke file yang di-commit ke GitHub. `.env` sudah masuk `.gitignore`.

---

## D. Jalankan sinkronisasi

```bash
cd scripts
node sinkron-sekolah.mjs
```

Atau tentukan tahun eksplisit:

```bash
node sinkron-sekolah.mjs --tahun=2027/2028
```

Contoh keluaran:

```
🔄 Menarik data SPMB tahun 2026/2027 dari portal...
   393 siswa diterima, 394 peringatan.
✅ 393 baris di-upsert ke MySQL lokal (spmb_sekolah).
⚠️  Peringatan: {"NISN_TIDAK_ADA_DI_FORMULIR":393,"FORMULIR_BELUM_LENGKAP":393,"TIDAK_ADA_DI_DINAS":1}
    Detail tersimpan di tabel sync_warnings.
🕓 Versi sumber: 1764268800000
```

---

## E. Arti peringatan

| Jenis | Arti | Tindakan |
|---|---|---|
| `NISN_TIDAK_ADA_DI_FORMULIR` | Siswa ada di daftar diterima, tapi NISN + tahunnya tidak ditemukan di tabel formulir | Tetap ikut; lengkapi formulir manual di panel admin lalu tarik ulang |
| `FORMULIR_BELUM_LENGKAP` | Data formulir ada, tapi sebagian field kosong | Tetap ikut; perbaiki manual oleh administrasi kesiswaan |
| `TIDAK_ADA_DI_DINAS` | Ada di formulir, tapi tidak ada di daftar siswa diterima | Tidak ikut ekspor; dicek panitia |

Detail per NISN ada di tabel `sync_warnings`.

---

## F. Menjadwalkan (opsional)

Linux/cron — tiap jam 07.00:

```cron
0 7 * * * cd /opt/spmb/scripts && /usr/bin/node sinkron-sekolah.mjs >> /var/log/spmb-sinkron.log 2>&1
```

Windows Task Scheduler:
- Program: `node.exe`
- Arguments: `C:\spmb\scripts\sinkron-sekolah.mjs`
- Start in: `C:\spmb\scripts`

---

## G. Catatan penting

- Skrip **read-only** terhadap Supabase: tidak mengubah data portal.
- Penulisan lokal memakai **UPSERT** per `(nisn, tahun_pelajaran)` → aman dijalankan berulang.
- Daftar yang ditarik **selalu mengikuti halaman "Data Siswa Diterima"**: sudah filter nonaktif, sudah mutasi jurusan.
- Jurusan yang dipakai adalah **`jurusan_diterima`** (bukan pilihan jurusan di formulir).
- Kolom `form_data` dan `nilai_rapor` berisi JSON; bisa di-query di MySQL dengan `JSON_EXTRACT()`.

Contoh:

```sql
SELECT nisn, nama, JSON_EXTRACT(form_data,'$.alamat_lengkap') AS alamat
FROM siswa_diterima WHERE tahun_pelajaran='2026/2027';
```
