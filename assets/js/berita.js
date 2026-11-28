import { getInfo, getBerita, listBerita } from "./api.js?v=7";

const $ = (s, r = document) => r.querySelector(s);
function toast(msg, type = "") {
  const el = document.createElement("div");
  el.className = `toast ${type}`; el.textContent = msg;
  $("#toastWrap").appendChild(el); setTimeout(() => el.remove(), 3500);
}
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

async function main() {
  const id = new URLSearchParams(location.search).get("id");
  const wrap = $("#beritaDetail");
  try { const info = await getInfo(); if (info.logo_url) { const lg = $("#navLogo"); if (lg) lg.src = info.logo_url; } } catch (e) {}
  if (!id) { wrap.innerHTML = "<p>Berita tidak ditemukan.</p>"; return; }
  try {
    const b = await getBerita(id);
    const tgl = new Date(b.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
    wrap.innerHTML = `
      ${b.gambar_url ? `<img src="${b.gambar_url}" alt="" style="width:100%;border-radius:14px;margin-bottom:18px">` : ""}
      <div class="news-meta" style="margin-bottom:10px"><span class="badge cat">${escapeHtml(b.kategori || "Umum")}</span><span>${tgl}</span>${b.penulis ? " &bull; " + escapeHtml(b.penulis) : ""}</div>
      <h1 style="color:var(--navy);margin:0 0 12px">${escapeHtml(b.judul)}</h1>
      <div class="isi" style="white-space:pre-line;color:var(--ink-2);font-size:16px;line-height:1.8">${escapeHtml(b.isi || b.ringkasan || "")}</div>
    `;
    document.title = (b.judul || "Berita") + " — SMKN 1 Teluk Keramat";
    // related
    try {
      const { data } = await listBerita({ kategori: b.kategori, limit: 4, publishedOnly: true });
      const rel = data.filter(x => x.id !== b.id).slice(0, 3);
      if (rel.length) {
        $("#beritaRelated").innerHTML = `<h4>Berita Terkait</h4>` + rel.map(r => `
          <div class="related-item" data-id="${r.id}">
            <div class="ri-title">${escapeHtml(r.judul)}</div>
            <div class="ri-date">${new Date(r.tanggal).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" })}</div>
          </div>`).join("");
        $("#beritaRelated").querySelectorAll(".related-item").forEach(el => el.addEventListener("click", () => location.href = `berita.html?id=${el.dataset.id}`));
      }
    } catch (e) {}
  } catch (e) {
    wrap.innerHTML = "<p>Berita tidak ditemukan atau belum dipublikasikan.</p>";
  }
  // hamburger
  const hb = $("#hamburger");
  if (hb) hb.addEventListener("click", () => $("#menu").classList.toggle("open"));
}

main();