/**
 * Data & autocomplete wilayah administratif Indonesia.
 * Sumber: https://wilayah.id (update 2025-07-04).
 *
 * - Data Kalimantan Barat / Sambas disimpan lokal => tetap jalan offline.
 * - Provinsi lain tersedia dari data nasional yang disimpan lokal (wilayah-data.js).
 * - Semua field memakai <datalist>, jadi tetap bisa diketik manual.
 */

import { WILAYAH_DATA } from "./wilayah-data.js";

export const PROVINSI = [
  { code: "11", name: "Aceh" },
  { code: "12", name: "Sumatera Utara" },
  { code: "13", name: "Sumatera Barat" },
  { code: "14", name: "Riau" },
  { code: "15", name: "Jambi" },
  { code: "16", name: "Sumatera Selatan" },
  { code: "17", name: "Bengkulu" },
  { code: "18", name: "Lampung" },
  { code: "19", name: "Kepulauan Bangka Belitung" },
  { code: "21", name: "Kepulauan Riau" },
  { code: "31", name: "DKI Jakarta" },
  { code: "32", name: "Jawa Barat" },
  { code: "33", name: "Jawa Tengah" },
  { code: "34", name: "Daerah Istimewa Yogyakarta" },
  { code: "35", name: "Jawa Timur" },
  { code: "36", name: "Banten" },
  { code: "51", name: "Bali" },
  { code: "52", name: "Nusa Tenggara Barat" },
  { code: "53", name: "Nusa Tenggara Timur" },
  { code: "61", name: "Kalimantan Barat" },
  { code: "62", name: "Kalimantan Tengah" },
  { code: "63", name: "Kalimantan Selatan" },
  { code: "64", name: "Kalimantan Timur" },
  { code: "65", name: "Kalimantan Utara" },
  { code: "71", name: "Sulawesi Utara" },
  { code: "72", name: "Sulawesi Tengah" },
  { code: "73", name: "Sulawesi Selatan" },
  { code: "74", name: "Sulawesi Tenggara" },
  { code: "75", name: "Gorontalo" },
  { code: "76", name: "Sulawesi Barat" },
  { code: "81", name: "Maluku" },
  { code: "82", name: "Maluku Utara" },
  { code: "91", name: "Papua" },
  { code: "92", name: "Papua Barat" },
  { code: "93", name: "Papua Selatan" },
  { code: "94", name: "Papua Tengah" },
  { code: "95", name: "Papua Pegunungan" },
  { code: "96", name: "Papua Barat Daya" },
];

const KODE_PROVINSI = Object.fromEntries(PROVINSI.map((p) => [p.name, p.code]));

export const KABUPATEN = {
  "Kalimantan Barat": [
    "Kabupaten Sambas", "Kabupaten Mempawah", "Kabupaten Sanggau",
    "Kabupaten Ketapang", "Kabupaten Sintang", "Kabupaten Kapuas Hulu",
    "Kabupaten Bengkayang", "Kabupaten Landak", "Kabupaten Sekadau",
    "Kabupaten Melawi", "Kabupaten Kayong Utara", "Kabupaten Kubu Raya",
    "Kota Pontianak", "Kota Singkawang",
  ],
};

export const KECAMATAN = {
  "Kabupaten Sambas": [
    "Sambas", "Teluk Keramat", "Jawai", "Tebas", "Pemangkat", "Sejangkung",
    "Selakau", "Paloh", "Sajingan Besar", "Subah", "Galing", "Tekarang",
    "Semparuk", "Sajad", "Sebawi", "Jawai Selatan", "Tangaran", "Salatiga",
    "Selakau Timur",
  ],
  "Kabupaten Mempawah": ["Mempawah Hilir", "Toho", "Sungai Pinyuh", "Jongkat", "Sungai Kunyit", "Segedong", "Anjongan", "Sadaniang", "Mempawah Timur"],
  "Kabupaten Sanggau": ["Kapuas", "Mukok", "Noyan", "Jangkang", "Bonti", "Beduai", "Sekayam", "Kembayan", "Parindu", "Tayan Hulu", "Tayan Hilir", "Balai", "Toba", "Meliau", "Entikong"],
  "Kabupaten Ketapang": ["Matan Hilir Utara", "Marau", "Manis Mata", "Kendawangan", "Sandai", "Sungai Laur", "Simpang Hulu", "Nanga Tayap", "Matan Hilir Selatan", "Tumbang Titi", "Jelai Hulu", "Delta Pawan", "Muara Pawan", "Benua Kayong", "Hulu Sungai", "Simpang Dua", "Air Upas", "Singkup", "Pemahan", "Sungai Melayu Rayak"],
  "Kabupaten Sintang": ["Sintang", "Tempunak", "Sepauk", "Ketungau Hilir", "Ketungau Tengah", "Ketungau Hulu", "Dedai", "Kayan Hilir", "Kayan Hulu", "Serawai", "Ambalau", "Kelam Permai", "Sungai Tebelian", "Binjai Hulu"],
  "Kabupaten Kapuas Hulu": ["Putussibau Utara", "Bika", "Embaloh Hilir", "Embaloh Hulu", "Bunut Hilir", "Bunut Hulu", "Jongkong", "Hulu Gurung", "Selimbau", "Semitau", "Seberuang", "Batang Lupar", "Empanang", "Badau", "Silat Hilir", "Silat Hulu", "Putussibau Selatan", "Kalis", "Boyan Tanjung", "Mentebah", "Pengkadan", "Suhaid", "Puring Kencana"],
  "Kabupaten Bengkayang": ["Sungai Raya", "Samalantan", "Ledo", "Bengkayang", "Seluas", "Sanggau Ledo", "Jagoi Babang", "Monterado", "Teriak", "Suti Semarang", "Capkala", "Siding", "Lumar", "Sungai Betung", "Sungai Raya Kepulauan", "Lembah Bawang", "Tujuh Belas"],
  "Kabupaten Landak": ["Ngabang", "Mempawah Hulu", "Menjalin", "Mandor", "Air Besar", "Menyuke", "Sengah Temila", "Meranti", "Kuala Behe", "Sebangki", "Jelimpo", "Banyuke Hulu", "Sompak"],
  "Kabupaten Sekadau": ["Sekadau Hilir", "Sekadau Hulu", "Nanga Taman", "Nanga Mahap", "Belitang Hilir", "Belitang Hulu", "Belitang"],
  "Kabupaten Melawi": ["Belimbing", "Nanga Pinoh", "Ella Hilir", "Menukung", "Sayan", "Tanah Pinoh", "Sokan", "Pinoh Utara", "Pinoh Selatan", "Belimbing Hulu", "Tanah Pinoh Barat"],
  "Kabupaten Kayong Utara": ["Sukadana", "Simpang Hilir", "Teluk Batang", "Pulau Maya", "Seponti", "Kepulauan Karimata"],
  "Kabupaten Kubu Raya": ["Sungai Raya", "Kuala Mandor B", "Sungai Ambawang", "Terentang", "Batu Ampar", "Kubu", "Rasau Jaya", "Teluk Pakedai", "Sungai Kakap"],
  "Kota Pontianak": ["Pontianak Selatan", "Pontianak Timur", "Pontianak Barat", "Pontianak Utara", "Pontianak Kota", "Pontianak Tenggara"],
  "Kota Singkawang": ["Singkawang Tengah", "Singkawang Barat", "Singkawang Timur", "Singkawang Utara", "Singkawang Selatan"],
};

export const DESA_SAMBAS = {
  "Sambas": ["Dalam Kaum", "Lubuk Dagang", "Tanjung Bugis", "Pendawan", "Pasar Melayu", "Durian", "Lorong", "Jagur", "Tumuk Manggis", "Tanjung Mekar", "Sebayan", "Kartiasa", "Saing Rambi", "Lumbang", "Sungai Rambah", "Gapura", "Sumber Harapan", "Semangau"],
  "Teluk Keramat": ["Sungai Kumpai", "Sekura", "Tri Mandayan", "Pedada", "Lela", "Puringan", "Berlimang", "Sungai Baru", "Sengawang", "Teluk Kaseh", "Sepadu", "Tambatan", "Kubangga", "Sungai Serabek", "Sayang Sedayu", "Pipit Teja", "Matang Segantar", "Mulia", "Teluk Kembang", "Samustida", "Tanjung Keracut", "Sebagu", "Mekar Sekuntum", "Kuala Pangkalan Keramat", "Sabing"],
  "Jawai": ["Sarang Burung Danau", "Sungai Nilam", "Sarang Burung Kolam", "Sarang Burung Usrat", "Sarang Burung Kuala", "Pelimpaan", "Parit Setia", "Bakau", "Sungai Nyirih", "Sentebang", "Dungun Laut", "Lambau", "Mutus Darussalam"],
  "Tebas": ["Tebas Kuala", "Tebas Sungai", "Sempalai", "Bekut", "Seberkat", "Sejiram", "Makrampai", "Mekar Sekuntum", "Mensere", "Pusaka", "Segedong", "Sungai Kelambu", "Serumpun Buluh", "Pangkalan Kongsi", "Dungun Perapakan", "Batu Makjage", "Serindang", "Bukit Sigoler", "Matang Labong", "Maktangguk", "Segarau Parit", "Maribas", "Seret Ayon"],
  "Pemangkat": ["Pemangkat Kota", "Harapan", "Penjajap", "Jelutung", "Perapakan", "Sebatuan", "Gugah Sejahtera", "Lonam"],
  "Sejangkung": ["Sulung", "Penakalan", "Sekuduk", "Setalik", "Parit Raja", "Piantus", "Perigi Landu", "Sendoyan", "Senujuh", "Perigi Limus", "Semanga", "Sepantai"],
  "Selakau": ["Semelagi Besar", "Sungai Daun", "Sungai Rusa", "Sungai Nyirih", "Kuala", "Parit Baru", "Twi Mentibar", "Bentunai", "Pangkalan Bemban", "Parit Kongsi", "Gayung Bersambut"],
  "Paloh": ["Sebubus", "Nibung", "Malek", "Tanah Hitam", "Matang Danau", "Kalimantan", "Temajuk", "Mentibar"],
  "Sajingan Besar": ["Kaliau'", "Sebunga", "Santaban", "Sanatab", "Sungai Bening"],
  "Subah": ["Balai Gemuruh", "Sungai Sapa'", "Madak", "Sabung", "Tebuah Elok", "Sungai Deden", "Bukit Mulya", "Mukti Raharja", "Sempurna", "Mensade", "Karaban Jaya", "Arga Pura", "Sapak Hulu Trans"],
  "Galing": ["Sagu", "Sungai Palah", "Galing", "Tempapan Kuala", "Tempapan Hulu", "Ratu Sepudak", "Tri Kembang", "Tri Gadu", "Teluk Pandan", "Sijang"],
  "Tekarang": ["Tekarang", "Merubung", "Cepala", "Sari Makmur", "Rambayan", "Sempadian", "Matang Segarau"],
  "Semparuk": ["Singaraya", "Semparuk", "Sepinggan", "Sepadu", "Seburing"],
  "Sajad": ["Jirak", "Tengguli", "Mekar Jaya", "Beringin"],
  "Sebawi": ["Rantau Panjang", "Tebing Batu", "Sebawi", "Sepuk Tanjung", "Sebangun", "Sempalai Sebedang", "Tempatan"],
  "Jawai Selatan": ["Jawai Laut", "Jelu Air", "Matang Terap", "Suah Api", "Sarilaba A", "Sarilaba B", "Semperiuk A", "Semperiuk B", "Sabaran"],
  "Tangaran": ["Tangaran", "Simpang Empat", "Merabuan", "Semata", "Merpati", "Pancur", "Arung Parak", "Arung Medang"],
  "Salatiga": ["Parit Baru", "Sungai Toman", "Serunai", "Serumpun", "Salatiga"],
  "Selakau Timur": ["Gelik", "Seranggam", "Selakau Tua", "Buduk Sempadang"],
};

const KODE_KABUPATEN_KALBAR = {
  "Kabupaten Sambas": "61.01", "Kabupaten Mempawah": "61.02",
  "Kabupaten Sanggau": "61.03", "Kabupaten Ketapang": "61.04",
  "Kabupaten Sintang": "61.05", "Kabupaten Kapuas Hulu": "61.06",
  "Kabupaten Bengkayang": "61.07", "Kabupaten Landak": "61.08",
  "Kabupaten Sekadau": "61.09", "Kabupaten Melawi": "61.10",
  "Kabupaten Kayong Utara": "61.11", "Kabupaten Kubu Raya": "61.12",
  "Kota Pontianak": "61.71", "Kota Singkawang": "61.72",
};

let provinsiAktif = "Kalimantan Barat";
let kodeProvinsiAktif = "61";

/** Isi <datalist> dengan daftar pilihan. */
export function isiDatalist(id, daftar) {
  const dl = document.getElementById(id);
  if (!dl) return;
  dl.innerHTML = "";
  (daftar || []).forEach((item) => {
    const opt = document.createElement("option");
    opt.value = typeof item === "string" ? item : item.name;
    dl.appendChild(opt);
  });
}

/** Daftar kabupaten/kota (data nasional lokal; Kalbar juga punya cadangan lokal). */
export function daftarKabupaten(provinsi) {
  const nama = String(provinsi || "").trim();
  const kode = KODE_PROVINSI[nama];
  if (kode) { provinsiAktif = nama; kodeProvinsiAktif = kode; }
  if (KABUPATEN[nama]) return KABUPATEN[nama];
  if (!kode) return [];
  return (WILAYAH_DATA[kode]?.daftar || []).map((x) => x[1]);
}

function cariKodeKab(namaKab) {
  if (KODE_KABUPATEN_KALBAR[namaKab]) return KODE_KABUPATEN_KALBAR[namaKab];
  const daftar = WILAYAH_DATA[kodeProvinsiAktif]?.daftar || [];
  return daftar.find((x) => x[1] === namaKab)?.[0] || null;
}

/** Daftar kecamatan untuk semua kabupaten/kota di Indonesia. */
export function daftarKecamatan(kabupaten) {
  const nama = String(kabupaten || "").trim();
  if (KECAMATAN[nama]) return KECAMATAN[nama];
  const kodeKab = cariKodeKab(nama);
  if (!kodeKab) return [];
  return (WILAYAH_DATA[kodeProvinsiAktif]?.kec?.[kodeKab] || []).map((x) => x[1]);
}

/** Daftar desa/kelurahan (lengkap untuk Kalbar, Sambas juga punya cadangan offline). */
export function daftarDesa(kabupaten, kecamatan) {
  const kab = String(kabupaten || "").trim();
  const kec = String(kecamatan || "").trim();
  if (kab === "Kabupaten Sambas" && DESA_SAMBAS[kec]) return DESA_SAMBAS[kec];
  const kodeKab = cariKodeKab(kab);
  if (!kodeKab) return [];
  const kecList = WILAYAH_DATA[kodeProvinsiAktif]?.kec?.[kodeKab] || [];
  const kodeKec = kecList.find((x) => x[1] === kec)?.[0];
  if (!kodeKec) return [];
  return WILAYAH_DATA[kodeProvinsiAktif]?.desa?.[kodeKec] || [];
}

/** Inisialisasi datalist + event perubahan berantai. */
export function initWilayah() {
  isiDatalist("dl-provinsi", PROVINSI);
  isiDatalist("dl-kabupaten", KABUPATEN["Kalimantan Barat"]);
  isiDatalist("dl-kecamatan", KECAMATAN["Kabupaten Sambas"]);
  isiDatalist("dl-desa", DESA_SAMBAS["Teluk Keramat"] || []);

  const prov = document.getElementById("f_provinsi");
  const kab = document.getElementById("f_kabupaten");
  const kec = document.getElementById("f_kecamatan");
  const des = document.getElementById("f_desa");
  let tokenKab = 0, tokenKec = 0;

  prov?.addEventListener("input", async () => {
    const t = ++tokenKab;
    const daftar = await daftarKabupaten(prov.value.trim());
    if (t === tokenKab) isiDatalist("dl-kabupaten", daftar);
  });

  prov?.addEventListener("change", async () => {
    const t = ++tokenKab;
    provinsiAktif = prov.value.trim();
    kodeProvinsiAktif = KODE_PROVINSI[provinsiAktif] || "61";
    const daftar = await daftarKabupaten(provinsiAktif);
    if (t !== tokenKab) return;
    isiDatalist("dl-kabupaten", daftar);
    kab.value = provinsiAktif === "Kalimantan Barat" ? "Kabupaten Sambas" : "";
    isiDatalist("dl-kecamatan", []);
    kec.value = "";
    isiDatalist("dl-desa", []);
    des.value = "";
  });

  kab?.addEventListener("input", async () => {
    const t = ++tokenKec;
    const daftar = await daftarKecamatan(kab.value.trim());
    if (t === tokenKec) isiDatalist("dl-kecamatan", daftar);
  });

  kab?.addEventListener("change", async () => {
    const t = ++tokenKec;
    isiDatalist("dl-kecamatan", []);
    kec.value = "";
    isiDatalist("dl-desa", []);
    des.value = "";
    const daftar = await daftarKecamatan(kab.value.trim());
    if (t === tokenKec) isiDatalist("dl-kecamatan", daftar);
  });

  kec?.addEventListener("change", async () => {
    const daftar = await daftarDesa(kab.value.trim(), kec.value.trim());
    isiDatalist("dl-desa", daftar);
  });
}
