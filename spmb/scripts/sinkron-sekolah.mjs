/**
 * SINKRONISASI DATA SPMB → DATABASE LOKAL SEKOLAH
 * =================================================
 * Dijalankan di server lokal sekolah:
 *   node scripts/sinkron-sekolah.mjs
 *   node scripts/sinkron-sekolah.mjs --tahun=2026/2027
 *
 * Skrip ini:
 *  1. memanggil Edge Function Supabase /functions/v1/tarik-data
 *     (pengecekan & pencocokan dilakukan di sana)
 *  2. menerima { meta, data, warnings }
 *  3. UPSERT ke MySQL lokal berdasarkan (nisn, tahun_pelajaran)
 *  4. menyimpan peringatan ke tabel sync_warnings
 *
 * Tidak menulis/mengubah data di Supabase (read-only).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const DIR = path.dirname(fileURLToPath(import.meta.url));

function bacaEnv(file) {
  const hasil = {};
  if (!fs.existsSync(file)) return hasil;
  for (const baris of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const b = baris.trim();
    if (!b || b.startsWith("#")) continue;
    const i = b.indexOf("=");
    if (i < 0) continue;
    hasil[b.slice(0, i).trim()] = b.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return hasil;
}

const cfg = bacaEnv(path.join(DIR, ".env"));
const argTahun = process.argv.find((a) => a.startsWith("--tahun="))?.split("=")[1];
const tahun = argTahun || cfg.TAHUN_PELAJARAN;

const WAJIB = [
  "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "TAHUN_PELAJARAN",
  "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME",
];
const kurang = WAJIB.filter((k) => !cfg[k] && !(k === "TAHUN_PELAJARAN" && argTahun));
if (kurang.length) {
  console.error("❌ Konfigurasi .env belum lengkap:", kurang.join(", "));
  process.exit(1);
}

async function tarikDariPortal() {
  const url = `${cfg.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/tarik-data`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ tahun }),
  });
  const teks = await res.text();
  let hasil;
  try { hasil = JSON.parse(teks); } catch { throw new Error(`Balasan bukan JSON: ${teks.slice(0, 200)}`); }
  if (!res.ok || hasil.error) throw new Error(hasil.error || `HTTP ${res.status}`);
  return hasil;
}

const kolomSiswa = [
  "tahun_pelajaran", "nisn", "no_pendaftaran_dinas", "nama", "jurusan_diterima",
  "jalur", "status_kelulusan", "urutan", "pilihan", "total_nilai", "bobot_nilai",
  "bobot_tka", "bobot_prestasi", "keterangan_dinas", "catatan_verifikasi",
  "catatan_mutasi", "form_data", "nilai_rapor", "sinkron_at", "versi_sumber",
];
const updateSiswa = kolomSiswa
  .filter((k) => !["tahun_pelajaran", "nisn"].includes(k))
  .map((k) => `${k}=VALUES(${k})`)
  .join(", ");
const sqlSiswa = `INSERT INTO siswa_diterima (${kolomSiswa.join(", ")})
  VALUES (${kolomSiswa.map(() => "?").join(", ")})
  ON DUPLICATE KEY UPDATE ${updateSiswa}`;

async function simpanKeLokal(hasil) {
  const koneksi = await mysql.createConnection({
    host: cfg.DB_HOST,
    port: Number(cfg.DB_PORT || 3306),
    user: cfg.DB_USER,
    password: cfg.DB_PASSWORD,
    database: cfg.DB_NAME,
    charset: "utf8mb4",
  });

  const waktu = new Date();
  const sqlWaktu = `${waktu.getFullYear()}-${String(waktu.getMonth() + 1).padStart(2, "0")}-${String(waktu.getDate()).padStart(2, "0")} ${String(waktu.getHours()).padStart(2, "0")}:${String(waktu.getMinutes()).padStart(2, "0")}:${String(waktu.getSeconds()).padStart(2, "0")}`;

  let tersimpan = 0;
  for (const d of hasil.data) {
    const nilai = kolomSiswa.map((k) => {
      if (k === "sinkron_at") return sqlWaktu;
      if (k === "versi_sumber") return hasil.meta.versi || null;
      if (k === "form_data") return d.form_data ? JSON.stringify(d.form_data) : null;
      if (k === "nilai_rapor") return JSON.stringify(d.nilai_rapor || []);
      return d[k] ?? null;
    });
    await koneksi.execute(sqlSiswa, nilai);
    tersimpan++;
  }

  await koneksi.execute("DELETE FROM sync_warnings WHERE tahun_pelajaran = ?", [tahun]);
  for (const w of hasil.warnings || []) {
    await koneksi.execute(
      `INSERT INTO sync_warnings
        (tahun_pelajaran, nisn, nama, jenis, detail, field_kosong, jumlah_kosong, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tahun, w.nisn || null, w.nama || null, w.jenis, w.detail || null,
        w.field ? JSON.stringify(w.field) : null,
        w.jumlah_kosong ?? null,
        sqlWaktu,
      ],
    );
  }

  await koneksi.end();
  return tersimpan;
}

(async () => {
  console.log(`🔄 Menarik data SPMB tahun ${tahun} dari portal...`);
  const hasil = await tarikDariPortal();
  console.log(`   ${hasil.meta.jumlah_siswa} siswa diterima, ${hasil.meta.jumlah_warning} peringatan.`);

  const tersimpan = await simpanKeLokal(hasil);
  console.log(`✅ ${tersimpan} baris di-upsert ke MySQL lokal (${cfg.DB_NAME}).`);

  if ((hasil.warnings || []).length) {
    const ringkas = {};
    hasil.warnings.forEach((w) => { ringkas[w.jenis] = (ringkas[w.jenis] || 0) + 1; });
    console.log("⚠️  Peringatan:", JSON.stringify(ringkas));
    console.log("    Detail tersimpan di tabel sync_warnings.");
  }
  console.log(`🕓 Versi sumber: ${hasil.meta.versi || 0}`);
})().catch((e) => {
  console.error("❌ Sinkronisasi gagal:", e.message);
  process.exit(1);
});
