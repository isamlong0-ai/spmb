import { getSession, signOut } from "./api.js?v=9";

const IDLE_MS = 15 * 60 * 1000;      // 15 menit
const WARN_MS = 2 * 60 * 1000;       // peringatan 2 menit sebelum logout

let timer = null;
let warnTimer = null;
let warningEl = null;

function redirectTarget() {
  return location.pathname.replace(/\/[^/]*$/, "").includes("/spmb") ? "../akses.html" : "akses.html";
}

async function doLogout() {
  try { await signOut(); } catch (e) {}
  location.href = redirectTarget();
}

function showWarning() {
  if (warningEl) return;
  warningEl = document.createElement("div");
  warningEl.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:9999;background:#0f172a;color:#fff;padding:18px;border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.3);max-width:320px;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.5";
  warningEl.innerHTML = `<strong>Sesi hampir berakhir</strong><div style="color:#cbd5e1;margin:6px 0 12px">Anda akan logout otomatis dalam 2 menit karena tidak ada aktivitas.</div><button id="idleStay" style="background:#10b981;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:600;cursor:pointer">Tetap Aktif</button>`;
  document.body.appendChild(warningEl);
  document.getElementById("idleStay").addEventListener("click", resetTimers);
}

function resetTimers() {
  clearTimeout(timer);
  clearTimeout(warnTimer);
  if (warningEl) { warningEl.remove(); warningEl = null; }
  timer = setTimeout(doLogout, IDLE_MS);
  warnTimer = setTimeout(showWarning, IDLE_MS - WARN_MS);
}

async function init() {
  const session = await getSession();
  if (!session) return;
  ["click", "keydown", "scroll", "mousemove", "touchstart"].forEach(evt =>
    window.addEventListener(evt, resetTimers, { passive: true })
  );
  resetTimers();
}

init();