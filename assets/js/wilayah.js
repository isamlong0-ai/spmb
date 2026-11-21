/**
 * Data wilayah administratif (sumber: https://wilayah.id, update 2025-07-04).
 * Disertakan lokal agar autocomplete tetap berfungsi tanpa koneksi internet.
 * Default: Provinsi Kalimantan Barat, Kabupaten Sambas.
 */
export const PROVINSI = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi",
  "Sumatera Selatan", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung",
  "Kepulauan Riau", "DKI Jakarta", "Jawa Barat", "Jawa Tengah",
  "Daerah Istimewa Yogyakarta", "Jawa Timur", "Banten", "Bali",
  "Nusa Tenggara Barat", "Nusa Tenggara Timur", "Kalimantan Barat",
  "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur",
  "Kalimantan Utara", "Sulawesi Utara", "Sulawesi Tengah",
  "Sulawesi Selatan", "Sulawesi Tenggara", "Gorontalo", "Sulawesi Barat",
  "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Selatan",
  "Papua Tengah", "Papua Pegunungan", "Papua Barat Daya",
];

/** Kabupaten/kota per provinsi. Yang lengkap tersedia untuk Kalimantan Barat. */
export const KABUPATEN = {
  "Kalimantan Barat": [
    "Kabupaten Sambas", "Kabupaten Mempawah", "Kabupaten Sanggau",
    "Kabupaten Ketapang", "Kabupaten Sintang", "Kabupaten Kapuas Hulu",
    "Kabupaten Bengkayang", "Kabupaten Landak", "Kabupaten Sekadau",
    "Kabupaten Melawi", "Kabupaten Kayong Utara", "Kabupaten Kubu Raya",
    "Kota Pontianak", "Kota Singkawang",
  ],
};

/** Kecamatan per kabupaten (lokal untuk Kalimantan Barat). */
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

/** Desa/kelurahan per kecamatan di Kabupaten Sambas (default). */
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

/** Kode wilayah untuk fallback fetch desa di luar Sambas. */
const KODE_KABUPATEN = {
  "Kabupaten Sambas": "61.01", "Kabupaten Mempawah": "61.02",
  "Kabupaten Sanggau": "61.03", "Kabupaten Ketapang": "61.04",
  "Kabupaten Sintang": "61.05", "Kabupaten Kapuas Hulu": "61.06",
  "Kabupaten Bengkayang": "61.07", "Kabupaten Landak": "61.08",
  "Kabupaten Sekadau": "61.09", "Kabupaten Melawi": "61.10",
  "Kabupaten Kayong Utara": "61.11", "Kabupaten Kubu Raya": "61.12",
  "Kota Pontianak": "61.71", "Kota Singkawang": "61.72",
};

const cacheDesa = new Map();

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

/** Kembalikan daftar kabupaten untuk sebuah provinsi. */
export function daftarKabupaten(provinsi) {
  return KABUPATEN[provinsi] || [];
}

/** Kembalikan daftar kecamatan untuk sebuah kabupaten. */
export function daftarKecamatan(kabupaten) {
  return KECAMATAN[kabupaten] || [];
}

/**
 * Ambil daftar desa. Data Sambas tersedia lokal; kabupaten lain diambil
 * dari wilayah.id bila online, dengan graceful fallback ke input bebas.
 */
export async function daftarDesa(kabupaten, kecamatan) {
  if (kabupaten === "Kabupaten Sambas" && DESA_SAMBAS[kecamatan]) {
    return DESA_SAMBAS[kecamatan];
  }
  const kodeKab = KODE_KABUPATEN[kabupaten];
  if (!kodeKab) return [];
  const daftarKec = daftarKecamatan(kabupaten);
  const index = daftarKec.indexOf(kecamatan);
  if (index < 0) return [];
  const kodeKec = `${kodeKab}.${String(index + 1).padStart(2, "0")}`;
  if (cacheDesa.has(kodeKec)) return cacheDesa.get(kodeKec);
  try {
    const res = await fetch(`https://wilayah.id/api/villages/${kodeKec}.json`);
    const json = await res.json();
    const hasil = (json.data || []).map((v) => v.name);
    cacheDesa.set(kodeKec, hasil);
    return hasil;
  } catch (e) {
    return [];
  }
}

/** Inisialisasi semua datalist wilayah + event perubahan berantai. */
export function initWilayah() {
  isiDatalist("dl-provinsi", PROVINSI);
  isiDatalist("dl-kabupaten", daftarKabupaten("Kalimantan Barat"));
  isiDatalist("dl-kecamatan", daftarKecamatan("Kabupaten Sambas"));
  isiDatalist("dl-desa", DESA_SAMBAS["Teluk Keramat"] || []);

  const prov = document.getElementById("f_provinsi");
  const kab = document.getElementById("f_kabupaten");
  const kec = document.getElementById("f_kecamatan");
  const des = document.getElementById("f_desa");

  prov?.addEventListener("input", () => {
    isiDatalist("dl-kabupaten", daftarKabupaten(prov.value.trim()));
  });
  prov?.addEventListener("change", () => {
    if (prov.value.trim() !== "Kalimantan Barat") {
      kab.value = "";
      isiDatalist("dl-kecamatan", []);
      kec.value = "";
      isiDatalist("dl-desa", []);
      des.value = "";
    } else {
      kab.value = "Kabupaten Sambas";
      isiDatalist("dl-kecamatan", daftarKecamatan(kab.value));
    }
  });

  kab?.addEventListener("input", () => {
    isiDatalist("dl-kecamatan", daftarKecamatan(kab.value.trim()));
  });
  kab?.addEventListener("change", async () => {
    isiDatalist("dl-kecamatan", daftarKecamatan(kab.value.trim()));
    kec.value = "";
    isiDatalist("dl-desa", []);
    des.value = "";
  });

  kec?.addEventListener("change", async () => {
    const daftar = await daftarDesa(kab.value.trim(), kec.value.trim());
    isiDatalist("dl-desa", daftar);
  });
}
