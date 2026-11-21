/**
 * Konfigurasi pusat aplikasi SPMB.
 * Ubah nilai di bawah ini sesuai project Supabase dan Web App Apps Script Anda.
 */
export const CONFIG = {
  // Supabase -> Project Settings -> API
  SUPABASE_URL: "https://eyugtyqppolmynhxccot.supabase.co",
  SUPABASE_ANON_KEY: "__SUPABASE_ANON_KEY__",

  // Google Apps Script Web App (deployment) untuk upload foto ke Google Drive
  // Kosongkan jika ingin sementara menyimpan foto sebagai data URL / belum aktif.
  DRIVE_UPLOAD_URL: "__APPS_SCRIPT_WEBAPP_URL__",

  // Folder Google Drive tujuan (dari link yang diberikan)
  DRIVE_FOLDER_ID: "1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT",

  // Batas ukuran file foto (byte) dan kompresi sisi klien
  MAX_FOTO_BYTES: 5 * 1024 * 1024,
  FOTO_MAX_DIMENSION: 1600,
  FOTO_QUALITY: 0.82,

  TAHUN_PELAJARAN: "2026/2027",
  NAMA_SEKOLAH: "SMK Negeri 1 Teluk Keramat",
  PORTAL_DIKNAS: "https://spmb-dikbud.kalbarprov.go.id/",

  JURUSAN: [
    "Teknik Komputer dan Jaringan",
    "Agribisnis Tanaman",
    "Desain Komunikasi Visual",
    "Teknik Kendaraan Ringan",
    "Bisnis Retail",
    "Manajemen Perkantoran",
    "Akuntansi",
  ],
};

/** Daftar field foto yang dikirim ke Drive. */
export const FOTO_FIELDS = [
  { key: "foto_siswa", label: "Foto Siswa (3x4 / terbaru)", required: true },
  { key: "foto_kk", label: "Foto / Scan Kartu Keluarga", required: false },
  { key: "foto_akta", label: "Foto / Scan Akta Kelahiran", required: false },
  { key: "foto_rapor", label: "Foto / Scan Rapor (halaman nilai)", required: false },
];

/** Daftar mata pelajaran dan semester untuk tabel nilai. */
export const MAPEL = ["B. Indonesia", "B. Inggris", "Matematika", "IPA", "IPS"];
export const SEMESTER = [1, 2, 3, 4, 5];
