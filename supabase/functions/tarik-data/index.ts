import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const FIELD_FORMULIR = [
  "nik", "kk", "akta", "tempat_lahir", "tanggal_lahir", "jenis_kelamin", "agama",
  "anak_ke", "jumlah_saudara", "tinggi_badan", "berat_badan", "jenis_tempat_tinggal",
  "tempat_tinggal_lain", "moda_transportasi", "transportasi_lain", "no_hp_siswa",
  "provinsi", "kabupaten", "kecamatan", "desa", "rt", "rw", "kode_pos",
  "alamat_keterangan", "alamat_lengkap", "nama_ayah", "status_ayah", "nik_ayah",
  "tempat_lahir_ayah", "tanggal_lahir_ayah", "pendidikan_ayah", "pekerjaan_ayah",
  "pekerjaan_ayah_lain", "penghasilan_ayah", "nama_ibu", "status_ibu", "nik_ibu",
  "tempat_lahir_ibu", "tanggal_lahir_ibu", "pendidikan_ibu", "pekerjaan_ibu",
  "pekerjaan_ibu_lain", "penghasilan_ibu", "alamat_orang_tua", "no_hp_orang_tua",
  "nama_wali", "status_wali", "nik_wali", "tempat_lahir_wali", "tanggal_lahir_wali",
  "pendidikan_wali", "pekerjaan_wali", "pekerjaan_wali_lain", "penghasilan_wali",
  "no_hp_wali", "alamat_wali", "bentuk_sekolah", "nama_sekolah", "alamat_sekolah",
  "tahun_lulus", "punya_kip", "no_kip", "peringkat_5", "rata_rata",
  "jurusan1", "jurusan2", "jurusan3", "foto_siswa",
];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: CORS });
}

function kosong(v) {
  return v === null || v === undefined || String(v).trim() === "";
}

function potong(array, ukuran) {
  const hasil = [];
  for (let i = 0; i < array.length; i += ukuran) hasil.push(array.slice(i, i + ukuran));
  return hasil;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Autorisasi: service role key yang sama dengan yang dipakai server lokal
  const auth = req.headers.get("authorization") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!serviceKey || auth !== `Bearer ${serviceKey}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const url = String(Deno.env.get("SUPABASE_URL") || "");
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    let tahun = "";
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      tahun = String(body.tahun || "").trim();
    }
    if (!tahun) {
      const urlObj = new URL(req.url);
      tahun = String(urlObj.searchParams.get("tahun") || "").trim();
    }
    if (!tahun) {
      const { data: pengaturan } = await supabase
        .from("pengaturan").select("value").eq("key", "tahun_pelajaran_aktif").maybeSingle();
      tahun = pengaturan?.value || "";
    }
    if (!tahun) return json({ error: "Tahun pelajaran tidak ditentukan" }, 400);

    // 1. Daftar final yang sudah diatur di halaman Data Siswa Diterima
    const { data: dinas, error: errDinas } = await supabase
      .from("dinas_hasil")
      .select("*")
      .eq("tahun_pelajaran", tahun)
      .eq("sumber", "import")
      .neq("status", "nonaktif")
      .order("jurusan_diterima", { ascending: true })
      .order("urutan", { ascending: true });
    if (errDinas) throw errDinas;

    const daftarDinas = dinas || [];
    const nisnDinas = daftarDinas.map((d) => d.nisn).filter(Boolean);
    const warnings = [];

    // 2. Data formulir yang NISN & tahunnya sama
    let pendaftar = [];
    for (const potongan of potong(nisnDinas, 100)) {
      const { data, error } = await supabase
        .from("pendaftar").select("*")
        .eq("tahun_pelajaran", tahun).in("nisn", potongan);
      if (error) throw error;
      pendaftar = pendaftar.concat(data || []);
    }
    const petaForm = new Map(pendaftar.map((p) => [p.nisn, p]));

    // 3. Nilai rapor untuk pendaftar yang cocok
    let nilai = [];
    const ids = pendaftar.map((p) => p.id);
    for (const potongan of potong(ids, 100)) {
      const { data, error } = await supabase
        .from("nilai_rapor")
        .select("pendaftar_id,mapel,semester,nilai")
        .in("pendaftar_id", potongan);
      if (error) throw error;
      nilai = nilai.concat(data || []);
    }
    const nilaiPerSiswa = new Map();
    nilai.forEach((n) => {
      if (!nilaiPerSiswa.has(n.pendaftar_id)) nilaiPerSiswa.set(n.pendaftar_id, []);
      nilaiPerSiswa.get(n.pendaftar_id).push({
        mapel: n.mapel, semester: n.semester, nilai: n.nilai,
      });
    });

    // 4. Gabungkan & susun peringatan
    const nisnDinasSet = new Set(nisnDinas);
    const data = daftarDinas.map((d) => {
      const f = petaForm.get(d.nisn);
      if (!f) {
        warnings.push({
          nisn: d.nisn, nama: d.nama,
          jenis: "NISN_TIDAK_ADA_DI_FORMULIR",
          detail: "Siswa ada di daftar diterima tetapi tidak ditemukan data formulir dengan NISN & tahun yang sama.",
        });
      } else {
        const fieldKosong = FIELD_FORMULIR.filter((k) => kosong(f[k]));
        if (fieldKosong.length) {
          warnings.push({
            nisn: d.nisn, nama: d.nama,
            jenis: "FORMULIR_BELUM_LENGKAP",
            detail: `${fieldKosong.length} field kosong`,
            field: fieldKosong.slice(0, 15),
            jumlah_kosong: fieldKosong.length,
          });
        }
      }
      const form = f || {};
      return {
        tahun_pelajaran: d.tahun_pelajaran,
        nisn: d.nisn,
        no_pendaftaran_dinas: d.no_pendaftaran_dinas,
        nama: d.nama,
        jurusan_diterima: d.jurusan_diterima,
        jalur: d.jalur,
        status_kelulusan: d.status,
        urutan: d.urutan,
        pilihan: d.pilihan,
        total_nilai: d.total_nilai,
        bobot_nilai: d.bobot_nilai,
        bobot_tka: d.bobot_tka,
        bobot_prestasi: d.bobot_prestasi,
        keterangan_dinas: d.keterangan,
        catatan_verifikasi: d.catatan_verifikasi,
        catatan_mutasi: d.catatan_mutasi,
        form_data: f ? Object.fromEntries(FIELD_FORMULIR.map((k) => [k, f[k]])) : null,
        nilai_rapor: f ? (nilaiPerSiswa.get(f.id) || []) : [],
      };
    });

    pendaftar.forEach((p) => {
      if (!nisnDinasSet.has(p.nisn)) {
        warnings.push({
          nisn: p.nisn, nama: p.nama,
          jenis: "TIDAK_ADA_DI_DINAS",
          detail: "Data formulir tidak ada di daftar siswa diterima, sehingga tidak ikut ditarik.",
        });
      }
    });

    const versi = daftarDinas.reduce((maks, d) => {
      const t = d.updated_at ? new Date(d.updated_at).getTime() : 0;
      return t > maks ? t : maks;
    }, 0);

    return json({
      meta: {
        tahun,
        generated_at: new Date().toISOString(),
        versi,
        jumlah_siswa: data.length,
        jumlah_pendaftar_cocok: pendaftar.length,
        jumlah_warning: warnings.length,
      },
      data,
      warnings,
    });
  } catch (e) {
    return json({ error: e.message || String(e) }, 500);
  }
});
