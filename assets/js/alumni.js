import { CONFIG } from "./config.js";
import { getInfo, listDaftar, listAlumni, saveAlumni } from "./api.js?v=7";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`; el.textContent = msg;
  $("#toastWrap").appendChild(el); setTimeout(() => el.remove(), 3500);
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

let allAlumni = [];
let alumniStatusFilter = "semua";
let alumniSearchQuery = "";

function statusLabel(s) {
  return ({ kuliah:"Kuliah", kerja:"Bekerja", wirausaha:"Wirausaha", mencari:"Mencari Kerja", lainnya:"Lainnya", belum_dilacak:"Belum Dilacak" }[s] || s);
}

function kartuAlumni(a) {
  return `<article class="card"><div class="card-body">
    <div class="news-meta"><span class="badge cat">${escapeHtml(a.jurusan || "Umum")}</span><span>${a.tahun_lulus}</span></div>
    <h3 class="news-title">${escapeHtml(a.nama)}</h3>
    <p class="news-excerpt">${escapeHtml(statusLabel(a.status))}${a.institusi ? " — " + escapeHtml(a.institusi) : ""}${a.kota ? " (" + escapeHtml(a.kota) + ")" : ""}</p>
  </div></article>`;
}

function renderAlumni() {
  const grid = $("#alumniGrid");
  let data = allAlumni;
  if (alumniStatusFilter !== "semua") data = data.filter(a => a.status === alumniStatusFilter);
  if (alumniSearchQuery.trim()) {
    const q = alumniSearchQuery.toLowerCase();
    data = data.filter(a => (a.nama + " " + (a.jurusan||"") + " " + (a.institusi||"") + " " + (a.kota||"")).toLowerCase().includes(q));
  }
  if (data.length === 0) { grid.innerHTML = `<p style="color:var(--muted)">Belum ada alumni yang ditampilkan.</p>`; return; }
  grid.innerHTML = data.map(kartuAlumni).join("");
}

async function muatAlumni() {
  try {
    allAlumni = await listAlumni({ publishedOnly: true });
    renderAlumni();
  } catch (e) { $("#alumniGrid").innerHTML = `<p style="color:var(--muted)">Belum ada data alumni.</p>`; }
}

function initAlumniFilter() {
  const statuses = ["semua","kuliah","kerja","wirausaha","mencari","lainnya"];
  const labels = { semua:"Semua", kuliah:"Kuliah", kerja:"Kerja", wirausaha:"Wirausaha", mencari:"Mencari", lainnya:"Lainnya" };
  $("#alumniFilter").innerHTML = statuses.map(s => `<button class="chip ${s === alumniStatusFilter ? "active" : ""}" data-status="${s}">${labels[s]}</button>`).join("");
  $("#alumniFilter").querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    alumniStatusFilter = b.dataset.status;
    initAlumniFilter();
    renderAlumni();
  }));
  $("#alumniSearch").addEventListener("input", (e) => { alumniSearchQuery = e.target.value; renderAlumni(); });
}

async function initAlumniForm() {
  const sel = $("#aJurusan");
  try {
    const items = await listDaftar("jurusan");
    if (items.length) sel.innerHTML = items.map(i => `<option value="${escapeHtml(i.judul)}">${escapeHtml(i.judul)}</option>`).join("");
    else throw new Error("none");
  } catch (e) {
    const fallback = ["Teknik Komputer dan Jaringan","Akuntansi","Desain Komunikasi Visual","Manajemen Perkantoran","Teknik Kendaraan Ringan","Agribisnis Tanaman Pangan dan Hortikultura","Bisnis Retail"];
    sel.innerHTML = fallback.map(j => `<option value="${j}">${j}</option>`).join("");
  }
  $("#alumniForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      nama: $("#aNama").value.trim(),
      tahun_lulus: parseInt($("#aTahun").value, 10),
      nisn: $("#aNisn").value.trim() || null,
      nis: $("#aNis").value.trim() || null,
      jurusan: $("#aJurusan").value,
      status: $("#aStatus").value,
      institusi: $("#aInstitusi").value.trim() || null,
      kota: $("#aKota").value.trim() || null,
      kontak: $("#aKontak").value.trim() || null,
      catatan: $("#aCatatan").value.trim() || null,
      is_published: false,
    };
    if (!payload.nama || !payload.tahun_lulus) { toast("Nama dan tahun lulus wajib", "err"); return; }
    if (!payload.nisn && !payload.nis) { toast("Isi NISN atau NIS/NIPD", "err"); return; }
    try {
      await saveAlumni(payload);
      toast("Data alumni terkirim, menunggu persetujuan admin", "ok");
      $("#alumniForm").reset();
    } catch (err) { toast(err.message || "Gagal mengirim", "err"); }
  });
}

async function main() {
  // tabs
  $$("#alumniTabs .tab").forEach(t => t.addEventListener("click", () => {
    $$("#alumniTabs .tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach(p => p.style.display = "none");
    document.getElementById("panel-" + t.dataset.tab).style.display = "block";
  }));
  // toggle form
  try {
    const info = await getInfo();
    if (info.logo_url) { const lg = $("#navLogo"); if (lg) lg.src = info.logo_url; }
    const wrap = $("#alumniFormWrap");
    if (info.alumni_form_aktif === false) {
      wrap.style.display = "none";
      $("#alumniFormStatus").textContent = "Formulir pendaftaran alumni sedang ditutup oleh admin.";
    } else {
      $("#alumniFormStatus").textContent = "Isi data Anda. Data akan tampil di direktori setelah disetujui admin.";
    }
  } catch (e) {}
  initAlumniFilter();
  await initAlumniForm();
  await muatAlumni();
  // hamburger
  $("#hamburger").addEventListener("click", () => $("#menu").classList.toggle("open"));
  $$("#menu a").forEach(a => a.addEventListener("click", () => $("#menu").classList.remove("open")));
}

main();