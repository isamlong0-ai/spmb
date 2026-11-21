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
}

muat();
