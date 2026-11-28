import { CONFIG, PAGE_SIZE } from "./config.js";
import {
  getSession, signOut, webRole,
  getInfo, updateInfo,
  listBerita, getBerita, saveBerita, deleteBerita,
  listDaftar, saveDaftar, deleteDaftar,
  listAlumni, saveAlumni, deleteAlumni,
  listGaleri, saveGaleri, deleteGaleri,
  uploadGambar,
  listUsers, createUser, deleteUser, resetUserPassword,
  supabase,
} from "./api.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`; el.textContent = msg;
  $("#toastWrap").appendChild(el); setTimeout(() => el.remove(), 3500);
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

let role = null;

async function guard() {
  const s = await getSession();
  if (!s) { location.href = "admin.html"; return null; }
  role = await webRole();
  if (role === "admin_spmb") { location.href = "spmb/admin.html"; return null; }
  if (role === "editor") {
    $$(".admin-only, [data-panel='info'], [data-panel='daftar'], [data-panel='pengguna']").forEach(el => el.style.display = "none");
  } else if (role !== "superadmin" && role !== "admin") {
    // admin_web: sembunyikan pengguna (hanya superadmin)
    $$(".admin-only, [data-panel='pengguna']").forEach(el => el.style.display = "none");
  }
  return s;
}

function initTabs() {
  $$(".side-link").forEach(l => l.addEventListener("click", () => {
    $$(".side-link").forEach(x => x.classList.remove("active"));
    l.classList.add("active");
    $$(".panel").forEach(p => p.classList.remove("active"));
    $("#panel-" + l.dataset.panel).classList.add("active");
  }));
}

// ---------- BERITA ----------
async function muatBeritaTable() {
  const { data } = await listBerita({ kategori: null, limit: 50, offset: 0, publishedOnly: false });
  const tbody = $("#tblBerita tbody");
  tbody.innerHTML = data.map(b => `<tr>
    <td>${escapeHtml(b.judul)}</td>
    <td>${escapeHtml(b.kategori || "-")}</td>
    <td>${b.tanggal ? new Date(b.tanggal).toLocaleDateString("id-ID") : "-"}</td>
    <td>${b.is_published ? "Terbit" : "Draft"}</td>
    <td>
      <button class="btn btn-outline btn-sm" data-edit="${b.id}">Edit</button>
      <button class="btn btn-outline btn-sm" data-pub="${b.id}">${b.status === "published" || b.is_published ? "Sembunyikan" : "Terbitkan"}</button>
      <button class="btn btn-outline btn-sm" data-del="${b.id}" style="color:#dc2626">Hapus</button>
    </td>
  </tr>`).join("");
  tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editBerita(b.dataset.edit)));
  tbody.querySelectorAll("[data-pub]").forEach(b => b.addEventListener("click", () => togglePubBerita(b.dataset.pub)));
  tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => hapusBerita(b.dataset.del)));
}

function resetFormBerita() {
  $("#bId").value = ""; $("#bJudul").value = ""; $("#bRingkasan").value = ""; $("#bIsi").value = "";
  $("#bGambarUrl").value = ""; $("#bGambarFile").value = "";
  $("#bTanggal").value = new Date().toISOString().slice(0, 10);
  $("#bStatus").value = "draft";
  $("#bPinned").value = "false";
  $("#formBeritaTitle").textContent = "Tambah Berita";
}
async function editBerita(id) {
  const b = await getBerita(id);
  $("#bId").value = b.id;
  $("#bJudul").value = b.judul || "";
  $("#bKategori").value = b.kategori || CONFIG.KATEGORI[0];
  $("#bTanggal").value = (b.tanggal || "").slice(0, 10);
  $("#bStatus").value = b.status || (b.is_published ? "published" : "draft");
  $("#bPinned").value = String(!!b.is_pinned);
  $("#bRingkasan").value = b.ringkasan || "";
  $("#bIsi").value = b.isi || "";
  $("#bGambarUrl").value = b.gambar_url || "";
  $("#formBeritaTitle").textContent = "Edit Berita";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function togglePubBerita(id) {
  const { data } = await listBerita({ limit: 100, offset: 0, publishedOnly: false });
  const b = data.find(x => x.id === id);
  if (!b) return;
  const newStatus = (b.status === "published" || b.is_published) ? "pending" : "published";
  try { await saveBerita({ id, status: newStatus, is_published: newStatus === "published" }); toast("Status publikasi diubah", "ok"); await muatBeritaTable(); }
  catch (e) { toast(e.message, "err"); }
}
async function hapusBerita(id) {
  if (!confirm("Hapus berita ini?")) return;
  try { await deleteBerita(id); toast("Berita dihapus", "ok"); await muatBeritaTable(); }
  catch (e) { toast(e.message, "err"); }
}
async function simpanBerita() {
  try {
    let gambar = $("#bGambarUrl").value.trim();
    const file = $("#bGambarFile").files[0];
    if (file) gambar = await uploadGambar(file);
    const payload = {
      judul: $("#bJudul").value.trim(),
      kategori: $("#bKategori").value,
      tanggal: $("#bTanggal").value,
      ringkasan: $("#bRingkasan").value.trim(),
      isi: $("#bIsi").value.trim(),
      gambar_url: gambar || null,
      status: $("#bStatus").value,
      is_published: $("#bStatus").value === "published",
      is_pinned: $("#bPinned").value === "true",
    };
    const id = $("#bId").value;
    if (id) { payload.id = id; await saveBerita(payload); }
    else { await saveBerita(payload); }
    toast("Berita disimpan", "ok");
    resetFormBerita();
    await muatBeritaTable();
  } catch (e) { toast(e.message || "Gagal menyimpan", "err"); }
}

// ---------- INFO ----------
async function muatInfoForm() {
  try {
    const info = await getInfo();
    if (!info) return;
    $("#iNama").value = info.nama_sekolah || "";
    $("#iTagline").value = info.tagline || "";
    $("#iTentang").value = info.tentang || "";
    $("#iVisi").value = info.visi || "";
    $("#iMisi").value = info.misi || "";
    $("#iAlamat").value = info.alamat || "";
    $("#iTelepon").value = info.telepon || "";
    $("#iEmail").value = info.email || "";
    $("#iWa").value = info.whatsapp || "";
    $("#iMaps").value = info.maps_embed_url || "";
    $("#iHero").value = info.hero_url || "";
    $("#iLogo").value = info.logo_url || "";
    $("#alumniFormAktif").checked = info.alumni_form_aktif !== false;
    const st = info.stats || {};
    $("#sBerdiri").value = st.tahun_berdiri || "";
    $("#sSiswa").value = st.jumlah_siswa || "";
    $("#sGuru").value = st.jumlah_guru || "";
    $("#sJurusan").value = st.jumlah_jurusan || "";
  } catch (e) { toast("Gagal memuat info", "err"); }
}
async function simpanInfo() {
  try {
    const payload = {
      nama_sekolah: $("#iNama").value.trim(),
      tagline: $("#iTagline").value.trim(),
      tentang: $("#iTentang").value.trim(),
      visi: $("#iVisi").value.trim(),
      misi: $("#iMisi").value.trim(),
      alamat: $("#iAlamat").value.trim(),
      telepon: $("#iTelepon").value.trim(),
      email: $("#iEmail").value.trim(),
      whatsapp: $("#iWa").value.trim(),
      maps_embed_url: $("#iMaps").value.trim(),
      hero_url: $("#iHero").value.trim(),
      logo_url: $("#iLogo").value.trim(),
      alumni_form_aktif: $("#alumniFormAktif").checked,
      stats: {
        tahun_berdiri: $("#sBerdiri").value.trim(),
        jumlah_siswa: $("#sSiswa").value.trim(),
        jumlah_guru: $("#sGuru").value.trim(),
        jumlah_jurusan: $("#sJurusan").value.trim(),
      },
    };
    await updateInfo(payload);
    toast("Informasi disimpan", "ok");
  } catch (e) { toast(e.message, "err"); }
}

// ---------- DAFTAR ----------
async function muatDaftarTable() {
  const items = await listDaftar();
  const tbody = $("#tblDaftar tbody");
  tbody.innerHTML = items.map(d => `<tr>
    <td>${escapeHtml(d.jenis)}</td>
    <td>${escapeHtml(d.judul)}</td>
    <td>${d.is_published ? "Terbit" : "Draft"}</td>
    <td>
      <button class="btn btn-outline btn-sm" data-edit="${d.id}">Edit</button>
      <button class="btn btn-outline btn-sm" data-del="${d.id}" style="color:#dc2626">Hapus</button>
    </td>
  </tr>`).join("");
  tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editDaftar(b.dataset.edit)));
  tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => hapusDaftar(b.dataset.del)));
}
async function editDaftar(id) {
  const items = await listDaftar();
  const d = items.find(x => x.id === id);
  if (!d) return;
  $("#dId").value = d.id;
  $("#dJenis").value = d.jenis;
  $("#dJudul").value = d.judul || "";
  $("#dDeskripsi").value = d.deskripsi || "";
  $("#dTanggal").value = (d.tanggal || "").slice(0, 10);
  $("#dIkon").value = d.ikon || "";
  $("#dUrutan").value = d.urutan ?? 0;
  $("#dStatus").value = String(!!d.is_published);
}
function resetDaftar() {
  $("#dId").value = ""; $("#dJudul").value = ""; $("#dDeskripsi").value = "";
  $("#dTanggal").value = ""; $("#dIkon").value = ""; $("#dUrutan").value = "0";
}
async function hapusDaftar(id) {
  if (!confirm("Hapus item ini?")) return;
  try { await deleteDaftar(id); toast("Item dihapus", "ok"); await muatDaftarTable(); }
  catch (e) { toast(e.message, "err"); }
}
async function simpanDaftar() {
  try {
    const payload = {
      jenis: $("#dJenis").value,
      judul: $("#dJudul").value.trim(),
      deskripsi: $("#dDeskripsi").value.trim(),
      tanggal: $("#dTanggal").value || null,
      ikon: $("#dIkon").value.trim() || null,
      urutan: parseInt($("#dUrutan").value || "0", 10),
      is_published: $("#dStatus").value === "true",
    };
    const id = $("#dId").value;
    if (id) { payload.id = id; await saveDaftar(payload); }
    else { await saveDaftar(payload); }
    toast("Item disimpan", "ok");
    resetDaftar();
    await muatDaftarTable();
  } catch (e) { toast(e.message, "err"); }
}

// ---------- PENGGUNA ----------
async function muatUsers() {
  if (role !== "admin") return;
  try {
    const res = await listUsers();
    const users = res?.users || res?.data || [];
    const tbody = $("#tblUsers tbody");
    tbody.innerHTML = users.map(u => `<tr>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.role || "user")}</td>
      <td>${u.created_at ? new Date(u.created_at).toLocaleDateString("id-ID") : "-"}</td>
      <td>
        ${u.role !== "admin" ? `<button class="btn btn-outline btn-sm" data-reset="${u.id}">Reset Pass</button>
        <button class="btn btn-outline btn-sm" data-del="${u.id}" style="color:#dc2626">Hapus</button>` : "-"}
      </td>
    </tr>`).join("");
    tbody.querySelectorAll("[data-reset]").forEach(b => b.addEventListener("click", async () => {
      const pw = prompt("Password baru (min 8 karakter):");
      if (!pw) return;
      try { await resetUserPassword(b.dataset.reset, pw); toast("Password direset", "ok"); }
      catch (e) { toast(e.message, "err"); }
    }));
    tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", async () => {
      if (!confirm("Hapus user ini?")) return;
      try { await deleteUser(b.dataset.del); toast("User dihapus", "ok"); await muatUsers(); }
      catch (e) { toast(e.message, "err"); }
    }));
  } catch (e) { toast(e.message, "err"); }
}

// ---------- ALUMNI ----------
async function muatAlumniTable() {
  const items = await listAlumni();
  const tbody = $("#tblAlumni tbody");
  tbody.innerHTML = items.map(a => `<tr>
    <td>${escapeHtml(a.nama)}</td>
    <td>${a.tahun_lulus}</td>
    <td>${escapeHtml(a.status)}</td>
    <td>${a.is_published ? "Ya" : "Tidak"}</td>
    <td>
      <button class="btn btn-outline btn-sm" data-edit="${a.id}">Edit</button>
      <button class="btn btn-outline btn-sm" data-pub="${a.id}">${a.is_published ? "Sembunyikan" : "Terbitkan"}</button>
      <button class="btn btn-outline btn-sm" data-del="${a.id}" style="color:#dc2626">Hapus</button>
    </td>
  </tr>`).join("");
  tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editAlumni(b.dataset.edit)));
  tbody.querySelectorAll("[data-pub]").forEach(b => b.addEventListener("click", () => togglePubAlumni(b.dataset.pub)));
  tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => hapusAlumni(b.dataset.del)));
}
async function editAlumni(id) {
  const items = await listAlumni();
  const a = items.find(x => x.id === id);
  if (!a) return;
  $("#alId").value = a.id;
  $("#alNama").value = a.nama || "";
  $("#alTahun").value = a.tahun_lulus || "";
  $("#alNisn").value = a.nisn || "";
  $("#alNis").value = a.nis || "";
  $("#alJurusan").value = a.jurusan || "";
  $("#alStatus").value = a.status || "belum_dilacak";
  $("#alInstitusi").value = a.institusi || "";
  $("#alKota").value = a.kota || "";
  $("#alKontak").value = a.kontak || "";
  $("#alPublished").value = String(!!a.is_published);
  $("#alCatatan").value = a.catatan || "";
  $("#formAlumniTitle").textContent = "Edit Alumni";
}
function resetAlumni() {
  $("#alId").value = ""; $("#alNama").value = ""; $("#alTahun").value = "";
  $("#alNisn").value = ""; $("#alNis").value = ""; $("#alJurusan").value = "";
  $("#alInstitusi").value = ""; $("#alKota").value = ""; $("#alKontak").value = "";
  $("#alCatatan").value = ""; $("#alPublished").value = "false";
  $("#formAlumniTitle").textContent = "Edit Alumni";
}
async function togglePubAlumni(id) {
  const items = await listAlumni();
  const a = items.find(x => x.id === id);
  if (!a) return;
  try { await saveAlumni({ id, is_published: !a.is_published }); toast("Status publikasi diubah", "ok"); await muatAlumniTable(); }
  catch (e) { toast(e.message, "err"); }
}
async function hapusAlumni(id) {
  if (!confirm("Hapus data alumni ini?")) return;
  try { await deleteAlumni(id); toast("Data dihapus", "ok"); await muatAlumniTable(); }
  catch (e) { toast(e.message, "err"); }
}
async function simpanAlumni() {
  try {
    const payload = {
      nama: $("#alNama").value.trim(),
      tahun_lulus: parseInt($("#alTahun").value, 10),
      nisn: $("#alNisn").value.trim() || null,
      nis: $("#alNis").value.trim() || null,
      jurusan: $("#alJurusan").value.trim() || null,
      status: $("#alStatus").value,
      institusi: $("#alInstitusi").value.trim() || null,
      kota: $("#alKota").value.trim() || null,
      kontak: $("#alKontak").value.trim() || null,
      catatan: $("#alCatatan").value.trim() || null,
      is_published: $("#alPublished").value === "true",
    };
    const id = $("#alId").value;
    if (id) payload.id = id;
    await saveAlumni(payload);
    toast("Data alumni disimpan", "ok");
    resetAlumni();
    await muatAlumniTable();
  } catch (e) { toast(e.message, "err"); }
}

// ---------- PROFIL DETAIL ----------
const PROFIL_FIELDS = [
  ["dNpsn","npsn"],["dBentuk","bentuk"],["dStatusSekolah","status_sekolah"],["dAkreditasi","akreditasi"],
  ["dAlamatJalan","alamat_jalan"],["dProvinsi","provinsi"],["dKabupaten","kabupaten"],["dKecamatan","kecamatan"],
  ["dDesa","desa"],["dKodePos","kode_pos"],["dEmail","email"],["dWebsite","website"],["dTelepon","telepon"],
  ["dLuasTanah","luas_tanah"],["dSkPendirian","sk_pendirian"],["dTglSkPendirian","tgl_sk_pendirian"],
  ["dSkAkreditasi","sk_akreditasi"],["dTglSkAkreditasi","tgl_sk_akreditasi"],["dIso","iso"],
  ["dListrik","listrik"],["dDaya","daya"],["dInternet","internet"],["dProvider","provider"],
  ["dLintang","lintang"],["dBujur","bujur"],
  ["dJmlSiswa","jml_siswa"],["dSiswaL","siswa_l"],["dSiswaP","siswa_p"],["dRombel","rombel"],["dJmlProg","jml_prog"],
  ["dGuruL","guru_l"],["dGuruP","guru_p"],["dAdminL","admin_l"],["dAdminP","admin_p"],
];
const PROFIL_TEXTAREAS = [
  ["dProgram","program"],["dRombelDetail","rombel_detail"],["dRuangan","ruangan"],["dPeralatan","peralatan"],
  ["dGuruMapel","guru_mapel"],["dDudi","dudi"],
];

async function muatProfilDetail() {
  try {
    const info = await getInfo();
    const d = info.detail || {};
    PROFIL_FIELDS.forEach(([id,key]) => { const el = $("#"+id); if (el) el.value = d[key] ?? ""; });
    PROFIL_TEXTAREAS.forEach(([id,key]) => { const el = $("#"+id); if (el) el.value = d[key] ?? ""; });
  } catch (e) { toast("Gagal memuat profil detail", "err"); }
}
async function simpanProfilDetail() {
  try {
    const d = {};
    PROFIL_FIELDS.forEach(([id,key]) => { d[key] = ($("#"+id).value || "").trim(); });
    PROFIL_TEXTAREAS.forEach(([id,key]) => { d[key] = ($("#"+id).value || "").trim(); });
    const info = await getInfo();
    await updateInfo({ ...info, detail: d });
    toast("Profil detail disimpan", "ok");
  } catch (e) { toast(e.message, "err"); }
}

// ---------- GALERI ----------
async function muatGaleriTable() {
  const { data } = await listGaleri({ limit: 50, offset: 0, publishedOnly: false });
  const tbody = $("#tblGaleri tbody");
  tbody.innerHTML = data.map(g => `<tr>
    <td>${escapeHtml(g.judul || "-")}</td>
    <td>${escapeHtml(g.kategori || "-")}</td>
    <td>${g.tanggal ? new Date(g.tanggal).toLocaleDateString("id-ID") : "-"}</td>
    <td>${g.status || (g.is_published ? "published" : "draft")}</td>
    <td>
      <button class="btn btn-outline btn-sm" data-edit="${g.id}">Edit</button>
      <button class="btn btn-outline btn-sm" data-pub="${g.id}">${g.status === "published" || g.is_published ? "Sembunyikan" : "Terbitkan"}</button>
      <button class="btn btn-outline btn-sm" data-del="${g.id}" style="color:#dc2626">Hapus</button>
    </td>
  </tr>`).join("");
  tbody.querySelectorAll("[data-edit]").forEach(b => b.addEventListener("click", () => editGaleri(b.dataset.edit)));
  tbody.querySelectorAll("[data-pub]").forEach(b => b.addEventListener("click", () => togglePubGaleri(b.dataset.pub)));
  tbody.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => hapusGaleri(b.dataset.del)));
}
async function editGaleri(id) {
  const { data } = await listGaleri({ limit: 100, offset: 0, publishedOnly: false });
  const g = data.find(x => x.id === id);
  if (!g) return;
  $("#gId").value = g.id;
  $("#gJudul").value = g.judul || "";
  $("#gKategori").value = g.kategori || "";
  $("#gTanggal").value = (g.tanggal || "").slice(0, 10);
  $("#gStatus").value = g.status || (g.is_published ? "published" : "draft");
  $("#gUrl").value = g.gambar_url || "";
  $("#formGaleriTitle").textContent = "Edit Foto";
}
function resetGaleri() {
  $("#gId").value = ""; $("#gJudul").value = ""; $("#gKategori").value = "";
  $("#gTanggal").value = new Date().toISOString().slice(0,10); $("#gStatus").value = "draft";
  $("#gUrl").value = ""; $("#gFile").value = "";
  $("#formGaleriTitle").textContent = "Tambah Foto";
}
async function togglePubGaleri(id) {
  const { data } = await listGaleri({ limit: 100, offset: 0, publishedOnly: false });
  const g = data.find(x => x.id === id);
  if (!g) return;
  const newStatus = (g.status === "published" || g.is_published) ? "pending" : "published";
  try { await saveGaleri({ id, status: newStatus, is_published: newStatus === "published" }); toast("Status publikasi diubah", "ok"); await muatGaleriTable(); }
  catch (e) { toast(e.message, "err"); }
}
async function hapusGaleri(id) {
  if (!confirm("Hapus foto ini?")) return;
  try { await deleteGaleri(id); toast("Foto dihapus", "ok"); await muatGaleriTable(); }
  catch (e) { toast(e.message, "err"); }
}
async function simpanGaleri() {
  try {
    let url = $("#gUrl").value.trim();
    const file = $("#gFile").files[0];
    if (file) url = await uploadGambar(file, "galeri");
    const payload = {
      judul: $("#gJudul").value.trim() || null,
      kategori: $("#gKategori").value.trim() || null,
      tanggal: $("#gTanggal").value,
      gambar_url: url,
      status: $("#gStatus").value,
      is_published: $("#gStatus").value === "published",
    };
    const id = $("#gId").value;
    if (id) payload.id = id;
    await saveGaleri(payload);
    toast("Foto disimpan", "ok");
    resetGaleri();
    await muatGaleriTable();
  } catch (e) { toast(e.message, "err"); }
}

// ---------- AKUN ----------
async function gantiPassword() {
  const lama = $("#pLama").value, baru = $("#pBaru").value, konf = $("#pKonf").value;
  if (baru !== konf) { toast("Konfirmasi tidak cocok", "err"); return; }
  if (baru.length < 8) { toast("Password min 8 karakter", "err"); return; }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email, password: lama });
    if (e1) throw e1;
    const { error: e2 } = await supabase.auth.updateUser({ password: baru });
    if (e2) throw e2;
    toast("Password diubah", "ok");
    $("#pLama").value = $("#pBaru").value = $("#pKonf").value = "";
  } catch (e) { toast(e.message, "err"); }
}

async function main() {
  const s = await guard();
  if (!s) return;
  initTabs();
  // kategori select
  $("#bKategori").innerHTML = CONFIG.KATEGORI.map(c => `<option value="${c}">${c}</option>`).join("");
  $("#bTanggal").value = new Date().toISOString().slice(0, 10);
  if (role === "editor") {
    const sel = $("#bStatus");
    Array.from(sel.options).forEach(o => { if (o.value === "published") o.remove(); });
    $("#bStatus").value = "pending";
    const gsel = $("#gStatus");
    Array.from(gsel.options).forEach(o => { if (o.value === "published") o.remove(); });
    $("#gStatus").value = "pending";
  }

  $("#btnSimpanBerita").addEventListener("click", simpanBerita);
  $("#btnResetBerita").addEventListener("click", resetFormBerita);
  $("#btnSimpanInfo").addEventListener("click", simpanInfo);
  $("#iHeroFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Ukuran gambar maksimal 2 MB", "err"); return; }
    try {
      const url = await uploadGambar(file, "info");
      $("#iHero").value = url;
      toast("Gambar hero diunggah", "ok");
    } catch (err) { toast(err.message || "Gagal mengunggah", "err"); }
  });
  $("#iLogoFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast("Ukuran logo maksimal 500 KB", "err"); return; }
    try {
      const url = await uploadGambar(file, "info");
      $("#iLogo").value = url;
      toast("Logo diunggah", "ok");
    } catch (err) { toast(err.message || "Gagal mengunggah", "err"); }
  });
  $("#btnSimpanDaftar").addEventListener("click", simpanDaftar);
  $("#btnResetDaftar").addEventListener("click", resetDaftar);
  $("#btnTambahUser").addEventListener("click", async () => {
    try {
      await createUser($("#uEmail").value.trim(), $("#uPassword").value, $("#uRole").value);
      toast("Pengguna ditambahkan", "ok");
      $("#uEmail").value = $("#uPassword").value = "";
      await muatUsers();
    } catch (e) { toast(e.message, "err"); }
  });
  $("#btnGantiPass").addEventListener("click", gantiPassword);
  $("#btnSimpanProfil").addEventListener("click", simpanProfilDetail);
  $("#btnSimpanAlumni").addEventListener("click", simpanAlumni);
  $("#btnSimpanGaleri").addEventListener("click", simpanGaleri);
  $("#btnResetGaleri").addEventListener("click", resetGaleri);
  $("#btnResetAlumni").addEventListener("click", resetAlumni);
  // logout diikat di level atas (lihat bawah) agar tetap berfungsi walau main() gagal

  await muatBeritaTable();
  await muatInfoForm();
  await muatProfilDetail();
  await muatDaftarTable();
  await muatAlumniTable();
  await muatGaleriTable();
  if (role === "admin") await muatUsers();
  // default panel berita
}

// Logout selalu aktif (tidak bergantung main())
function doLogout() {
  signOut().finally(() => { location.href = "admin.html"; });
}
document.addEventListener("DOMContentLoaded", () => {
  ["btnLogout2", "btnLogoutSidebar"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", (e) => { e.preventDefault(); doLogout(); });
  });
});

main();