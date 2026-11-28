import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG, MAPEL, SEMESTER } from "./config.js?v=20";
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
  // Login tunggal: halaman login ada di root (../admin.html)
  const { data } = await supabase.auth.getSession();
  if (!data.session) { window.location.href = "../admin.html"; return; }
  // SPMB dashboard hanya untuk admin
  try {
    const { data: r } = await supabase.from("web_roles").select("role").eq("user_id", data.session.user.id).maybeSingle();
    if (r && r.role !== "admin") { window.location.href = "../admin-web.html"; return; }
  } catch (e) { /* fallback: izinkan jika tabel belum ada */ }
  tampilkanAdmin(data.session.user);
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) tampilkanAdmin(session.user);
    else window.location.href = "../admin.html";
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
  ["navDashboard", "navPendaftar", "navHasil", "navPengumuman", "navLanding", "navPassword"].forEach((n) =>
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

/* ---------------------------- Info portal dinas ------------------------ */
let draftJadwal = [];

function parseJadwal(md) {
  const lines = md.split("\n").map((s) => s.trim()).filter(Boolean);
  const grup = [];
  const namaJalur = /^(Afirmasi\/Disabilitas|Mutasi|Domisili|Prestasi|SMK)$/;
  const namaTahap = /^(Pembuatan akun dan Pendaftaran|Masa Sanggah|Pengumuman|Daftar Ulang)$/;
  let aktif = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].replace(/^#+\s*/, "");
    if (namaJalur.test(l)) {
      aktif = { jalur: l, items: [] };
      grup.push(aktif);
      const c = lines.slice(i + 1, i + 5);
      if (c.length === 4) aktif.items.push({ tahap: c[0], tanggal: c[1], status: c[2], jam: c[3] });
      i += 4;
    } else if (aktif && namaTahap.test(l)) {
      const c = lines.slice(i, i + 4);
      if (c.length === 4) {
        aktif.items.push({ tahap: c[0], tanggal: c[1], status: c[2], jam: c[3] });
        i += 3;
      }
    }
  }
  return grup.filter((g) => g.items.length);
}

function isiDraftDinas(d) {
  const data = d || {};
  draftJadwal = Array.isArray(data.jadwal_data) ? data.jadwal_data : [];
  $("#dinas_pengumuman").value = (data.pengumuman || []).join("\n");
  $("#dinas_jadwal").value = data.jadwal_url || "";
  $("#dinas_surat").value = data.surat_url || "";
  $("#dinas_video").value = data.video_smk_url || "";
  $("#dinas_minat_nama").value = data.minat_nama_sekolah || "";
  $("#dinas_minat_persen").value = data.minat_persen || "";
  $("#dinas_minat_pendaftar").value = data.minat_pendaftar ?? "";
  $("#dinas_minat_kuota").value = data.minat_kuota ?? "";
  $("#dinas_sumber_update").value = data.sumber_update || "";
  const info = $("#jadwalDraftInfo");
  if (info) {
    info.textContent = draftJadwal.length
      ? draftJadwal.map((g) => `${g.jalur}: ${g.items.length} tahap`).join(" · ")
      : "Belum ada jadwal tersimpan.";
  }
}

async function muatInfoDinas() {
  try {
    const { data } = await supabase.from("dinas_info").select("*").eq("id", 1).maybeSingle();
    isiDraftDinas(data);
    $("#tarikStatus").textContent = data?.published_at
      ? `Info ditayangkan: ${tgl(data.published_at)}` + (data.fetched_at ? ` · diambil: ${tgl(data.fetched_at)}` : "")
      : "Belum ada info dinas yang disimpan.";
  } catch (e) {
    $("#tarikStatus").textContent = "Gagal memuat info dinas: " + e.message;
  }
}

async function tarikInfoDinas() {
  const btn = $("#btnTarikDinas");
  const status = $("#tarikStatus");
  btn.disabled = true;
  btn.textContent = "⏳ Mengambil…";
  status.style.color = "var(--muted)";
  status.textContent = "Menghubungi portal dinas…";
  try {
    const baca = async (path) => {
      const target = CONFIG.PORTAL_DINAS.replace(/\/$/, "") + path;
      const res = await fetch(CONFIG.PROXY_BACA + target);
      if (!res.ok) throw new Error("Gagal membaca portal (HTTP " + res.status + ")");
      return await res.text();
    };
    const [md, jsonTeks, jadwalMd] = await Promise.all([
      baca("/"), baca("/home/sekolah-list"), baca("/jadwal"),
    ]);
    const jadwal = parseJadwal(jadwalMd);

    // Pengumuman penting (format markdown dari proxy)
    const pengumuman = md.split("\n")
      .filter((l) => /check_circle/i.test(l))
      .map((l) => l.replace(/^\s*[*]+\s*/, "").replace(/check_circle/gi, "").replace(/\*+/g, "").trim())
      .filter(Boolean)
      .slice(0, 10);

    // Dokumen SPTJM & video SMK
    const pdf = md.match(/https:\/\/spmb-dikbud\.kalbarprov\.go\.id\/docs\/[^)\s"]*PERNYATAAN[^)\s"]*\.pdf/i);
    const idx = md.indexOf("Video Panduan Pendaftaran SMK");
    const video = idx >= 0
      ? md.slice(idx, idx + 1000).match(/https:\/\/drive\.google\.com\/file\/d\/[^)\s"]+\/view[^)\s"]*/)
      : null;
    const upd = md.match(/Terakhir diperbarui:\s*([^\n]+)/);

    // Angka minat sekolah dari endpoint JSON portal
    let minat = {};
    try {
      const awal = jsonTeks.indexOf("{");
      const akhir = jsonTeks.lastIndexOf("}");
      const json = JSON.parse(jsonTeks.slice(awal, akhir + 1));
      const nama = "SMKN 1 TELUK KERAMAT";
      const rows = json.data || [];
      const baris = rows.find((d) => String(d.sekolah_nama).toUpperCase() === nama)
        || rows.find((d) => String(d.sekolah_nama).toUpperCase().indexOf(nama) !== -1);
      if (baris) {
        minat = {
          minat_nama_sekolah: baris.sekolah_nama,
          minat_pendaftar: Number(baris.total_pendaftar) || 0,
          minat_kuota: Number(baris.total_kuota) || 0,
          minat_persen: String(baris.persen || ""),
        };
      }
    } catch (e) {
      minat = { error_minat: e.message };
    }

    const d = {
      pengumuman,
      jadwal_url: CONFIG.PORTAL_DINAS + "jadwal",
      surat_url: pdf ? pdf[0] : "",
      video_smk_url: video ? video[0] : "",
      sumber_update: upd ? "Terakhir diperbarui: " + upd[1].trim() : "",
      fetched_at: new Date().toISOString(),
      jadwal_data: jadwal,
      ...minat,
    };
    isiDraftDinas(d);

    const masalah = [];
    if (!pengumuman.length) masalah.push("pengumuman");
    if (!d.surat_url) masalah.push("PDF SPTJM");
    if (!d.video_smk_url) masalah.push("video SMK");
    if (!d.minat_persen) masalah.push("data minat");
    if (!jadwal.length) masalah.push("jadwal");
    status.style.color = masalah.length ? "var(--warn)" : "var(--primary)";
    status.textContent = masalah.length
      ? `Sebagian data tidak terbaca (${masalah.join(", ")}). Periksa & edit draft sebelum menyimpan.`
      : `Berhasil diambil ${new Date(d.fetched_at).toLocaleString("id-ID")}. Periksa draft lalu klik Simpan Info Dinas.`;
    toast("Info dinas berhasil diambil. Tinjau dulu sebelum disimpan.");
  } catch (e) {
    status.style.color = "var(--danger)";
    status.textContent = "Gagal: " + e.message;
    toast("Gagal mengambil info dinas: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "🔄 Tarik Info dari Portal Dinas";
  }
}

async function simpanInfoDinas() {
  const btn = $("#btnSimpanDinas");
  btn.disabled = true;
  btn.textContent = "Menyimpan…";
  const payload = {
    id: 1,
    pengumuman: $("#dinas_pengumuman").value.split("\n").map((s) => s.trim()).filter(Boolean),
    jadwal_url: $("#dinas_jadwal").value.trim() || null,
    surat_url: $("#dinas_surat").value.trim() || null,
    video_smk_url: $("#dinas_video").value.trim() || null,
    minat_nama_sekolah: $("#dinas_minat_nama").value.trim() || null,
    minat_persen: $("#dinas_minat_persen").value.trim() || null,
    minat_pendaftar: $("#dinas_minat_pendaftar").value ? Number($("#dinas_minat_pendaftar").value) : null,
    minat_kuota: $("#dinas_minat_kuota").value ? Number($("#dinas_minat_kuota").value) : null,
    jadwal_data: draftJadwal,
    sumber_update: $("#dinas_sumber_update").value.trim() || null,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  try {
    const { error } = await supabase.from("dinas_info").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    $("#tarikStatus").style.color = "var(--primary)";
    $("#tarikStatus").textContent = "✓ Info dinas tersimpan & tampil di beranda: " + tgl(new Date());
    toast("Info portal dinas berhasil disimpan.");
  } catch (e) {
    $("#tarikStatus").style.color = "var(--danger)";
    $("#tarikStatus").textContent = "Gagal menyimpan: " + e.message;
    toast("Gagal menyimpan info dinas: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Simpan Info Dinas";
  }
}

/* -------------------------- Data siswa diterima ------------------------ */
let dataHasil = [];
let jurusanHasilAktif = "Semua";
let draftHasil = [];
let nonaktifId = null;
let mutasiId = null;
let hasilTahunAktif = null;
let petaPendaftar = {};

function normalisasiJurusan(nama) {
  const alias = {
    "Agribisnis Tanaman": "Agribisnis Tanaman Pangan dan Hortikultura",
    "Teknik Komputer": "Teknik Komputer dan Jaringan",
  };
  const bersih = String(nama || "").replace(/\s+/g, " ").trim();
  if (alias[bersih]) return alias[bersih];
  const cocok = CONFIG.JURUSAN.find((j) => j.toLowerCase() === bersih.toLowerCase())
    || CONFIG.JURUSAN.find((j) => bersih.toLowerCase().includes(j.toLowerCase()))
    || CONFIG.JURUSAN.find((j) => j.toLowerCase().includes(bersih.toLowerCase()));
  return cocok || bersih;
}

function properNama(nilai) {
  return String(nilai || "")
    .toLowerCase()
    .replace(/(^|[\s'’-])([a-z])/g, (_, depan, huruf) => depan + huruf.toUpperCase())
    .replace(/\s+/g, " ")
    .trim();
}

function normalisasiNisn(nilai) {
  const teks = String(nilai ?? "").trim();
  // NISN harus hanya angka dan (setelah ditambah 0 di depan) tepat 10 digit
  if (!/^\d+$/.test(teks)) return null;
  const nisn = teks.padStart(10, "0");
  return nisn.length === 10 ? nisn : null;
}

function bersihkanNikKk(nilai) {
  const angka = String(nilai || "").replace(/\D/g, "");
  if (angka.length !== 16 || /0{4}$/.test(angka)) return { value: null, flag: true };
  return { value: angka, flag: false };
}

function angkaDesimal(nilai) {
  const n = parseFloat(String(nilai || "").replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

async function muatHasil() {
  try {
    const { data: semuaTahun, error: errTahun } = await supabase
      .from("dinas_hasil").select("tahun_pelajaran");
    if (errTahun) throw errTahun;
    const daftar = Array.from(new Set([
      tahunAktif,
      ...(semuaTahun || []).map((d) => d.tahun_pelajaran).filter(Boolean),
    ])).sort().reverse();
    const pilih = $("#hasilTahun");
    const sebelumnya = hasilTahunAktif || tahunAktif;
    pilih.innerHTML = daftar.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
    hasilTahunAktif = daftar.includes(sebelumnya) ? sebelumnya : daftar[0];
    pilih.value = hasilTahunAktif;

    const { data, error } = await supabase
      .from("dinas_hasil")
      .select("*")
      .eq("tahun_pelajaran", hasilTahunAktif)
      .order("jurusan_diterima", { ascending: true })
      .order("urutan", { ascending: true });
    if (error) throw error;
    dataHasil = data || [];
  } catch (e) {
    dataHasil = [];
    toast("Gagal memuat data hasil: " + e.message, "error");
  }
  renderHasil();
}

function renderHasil() {
  const tabs = $("#hasilTabs");
  const body = $("#hasilBody");
  if (!tabs || !body) return;

  const daftarJurusan = ["Semua", ...CONFIG.JURUSAN.slice().sort((a, b) => a.localeCompare(b, "id")), "Nonaktif"];
  tabs.innerHTML = daftarJurusan.map((j) =>
    `<button type="button" class="jadwal-tab ${j === jurusanHasilAktif ? "aktif" : ""}" data-jurusan="${escapeHtml(j)}">${escapeHtml(j)}</button>`
  ).join("");
  tabs.querySelectorAll(".jadwal-tab").forEach((b) =>
    b.addEventListener("click", () => {
      jurusanHasilAktif = b.dataset.jurusan;
      renderHasil();
    }));

  const baris = dataHasil.filter((d) => {
    if (jurusanHasilAktif === "Nonaktif") return d.status === "nonaktif";
    return d.status !== "nonaktif"
      && (jurusanHasilAktif === "Semua" || d.jurusan_diterima === jurusanHasilAktif);
  });

  if (!baris.length) {
    body.innerHTML = `<tr><td colspan="11" style="padding:30px;color:var(--muted)">Belum ada data pada jurusan ini.</td></tr>`;
  } else {
    body.innerHTML = baris.map((d) => `
      <tr>
        <td>${d.urutan ?? "-"}</td>
        <td style="font-size:11px">${escapeHtml(d.no_pendaftaran_dinas || "-")}</td>
        <td class="teks-kiri"><b>${escapeHtml(d.nama)}</b>
          ${d.catatan_verifikasi ? `<br><span class="hint" style="color:var(--warn)">⚠ ${escapeHtml(d.catatan_verifikasi)}</span>` : ""}
          ${d.catatan_mutasi ? `<br><span class="hint" style="color:var(--info)">↔ ${escapeHtml(d.catatan_mutasi)}</span>` : ""}
        </td>
        <td>${escapeHtml(d.nisn || "-")}</td>
        <td>${escapeHtml(d.jurusan_diterima)}</td>
        <td>${d.total_nilai ?? "-"}</td>
        <td>${d.bobot_nilai ?? "-"}</td>
        <td>${d.bobot_tka ?? "-"}</td>
        <td>${d.bobot_prestasi ?? "-"}</td>
        <td>
          ${d.status === "nonaktif"
            ? `<span class="badge ditolak">Nonaktif</span>${d.alasan_nonaktif ? `<br><span class="hint">${escapeHtml(d.alasan_nonaktif)}</span>` : ""}`
            : `<span class="badge ${d.sumber === "manual_form" ? "diterima" : "menunggu"}">${d.sumber === "manual_form" ? "Formulir" : "Dinas"}</span>`}
        </td>
        <td><div class="row-actions">
          ${d.status === "nonaktif"
            ? `<button class="btn btn-sm btn-info" data-aktifkan-hasil="${d.id}">Aktifkan</button>`
            : `<button class="btn btn-sm btn-info" data-mutasi-hasil="${d.id}">Mutasi</button>
               <button class="btn btn-sm btn-ghost" data-nonaktif-hasil="${d.id}">Nonaktifkan</button>`}
          <button class="btn btn-sm btn-danger" data-hapus-hasil="${d.id}">Hapus</button>
        </div></td>
      </tr>`).join("");
    body.querySelectorAll("[data-hapus-hasil]").forEach((b) =>
      b.addEventListener("click", () => hapusHasil(b.dataset.hapusHasil)));
    body.querySelectorAll("[data-nonaktif-hasil]").forEach((b) =>
      b.addEventListener("click", () => bukaNonaktif(b.dataset.nonaktifHasil)));
    body.querySelectorAll("[data-aktifkan-hasil]").forEach((b) =>
      b.addEventListener("click", () => aktifkanHasil(b.dataset.aktifkanHasil)));
    body.querySelectorAll("[data-mutasi-hasil]").forEach((b) =>
      b.addEventListener("click", () => bukaMutasi(b.dataset.mutasiHasil)));
  }
  $("#infoHasil").textContent = `${baris.length} siswa · ${jurusanHasilAktif} · Tahun ${hasilTahunAktif || tahunAktif}`;
}

function bukaMutasi(id) {
  const d = dataHasil.find((x) => x.id === id);
  if (!d) return;
  mutasiId = id;
  $("#mutasiJurusanBaru").innerHTML = CONFIG.JURUSAN.map((j) =>
    `<option value="${escapeHtml(j)}" ${j === d.jurusan_diterima ? "selected" : ""}>${escapeHtml(j)}</option>`).join("");
  $("#mutasiAlasan").value = "Mutasi";
  $("#mutasiCatatan").value = "";
  $("#overlayMutasi").classList.add("show");
  document.body.classList.add("lock-scroll");
}

async function simpanMutasi() {
  if (!mutasiId) return;
  const d = dataHasil.find((x) => x.id === mutasiId);
  if (!d) return;
  const baru = $("#mutasiJurusanBaru").value;
  const alasan = $("#mutasiAlasan").value;
  const catatan = $("#mutasiCatatan").value.trim();
  const riwayat = `${d.jurusan_diterima} → ${baru} (${alasan})` + (catatan ? ` — ${catatan}` : "");
  const { error } = await supabase.from("dinas_hasil").update({
    jurusan_diterima: baru,
    catatan_mutasi: riwayat,
    updated_at: new Date().toISOString(),
  }).eq("id", mutasiId);
  if (error) { toast("Gagal memindahkan jurusan: " + error.message, "error"); return; }
  $("#overlayMutasi").classList.remove("show");
  document.body.classList.remove("lock-scroll");
  mutasiId = null;
  toast("Jurusan siswa diperbarui.");
  muatHasil();
}

function bukaNonaktif(id) {
  nonaktifId = id;
  $("#alasanNonaktif").value = "Mengundurkan diri";
  $("#catatanNonaktif").value = "";
  $("#overlayNonaktif").classList.add("show");
  document.body.classList.add("lock-scroll");
}

async function simpanNonaktif() {
  if (!nonaktifId) return;
  const alasan = $("#alasanNonaktif").value;
  const catatan = $("#catatanNonaktif").value.trim();
  const { error } = await supabase.from("dinas_hasil").update({
    status: "nonaktif",
    alasan_nonaktif: catatan ? `${alasan} — ${catatan}` : alasan,
    updated_at: new Date().toISOString(),
  }).eq("id", nonaktifId);
  if (error) { toast("Gagal menonaktifkan: " + error.message, "error"); return; }
  $("#overlayNonaktif").classList.remove("show");
  document.body.classList.remove("lock-scroll");
  nonaktifId = null;
  toast("Siswa dinonaktifkan. Data tetap tersimpan.");
  muatHasil();
}

async function aktifkanHasil(id) {
  const { error } = await supabase.from("dinas_hasil").update({
    status: "diterima",
    alasan_nonaktif: null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) { toast("Gagal mengaktifkan: " + error.message, "error"); return; }
  toast("Siswa diaktifkan kembali.");
  muatHasil();
}

async function hapusHasil(id) {
  if (!confirm("Yakin hapus data siswa diterima ini?")) return;
  const { error } = await supabase.from("dinas_hasil").delete().eq("id", id);
  if (error) toast("Gagal menghapus: " + error.message, "error");
  else { toast("Data dihapus."); muatHasil(); }
}

function parseHasilDinas(teks, namaFile) {
  const hasil = [];
  const ekstensi = String(namaFile || "").toLowerCase();

  if (ekstensi.endsWith(".xlsx") && typeof XLSX !== "undefined" && !teks.trim().startsWith("<")) {
    toast("File .xlsx perlu dibaca sebagai biner — gunakan ekspor HTML dari portal dinas.", "warn");
    return hasil;
  }

  const doc = new DOMParser().parseFromString(teks, "text/html");
  doc.querySelectorAll(".card").forEach((card) => {
    const judul = card.querySelector(".card-title h4")?.textContent?.trim() || "";
    if (!/jurusan/i.test(judul)) return;
    const jurusan = normalisasiJurusan(judul.replace(/^jurusan\s*/i, ""));
    const jalur = card.querySelector("h5")?.textContent?.trim() || "Reguler SMK";
    const header = Array.from(card.querySelectorAll("thead th")).map((t) => t.textContent.trim());
    card.querySelectorAll("tbody tr").forEach((tr) => {
      const sel = Array.from(tr.querySelectorAll("td")).map((c) => c.textContent.trim());
      if (!sel.length) return;
      const r = {};
      header.forEach((h, i) => { r[h] = sel[i] || ""; });
      const nik = bersihkanNikKk(r["NIK"]);
      const kk = bersihkanNikKk(r["KK"]);
      const catatan = [];
      if (nik.flag) catatan.push("NIK perlu verifikasi");
      if (kk.flag) catatan.push("KK perlu verifikasi");
      const nisn = normalisasiNisn(r["NISN"]);
      if (!nisn) catatan.push("NISN tidak valid (harus 10 angka)");
      hasil.push({
        tahun_pelajaran: hasilTahunAktif || tahunAktif,
        no_pendaftaran_dinas: r["Nomor Pendaftaran"] || null,
        nama: properNama(r["Nama Siswa"]),
        nisn: nisn || null,
        nik: nik.value,
        kk: kk.value,
        jurusan_diterima: jurusan,
        jalur,
        status: "diterima",
        urutan: angkaDesimal(r["Urut"]),
        pilihan: angkaDesimal(r["Pilihan"]),
        total_nilai: angkaDesimal(r["Total Nilai"]),
        bobot_nilai: angkaDesimal(r["Bobot Nilai"]),
        bobot_tka: angkaDesimal(r["Bobot TKA"]),
        bobot_prestasi: angkaDesimal(r["Bobot Prestasi"]),
        keterangan: r["Keterangan"] || null,
        catatan_verifikasi: catatan.length ? catatan.join("; ") : null,
        sumber: "import",
      });
    });
  });
  return hasil;
}

function tampilkanPreviewHasil() {
  const box = $("#importHasilPreview");
  if (!box) return;
  box.classList.remove("hidden");
  const ada = new Set(semuaData.map((d) => String(d.nisn || "")));
  const cocok = draftHasil.filter((d) => d.nisn && ada.has(d.nisn)).length;
  const baru = draftHasil.filter((d) => d.nisn && !ada.has(d.nisn)).length;
  const flag = draftHasil.filter((d) => d.catatan_verifikasi).length;
  const nisnInvalid = draftHasil.filter((d) => !d.nisn).length;
  box.innerHTML = `
    <b>${draftHasil.length} baris terbaca dari file dinas.</b><br>
    ✅ ${cocok} NISN cocok dengan data formulir · 🆕 ${baru} siswa baru · ⚠️ ${flag} perlu verifikasi<br>
    ${nisnInvalid ? `<span style="color:var(--danger);font-weight:700">⛔ ${nisnInvalid} NISN tidak valid (bukan 10 digit angka) — tetap disimpan dengan catatan, NISN dikosongkan.</span><br>` : ""}
    <span class="hint">NIK/KK yang terpotong dikosongkan, tidak menimpa data formulir.</span>
    <div style="display:flex;gap:8px;margin-top:12px">
      <button class="btn btn-primary btn-sm" id="konfirmasiImportHasil">💾 Simpan ke Data Diterima</button>
      <button class="btn btn-ghost btn-sm" id="batalImportHasil">Batal</button>
    </div>`;
  $("#konfirmasiImportHasil").addEventListener("click", konfirmasiImportHasil);
  $("#batalImportHasil").addEventListener("click", () => {
    draftHasil = [];
    box.classList.add("hidden");
  });
}

async function konfirmasiImportHasil() {
  if (!draftHasil.length) return;
  const btn = $("#konfirmasiImportHasil");
  btn.disabled = true;
  btn.textContent = "Menyimpan…";
  try {
    const jumlah = draftHasil.length;
    let tersimpan = 0;
    for (const baris of draftHasil) {
      let ada = null;
      if (baris.nisn) {
        const { data: hasilCari, error: errCari } = await supabase
          .from("dinas_hasil")
          .select("id")
          .eq("tahun_pelajaran", baris.tahun_pelajaran)
          .eq("nisn", baris.nisn)
          .maybeSingle();
        if (errCari) throw errCari;
        ada = hasilCari;
      }
      const isi = { ...baris };
      delete isi.id;
      const errSimpan = ada
        ? (await supabase.from("dinas_hasil").update(isi).eq("id", ada.id)).error
        : (await supabase.from("dinas_hasil").insert(isi)).error;
      if (errSimpan) throw errSimpan;
      tersimpan++;
    }
    draftHasil = [];
    $("#importHasilPreview").classList.add("hidden");
    toast(`${tersimpan} dari ${jumlah} hasil berhasil disimpan.`);
    muatHasil();
  } catch (e) {
    toast("Gagal menyimpan hasil: " + e.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Simpan ke Data Diterima";
  }
}

function bukaTambahHasil() {
  const tersedia = semuaData.filter((d) => !dataHasil.some((h) => h.pendaftar_id === d.id || (d.nisn && h.nisn === d.nisn)));
  petaPendaftar = {};
  const daftar = tersedia.map((d) => {
    const label = `${properNama(d.nama)} — ${d.nisn || "-"} (${d.tahun_pelajaran || "-"})`;
    petaPendaftar[label] = d.id;
    return label;
  });
  $("#dl-pendaftar").innerHTML = daftar.map((x) => `<option value="${escapeHtml(x)}"></option>`).join("");
  $("#cariPendaftar").value = "";
  $("#tambahJurusan").innerHTML = CONFIG.JURUSAN.map((j) => `<option value="${escapeHtml(j)}">${escapeHtml(j)}</option>`).join("");
  $("#tambahCatatan").value = "";
  $("#overlayTambahHasil").classList.add("show");
  document.body.classList.add("lock-scroll");
}

async function simpanTambahHasil() {
  const ketikan = $("#cariPendaftar").value.trim();
  let id = petaPendaftar[ketikan];
  if (!id) {
    const nisn = (ketikan.match(/\b\d{10}\b/) || [])[0];
    const dCari = semuaData.find((x) => (nisn && x.nisn === nisn)
      || (ketikan.length > 2 && String(x.nama).toLowerCase().includes(ketikan.toLowerCase())));
    id = dCari?.id;
  }
  const d = semuaData.find((x) => x.id === id);
  if (!d) { toast("Calon siswa tidak ditemukan. Ketik nama/NISN yang tersedia.", "warn"); return; }
  const { error } = await supabase.from("dinas_hasil").insert({
    tahun_pelajaran: d.tahun_pelajaran || tahunAktif,
    no_pendaftaran_dinas: d.kode_pendaftaran || null,
    nama: properNama(d.nama),
    nisn: d.nisn || null,
    nik: d.nik || null,
    kk: d.kk || null,
    jurusan_diterima: $("#tambahJurusan").value,
    jalur: "Reguler SMK",
    status: $("#tambahStatus").value,
    catatan_verifikasi: $("#tambahCatatan").value.trim() || null,
    sumber: "manual_form",
    pendaftar_id: d.id,
  });
  if (error) { toast("Gagal menambah: " + error.message, "error"); return; }
  $("#overlayTambahHasil").classList.remove("show");
  document.body.classList.remove("lock-scroll");
  toast("Siswa ditambahkan ke data diterima.");
  muatHasil();
}

function exportHasil(semua) {
  // Siswa nonaktif tidak pernah diekspor
  const semuaBaris = dataHasil
    .filter((d) => d.status !== "nonaktif")
    .slice()
    .sort((a, b) => String(a.jurusan_diterima).localeCompare(String(b.jurusan_diterima), "id")
      || (Number(a.urutan) || 0) - (Number(b.urutan) || 0));
  const baris = semua ? semuaBaris : semuaBaris.filter((d) => d.jurusan_diterima === jurusanHasilAktif);
  if (!baris.length) { toast("Tidak ada data untuk diekspor.", "warn"); return; }
  const kolom = [
    ["urutan", "Urut"], ["no_pendaftaran_dinas", "No. Pendaftaran Dinas"], ["nama", "Nama"],
    ["nisn", "NISN"], ["jurusan_diterima", "Jurusan Diterima"], ["jalur", "Jalur"],
    ["status", "Status"], ["total_nilai", "Total Nilai"], ["bobot_nilai", "Bobot Nilai"],
    ["bobot_tka", "Bobot TKA"], ["bobot_prestasi", "Bobot Prestasi"],
    ["sumber", "Sumber"], ["catatan_verifikasi", "Catatan Verifikasi"],
    ["alasan_nonaktif", "Alasan Nonaktif"], ["catatan_mutasi", "Catatan Mutasi"],
  ];
  const ws = XLSX.utils.json_to_sheet(baris.map((d) => {
    const o = {};
    kolom.forEach(([k, l]) => { o[l] = d[k] ?? ""; });
    return o;
  }));
  ws["!cols"] = kolom.map(([, l]) => ({ wch: Math.min(Math.max(l.length + 4, 12), 30) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, semua ? "Semua Siswa" : jurusanHasilAktif.slice(0, 31));
  const label = semua ? "semua" : jurusanHasilAktif.replace(/[^\w-]+/g, "-").toLowerCase();
  XLSX.writeFile(wb, `siswa-diterima-${label}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast(`Excel berhasil diunduh (${baris.length} siswa).`);
}

/* -------------------------- Pengumuman kelulusan ----------------------- */
let dataPengumuman = [];
let pengumumanTahunAktif = null;

async function muatPengumuman() {
  try {
    const { data: semua, error: errTahun } = await supabase
      .from("dinas_hasil").select("tahun_pelajaran").eq("sumber", "import");
    if (errTahun) throw errTahun;
    const daftar = Array.from(new Set([
      tahunAktif, ...(semua || []).map((d) => d.tahun_pelajaran).filter(Boolean),
    ])).sort().reverse();
    const pilih = $("#pengumumanTahun");
    const sebelumnya = pengumumanTahunAktif || hasilTahunAktif || tahunAktif;
    pilih.innerHTML = daftar.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");
    pengumumanTahunAktif = daftar.includes(sebelumnya) ? sebelumnya : daftar[0];
    pilih.value = pengumumanTahunAktif;

    const { data, error } = await supabase
      .from("dinas_hasil")
      .select("*")
      .eq("sumber", "import")
      .eq("tahun_pelajaran", pengumumanTahunAktif)
      .neq("status", "nonaktif")
      .order("jurusan_diterima", { ascending: true })
      .order("urutan", { ascending: true });
    if (error) throw error;
    dataPengumuman = data || [];
  } catch (e) {
    dataPengumuman = [];
    toast("Gagal memuat pengumuman: " + e.message, "error");
  }
  renderPengumuman();
}

function renderPengumuman() {
  const tabs = $("#pengumumanTabs");
  const body = $("#pengumumanBody");
  if (!tabs || !body) return;
  const daftar = ["Semua", ...CONFIG.JURUSAN.slice().sort((a, b) => a.localeCompare(b, "id"))];
  tabs.innerHTML = daftar.map((j) =>
    `<button type="button" class="jadwal-tab ${j === jurusanHasilAktif ? "aktif" : ""}" data-jurusan="${escapeHtml(j)}">${escapeHtml(j)}</button>`).join("");
  tabs.querySelectorAll(".jadwal-tab").forEach((b) => b.addEventListener("click", () => {
    jurusanHasilAktif = b.dataset.jurusan;
    renderPengumuman();
  }));

  const baris = dataPengumuman.filter((d) =>
    jurusanHasilAktif === "Semua" || d.jurusan_diterima === jurusanHasilAktif);
  const published = dataPengumuman.filter((d) => d.is_published).length;
  $("#statusPengumuman").innerHTML = published
    ? `✅ <b>Sudah dipublikasikan:</b> ${published} siswa tampil di halaman pengumuman publik.`
    : "📝 <b>Masih draft.</b> Halaman pengumuman publik belum menampilkan data apa pun.";
  $("#statusPengumuman").style.background = published ? "var(--primary-50)" : "#fff7ed";
  $("#statusPengumuman").style.color = published ? "var(--primary)" : "#9a3412";
  $("#statusPengumuman").style.borderColor = published ? "#a7f3d0" : "#fed7aa";

  if (!baris.length) {
    body.innerHTML = `<tr><td colspan="10" style="padding:30px;color:var(--muted)">Belum ada data.</td></tr>`;
  } else {
    body.innerHTML = baris.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-size:11px">${escapeHtml(d.no_pendaftaran_dinas || "-")}</td>
        <td class="teks-kiri"><b>${escapeHtml(d.nama)}</b></td>
        <td>${escapeHtml(d.nisn || "-")}</td>
        <td>${escapeHtml(d.jurusan_diterima)}</td>
        <td>${d.total_nilai ?? "-"}</td>
        <td>${d.bobot_nilai ?? "-"}</td>
        <td>${d.bobot_tka ?? "-"}</td>
        <td>${d.bobot_prestasi ?? "-"}</td>
        <td>${d.is_published ? '<span class="badge diterima">Tampil</span>' : '<span class="badge menunggu">Draft</span>'}</td>
      </tr>`).join("");
  }
  $("#infoPengumuman").textContent = `${baris.length} siswa · ${jurusanHasilAktif} · ${pengumumanTahunAktif}`;
}

async function setPublishPengumuman(flag) {
  if (!dataPengumuman.length) { toast("Tidak ada data untuk dipublikasikan.", "warn"); return; }
  const teks = flag ? "publish" : "kembalikan ke draft";
  if (!confirm(`Yakin ingin ${teks} ${dataPengumuman.length} siswa?`)) return;
  const { error } = await supabase.from("dinas_hasil")
    .update({ is_published: flag, updated_at: new Date().toISOString() })
    .eq("sumber", "import")
    .eq("tahun_pelajaran", pengumumanTahunAktif)
    .neq("status", "nonaktif");
  if (error) { toast("Gagal: " + error.message, "error"); return; }
  toast(flag ? "Pengumuman berhasil dipublikasikan." : "Pengumuman dikembalikan ke draft.");
  muatPengumuman();
}

function exportPengumuman() {
  if (!dataPengumuman.length) { toast("Tidak ada data untuk diekspor.", "warn"); return; }
  const baris = dataPengumuman.slice()
    .sort((a, b) => String(a.jurusan_diterima).localeCompare(String(b.jurusan_diterima), "id")
      || (Number(a.urutan) || 0) - (Number(b.urutan) || 0))
    .map((d, i) => ({
      "No": i + 1,
      "No. Pendaftaran": d.no_pendaftaran_dinas || "",
      "Nama": d.nama,
      "NISN": d.nisn || "",
      "Diterima di Konsentrasi Keahlian": d.jurusan_diterima,
      "Total Nilai": d.total_nilai ?? "",
      "Bobot Nilai": d.bobot_nilai ?? "",
      "Bobot TKA": d.bobot_tka ?? "",
      "Bobot Prestasi": d.bobot_prestasi ?? "",
    }));
  const ws = XLSX.utils.json_to_sheet(baris);
  ws["!cols"] = [{ wch: 6 }, { wch: 26 }, { wch: 28 }, { wch: 16 }, { wch: 44 }, { wch: 13 }, { wch: 13 }, { wch: 12 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pengumuman Kelulusan");
  XLSX.writeFile(wb, `pengumuman-kelulusan-${pengumumanTahunAktif}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  toast(`Pengumuman diekspor (${baris.length} siswa). Hanya admin yang punya tombol ini.`);
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
    $("#hasilSection").classList.add("hidden");
    $("#passwordSection").classList.add("hidden");
    $("#pengumumanSection").classList.add("hidden");
  });
  $("#navPendaftar").addEventListener("click", () => {
    gantiMenu("navPendaftar", "Data Calon Siswa");
    $("#dashboardSection").classList.add("hidden");
    $("#dataSection").classList.remove("hidden");
    $("#landingSection").classList.add("hidden");
    $("#hasilSection").classList.add("hidden");
    $("#passwordSection").classList.add("hidden");
    $("#pengumumanSection").classList.add("hidden");
    $("#dataSection").scrollIntoView({ behavior: "smooth" });
  });
  $("#navHasil").addEventListener("click", () => {
    gantiMenu("navHasil", "Data Siswa Diterima");
    $("#dashboardSection").classList.add("hidden");
    $("#dataSection").classList.add("hidden");
    $("#landingSection").classList.add("hidden");
    $("#hasilSection").classList.remove("hidden");
    $("#passwordSection").classList.add("hidden");
    $("#pengumumanSection").classList.add("hidden");
    muatHasil();
  });
  $("#navPengumuman").addEventListener("click", () => {
    gantiMenu("navPengumuman", "Pengumuman Kelulusan");
    $("#dashboardSection").classList.add("hidden");
    $("#dataSection").classList.add("hidden");
    $("#landingSection").classList.add("hidden");
    $("#hasilSection").classList.add("hidden");
    $("#pengumumanSection").classList.remove("hidden");
    muatPengumuman();
  });
  $("#navLanding").addEventListener("click", () => {
    gantiMenu("navLanding", "Konten Beranda");
    $("#dashboardSection").classList.add("hidden");
    $("#dataSection").classList.add("hidden");
    $("#landingSection").classList.remove("hidden");
    $("#hasilSection").classList.add("hidden");
    $("#passwordSection").classList.add("hidden");
    $("#pengumumanSection").classList.add("hidden");
    muatLanding();
    muatInfoDinas();
  });
  $("#navPassword").addEventListener("click", () => {
    gantiMenu("navPassword", "Ganti Password");
    $("#dashboardSection").classList.add("hidden");
    $("#dataSection").classList.add("hidden");
    $("#landingSection").classList.add("hidden");
    $("#hasilSection").classList.add("hidden");
    $("#passwordSection").classList.remove("hidden");
    $("#passPesan").textContent = `Akun: ${emailAdmin}`;
    ["passLama", "passBaru", "passUlang"].forEach((id) => { $("#" + id).value = ""; });
  });
  $("#btnSimpanLanding").addEventListener("click", simpanLanding);
  $("#btnTarikDinas").addEventListener("click", tarikInfoDinas);
  $("#btnSimpanDinas").addEventListener("click", simpanInfoDinas);
  $("#btnImportHasil").addEventListener("click", () => $("#fileHasil").click());
  $("#fileHasil").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const teks = await file.text();
    draftHasil = parseHasilDinas(teks, file.name);
    e.target.value = "";
    if (!draftHasil.length) { toast("Tidak ada baris siswa yang terbaca dari file.", "error"); return; }
    tampilkanPreviewHasil();
  });
  $("#btnTambahHasil").addEventListener("click", bukaTambahHasil);
  $("#simpanTambahHasil").addEventListener("click", simpanTambahHasil);
  $("#tutupTambahHasil").addEventListener("click", () => {
    $("#overlayTambahHasil").classList.remove("show");
    document.body.classList.remove("lock-scroll");
  });
  $("#batalTambahHasil").addEventListener("click", () => {
    $("#overlayTambahHasil").classList.remove("show");
    document.body.classList.remove("lock-scroll");
  });
  $("#overlayTambahHasil").addEventListener("click", (e) => {
    if (e.target.id === "overlayTambahHasil") {
      $("#overlayTambahHasil").classList.remove("show");
      document.body.classList.remove("lock-scroll");
    }
  });
  $("#btnExportSemuaHasil").addEventListener("click", () => exportHasil(true));
  $("#btnExportJurusan").addEventListener("click", () => exportHasil(false));
  $("#hasilTahun").addEventListener("change", (e) => {
    hasilTahunAktif = e.target.value;
    muatHasil();
  });
  $("#tutupNonaktif").addEventListener("click", () => {
    $("#overlayNonaktif").classList.remove("show");
    document.body.classList.remove("lock-scroll");
  });
  $("#batalNonaktif").addEventListener("click", () => {
    $("#overlayNonaktif").classList.remove("show");
    document.body.classList.remove("lock-scroll");
  });
  $("#overlayNonaktif").addEventListener("click", (e) => {
    if (e.target.id === "overlayNonaktif") {
      $("#overlayNonaktif").classList.remove("show");
      document.body.classList.remove("lock-scroll");
    }
  });
  $("#simpanNonaktif").addEventListener("click", simpanNonaktif);
  $("#simpanMutasi").addEventListener("click", simpanMutasi);
  $("#btnPublishPengumuman").addEventListener("click", () => setPublishPengumuman(true));
  $("#btnDraftPengumuman").addEventListener("click", () => setPublishPengumuman(false));
  $("#btnExportPengumuman").addEventListener("click", exportPengumuman);
  $("#pengumumanTahun").addEventListener("change", (e) => {
    pengumumanTahunAktif = e.target.value;
    muatPengumuman();
  });
  $("#tutupMutasi").addEventListener("click", () => {
    $("#overlayMutasi").classList.remove("show");
    document.body.classList.remove("lock-scroll");
  });
  $("#batalMutasi").addEventListener("click", () => {
    $("#overlayMutasi").classList.remove("show");
    document.body.classList.remove("lock-scroll");
  });
  $("#overlayMutasi").addEventListener("click", (e) => {
    if (e.target.id === "overlayMutasi") {
      $("#overlayMutasi").classList.remove("show");
      document.body.classList.remove("lock-scroll");
    }
  });
  $("#btnGantiPassword").addEventListener("click", gantiPassword);
}

bindEvents();
initAuth();
