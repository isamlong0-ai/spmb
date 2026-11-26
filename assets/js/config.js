/**
 * Konfigurasi pusat aplikasi SPMB.
 * Ubah nilai di bawah ini sesuai project Supabase dan Web App Apps Script Anda.
 */
export const CONFIG = {
  // Supabase -> Project Settings -> API
  SUPABASE_URL: "https://eyugtyqppolmynhxccot.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_XBST_lVhiVHsq6FpFAmx-A_ddN0JB1K",

  // Google Apps Script Web App (deployment) untuk upload foto ke Google Drive
  // Kosongkan jika ingin sementara menyimpan foto sebagai data URL / belum aktif.
  DRIVE_UPLOAD_URL: "https://script.google.com/macros/s/AKfycbyI9xgpIi6jnxHWmUuVRakeNxTwWWaNgYUuBMrhc_900HBX48swaEiwOZRgE5Wq_1dROQ/exec",

  // Portal resmi SPMB Dinas Kalimantan Barat
  PORTAL_DINAS: "https://spmb-dikbud.kalbarprov.go.id/",

  // Proxy baca-saja untuk mengambil info portal dari browser (CORS)
  PROXY_BACA: "https://r.jina.ai/",

  // Video resmi panduan pembuatan akun dari portal dinas
  VIDEO_AKUN_URL: "https://drive.google.com/file/d/1pe8j7wqJFsibVZE9hQtgfaRiZ1bqU2Zi/view?usp=sharing",

  // Folder Google Drive tujuan (dari link yang diberikan)
  DRIVE_FOLDER_ID: "1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT",

  // Batas ukuran file foto (byte) dan kompresi sisi klien
  MAX_FOTO_BYTES: 5 * 1024 * 1024,
  FOTO_MAX_DIMENSION: 1600,
  FOTO_QUALITY: 0.82,

  // Fallback jika tabel pengaturan belum bisa diakses.
  // Nilai sebenarnya diambil dari Supabase (bisa diubah di panel admin).
  TAHUN_PELAJARAN: "2026/2027",
  NAMA_SEKOLAH: "SMK Negeri 1 Teluk Keramat",
  PORTAL_DIKNAS: "https://spmb-dikbud.kalbarprov.go.id/",

  // Diurutkan abjad (sesuai urutan tab di panel admin)
  JURUSAN: [
    "Agribisnis Tanaman Pangan dan Hortikultura",
    "Akuntansi",
    "Bisnis Retail",
    "Desain Komunikasi Visual",
    "Manajemen Perkantoran",
    "Teknik Kendaraan Ringan",
    "Teknik Komputer dan Jaringan",
  ],
};

/** Form hanya mengunggah satu foto (3x4) dan bersifat opsional. */
export const FOTO_FIELDS = [
  { key: "foto_siswa", label: "Foto 3x4 Siswa (terbaru)", required: false },
];

/** Daftar mata pelajaran dan semester untuk tabel nilai. */
export const MAPEL = ["B. Indonesia", "B. Inggris", "Matematika", "IPA", "IPS"];
export const SEMESTER = [1, 2, 3, 4, 5];
