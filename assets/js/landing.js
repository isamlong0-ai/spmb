import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from "./config.js";
import { ambilTahunAktif, tahunPelajaran } from "./tahun.js";

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const $ = (s) => document.querySelector(s);

const DEFAULT = {
  judul: "Selamat Datang di Penerimaan Murid Baru",
  tagline: "Raih masa depanmu bersama keluarga besar SMK Negeri 1 Teluk Keramat.",
  sambutan: "Isi sambutan belum diatur. Silakan atur melalui panel admin.",
  tahun_pelajaran: CONFIG.TAHUN_PELAJARAN,
  waktu_pendaftaran: "-",
  tanggal_mulai: null,
  tanggal_selesai: null,
};

function parseTanggal(s) {
  if (!s) return null;
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function aturCountdown(target, caption) {
  $("#cdCaption").textContent = caption;
  const box = $("#lpCountdown");
  if (!target) { box.style.display = "none"; return; }
  box.style.display = "grid";

  const tick = () => {
    const selisih = target.getTime() - Date.now();
    if (selisih <= 0) {
      $("#cdHari").textContent = "0";
      $("#cdJam").textContent = "0";
      $("#cdMenit").textContent = "0";
      $("#cdDetik").textContent = "0";
      return;
    }
    const hari = Math.floor(selisih / 86400000);
    const jam = Math.floor((selisih % 86400000) / 3600000);
    const menit = Math.floor((selisih % 3600000) / 60000);
    const detik = Math.floor((selisih % 60000) / 1000);
    $("#cdHari").textContent = hari;
    $("#cdJam").textContent = jam;
    $("#cdMenit").textContent = menit;
    $("#cdDetik").textContent = detik;
  };
  tick();
  setInterval(tick, 1000);
}

function render(data, tahunAktif) {
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

  const mulai = parseTanggal(d.tanggal_mulai);
  const selesai = parseTanggal(d.tanggal_selesai);
  const hariIni = new Date();
  hariIni.setHours(0, 0, 0, 0);
  const status = $("#lpStatus");

  if (!mulai || !selesai) {
    status.className = "lp-status dibuka";
    status.textContent = "Dibuka";
    aturCountdown(null, "");
  } else if (hariIni < mulai) {
    status.className = "lp-status akan-datang";
    status.textContent = "Akan Datang";
    aturCountdown(mulai, "Menuju pembukaan pendaftaran:");
  } else if (hariIni > selesai) {
    status.className = "lp-status ditutup";
    status.textContent = "Ditutup";
    aturCountdown(null, "Pendaftaran telah berakhir.");
  } else {
    status.className = "lp-status dibuka";
    status.textContent = "Dibuka";
    aturCountdown(new Date(selesai.getTime() + 86400000), "Menuju penutupan pendaftaran:");
  }
}

async function muat() {
  const tahun = await ambilTahunAktif(supabase);
  try {
    const { data } = await supabase.from("landing").select("*").eq("id", 1).maybeSingle();
    render(data, tahun);
  } catch (e) {
    render(null, tahun);
  }
}

muat();
