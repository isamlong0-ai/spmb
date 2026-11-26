-- =============================================================================
-- Skema database LOKAL sekolah untuk sinkronisasi data dari portal SPMB
-- Jalankan di MySQL/MariaDB server lokal SEBELUM menjalankan sinkron-sekolah.mjs
-- =============================================================================

CREATE DATABASE IF NOT EXISTS spmb_sekolah
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE spmb_sekolah;

CREATE TABLE IF NOT EXISTS siswa_diterima (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tahun_pelajaran VARCHAR(20) NOT NULL,
  nisn VARCHAR(20) NOT NULL,
  no_pendaftaran_dinas VARCHAR(60) NULL,
  nama VARCHAR(200) NOT NULL,
  jurusan_diterima VARCHAR(120) NOT NULL,
  jalur VARCHAR(80) NULL,
  status_kelulusan VARCHAR(30) NULL,
  urutan INT NULL,
  pilihan SMALLINT NULL,
  total_nilai DECIMAL(12,2) NULL,
  bobot_nilai DECIMAL(12,2) NULL,
  bobot_tka DECIMAL(12,2) NULL,
  bobot_prestasi DECIMAL(12,2) NULL,
  keterangan_dinas TEXT NULL,
  catatan_verifikasi TEXT NULL,
  catatan_mutasi TEXT NULL,
  form_data JSON NULL COMMENT 'Seluruh isian formulir calon siswa',
  nilai_rapor JSON NULL COMMENT 'Array nilai rapor 5 mapel x 5 semester',
  sinkron_at DATETIME NOT NULL,
  versi_sumber BIGINT NULL,
  UNIQUE KEY unik_nisn_tahun (nisn, tahun_pelajaran),
  KEY idx_tahun (tahun_pelajaran),
  KEY idx_jurusan (jurusan_diterima)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_warnings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tahun_pelajaran VARCHAR(20) NOT NULL,
  nisn VARCHAR(20) NULL,
  nama VARCHAR(200) NULL,
  jenis VARCHAR(60) NOT NULL,
  detail TEXT NULL,
  field_kosong JSON NULL,
  jumlah_kosong INT NULL,
  created_at DATETIME NOT NULL,
  KEY idx_tahun (tahun_pelajaran),
  KEY idx_jenis (jenis)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
