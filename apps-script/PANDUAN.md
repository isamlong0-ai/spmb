# Panduan Deploy Google Apps Script (Upload Foto ke Drive)

## 1. Buat project
1. Buka https://script.google.com → **New project**.
2. Hapus isi `Code.gs` bawaan, lalu salin seluruh isi file `apps-script/Code.gs` ke editor.
3. Simpan (Ctrl+S). Beri nama misalnya `SPMB Drive Upload`.

## 2. Periksa akses folder
- Folder tujuan: https://drive.google.com/drive/folders/1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT
- Pastikan akun Google yang menjalankan script memiliki akses **Editor** pada folder tersebut.
- Pastikan juga folder di-share sebagai **Anyone with the link → Viewer** (atau setidaknya akun script bisa membaca/menulis).

## 3. Deploy sebagai Web App
1. Klik **Deploy → New deployment**.
2. Pilih **Web app**.
3. Isi:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Klik **Deploy**, lalu **Authorize access** (pilih akun Google Anda → Advanced → Go to project).
5. Salin **Web app URL** (berakhir dengan `/exec`).

## 4. Pasang URL ke aplikasi
Buka `assets/js/config.js`, ganti:

```js
DRIVE_UPLOAD_URL: "__APPS_SCRIPT_WEBAPP_URL__",
```

dengan URL Web App tersebut, misalnya:

```js
DRIVE_UPLOAD_URL: "https://script.google.com/macros/s/AKfycby.../exec",
```

> Catatan: setiap kali melakukan **New deployment**, URL akan berubah. GunakanDeployment yang sudah ada → **Manage deployments** → edit untuk mempertahankan URL yang sama.

## 4b. Perbaruan kode (subfolder per tahun pelajaran)
Versi `Code.gs` terbaru otomatis membuat subfolder bernama tahun pelajaran
(mis. `2026-2027`) di dalam folder utama Drive. Jika Anda sudah pernah deploy:

1. Buka project Apps Script yang lama.
2. Timpa `Code.gs` dengan isi file terbaru, simpan.
3. **Deploy → Manage deployments** → pilih deployment aktif → ikon pensil →
   **Version: New version** → Deploy.
   (URL Web App tetap sama, jadi tidak perlu mengubah `config.js`.)

## 4c. Aksi "Tarik Info dari Portal Dinas"
Versi `Code.gs` terbaru juga menerima POST dengan badan:

```json
{ "aksi": "scrape_dinas" }
```

Aksi ini mengambil dari portal resmi:
- 8 pengumuman penting (dari blok `announcement-content`)
- tautan Jadwal, PDF Surat Pernyataan (SPTJM), dan video panduan SMK
- angka minat sekolah SMKN 1 Teluk Keramat dari endpoint JSON `/home/sekolah-list`

Catatan: hasilnya **draft** di panel admin. Admin harus meninjau lalu klik **Simpan Info Dinas** agar tampil di beranda. Bila pengambilan gagal, data lama tetap ditampilkan.

Panduan deploy ulang sama seperti bagian 4b (New version, URL tidak berubah).

## 5. Uji coba
Buka URL Web App di browser. Jika muncul JSON seperti:

```json
{"ok":true,"layanan":"SPMB Drive Upload Proxy","folderId":"1iRtq..."}
```

berarti Web App sudah aktif. Selanjutnya coba unggah foto lewat formulir pengumpulan data calon siswa.

## Troubleshooting CORS
Jika browser menolak permintaan (error CORS), pastikan script mengembalikan `ContentService.createTextOutput(...)` seperti pada kode di atas, dan frontend mengirim `Content-Type: text/plain` (sudah diatur di `form.js`). Hindari `application/json` karena memicu preflight OPTIONS yang tidak didukung Apps Script.
