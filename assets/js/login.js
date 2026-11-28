import { getSession, signIn, signOut, webRole } from "./api.js?v=9";
import { CONFIG } from "./config.js";

const $ = (s, r = document) => r.querySelector(s);

function show(id) { document.getElementById(id).style.display = ""; }
function hide(id) { document.getElementById(id).style.display = "none"; }

async function renderChooser(user) {
  $("#userEmail").textContent = user.email;
  const role = await webRole();
  const cards = [];
  const canWeb = ["superadmin","admin","admin_web","editor"].includes(role);
  const canSpmb = ["superadmin","admin","admin_spmb"].includes(role);
  if (canWeb) cards.push({ ic: "🌐", title: "Website Sekolah", desc: "Berita, informasi, profil, dan kontak sekolah.", href: "dashboard.html" });
  if (canSpmb) cards.push({ ic: "🎓", title: "SPMB", desc: "Data calon siswa, pengumuman, dan konten SPMB.", href: "spmb/admin.html" });
  if (cards.length === 0) {
    $("#dashGrid").innerHTML = `<p style="color:var(--muted)">Akun Anda tidak memiliki akses dashboard.</p>`;
    return;
  }
  $("#dashGrid").innerHTML = cards.map(c => `
    <div class="dash-card" data-href="${c.href}">
      <div class="ic">${c.ic}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
    </div>`).join("");
  $("#dashGrid").querySelectorAll(".dash-card").forEach(c => c.addEventListener("click", () => location.href = c.dataset.href));
  hide("loginView"); show("chooserView");
}

async function init() {
  const session = await getSession();
  if (session) { await renderChooser(session.user); return; }
  show("loginView"); hide("chooserView");

  $("#btnLogin").addEventListener("click", async () => {
    const btn = $("#btnLogin");
    btn.disabled = true; btn.textContent = "Memproses…";
    $("#loginError").textContent = "";
    const { data, error } = await signIn($("#email").value, $("#password").value);
    btn.disabled = false; btn.textContent = "Masuk";
    if (error) { $("#loginError").textContent = error.message; return; }
    await renderChooser(data.user);
  });
  $("#password").addEventListener("keydown", e => { if (e.key === "Enter") $("#btnLogin").click(); });
  $("#btnLogout").addEventListener("click", async () => { await signOut(); location.reload(); });
}

init();