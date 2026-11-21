/**
 * Status pendaftaran: Akan Datang / Dibuka / Ditutup.
 * Diatur manual dari panel admin (kolom `status_pendaftaran`).
 * Tanggal mulai/selesai hanya dipakai sebagai fallback bila kolom belum ada.
 * Dipakai beranda dan halaman form agar aturannya identik.
 */

const STATUS_VALID = ["dibuka", "akan-datang", "ditutup"];

function parseTanggal(s) {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export function hitungStatus(data) {
  // Mode manual (utama): nilai dari panel admin
  if (STATUS_VALID.includes(data?.status_pendaftaran)) {
    return data.status_pendaftaran;
  }
  // Fallback lama: hitung dari tanggal
  const mulai = parseTanggal(data?.tanggal_mulai);
  const selesai = parseTanggal(data?.tanggal_selesai);
  if (!mulai || !selesai) return "dibuka";

  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  if (hariIni < mulai) return "akan-datang";
  if (hariIni > selesai) return "ditutup";
  return "dibuka";
}

export const LABEL_STATUS = {
  "dibuka": "Dibuka",
  "akan-datang": "Akan Datang",
  "ditutup": "Ditutup",
};

/** Ambil status beserta data tanggal dari Supabase. */
export async function ambilStatus(supabase) {
  try {
    const { data } = await supabase
      .from("landing")
      .select("status_pendaftaran, tanggal_mulai, tanggal_selesai, waktu_pendaftaran")
      .eq("id", 1)
      .maybeSingle();
    return { status: hitungStatus(data), ...(data || {}) };
  } catch (e) {
    return { status: "dibuka", tanggal_mulai: null, tanggal_selesai: null };
  }
}

export { parseTanggal };
