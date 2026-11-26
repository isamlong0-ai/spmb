import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from "./config.js?v=19";
import { ambilTahunAktif } from "./tahun.js";

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const $ = (s) => document.querySelector(s);

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let data = [];
let jurusanAktif = "Semua";

function render() {
  const daftar = ["Semua", ...CONFIG.JURUSAN.slice().sort((a, b) => a.localeCompare(b, "id"))];
  const tabs = $("#pengumumanTabs");
  tabs.innerHTML = daftar.map((j) =>
    `<button type="button" class="jadwal-tab ${j === jurusanAktif ? "aktif" : ""}" data-jurusan="${escapeHtml(j)}">${escapeHtml(j)}</button>`).join("");
  tabs.querySelectorAll(".jadwal-tab").forEach((b) => b.addEventListener("click", () => {
    jurusanAktif = b.dataset.jurusan;
    render();
  }));

  const baris = data.filter((d) => jurusanAktif === "Semua" || d.jurusan_diterima === jurusanAktif);
  const body = $("#pengumumanBody");
  if (!baris.length) {
    body.innerHTML = `<tr><td colspan="9" style="padding:30px;color:var(--muted)">Belum ada pengumuman yang dipublikasikan.</td></tr>`;
  } else {
    body.innerHTML = baris.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="font-size:11px">${escapeHtml(d.no_pendaftaran_dinas || "-")}</td>
        <td><b>${escapeHtml(d.nama)}</b></td>
        <td>${escapeHtml(d.nisn || "-")}</td>
        <td>${escapeHtml(d.jurusan_diterima)}</td>
        <td>${d.total_nilai ?? "-"}</td>
        <td>${d.bobot_nilai ?? "-"}</td>
        <td>${d.bobot_tka ?? "-"}</td>
        <td>${d.bobot_prestasi ?? "-"}</td>
      </tr>`).join("");
  }
  $("#infoPengumuman").textContent = `${baris.length} siswa dinyatakan lulus · ${jurusanAktif}`;
}

async function muat() {
  const tahun = await ambilTahunAktif(supabase);
  document.querySelectorAll(".tahun-inline").forEach((el) => { el.textContent = tahun; });
  try {
    // RLS hanya mengembalikan baris import yang sudah dipublish & tidak nonaktif
    const { data: hasil, error } = await supabase
      .from("dinas_hasil")
      .select("urutan,no_pendaftaran_dinas,nama,nisn,jurusan_diterima,total_nilai,bobot_nilai,bobot_tka,bobot_prestasi,tahun_pelajaran")
      .eq("tahun_pelajaran", tahun)
      .order("jurusan_diterima", { ascending: true })
      .order("urutan", { ascending: true });
    if (error) throw error;
    data = hasil || [];
  } catch (e) {
    data = [];
  }
  const notice = $("#statusPengumuman");
  if (!data.length) {
    notice.classList.remove("hidden");
    notice.innerHTML = "📝 <b>Pengumuman belum dipublikasikan.</b> Silakan kembali beberapa saat lagi.";
  } else {
    notice.classList.add("hidden");
  }
  render();
}

muat();
