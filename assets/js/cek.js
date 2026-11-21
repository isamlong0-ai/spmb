import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from "./config.js";
import { ambilStatus, LABEL_STATUS } from "./status.js";

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const $ = (s) => document.querySelector(s);
let dataTerakhir = null;

const statusInfo = await ambilStatus(supabase);
if (statusInfo.status !== "dibuka" && !new URLSearchParams(location.search).has("akses")) {
  document.body.classList.add("lock-scroll");
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;inset:0;z-index:500;background:rgba(15,23,42,.75);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(4px)";
  box.innerHTML = `<div style="background:#fff;border-radius:18px;padding:30px;max-width:420px;width:100%;text-align:center">
    <div style="font-size:42px">${statusInfo.status === "akan-datang" ? "⏳" : "🔒"}</div>
    <h2 style="margin:8px 0">Pendaftaran ${LABEL_STATUS[statusInfo.status]}</h2>
    <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 18px">Pengecekan data tidak tersedia saat pendaftaran ${LABEL_STATUS[statusInfo.status].toLowerCase()}.</p>
    <a class="btn btn-primary" href="index.html">← Kembali ke Beranda</a>
  </div>`;
  document.body.appendChild(box);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function toast(pesan, tipe = "") {
  const el = document.createElement("div");
  el.className = `toast ${tipe}`;
  el.textContent = pesan;
  $("#toastWrap").appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function isiBukti(r) {
  $("#c_tahun").textContent = r.tahun_pelajaran || "-";
  $("#c_kode").textContent = r.kode_pendaftaran || "-";
  $("#c_nama").textContent = String(r.nama || "").toUpperCase();
  $("#c_nisn").textContent = $("#nisn").value.trim();
  $("#c_sekolah").textContent = r.sekolah || "-";
  $("#c_j1").textContent = r.jurusan1 || "-";
  $("#c_j2").textContent = r.jurusan2 || "-";
  $("#c_j3").textContent = r.jurusan3 || "-";
  $("#c_waktu").textContent = new Date().toLocaleString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).replace(/\./g, ":") + " WIB";
}

async function cari() {
  const nisn = $("#nisn").value.trim();
  const hasil = $("#hasil");
  const btn = $("#btnCari");
  if (!nisn) {
    hasil.style.display = "block";
    hasil.innerHTML = '<div class="callout" style="background:var(--danger-50);border-color:#fecaca;color:#991b1b">Masukkan NISN terlebih dahulu.</div>';
    return;
  }
  btn.disabled = true;
  btn.textContent = "⏳ Mencari…";
  hasil.style.display = "block";
  hasil.innerHTML = '<div class="callout">Sedang mencari data… ⏳</div>';
  $("#buktiCetak").classList.add("hidden");
  try {
    const { data, error } = await supabase.rpc("cek_nisn", { p_nisn: nisn });
    if (error) throw error;
    const r = Array.isArray(data) ? data[0] : data;
    if (!r?.ditemukan) {
      hasil.innerHTML = `<div class="callout" style="background:var(--danger-50);border-color:#fecaca;color:#991b1b">Data dengan NISN <b>${escapeHtml(nisn)}</b> belum terdaftar atau tidak ditemukan.</div>`;
      return;
    }
    dataTerakhir = r;
    hasil.innerHTML = `
      <div class="bukti-success" style="margin-bottom:14px">✓ Data ditemukan</div>
      <div class="callout">
        <div><b>Nama:</b> ${escapeHtml(r.nama)}</div>
        <div><b>Asal Sekolah:</b> ${escapeHtml(r.sekolah)}</div>
        <div><b>Tahun Pelajaran:</b> ${escapeHtml(r.tahun_pelajaran || "-")}</div>
        <div style="margin-top:6px"><b>Pilihan Jurusan:</b></div>
        <div>1. ${escapeHtml(r.jurusan1)}</div>
        <div>2. ${escapeHtml(r.jurusan2)}</div>
        <div>3. ${escapeHtml(r.jurusan3)}</div>
        <div style="margin-top:6px;color:var(--muted);font-size:12px">Waktu daftar: ${escapeHtml(r.waktu_daftar)} WIB</div>
      </div>`;
    isiBukti(r);
    $("#buktiCetak").classList.remove("hidden");
  } catch (e) {
    hasil.innerHTML = `<div class="callout" style="background:var(--danger-50);border-color:#fecaca;color:#991b1b">Terjadi kesalahan: ${escapeHtml(e.message)}</div>`;
  } finally {
    btn.disabled = false;
    btn.textContent = "🔍 Cari Data";
  }
}

$("#btnCari").addEventListener("click", cari);
$("#nisn").addEventListener("keydown", (e) => { if (e.key === "Enter") cari(); });
$("#nisn").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, ""); });
$("#btnCetak").addEventListener("click", () => window.print());
$("#btnPdf").addEventListener("click", () => {
  if (!dataTerakhir) return;
  const btn = $("#btnPdf");
  btn.disabled = true;
  btn.textContent = "⏳ Menyiapkan PDF…";
  isiBukti(dataTerakhir);
  const el = $("#areaCetak");
  html2pdf().set({
    margin: 6,
    filename: `BUKTI_SPMB_${$("#nisn").value.trim()}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF: { unit: "px", format: [el.offsetWidth, el.offsetHeight + 15], orientation: "portrait" },
    pagebreak: { mode: "avoid-all" },
  }).from(el).save().finally(() => {
    btn.disabled = false;
    btn.textContent = "⬇ Unduh PDF";
  });
});

const params = new URLSearchParams(location.search);
if (params.get("nisn") && statusInfo.status === "dibuka") {
  $("#nisn").value = params.get("nisn");
  cari();
}
