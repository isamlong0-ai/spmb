/**
 * Utilitas Tahun Pelajaran otomatis.
 *
 * Aturan: tahun pelajaran dimulai bulan Juli.
 * - Bulan Januari–Juni 2026  -> 2025/2026
 * - Bulan Juli–Desember 2026 -> 2026/2027
 *
 * Semua tahun di aplikasi (form, beranda, admin) diambil dari sini,
 * sehingga berganti tahun dengan sendirinya tanpa edit kode.
 */

/** Tahun pelajaran berjalan untuk sebuah tanggal. */
export function tahunPelajaran(tanggal = new Date()) {
  const y = tanggal.getFullYear();
  const bulan = tanggal.getMonth() + 1;
  return bulan >= 7 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

/** Tahun pelajaran berikutnya. */
export function tahunDepan(tahun = tahunPelajaran()) {
  const y = parseInt(String(tahun).slice(0, 4), 10);
  return `${y + 1}/${y + 2}`;
}

/** Tahun pelajaran sebelumnya. */
export function tahunSebelumnya(tahun = tahunPelajaran()) {
  const y = parseInt(String(tahun).slice(0, 4), 10);
  return `${y - 1}/${y}`;
}

/** Pilihan tahun aktif: sekarang + akan datang. */
export function pilihanTahunAktif() {
  const sekarang = tahunPelajaran();
  return [sekarang, tahunDepan(sekarang)];
}

/** Pilihan tahun untuk filter data: tahun depan, sekarang, sebelumnya. */
export function pilihanTahunData() {
  const sekarang = tahunPelajaran();
  return [tahunDepan(sekarang), sekarang, tahunSebelumnya(sekarang)];
}

/** Tahun pertama dari sebuah tahun pelajaran (untuk opsi tahun lulus). */
export function tahunAwal(tahun) {
  return parseInt(String(tahun).slice(0, 4), 10);
}

/**
 * Ambil tahun aktif yang berlaku.
 * - Jika mode = 'auto' (default), selalu pakai tahun berjalan dari tanggal.
 * - Jika admin memilih manual, pakai nilai yang tersimpan.
 */
export async function ambilTahunAktif(supabase) {
  try {
    const { data } = await supabase
      .from("pengaturan")
      .select("key, value")
      .in("key", ["tahun_pelajaran_aktif", "mode_tahun_aktif"]);
    const peta = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    if (peta.mode_tahun_aktif === "manual" && peta.tahun_pelajaran_aktif) {
      return peta.tahun_pelajaran_aktif;
    }
  } catch (e) {
    // Fallback ke perhitungan lokal
  }
  return tahunPelajaran();
}
