import { CONFIG } from "./config.js";
import { getInfo, listBerita, getBerita, listDaftar, listGaleri } from "./api.js?v=9";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`; el.textContent = msg;
  $("#toastWrap").appendChild(el); setTimeout(() => el.remove(), 3500);
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

let kategoriAktif = "Semua";
let searchQuery = "";
let offset = 0;
let total = 0;
const LIMIT = 6;
let debounceTimer = null;

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
    if (info.logo_url) { const lg = $("#navLogo"); if (lg) lg.src = info.logo_url; }
    $("#footerNama").textContent = info.nama_sekolah || CONFIG.NAMA_SEKOLAH;
    $("#footerTagline").textContent = info.tagline || CONFIG.TAGLINE;
    // toggle formulir alumni
    const formWrap = $("#alumniFormWrap");
    if (formWrap) {
      if (info.alumni_form_aktif === false) {
        formWrap.style.display = "none";
        $("#alumniFormStatus").textContent = "Formulir pendaftaran alumni sedang ditutup oleh admin.";
      } else {
        formWrap.style.display = "";
        $("#alumniFormStatus").textContent = "Isi data Anda. Data akan tampil di direktori setelah disetujui admin.";
      }
    }
    // hero background (gambar bisa diubah dari admin)
    const hero = document.querySelector(".hero");
    if (info.hero_url) {
      hero.classList.add("has-image");
      hero.style.backgroundImage = `url("${info.hero_url}")`;
      hero.style.backgroundSize = "cover";
      hero.style.backgroundPosition = "center";
    } else {
      hero.classList.remove("has-image");
      hero.style.backgroundImage = "";
    }
  } catch (e) {
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
    const hero = document.querySelector(".hero");
    hero.classList.remove("has-image");
    hero.style.backgroundImage = "";
  }
}

function renderFilter() {
  const wrap = $("#filterBerita");
  const cats = ["Semua", ...CONFIG.KATEGORI];
  wrap.innerHTML = cats.map(c => `<button class="chip ${c === kategoriAktif ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
  wrap.querySelectorAll(".chip").forEach(b => b.addEventListener("click", () => {
    kategoriAktif = b.dataset.cat;
    offset = 0;
    renderFilter();
    muatBerita(true);
  }));
}

function kartuBerita(b) {
  const tgl = new Date(b.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  const img = b.gambar_url ? `<img class="news-img" src="${b.gambar_url}" alt="" loading="lazy">` : `<div class="news-img"></div>`;
  return `<a class="card" href="berita.html?id=${b.id}" data-id="${b.id}" style="display:block;text-decoration:none;color:inherit">
    ${img}
    <div class="card-body">
      <div class="news-meta"><span class="badge cat">${b.kategori || "Umum"}</span><span>${tgl}</span></div>
      <h3 class="news-title">${escapeHtml(b.judul)}</h3>
      <p class="news-excerpt">${escapeHtml(b.ringkasan || "")}</p>
    </div>
  </a>`;
}

function renderFeatured(b, pinned = false) {
  const wrap = $("#newsFeatured");
  if (!b) { wrap.innerHTML = ""; return; }
  const tgl = new Date(b.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  const img = b.gambar_url ? `<img class="f-img" src="${b.gambar_url}" alt="" loading="lazy">` : `<div class="f-img"></div>`;
  const kicker = pinned ? `📌 Berita Disematkan &bull; ${escapeHtml(b.kategori || "Umum")} &bull; ${tgl}` : `${escapeHtml(b.kategori || "Umum")} &bull; ${tgl}`;
  wrap.innerHTML = `<div class="featured-card" data-id="${b.id}">
    ${img}
    <div class="f-body">
      <div class="f-kicker">${kicker}</div>
      <h3>${escapeHtml(b.judul)}</h3>
      <p>${escapeHtml(b.ringkasan || "")}</p>
      <div><a class="btn btn-primary btn-sm" href="berita.html?id=${b.id}">Baca Selengkapnya</a></div>
    </div>
  </div>`;
  // navigasi ditangani oleh tautan di dalam kartu
}

async function muatBerita(reset = false) {
  if (reset) { offset = 0; $("#newsGrid").innerHTML = ""; $("#newsFeatured").innerHTML = ""; }
  try {
    const isFilter = (searchQuery.trim() !== "" || (kategoriAktif && kategoriAktif !== "Semua"));
    // berita disematkan (pinned) hanya saat tidak ada filter/pencarian
    let pinned = [];
    if (offset === 0 && !isFilter) {
      try { const r = await listBerita({ limit: 5, publishedOnly: true, pinned: true }); pinned = r || []; } catch (e) { pinned = []; }
    }
    const { data, count } = await listBerita({ kategori: kategoriAktif, limit: LIMIT, offset, publishedOnly: true, q: searchQuery, pinned: (isFilter ? null : false) });
    total = count;
    const grid = $("#newsGrid");
    if (offset === 0) {
      if (pinned.length > 0) {
        renderFeatured(pinned[0], true);
        grid.insertAdjacentHTML("beforeend", data.map(kartuBerita).join(""));
      } else if (data.length === 0) {
        grid.innerHTML = `<p style="color:var(--muted)">Tidak ada berita yang cocok.</p>`;
        renderFeatured(null);
      } else {
        renderFeatured(data[0], false);
        grid.insertAdjacentHTML("beforeend", data.slice(1).map(kartuBerita).join(""));
      }
    } else {
      grid.insertAdjacentHTML("beforeend", data.map(kartuBerita).join(""));
    }
    offset += data.length;
    $("#btnLoadMore").style.display = offset < total ? "inline-flex" : "none";
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
  location.href = `berita.html?id=${id}`;
  return;
  try {
    const b = await getBerita(id);
    $("#modalJudul").textContent = b.judul;
    const img = $("#modalImg");
    if (b.gambar_url) { img.src = b.gambar_url; img.style.display = "block"; } else img.style.display = "none";
    const tgl = new Date(b.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    $("#modalMeta").innerHTML = `<span class="badge cat">${b.kategori || "Umum"}</span><span>${tgl}</span>${b.penulis ? " &bull; " + escapeHtml(b.penulis) : ""}`;
    $("#modalIsi").textContent = b.isi || b.ringkasan || "";
    // share
    const url = `${location.origin}${location.pathname}#berita-${b.id}`;
    $("#btnCopyLink").onclick = async () => {
      try { await navigator.clipboard.writeText(url); toast("Tautan disalin", "ok"); }
      catch { toast("Gagal menyalin", "err"); }
    };
    $("#btnWaShare").href = `https://wa.me/?text=${encodeURIComponent(b.judul + " " + url)}`;
    // related
    const relatedWrap = $("#modalRelated");
    relatedWrap.innerHTML = "";
    try {
      const { data } = await listBerita({ kategori: b.kategori, limit: 4, publishedOnly: true });
      const rel = data.filter(x => x.id !== b.id).slice(0, 3);
      if (rel.length) {
        relatedWrap.innerHTML = `<h4>Berita Terkait</h4>` + rel.map(r => `
          <div class="related-item" data-id="${r.id}">
            <div class="ri-title">${escapeHtml(r.judul)}</div>
            <div class="ri-date">${new Date(r.tanggal).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}</div>
          </div>`).join("");
        relatedWrap.querySelectorAll(".related-item").forEach(el => el.addEventListener("click", () => { $("#modalBerita").classList.remove("open"); bukaBerita(el.dataset.id); }));
      }
    } catch (e) {}
    $("#modalBerita").classList.add("open");
  } catch (e) { toast("Gagal membuka berita", "err"); }
}

async function muatSidebar() {
  try {
    // satu request untuk latest + hitung kategori (lebih cepat)
    const { data } = await listBerita({ limit: 100, publishedOnly: true, pinned: false });
    const latest = data.slice(0, 5);
    const wrap = $("#sidebarLatest");
    wrap.innerHTML = latest.map(b => `
      <div class="sidebar-item" data-id="${b.id}">
        ${b.gambar_url ? `<img src="${b.gambar_url}" alt="" loading="lazy">` : `<div style="width:56px;height:42px;background:#e2e8f0;border-radius:6px;flex-shrink:0"></div>`}
        <div>
          <div class="si-title">${escapeHtml(b.judul)}</div>
          <div class="si-date">${new Date(b.tanggal).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}</div>
        </div>
      </div>`).join("");
    wrap.querySelectorAll(".sidebar-item").forEach(el => el.addEventListener("click", () => bukaBerita(el.dataset.id)));

    const counts = {};
    CONFIG.KATEGORI.forEach(c => counts[c] = 0);
    data.forEach(b => { if (counts[b.kategori] !== undefined) counts[b.kategori]++; });
    const catWrap = $("#sidebarCats");
    catWrap.innerHTML = CONFIG.KATEGORI.map(c => `<div class="sidebar-cat" data-cat="${c}"><span>${c}</span><span class="count">${counts[c]}</span></div>`).join("");
    catWrap.querySelectorAll(".sidebar-cat").forEach(el => el.addEventListener("click", () => {
      kategoriAktif = el.dataset.cat;
      offset = 0;
      renderFilter();
      muatBerita(true);
      window.scrollTo({ top: $("#berita").offsetTop - 70, behavior: "smooth" });
    }));
  } catch (e) {}
}

async function muatDaftar() {
  const jenisDb = { "panel-jurusan": "jurusan", "panel-fasilitas": "fasilitas", "panel-ekskul": "ekstrakurikuler", "panel-agenda": "agenda" };
  for (const panelId of Object.keys(jenisDb)) {
    const el = document.getElementById(panelId);
    try {
      const items = await listDaftar(jenisDb[panelId], true);
      if (items.length === 0) { el.innerHTML = `<p style="color:var(--muted)">Belum ada data.</p>`; continue; }
      el.innerHTML = items.map(it => {
        if (jenisDb[panelId] === "agenda") {
          return `<div class="list-item"><div class="ikon">${it.ikon || "📅"}</div><div><div class="agenda-date">${it.tanggal ? new Date(it.tanggal).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" }) : ""}</div><h4>${escapeHtml(it.judul)}</h4><p>${escapeHtml(it.deskripsi || "")}</p></div></div>`;
        }
        if (jenisDb[panelId] === "jurusan") {
          const src = `assets/img/program/${encodeURI((it.judul || "").trim().toLowerCase() + ".png")}`;
          return `<div class="list-item"><div class="ikon"><img class="prog-icon" src="${src}" alt="${escapeHtml(it.judul)}" loading="lazy" onerror="this.style.display='none'"></div><div><h4>${escapeHtml(it.judul)}</h4><p>${escapeHtml(it.deskripsi || "")}</p></div></div>`;
        }
        return `<div class="list-item"><div class="ikon">${it.ikon || "•"}</div><div><h4>${escapeHtml(it.judul)}</h4><p>${escapeHtml(it.deskripsi || "")}</p></div></div>`;
      }).join("");
    } catch (e) { el.innerHTML = `<p style="color:var(--muted)">Belum ada data.</p>`; }
  }
}

let galeriOffset = 0;
const GALERI_LIMIT = 12;
let galeriTotal = 0;

function kartuGaleri(g) {
  const fotos = Array.isArray(g.fotos) && g.fotos.length ? g.fotos : (g.gambar_url ? [g.gambar_url] : []);
  const cover = fotos[0] || "";
  const badge = fotos.length > 1 ? `<span class="badge" style="margin-left:6px">${fotos.length} foto</span>` : "";
  return `<article class="card" data-id="${g.id}" style="cursor:pointer">
    <img class="news-img" src="${cover}" alt="${escapeHtml(g.judul || "")}" loading="lazy">
    <div class="card-body">
      <div class="news-meta"><span class="badge cat">${escapeHtml(g.kategori || "Umum")}</span>${badge}<span>${new Date(g.tanggal).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}</span></div>
      <h3 class="news-title">${escapeHtml(g.judul || "Foto")}</h3>
    </div>
  </article>`;
}

async function muatGaleri(reset = false) {
  if (reset) { galeriOffset = 0; $("#galeriGrid").innerHTML = ""; }
  try {
    const { data, count } = await listGaleri({ limit: GALERI_LIMIT, offset: galeriOffset, publishedOnly: true });
    galeriTotal = count;
    const grid = $("#galeriGrid");
    if (galeriOffset === 0 && data.length === 0) {
      grid.innerHTML = `<p style="color:var(--muted)">Belum ada foto galeri.</p>`;
    } else {
      grid.insertAdjacentHTML("beforeend", data.map(kartuGaleri).join(""));
    }
    galeriOffset += data.length;
    $("#btnLoadGaleri").style.display = galeriOffset < galeriTotal ? "inline-flex" : "none";
    grid.querySelectorAll("article.card").forEach(c => {
      if (c.dataset.bound) return;
      c.dataset.bound = "1";
      c.addEventListener("click", () => bukaGaleri(c.dataset.id, data));
    });
  } catch (e) { toast("Gagal memuat galeri", "err"); }
}

let galeriFotos = [];
let galeriIndex = 0;

function tampilFotoGaleri() {
  $("#modalGaleriImg").src = galeriFotos[galeriIndex] || "";
  $("#galeriCounter").textContent = `${galeriIndex + 1} / ${galeriFotos.length}`;
  $("#galeriPrev").style.display = galeriFotos.length > 1 ? "" : "none";
  $("#galeriNext").style.display = galeriFotos.length > 1 ? "" : "none";
}
function bukaGaleri(id, data) {
  const g = data.find(x => x.id === id);
  if (!g) return;
  galeriFotos = Array.isArray(g.fotos) && g.fotos.length ? g.fotos : (g.gambar_url ? [g.gambar_url] : []);
  galeriIndex = 0;
  $("#modalGaleriJudul").textContent = g.judul || "Foto";
  tampilFotoGaleri();
  $("#modalGaleri").classList.add("open");
}

function initGaleriModal() {
  $("#modalGaleriClose").addEventListener("click", () => $("#modalGaleri").classList.remove("open"));
  $("#modalGaleri").addEventListener("click", (e) => { if (e.target.id === "modalGaleri") $("#modalGaleri").classList.remove("open"); });
  $("#galeriPrev").addEventListener("click", () => { galeriIndex = Math.max(0, galeriIndex - 1); tampilFotoGaleri(); });
  $("#galeriNext").addEventListener("click", () => { galeriIndex = Math.min(galeriFotos.length - 1, galeriIndex + 1); tampilFotoGaleri(); });
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
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $("#modalBerita").classList.remove("open"); });
}

function initMenu() {
  $("#hamburger").addEventListener("click", () => $("#menu").classList.toggle("open"));
  $$("#menu a").forEach(a => a.addEventListener("click", () => $("#menu").classList.remove("open")));
}

function initSearch() {
  const input = $("#newsSearch");
  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = input.value;
      offset = 0;
      muatBerita(true);
    }, 350);
  });
}

function initBackToTop() {
  const btn = $("#btnTop");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) btn.classList.add("show"); else btn.classList.remove("show");
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

async function main() {
  initMenu();
  initTabs();
  initModal();
  initSearch();
  initBackToTop();
  renderFilter();
  await Promise.all([muatInfo(), muatBerita(true), muatSidebar(), muatDaftar(), muatGaleri(true)]);
  initGaleriModal();
  $("#btnLoadGaleri").addEventListener("click", () => muatGaleri(false));
  $("#btnLoadMore").addEventListener("click", () => muatBerita(false));
}

main();