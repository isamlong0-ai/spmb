import { CONFIG } from "./config.js";
import { getInfo, listBerita, getBerita, listDaftar } from "./api.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`; el.textContent = msg;
  $("#toastWrap").appendChild(el); setTimeout(() => el.remove(), 3500);
}

let kategoriAktif = "Semua";
let offset = 0;
let total = 0;
const LIMIT = 6;

async function muatInfo() {
  try {
    const info = await getInfo();
    if (!info) return;
    $("#heroJudul").textContent = info.nama_sekolah || CONFIG.NAMA_SEKOLAH;
    $("#navTagline").textContent = info.tagline || CONFIG.TAGLINE;
    $("#heroTagline").textContent = info.tagline || CONFIG.TAGLINE;
    $("#tentangText").textContent = info.tentang || "Belum ada deskripsi.";
    $("#visiText").textContent = info.visi || "-";
    $("#misiText").textContent = info.misi || "-";
    const st = info.stats || {};
    $("#statBerdiri").textContent = st.tahun_berdiri || CONFIG.TAHUN_BERDIRI;
    $("#statSiswa").textContent = st.jumlah_siswa || "-";
    $("#statGuru").textContent = st.jumlah_guru || "-";
    $("#statJurusan").textContent = st.jumlah_jurusan || "-";
    $("#alamatText").textContent = info.alamat || CONFIG.ALAMAT;
    $("#teleponText").textContent = info.telepon || CONFIG.TELEPON;
    $("#emailText").textContent = info.email || CONFIG.EMAIL;
    const wa = info.whatsapp || CONFIG.WHATSAPP;
    $("#waLink").href = `https://wa.me/${wa}`;
    $("#mapsFrame").src = info.maps_embed_url || CONFIG.MAPS_EMBED;
    $("#footerNama").textContent = info.nama_sekolah || CONFIG.NAMA_SEKOLAH;
    $("#footerTagline").textContent = info.tagline || CONFIG.TAGLINE;
  } catch (e) {
    // fallback ke config (mis. tabel belum dibuat / offline)
    $("#heroJudul").textContent = CONFIG.NAMA_SEKOLAH;
    $("#navTagline").textContent = CONFIG.TAGLINE;
    $("#heroTagline").textContent = CONFIG.TAGLINE;
    $("#tentangText").textContent = "Belum ada deskripsi sekolah.";
    $("#visiText").textContent = "-";
    $("#misiText").textContent = "-";
    $("#statBerdiri").textContent = CONFIG.TAHUN_BERDIRI;
    $("#statSiswa").textContent = "-";
    $("#statGuru").textContent = "-";
    $("#statJurusan").textContent = "7";
    $("#alamatText").textContent = CONFIG.ALAMAT;
    $("#teleponText").textContent = CONFIG.TELEPON;
    $("#emailText").textContent = CONFIG.EMAIL;
    $("#waLink").href = `https://wa.me/${CONFIG.WHATSAPP}`;
    $("#mapsFrame").src = CONFIG.MAPS_EMBED;
    $("#footerNama").textContent = CONFIG.NAMA_SEKOLAH;
    $("#footerTagline").textContent = CONFIG.TAGLINE;
  }
}

function renderFilter() {
  const wrap = $("#filterBerita");
  const cats = ["Semua", ...CONFIG.KATEGORI];
  wrap.innerHTML = cats.map(c => `<button class="chip ${c === kategoriAktif ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
  wrap.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    kategoriAktif = b.dataset.cat;
    offset = 0;
    $("#newsGrid").innerHTML = "";
    renderFilter();
    muatBerita(true);
  }));
}

function kartuBerita(b) {
  const tgl = new Date(b.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const img = b.gambar_url ? `<img class="news-img" src="${b.gambar_url}" alt="" loading="lazy">` : `<div class="news-img"></div>`;
  return `<article class="card" data-id="${b.id}">
    ${img}
    <div class="card-body">
      <div class="news-meta"><span class="badge cat">${b.kategori || "Umum"}</span><span>${tgl}</span></div>
      <h3 class="news-title">${escapeHtml(b.judul)}</h3>
      <p class="news-excerpt">${escapeHtml(b.ringkasan || "")}</p>
    </div>
  </article>`;
}

function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

async function muatBerita(reset = false) {
  if (reset) { offset = 0; $("#newsGrid").innerHTML = ""; }
  try {
    const { data, count } = await listBerita({ kategori: kategoriAktif, limit: LIMIT, offset, publishedOnly: true });
    total = count;
    const grid = $("#newsGrid");
    if (offset === 0 && data.length === 0) {
      grid.innerHTML = `<p style="color:var(--muted)">Belum ada berita.</p>`;
    } else {
      grid.insertAdjacentHTML("beforeend", data.map(kartuBerita).join(""));
    }
    offset += data.length;
    $("#btnLoadMore").style.display = offset < total ? "inline-flex" : "none";
    // click handlers
    grid.querySelectorAll("article.card").forEach(c => {
      if (c.dataset.bound) return;
      c.dataset.bound = "1";
      c.addEventListener("click", () => bukaBerita(c.dataset.id));
    });
  } catch (e) {
    const grid = $("#newsGrid");
    if (offset === 0) grid.innerHTML = `<p style="color:var(--muted)">Belum ada berita atau koneksi database belum siap.</p>`;
    toast("Gagal memuat berita", "err");
  }
}

async function bukaBerita(id) {
  try {
    const b = await getBerita(id);
    $("#modalJudul").textContent = b.judul;
    const img = $("#modalImg");
    if (b.gambar_url) { img.src = b.gambar_url; img.style.display = "block"; } else img.style.display = "none";
    const tgl = new Date(b.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    $("#modalMeta").innerHTML = `<span class="badge cat">${b.kategori || "Umum"}</span><span>${tgl}</span>${b.penulis ? " &bull; " + escapeHtml(b.penulis) : ""}`;
    $("#modalIsi").textContent = b.isi || b.ringkasan || "";
    $("#modalBerita").classList.add("open");
  } catch (e) { toast("Gagal membuka berita", "err"); }
}

async function muatDaftar() {
  const mapJenis = { jurusan: "panel-jurusan", fasilitas: "panel-fasilitas", ekskul: "panel-ekskul", agenda: "panel-agenda" };
  // mapping jenis di DB -> panel
  const jenisDb = { "panel-jurusan": "jurusan", "panel-fasilitas": "fasilitas", "panel-ekskul": "ekstrakurikuler", "panel-agenda": "agenda" };
  for (const panelId of Object.keys(jenisDb)) {
    const el = document.getElementById(panelId);
    try {
      const items = await listDaftar(jenisDb[panelId]);
      if (items.length === 0) { el.innerHTML = `<p style="color:var(--muted)">Belum ada data.</p>`; continue; }
      el.innerHTML = items.map(it => {
        if (jenisDb[panelId] === "agenda") {
          return `<div class="list-item"><div class="ikon">${it.ikon || "📅"}</div><div><div class="agenda-date">${it.tanggal ? new Date(it.tanggal).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" }) : ""}</div><h4>${escapeHtml(it.judul)}</h4><p>${escapeHtml(it.deskripsi || "")}</p></div></div>`;
        }
        return `<div class="list-item"><div class="ikon">${it.ikon || "•"}</div><div><h4>${escapeHtml(it.judul)}</h4><p>${escapeHtml(it.deskripsi || "")}</p></div></div>`;
      }).join("");
    } catch (e) { el.innerHTML = `<p style="color:var(--muted)">Belum ada data.</p>`; }
  }
}

function initTabs() {
  $$("#infoTabs .tab").forEach(t => t.addEventListener("click", () => {
    $$("#infoTabs .tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    $$(".tab-panel").forEach(p => p.classList.remove("active"));
    $("#panel-" + t.dataset.tab).classList.add("active");
  }));
}

function initModal() {
  $("#modalClose").addEventListener("click", () => $("#modalBerita").classList.remove("open"));
  $("#modalBerita").addEventListener("click", (e) => { if (e.target.id === "modalBerita") $("#modalBerita").classList.remove("open"); });
}

function initMenu() {
  $("#hamburger").addEventListener("click", () => $("#menu").classList.toggle("open"));
  $$("#menu a").forEach(a => a.addEventListener("click", () => $("#menu").classList.remove("open")));
}

async function main() {
  initMenu();
  initTabs();
  initModal();
  renderFilter();
  await muatInfo();
  await muatBerita(true);
  await muatDaftar();
  $("#btnLoadMore").addEventListener("click", () => muatBerita(false));
}

main();