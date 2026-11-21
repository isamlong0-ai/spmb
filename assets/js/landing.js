import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from "./config.js";
import { ambilTahunAktif, tahunPelajaran } from "./tahun.js";
import { ambilStatus, hitungStatus, LABEL_STATUS, parseTanggal } from "./status.js";

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const $ = (s) => document.querySelector(s);

const DEFAULT = {
  judul: "Selamat Datang di Pengumpulan Data Calon Siswa",
  tagline: "Raih masa depanmu bersama keluarga besar SMK Negeri 1 Teluk Keramat.",
  sambutan: "Isi sambutan belum diatur. Silakan atur melalui panel admin.",
  tahun_pelajaran: CONFIG.TAHUN_PELAJARAN,
  waktu_pendaftaran: "-",
  tanggal_mulai: null,
  tanggal_selesai: null,
};

function aturCountdown(target, caption) {
  $("#cdCaption").textContent = caption;
  const box = $("#lpCountdown");
  if (!target) { box.style.display = "none"; return; }
  box.style.display = "grid";
  const tick = () => {
    const s = target.getTime() - Date.now();
    if (s <= 0) {
      $("#cdHari").textContent = $("#cdJam").textContent = $("#cdMenit").textContent = $("#cdDetik").textContent = "0";
      return;
    }
    $("#cdHari").textContent = Math.floor(s / 86400000);
    $("#cdJam").textContent = Math.floor((s % 86400000) / 3600000);
    $("#cdMenit").textContent = Math.floor((s % 3600000) / 60000);
    $("#cdDetik").textContent = Math.floor((s % 60000) / 1000);
  };
  tick();
  setInterval(tick, 1000);
}

/** Kunci semua tautan/form bila formulir belum dibuka atau sudah ditutup. */
function terapkanGate(status, data) {
  const buka = status === "dibuka";
  const notice = $("#lpGateNotice");
  document.querySelectorAll("[data-requires-open]").forEach((el) => {
    el.classList.toggle("terkunci", !buka);
    if (buka) el.removeAttribute("aria-disabled");
    else {
      el.setAttribute("aria-disabled", "true");
      el.title = status === "akan-datang"
        ? `Formulir belum dibuka. Mulai ${data.waktu_pendaftaran || "-"}.`
        : "Formulir sudah ditutup.";
    }
  });
  if (!buka) {
    notice.classList.remove("hidden");
    notice.classList.toggle("closed", status === "ditutup");
    notice.innerHTML = status === "akan-datang"
      ? `⏳ <b>Formulir pengumpulan data belum dibuka.</b> Pengisian &amp; pengecekan data sedang dinonaktifkan. Jadwal: ${data.waktu_pendaftaran || "-"}. Untuk pendaftaran resmi, kunjungi <a href="https://spmb-dikbud.kalbarprov.go.id/" target="_blank" rel="noopener">portal dinas</a>.`
      : `🔒 <b>Formulir pengumpulan data sudah ditutup.</b> Pengisian &amp; pengecekan data tidak tersedia. Untuk pendaftaran resmi, kunjungi <a href="https://spmb-dikbud.kalbarprov.go.id/" target="_blank" rel="noopener">portal dinas</a>.`;
  }
}

function render(data, tahunAktif, statusInfo) {
  const d = { ...DEFAULT, ...(data || {}) };
  const tahunDitampilkan = tahunAktif || d.tahun_pelajaran || tahunPelajaran();
  document.title = `${d.judul} — SMKN 1 Teluk Keramat`;
  $("#lpJudul").textContent = d.judul;
  $("#lpTagline").textContent = d.tagline;
  $("#lpSambutan").textContent = d.sambutan;
  $("#lpTahun").textContent = tahunDitampilkan;
  $("#lpWaktu").textContent = d.waktu_pendaftaran;
  document.querySelectorAll(".tahun-inline").forEach((el) => { el.textContent = tahunDitampilkan; });
  $("#lpTahunPoros").textContent = new Date().getFullYear();

  const status = statusInfo?.status || hitungStatus(d);
  const elStatus = $("#lpStatus");
  elStatus.className = `lp-status ${status}`;
  elStatus.textContent = LABEL_STATUS[status];

  const mulai = parseTanggal(d.tanggal_mulai);
  const selesai = parseTanggal(d.tanggal_selesai);
  const modeManual = !!d.status_pendaftaran;

  if (modeManual) {
    // Mode manual: status dikontrol admin, hitung mundur dinonaktifkan
    aturCountdown(null, status === "dibuka"
      ? "Formulir pengumpulan data sedang dibuka."
      : "Status formulir diatur oleh panitia.");
  } else if (status === "akan-datang") {
    aturCountdown(mulai, "Menuju pembukaan formulir:");
  } else if (status === "ditutup") {
    aturCountdown(null, "Pengisian formulir telah berakhir.");
  } else {
    aturCountdown(selesai ? new Date(selesai.getTime() + 86400000) : null, "Menuju penutupan formulir:");
  }

  terapkanGate(status, d);
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function barJurusan(label, jumlah, persen, maks) {
  const lebar = maks ? Math.max(3, Math.round((jumlah / maks) * 100)) : 0;
  return `<div class="chart-row">
    <div class="chart-label" title="${escapeHtml(label)}">${escapeHtml(label)}</div>
    <div class="chart-track"><div class="chart-fill" style="width:${lebar}%"></div></div>
    <div class="chart-nilai">${persen}%</div>
  </div>`;
}

function renderInfoDinas(info, jurusan, tahun) {
  const portal = "https://spmb-dikbud.kalbarprov.go.id/";
  const sumber = info?.sumber_update || "";

  const strip = $("#dinasStrip");
  if (strip) {
    strip.textContent = sumber
      ? `${sumber}` + (info?.minat_persen ? ` · Minat SMKN 1 Teluk Keramat: ${info.minat_persen}%` : "")
      : "";
  }
  $("#dinasSumber").textContent = sumber
    ? `Bersumber dari portal resmi SPMB Dinas Pendidikan Kalimantan Barat · ${sumber}`
    : "Bersumber dari portal resmi SPMB Dinas Pendidikan Kalimantan Barat.";

  const daftar = Array.isArray(info?.pengumuman) ? info.pengumuman : [];
  const ul = $("#dinasPengumuman");
  if (ul) {
    ul.innerHTML = daftar.length
      ? daftar.slice(0, 4).map((p) => `<li>${escapeHtml(p)}</li>`).join("")
      : "<li>Belum ada pengumuman yang ditampilkan.</li>";
  }
  if (info?.jadwal_url) $("#dinasJadwal").href = info.jadwal_url;
  if (info?.surat_url) $("#dinasSurat").href = info.surat_url;
  if (info?.video_smk_url) $("#dinasVideo").href = info.video_smk_url;
  $("#dinasPortalLink").href = portal;

  const minat = $("#dinasMinat");
  if (minat) {
    minat.innerHTML = info?.minat_pendaftar != null
      ? `<div style="font-size:26px;font-weight:800;color:var(--primary);line-height:1.2">${escapeHtml(info.minat_persen || "0")}%</div>
         <div style="margin-top:6px"><b>${escapeHtml(info.minat_nama_sekolah || "SMKN 1 Teluk Keramat")}</b></div>
         <div>${Number(info.minat_pendaftar).toLocaleString("id-ID")} pendaftar / ${Number(info.minat_kuota || 0).toLocaleString("id-ID")} kuota</div>`
      : "Data belum tersedia.";
  }

  $("#jurusanTahun").textContent = tahun;
  const chart = $("#jurusanChart");
  if (chart) {
    const maks = jurusan.length ? Number(jurusan[0].jumlah) : 0;
    chart.innerHTML = jurusan.length
      ? jurusan.slice(0, 7).map((j) => barJurusan(j.jurusan, Number(j.jumlah), j.persen, maks)).join("")
      : '<div class="hint">Belum ada data formulir pada tahun ini.</div>';
  }
}

async function muatInfoDinas(tahun) {
  try {
    const [r1, r2] = await Promise.all([
      supabase.from("dinas_info").select("*").eq("id", 1).maybeSingle(),
      supabase.rpc("statistik_minat_jurusan", { p_tahun: tahun }),
    ]);
    renderInfoDinas(r1.data, r2.data || [], tahun);
  } catch (e) {
    renderInfoDinas(null, [], tahun);
  }
}

async function muat() {
  const [tahun, statusInfo] = await Promise.all([
    ambilTahunAktif(supabase),
    ambilStatus(supabase),
  ]);
  try {
    const { data } = await supabase.from("landing").select("*").eq("id", 1).maybeSingle();
    render(data, tahun, statusInfo);
  } catch (e) {
    render(null, tahun, statusInfo);
  }
  muatInfoDinas(tahun);
}

muat();
