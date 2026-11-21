/**
 * Pengaman halaman formulir.
 * Jika formulir belum dibuka / sudah ditutup, seluruh form dinonaktifkan
 * dan pengunjung dikembalikan ke beranda.
 * (Bukan pengamanan server — aturan tegas tetap ada di RLS/landing.)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG } from "./config.js?v=15";
import { ambilStatus, LABEL_STATUS } from "./status.js";

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const info = await ambilStatus(supabase);
const bolehLewat = new URLSearchParams(location.search).has("akses");

if (info.status !== "dibuka" && !bolehLewat) {
  document.body.classList.add("lock-scroll");
  const form = document.getElementById("formPendaftaran");
  const bukti = document.getElementById("buktiBox");
  if (form) form.style.pointerEvents = "none";
  if (bukti) bukti.style.pointerEvents = "none";
  document.querySelectorAll(".fab-group button").forEach((b) => { b.disabled = true; b.style.opacity = ".4"; });

  const overlay = document.createElement("div");
  overlay.id = "guardTutup";
  overlay.style.cssText = "position:fixed;inset:0;z-index:500;background:rgba(15,23,42,.75);display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(4px)";
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:30px;max-width:440px;width:100%;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.3)">
      <div style="font-size:44px;margin-bottom:8px">${info.status === "akan-datang" ? "⏳" : "🔒"}</div>
      <h2 style="margin:0 0 10px;font-size:21px">Formulir ${LABEL_STATUS[info.status]}</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 18px">
        ${info.status === "akan-datang"
          ? `Formulir pengumpulan data belum dapat diisi. Jadwal pengisian:<br><b>${info.waktu_pendaftaran || "-"}</b>`
          : "Masa pengisian formulir telah berakhir. Formulir tidak lagi tersedia."}
      </p>
      <p style="font-size:12px;color:#64748b;margin:0 0 16px">Untuk pendaftaran resmi, kunjungi <a href="https://spmb-dikbud.kalbarprov.go.id/" target="_blank" rel="noopener">portal dinas</a>.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a class="btn btn-primary" href="index.html">← Kembali ke Beranda</a>
        <a class="btn btn-ghost" href="admin.html">Area Admin</a>
      </div>
      <p style="font-size:11px;color:#94a3b8;margin:18px 0 0">Butuh bantuan? Hubungi panitia melalui menu Bantuan di beranda.</p>
    </div>`;
  document.body.appendChild(overlay);
}
