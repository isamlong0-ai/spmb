import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG, MAPEL, SEMESTER } from "./config.js";
import { ambilTahunAktif, pilihanTahunAktif, pilihanTahunData, tahunPelajaran } from "./tahun.js";

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const PAGE_SIZE = 25;

let offset = 0;
let semuaData = [];
let dataTerfilter = [];
let editId = null;
let tahunAktif = CONFIG.TAHUN_PELAJARAN;
let daftarTahun = [];
let modeTahun = "auto";
let emailAdmin = "";

/* -------------------------------- Util -------------------------------- */
function toast(pesan, tipe = "") {
  const el = document.createElement("div");
  el.className = `toast ${tipe}`;
  el.textContent = pesan;
  $("#toastWrap").appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function tgl(s) {
  if (!s) return "-";
  return new Date(s).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------ Autentikasi ---------------------------- */
async function initAuth() {
  const { data } = await supabase.auth.getSession();
  if (data.session) tampilkanAdmin(data.session.user);
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) tampilkanAdmin(session.user);
    else {
      $("#adminView").classList.add("hidden");
      $("#loginView").classList.remove("hidden");
    }
  });

  $("#btnLogin").addEventListener("click", async () => {
    const btn = $("#btnLogin");
    btn.disabled = true;
    btn.textContent = "Memproses…";
    $("#loginError").textContent = "";
    const { error } = await supabase.auth.signInWithPassword({
      email: $("#email").value.trim(),
      password: $("#password").value,
    });
    if (error) $("#loginError").textContent = error.message;
    btn.disabled = false;
    btn.textContent = "Masuk";
  });
  $("#password").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#btnLogin").click(); });
  $("#btnLogout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    toast("Anda telah keluar.");
  });
}

function tampilkanAdmin(user) {
  $("#loginView").classList.add("hidden");
  $("#adminView").classList.remove("hidden");
  emailAdmin = user.email;
  muatTahun();
  muatData();
}

/* ------------------------------- Data ---------------------------------- */
async function muatData(reset = true) {
  if (reset) offset = 0;
  const { data, error } = await supabase
    .from("pendaftar")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    toast("Gagal memuat data: " + error.message, "error");
    $("#dataBody").innerHTML = `<tr><td colspan="9" style="padding:30px;color:var(--danger)">${escapeHtml(error.message)}</td></tr>`;
    return;
  }
  semuaData = reset ? (data || []) : [...semuaData, ...(data || [])];
  offset += data?.length || 0;
  kumpulkanTahun();
  updateDashboard();
  terapkanFilter();
  $("#btnMore").style.display = (data?.length || 0) < PAGE_SIZE ? "none" : "";
}

function kumpulkanTahun() {
  const dariData = semuaData.map((d) => d.tahun_pelajaran).filter(Boolean);
  daftarTahun = Array.from(new Set([
    ...pilihanTahunData(), tahunAktif, ...dariData,
  ])).sort().reverse();

  const filter = $("#filterTahun");
  const nilaiSebelumnya = filter.value || tahunAktif;
  filter.innerHTML = `<option value="">Semua Tahun</option>` +
    daftarTahun.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  filter.value = daftarTahun.includes(nilaiSebelumnya) ? nilaiSebelumnya : tahunAktif;

  // Opsi tahun aktif: otomatis + tahun sekarang + tahun depan (+ data lama)
  const opsiAktif = Array.from(new Set([...pilihanTahunAktif(), ...dariData, tahunAktif])).sort().reverse();
  const sel = $("#tahunAktifSelect");
  sel.innerHTML =
    `<option value="__auto__">Otomatis (${tahunPelajaran()})</option>` +
    opsiAktif.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  sel.value = modeTahun === "auto" ? "__auto__" : tahunAktif;

  // Pemilih tahun untuk statistik dashboard (terpisah dari tahun form)
  const stat = $("#statTahun");
  const statSebelumnya = stat.value || tahunAktif;
  stat.innerHTML = `<option value="">Semua Tahun</option>` +
    daftarTahun.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
  stat.value = daftarTahun.includes(statSebelumnya) ? statSebelumnya : tahunAktif;
}

function barisChart(label, jumlah, maks, kelas = "") {
  const pct = maks ? Math.max(3, Math.round((jumlah / maks) * 100)) : 0;
  return `<div class="chart-row">
    <div class="chart-label" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
    <div class="chart-track"><div class="chart-fill ${kelas}" style="width:${pct}%"></div></div>
    <div class="chart-nilai">${jumlah}</div>
  </div>`;
}

function updateDashboard() {
  const tahunStat = $("#statTahun")?.value || "";
  const data = tahunStat ? semuaData.filter((d) => d.tahun_pelajaran === tahunStat) : semuaData;
  $("#dashboardSubtitle").textContent = tahunStat
    ? `Statistik Tahun Pelajaran ${tahunStat}`
    : "Statistik seluruh tahun pelajaran";

  $("#stTotal").textContent = data.length;

  // Hitung jurusan dari ketiga pilihan setiap pendaftar pada tahun terpilih
  const hitung = {};
  CONFIG.JURUSAN.forEach((j) => { hitung[j] = 0; });
  data.forEach((d) => [d.jurusan1, d.jurusan2, d.jurusan3].forEach((j) => {
    if (j) hitung[j] = (hitung[j] || 0) + 1;
  }));
  const urut = Object.entries(hitung).sort((a, b) => b[1] - a[1]);
  [1, 2, 3].forEach((i) => {
    const [nama, jumlah] = urut[i - 1] || ["-", 0];
    $("#stJ" + i).textContent = jumlah > 0 ? nama : "-";
    $("#stJ" + i + "n").textContent = jumlah + " calon siswa";
  });
  const maksJ = urut[0]?.[1] || 1;
  $("#chartJurusan").innerHTML = data.length
    ? urut.map(([n, v]) => barisChart(n, v, maksJ)).join("")
    : '<div class="hint">Belum ada calon siswa pada tahun ini.</div>';

  const kip = data.filter((d) => d.punya_kip).length;
  const foto = data.filter((d) => d.foto_siswa).length;
  const maksLain = Math.max(data.length, 1);
  $("#chartLain").innerHTML =
    barisChart("Memiliki KIP", kip, maksLain, "warn") +
    barisChart("Tanpa KIP", data.length - kip, maksLain, "info") +
    barisChart("Sudah upload foto", foto, maksLain, "info");

  // Grafik per tahun tetap menampilkan semua tahun (untuk perbandingan)
  const perTahun = {};
  semuaData.forEach((d) => { const k = d.tahun_pelajaran || "-"; perTahun[k] = (perTahun[k] || 0) + 1; });
  const urutTh = Object.entries(perTahun).sort((a, b) => b[0].localeCompare(a[0]));
  const maksTh = Math.max(...Object.values(perTahun), 1);
  $("#chartTahun").innerHTML = urutTh.map(([n, v]) => barisChart(n, v, maksTh, "info")).join("") || "-";
}

function terapkanFilter() {
  const q = $("#cari").value.trim().toLowerCase();
  const th = $("#filterTahun").value;
  dataTerfilter = semuaData.filter((d) => {
    const cocokTeks = !q || [d.nama, d.nisn, d.nama_sekolah, d.kode_pendaftaran]
      .some((v) => String(v || "").toLowerCase().includes(q));
    const cocokTahun = !th || d.tahun_pelajaran === th;
    return cocokTeks && cocokTahun;
  });
  renderTabel();
}

function renderTabel() {
  const body = $("#dataBody");
  if (!dataTerfilter.length) {
    body.innerHTML = `<tr><td colspan="8" style="padding:30px;color:var(--muted)">Belum ada data calon siswa untuk tahun ini.</td></tr>`;
    $("#infoData").textContent = "0 data";
    return;
  }
  body.innerHTML = dataTerfilter.map((d) => `
    <tr>
      <td style="font-size:11px;color:var(--muted)">${escapeHtml(d.kode_pendaftaran)}</td>
      <td style="font-size:11px;white-space:nowrap">${escapeHtml(d.tahun_pelajaran || "-")}</td>
      <td><b>${escapeHtml(d.nama)}</b><br><span style="font-size:11px;color:var(--muted)">${escapeHtml(d.provinsi)} / ${escapeHtml(d.kabupaten)}</span></td>
      <td>${escapeHtml(d.nisn)}</td>
      <td>${escapeHtml(d.nama_sekolah)}</td>
      <td style="font-size:12px;line-height:1.7">
        <div><span style="color:var(--muted)">1.</span> ${escapeHtml(d.jurusan1 || "-")}</div>
        <div><span style="color:var(--muted)">2.</span> ${escapeHtml(d.jurusan2 || "-")}</div>
        <div><span style="color:var(--muted)">3.</span> ${escapeHtml(d.jurusan3 || "-")}</div>
      </td>
      <td style="font-size:11px">${tgl(d.created_at)}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-sm btn-info" data-edit="${d.id}">Edit</button>
          <button class="btn btn-sm btn-danger" data-hapus="${d.id}">Hapus</button>
        </div>
      </td>
    </tr>`).join("");
  const labelTahun = $("#filterTahun").value || "semua tahun";
  $("#infoData").textContent = `Menampilkan ${dataTerfilter.length} data (${labelTahun})`;

  $$("[data-edit]", body).forEach((b) => b.addEventListener("click", () => bukaEdit(b.dataset.edit)));
  $$("[data-hapus]", body).forEach((b) => b.addEventListener("click", () => hapusData(b.dataset.hapus)));
}

/* ---------------------------- Modal edit -------------------------------- */
const GRUP = [
  { judul: "Data Diri", field: [
    ["nama", "Nama Lengkap", "text"], ["nik", "NIK", "text"],
    ["kk", "Nomor KK", "text"], ["akta", "Nomor Akta", "text"],
    ["tempat_lahir", "Tempat Lahir", "text"], ["tanggal_lahir", "Tanggal Lahir", "date"],
    ["jenis_kelamin", "Jenis Kelamin", "select", ["Laki-laki", "Perempuan"]],
    ["agama", "Agama", "select", ["Islam", "Kristen", "Katolik", "Hindu", "Buddha", "Khonghucu"]],
    ["anak_ke", "Anak Ke-", "number"], ["jumlah_saudara", "Jumlah Saudara", "number"],
    ["tinggi_badan", "Tinggi Badan (cm)", "number"], ["berat_badan", "Berat Badan (kg)", "number"],
    ["jenis_tempat_tinggal", "Jenis Tempat Tinggal", "text"], ["tempat_tinggal_lain", "Tempat Tinggal Lain", "text"],
    ["moda_transportasi", "Moda Transportasi", "text"], ["transportasi_lain", "Transportasi Lain", "text"],
    ["no_hp_siswa", "No. HP Siswa", "text"],
  ]},
  { judul: "Alamat", field: [
    ["provinsi", "Provinsi", "text"], ["kabupaten", "Kabupaten / Kota", "text"],
    ["kecamatan", "Kecamatan", "text"], ["desa", "Desa / Kelurahan", "text"],
    ["rt", "RT", "text"], ["rw", "RW", "text"], ["kode_pos", "Kode Pos", "text"],
    ["alamat_keterangan", "Patokan", "text"], ["alamat_lengkap", "Alamat Lengkap", "textarea"],
  ]},
  { judul: "Orang Tua", field: [
    ["nama_ayah", "Nama Ayah", "text"], ["status_ayah", "Status Ayah", "select", ["Hidup", "Meninggal"]],
    ["nik_ayah", "NIK Ayah", "text"], ["tempat_lahir_ayah", "Tempat Lahir Ayah", "text"],
    ["tanggal_lahir_ayah", "Tanggal Lahir Ayah", "date"], ["pendidikan_ayah", "Pendidikan Ayah", "text"],
    ["pekerjaan_ayah", "Pekerjaan Ayah", "text"], ["pekerjaan_ayah_lain", "Pekerjaan Ayah Lain", "text"],
    ["penghasilan_ayah", "Penghasilan Ayah", "text"],
    ["nama_ibu", "Nama Ibu", "text"], ["status_ibu", "Status Ibu", "select", ["Hidup", "Meninggal"]],
    ["nik_ibu", "NIK Ibu", "text"], ["tempat_lahir_ibu", "Tempat Lahir Ibu", "text"],
    ["tanggal_lahir_ibu", "Tanggal Lahir Ibu", "date"], ["pendidikan_ibu", "Pendidikan Ibu", "text"],
    ["pekerjaan_ibu", "Pekerjaan Ibu", "text"], ["pekerjaan_ibu_lain", "Pekerjaan Ibu Lain", "text"],
    ["penghasilan_ibu", "Penghasilan Ibu", "text"],
    ["alamat_orang_tua", "Alamat Orang Tua", "textarea"], ["no_hp_orang_tua", "No. HP Orang Tua", "text"],
  ]},
  { judul: "Wali (opsional)", field: [
    ["nama_wali", "Nama Wali", "text"], ["status_wali", "Status Wali", "select", ["Hidup", "Meninggal"]],
    ["nik_wali", "NIK Wali", "text"], ["tempat_lahir_wali", "Tempat Lahir Wali", "text"],
    ["tanggal_lahir_wali", "Tanggal Lahir Wali", "date"], ["pendidikan_wali", "Pendidikan Wali", "text"],
    ["pekerjaan_wali", "Pekerjaan Wali", "text"], ["pekerjaan_wali_lain", "Pekerjaan Wali Lain", "text"],
    ["penghasilan_wali", "Penghasilan Wali", "text"],
    ["no_hp_wali", "No. HP Wali", "text"], ["alamat_wali", "Alamat Wali", "textarea"],
  ]},
  { judul: "Sekolah & Jurusan", field: [
    ["tahun_pelajaran", "Tahun Pelajaran", "tahun"],
    ["nisn", "NISN", "text"], ["bentuk_sekolah", "Bentuk Sekolah", "select", ["SMP", "MTs.", "Paket B"]],
    ["nama_sekolah", "Nama Asal Sekolah", "text"], ["alamat_sekolah", "Alamat Sekolah", "textarea"],
    ["tahun_lulus", "Tahun Lulus", "number"], ["punya_kip", "Memiliki KIP", "select", ["true", "false"]],
    ["no_kip", "Nomor KIP", "text"],
    ["peringkat_5", "Peringkat Kelas Smt 5", "number"], ["rata_rata", "Rata-rata Nilai", "number"],
    ["jurusan1", "Pilihan Jurusan 1", "select", CONFIG.JURUSAN],
    ["jurusan2", "Pilihan Jurusan 2", "select", CONFIG.JURUSAN],
    ["jurusan3", "Pilihan Jurusan 3", "select", CONFIG.JURUSAN],
  ]},
  { judul: "Foto / Dokumen", field: [
    ["foto_siswa", "URL Foto Siswa (Drive)", "text"], ["foto_kk", "URL Foto KK", "text"],
    ["foto_akta", "URL Foto Akta", "text"], ["foto_rapor", "URL Foto Rapor", "text"],
  ]},
];

function inputEdit(field, val) {
  const [name, label, type, opsi] = field;
  const v = val == null ? "" : String(val);
  if (type === "textarea") {
    return `<div class="field"><label>${label}</label><textarea name="${name}" rows="2">${escapeHtml(v)}</textarea></div>`;
  }
  if (type === "select" || type === "tahun") {
    const pilihan = type === "tahun" ? daftarTahun : (opsi || []);
    return `<div class="field"><label>${label}</label><select name="${name}">
      ${type === "select" ? '<option value="">-- Kosong --</option>' : ""}
      ${pilihan.map((o) => `<option value="${escapeHtml(o)}" ${o === v ? "selected" : ""}>${escapeHtml(o)}</option>`).join("")}
    </select></div>`;
  }
  return `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${escapeHtml(v)}" ${type === "number" ? 'step="any"' : ""}></div>`;
}

async function bukaEdit(id) {
  const d = semuaData.find((x) => x.id === id);
  if (!d) return;
  editId = id;
  $("#editTitle").textContent = `Edit: ${d.nama}`;

  let html = `<div class="grid">`;
  GRUP.forEach((g) => {
    html += `<div class="section-title">${g.judul}</div>`;
    g.field.forEach((f) => { html += inputEdit(f, d[f[0]]); });
  });

  const { data: nilai } = await supabase.from("nilai_rapor").select("mapel,semester,nilai").eq("pendaftar_id", id);
  const peta = new Map((nilai || []).map((n) => [`${n.mapel}|${n.semester}`, n.nilai]));

  html += `<div class="section-title">Nilai Rapor</div>
    <div class="field full"><div class="table-wrap"><table class="data-table">
      <thead><tr><th>Mapel</th>${SEMESTER.map((s) => `<th>Smt ${s}</th>`).join("")}</tr></thead>
      <tbody>${MAPEL.map((m, mi) => `<tr><td>${m}</td>${SEMESTER.map((s) => {
        const val = peta.get(`${m}|${s}`) ?? "";
        return `<td><input type="number" min="0" max="100" step="0.01" name="nilai_${mi}_${s}" value="${val}"></td>`;
      }).join("")}</tr>`).join("")}</tbody>
    </table></div></div>`;
  html += `</div>`;

  $("#editBody").innerHTML = html;
  $("#overlayEdit").classList.add("show");
  document.body.classList.add("lock-scroll");
}

function tutupEdit() {
  $("#overlayEdit").classList.remove("show");
  document.body.classList.remove("lock-scroll");
  editId = null;
}

async function simpanEdit() {
  if (!editId) return;
  const btn = $("#editSimpan");
  btn.disabled = true;
  btn.textContent = "Menyimpan…";

  const payload = {};
  $$("#editBody [name]").forEach((el) => {
    if (el.name.startsWith("nilai_")) return;
    let v = el.value;
    if (["anak_ke", "jumlah_saudara", "tinggi_badan", "berat_badan", "tahun_lulus", "peringkat_5", "rata_rata"].includes(el.name)) v = v === "" ? null : Number(v);
    if (el.name === "punya_kip") v = v === "true";
    payload[el.name] = v === "" ? null : v;
  });

  try {
    const { error: e1 } = await supabase.from("pendaftar").update(payload).eq("id", editId);
    if (e1) throw e1;

    const nilai = [];
    MAPEL.forEach((mapel, mi) => SEMESTER.forEach((s) => {
      const v = parseFloat($(`#editBody [name="nilai_${mi}_${s}"]`).value);
      if (!isNaN(v)) nilai.push({ pendaftar_id: editId, mapel, semester: s, nilai: v });
    }));
    const { error: e2 } = await supabase.from("nilai_rapor").delete().eq("pendaftar_id", editId);
    if (e2) throw e2;
    if (nilai.length) {
      const { error: e3 } = await supabase.from("nilai_rapor").insert(nilai);
      if (e3) throw e3;
    }

    toast("Perubahan berhasil disimpan.");
    tutupEdit();
    muatData();
  } catch (err) {
    toast("Gagal menyimpan: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Simpan Perubahan";
  }
}

async function hapusData(id) {
  const d = semuaData.find((x) => x.id === id);
  if (!confirm(`Yakin ingin menghapus data calon siswa "${d?.nama || id}"?\n\nTindakan ini tidak dapat dibatalkan.`)) return;
  const { error } = await supabase.from("pendaftar").delete().eq("id", id);
  if (error) toast("Gagal menghapus: " + error.message, "error");
  else { toast("Data berhasil dihapus."); muatData(); }
}

/* -------------------------------- Export ------------------------------- */
function exportCSV() {
  if (!dataTerfilter.length) { toast("Belum ada data untuk diekspor.", "warn"); return; }
  const kolom = ["tahun_pelajaran", "kode_pendaftaran", "nama", "nik", "nisn", "nama_sekolah", "provinsi", "kabupaten", "kecamatan", "desa", "jurusan1", "jurusan2", "jurusan3", "created_at"];
  const baris = [kolom.join(",")].concat(dataTerfilter.map((d) =>
    kolom.map((k) => `"${String(d[k] ?? "").replace(/"/g, '""')}"`).join(",")
  ));
  const blob = new Blob(["\ufeff" + baris.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const label = ($("#filterTahun").value || "semua-tahun").replace("/", "-");
  a.download = `calon-siswa-spmb-${label}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

const KOLOM_EXCEL = [
  ["tahun_pelajaran", "Tahun Pelajaran"], ["kode_pendaftaran", "Kode Pengiriman Data"],
  ["nama", "Nama"], ["nik", "NIK"], ["kk", "No. KK"], ["nisn", "NISN"],
  ["tempat_lahir", "Tempat Lahir"], ["tanggal_lahir", "Tanggal Lahir"],
  ["jenis_kelamin", "Jenis Kelamin"], ["agama", "Agama"],
  ["provinsi", "Provinsi"], ["kabupaten", "Kabupaten/Kota"],
  ["kecamatan", "Kecamatan"], ["desa", "Desa"], ["rt", "RT"], ["rw", "RW"],
  ["alamat_lengkap", "Alamat Lengkap"], ["no_hp_siswa", "HP Siswa"],
  ["nama_ayah", "Nama Ayah"], ["status_ayah", "Status Ayah"],
  ["nama_ibu", "Nama Ibu"], ["status_ibu", "Status Ibu"],
  ["nama_wali", "Nama Wali"], ["status_wali", "Status Wali"],
  ["bentuk_sekolah", "Bentuk Sekolah"], ["nama_sekolah", "Asal Sekolah"],
  ["tahun_lulus", "Tahun Lulus"], ["punya_kip", "Punya KIP"], ["no_kip", "No. KIP"],
  ["jurusan1", "Pilihan 1"], ["jurusan2", "Pilihan 2"], ["jurusan3", "Pilihan 3"],
  ["peringkat_5", "Peringkat"], ["rata_rata", "Rata-rata"],
  ["foto_siswa", "URL Foto 3x4"], ["created_at", "Waktu Pengiriman Data"],
];

async function exportExcel() {
  if (!dataTerfilter.length) { toast("Belum ada data untuk diekspor.", "warn"); return; }
  if (typeof XLSX === "undefined") { toast("Library Excel belum termuat. Periksa koneksi internet.", "error"); return; }
  const btn = $("#btnExport");
  btn.disabled = true;
  btn.textContent = "⏳ Membuat Excel…";
  try {
    const baris = dataTerfilter.map((d) => {
      const o = {};
      KOLOM_EXCEL.forEach(([k, label]) => {
        let v = d[k];
        if (k === "punya_kip") v = v ? "Ya" : "Tidak";
        o[label] = v ?? "";
      });
      return o;
    });

    const ws1 = XLSX.utils.json_to_sheet(baris);
    ws1["!cols"] = KOLOM_EXCEL.map(([, label]) => ({ wch: Math.min(Math.max(label.length + 4, 12), 30) }));

    const ids = dataTerfilter.map((d) => d.id);
    const { data: nilai } = await supabase
      .from("nilai_rapor").select("pendaftar_id,mapel,semester,nilai").in("pendaftar_id", ids);
    const peta = new Map(dataTerfilter.map((d) => [d.id, d]));
    const pivot = new Map();
    (nilai || []).forEach((n) => {
      const kunci = n.pendaftar_id + "|" + n.mapel;
      if (!pivot.has(kunci)) {
        const s = peta.get(n.pendaftar_id) || {};
        pivot.set(kunci, { NISN: s.nisn || "", Nama: s.nama || "", Tahun: s.tahun_pelajaran || "", Mapel: n.mapel });
      }
      pivot.get(kunci)["Smt " + n.semester] = Number(n.nilai);
    });
    const ws2 = XLSX.utils.json_to_sheet(Array.from(pivot.values()));
    ws2["!cols"] = [{ wch: 16 }, { wch: 24 }, { wch: 13 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Calon Siswa");
    XLSX.utils.book_append_sheet(wb, ws2, "Nilai Rapor");
    const label = ($("#filterTahun").value || "semua-tahun").replace("/", "-");
    XLSX.writeFile(wb, `SPMB_${label}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast(`Excel berhasil diunduh (${baris.length} calon siswa).`);
  } catch (e) {
    toast("Gagal membuat Excel: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "⬇ Excel";
  }
}

/* ---------------------------- Tahun pelajaran --------------------------- */
async function muatTahun() {
  try {
    const { data } = await supabase
      .from("pengaturan")
      .select("key, value")
      .in("key", ["tahun_pelajaran_aktif", "mode_tahun_aktif"]);
    const peta = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
    modeTahun = peta.mode_tahun_aktif === "manual" ? "manual" : "auto";
    tahunAktif = modeTahun === "manual" && peta.tahun_pelajaran_aktif
      ? peta.tahun_pelajaran_aktif
      : tahunPelajaran();
  } catch (e) {
    modeTahun = "auto";
    tahunAktif = tahunPelajaran();
  }
  perbaruiSubtitle();
  kumpulkanTahun();
  updateDashboard();
}

function perbaruiSubtitle() {
  const keterangan = modeTahun === "auto" ? "otomatis" : "manual";
  $("#pageSubtitle").textContent = `${emailAdmin} · Tahun Pelajaran ${tahunAktif} (${keterangan})`;
}

async function simpanTahunAktif() {
  const pilihan = $("#tahunAktifSelect").value;
  const otomatis = pilihan === "__auto__";
  const tahun = otomatis ? tahunPelajaran() : pilihan.trim();
  if (!/^\d{4}\/\d{4}$/.test(tahun)) {
    toast("Format tahun pelajaran harus seperti 2027/2028.", "error");
    return;
  }
  const { error } = await supabase.from("pengaturan").upsert([
    { key: "tahun_pelajaran_aktif", value: tahun, updated_at: new Date().toISOString() },
    { key: "mode_tahun_aktif", value: otomatis ? "auto" : "manual", updated_at: new Date().toISOString() },
  ], { onConflict: "key" });
  if (error) { toast("Gagal menyimpan tahun: " + error.message, "error"); return; }
  modeTahun = otomatis ? "auto" : "manual";
  tahunAktif = tahun;
  $("#filterTahun").value = tahun;
  perbaruiSubtitle();
  kumpulkanTahun();
  updateDashboard();
  terapkanFilter();
  toast(otomatis
    ? `Tahun pelajaran otomatis: ${tahun}. Berganti sendiri setiap tahun.`
    : `Tahun pelajaran aktif sekarang ${tahun}. Formulir ikut berubah.`);
}

/* --------------------------- Konten beranda ---------------------------- */
function gantiMenu(id, judul) {
  ["navDashboard", "navPendaftar", "navLanding", "navPassword"].forEach((n) =>
    $("#" + n).classList.toggle("active", n === id));
  $("#pageTitle").textContent = judul;
  perbaruiSubtitle();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function muatLanding() {
  $("#lpSimpanStatus").textContent = "Memuat…";
  try {
    const { data } = await supabase.from("landing").select("*").eq("id", 1).maybeSingle();
    if (data) {
      $("#lp_edit_judul").value = data.judul || "";
      $("#lp_edit_tagline").value = data.tagline || "";
      $("#lp_edit_sambutan").value = data.sambutan || "";
      $("#lp_edit_tahun").value = tahunAktif;
      $("#lp_edit_waktu").value = data.waktu_pendaftaran || "";
      $("#lp_edit_status").value = data.status_pendaftaran || "dibuka";
      $("#lp_edit_mulai").value = data.tanggal_mulai || "";
      $("#lp_edit_selesai").value = data.tanggal_selesai || "";
    }
    $("#lpSimpanStatus").textContent = data ? "Konten terakhir diperbarui: " + tgl(data.updated_at) : "Belum ada data.";
  } catch (e) {
    $("#lpSimpanStatus").textContent = "Gagal memuat: " + e.message;
  }
}

async function simpanLanding() {
  const btn = $("#btnSimpanLanding");
  btn.disabled = true;
  btn.textContent = "Menyimpan…";
  const payload = {
    id: 1,
    judul: $("#lp_edit_judul").value.trim() || "Selamat Datang",
    tagline: $("#lp_edit_tagline").value.trim() || "-",
    sambutan: $("#lp_edit_sambutan").value.trim() || "-",
    tahun_pelajaran: $("#lp_edit_tahun").value.trim() || tahunAktif,
    waktu_pendaftaran: $("#lp_edit_waktu").value.trim() || "-",
    status_pendaftaran: $("#lp_edit_status").value || "dibuka",
    tanggal_mulai: $("#lp_edit_mulai").value || null,
    tanggal_selesai: $("#lp_edit_selesai").value || null,
    updated_at: new Date().toISOString(),
  };
  try {
    const { error } = await supabase.from("landing").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    $("#lpSimpanStatus").textContent = "✓ Tersimpan: " + tgl(new Date());
    toast("Konten beranda berhasil disimpan.");
  } catch (e) {
    $("#lpSimpanStatus").textContent = "Gagal: " + e.message;
    toast("Gagal menyimpan: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Simpan Konten Beranda";
  }
}

/* ---------------------------- Ganti password --------------------------- */
async function gantiPassword() {
  const lama = $("#passLama").value;
  const baru = $("#passBaru").value;
  const ulang = $("#passUlang").value;
  const pesan = $("#passPesan");

  if (!lama || !baru || !ulang) {
    pesan.style.color = "var(--danger)";
    pesan.textContent = "Lengkapi semua kolom.";
    return;
  }
  if (baru.length < 6) {
    pesan.style.color = "var(--danger)";
    pesan.textContent = "Password baru minimal 6 karakter.";
    return;
  }
  if (baru !== ulang) {
    pesan.style.color = "var(--danger)";
    pesan.textContent = "Konfirmasi password baru tidak cocok.";
    return;
  }

  const btn = $("#btnGantiPassword");
  btn.disabled = true;
  btn.textContent = "Menyimpan…";
  pesan.style.color = "var(--muted)";
  pesan.textContent = "Memverifikasi password lama…";
  try {
    const cek = await supabase.auth.signInWithPassword({ email: emailAdmin, password: lama });
    if (cek.error) throw new Error("Password lama tidak benar.");

    pesan.textContent = "Menyimpan password baru…";
    const { error } = await supabase.auth.updateUser({ password: baru });
    if (error) throw error;

    ["passLama", "passBaru", "passUlang"].forEach((id) => { $("#" + id).value = ""; });
    pesan.style.color = "var(--primary)";
    pesan.textContent = "✓ Password berhasil diubah. Gunakan password baru untuk login berikutnya.";
    toast("Password admin berhasil diubah.");
  } catch (e) {
    pesan.style.color = "var(--danger)";
    pesan.textContent = "Gagal: " + e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "🔑 Simpan Password Baru";
  }
}

/* ------------------------------- Events -------------------------------- */
function bindEvents() {
  $("#cari").addEventListener("input", terapkanFilter);
  $("#filterTahun").addEventListener("change", terapkanFilter);
  $("#statTahun").addEventListener("change", updateDashboard);
  $("#btnSimpanTahun").addEventListener("click", simpanTahunAktif);
  $("#btnMore").addEventListener("click", () => muatData(false));
  $("#btnExport").addEventListener("click", exportExcel);
  $("#btnExportCsv").addEventListener("click", exportCSV);

  $("#editClose").addEventListener("click", tutupEdit);
  $("#editBatal").addEventListener("click", tutupEdit);
  $("#overlayEdit").addEventListener("click", (e) => { if (e.target.id === "overlayEdit") tutupEdit(); });
  $("#editSimpan").addEventListener("click", simpanEdit);

  $("#navDashboard").addEventListener("click", () => {
    gantiMenu("navDashboard", "Dashboard");
    $("#dashboardSection").classList.remove("hidden");
    $("#dataSection").classList.add("hidden");
    $("#landingSection").classList.add("hidden");
    $("#passwordSection").classList.add("hidden");
  });
  $("#navPendaftar").addEventListener("click", () => {
    gantiMenu("navPendaftar", "Data Calon Siswa");
    $("#dashboardSection").classList.add("hidden");
    $("#dataSection").classList.remove("hidden");
    $("#landingSection").classList.add("hidden");
    $("#passwordSection").classList.add("hidden");
    $("#dataSection").scrollIntoView({ behavior: "smooth" });
  });
  $("#navLanding").addEventListener("click", () => {
    gantiMenu("navLanding", "Konten Beranda");
    $("#dashboardSection").classList.add("hidden");
    $("#dataSection").classList.add("hidden");
    $("#landingSection").classList.remove("hidden");
    $("#passwordSection").classList.add("hidden");
    muatLanding();
  });
  $("#navPassword").addEventListener("click", () => {
    gantiMenu("navPassword", "Ganti Password");
    $("#dashboardSection").classList.add("hidden");
    $("#dataSection").classList.add("hidden");
    $("#landingSection").classList.add("hidden");
    $("#passwordSection").classList.remove("hidden");
    $("#passPesan").textContent = `Akun: ${emailAdmin}`;
    ["passLama", "passBaru", "passUlang"].forEach((id) => { $("#" + id).value = ""; });
  });
  $("#btnSimpanLanding").addEventListener("click", simpanLanding);
  $("#btnGantiPassword").addEventListener("click", gantiPassword);
}

bindEvents();
initAuth();
