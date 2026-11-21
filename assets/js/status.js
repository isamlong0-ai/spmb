/**
 * Status pendaftaran: Akan Datang / Dibuka / Ditutup.
 * Dihitung dari tanggal mulai & selesai pada tabel `landing`.
 * Dipakai beranda dan halaman form agar aturannya identik.
 */

function parseTanggal(s) {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export function hitungStatus(data) {
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
      .select("tanggal_mulai, tanggal_selesai, waktu_pendaftaran")
      .eq("id", 1)
      .maybeSingle();
    return { status: hitungStatus(data), ...(data || {}) };
  } catch (e) {
    return { status: "dibuka", tanggal_mulai: null, tanggal_selesai: null };
  }
}

export { parseTanggal };
