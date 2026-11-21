import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CONFIG, MAPEL, SEMESTER, FOTO_FIELDS } from "./config.js";
import { initWilayah } from "./wilayah.js";
import { ambilTahunAktif, tahunAwal } from "./tahun.js";

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const form = document.getElementById("formPendaftaran");
const statusBox = document.getElementById("status");
let currentStep = 1;
let totalSteps = 6;
let tahunAktif = CONFIG.TAHUN_PELAJARAN;
const fotoState = {};

/* ------------------------------ Utilitas ------------------------------ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function toast(pesan, tipe = "ok") {
  const el = document.createElement("div");
  el.className = `toast ${tipe === "ok" ? "" : tipe}`;
  el.textContent = pesan;
  $("#toastWrap").appendChild(el);
  setTimeout(() => el.remove(), 4500);
}

function setStatus(pesan, warna = "var(--muted)") {
  statusBox.textContent = pesan;
  statusBox.style.display = pesan ? "block" : "none";
  statusBox.style.borderColor = warna === "var(--danger)" ? "#fecaca" : "#bfdbfe";
  statusBox.style.color = warna;
}

function bukaModal(judul, isi) {
  $("#modalTitle").textContent = judul;
  $("#modalBody").innerHTML = isi;
  $("#overlay").classList.add("show");
  document.body.classList.add("lock-scroll");
}
function tutupModal() {
  $("#overlay").classList.remove("show");
  document.body.classList.remove("lock-scroll");
}

/* Fungsi global untuk inline handler di HTML */
window.toggleLain = function (selectEl, idWrapper) {
  const wrapper = $(idWrapper);
  if (!wrapper) return;
  const lain = selectEl.value === "Lainnya";
  wrapper.classList.toggle("hidden", !lain);
  const input = $("input", wrapper);
  if (input) {
    input.required = lain;
    if (!lain) input.value = "";
  }
};
window.toggleDetail = function (id, meninggal) {
  const box = $("#" + id);
  if (!box) return;
  box.classList.toggle("hidden", meninggal);
  $$("input, select", box).forEach((el) => { el.value = ""; });
};

/* Orang tua/wali meninggal: sembunyikan seluruh isian, sisakan nama & status */
window.toggleMeninggal = function (id, meninggal) {
  const box = $("#" + id);
  if (!box) return;
  box.classList.toggle("hidden", meninggal);
  $$("input, select, textarea", box).forEach((el) => {
    if (meninggal) {
      el.dataset.wajib = el.required ? "1" : "0";
      el.required = false;
      el.value = "";
    } else {
      el.required = el.dataset.wajib === "1";
    }
  });
};
window.toggleKip = function (ya) {
  const wrap = $("#kip_wrap");
  const input = $("#no_kip");
  wrap.classList.toggle("hidden", !ya);
  input.required = ya;
  if (!ya) input.value = "";
};
window.cekJurusan = function () {
  const vals = [1, 2, 3].map((i) => $("#jurusan" + i).value).filter(Boolean);
  const duplikat = new Set(vals).size !== vals.length;
  $("#jurusanWarning").style.display = duplikat ? "block" : "none";
  return !duplikat;
};

/* --------------------------- Inisialisasi UI --------------------------- */
function buildNilaiTable() {
  const tbody = $("#nilaiBody");
  tbody.innerHTML = "";
  MAPEL.forEach((mapel, mi) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${mapel}</td>` +
      SEMESTER.map((s) => `<td><input type="number" min="0" max="100" step="0.01" name="nilai_${mi}_${s}" placeholder="0–100" required aria-label="${mapel} semester ${s}"></td>`).join("");
    tbody.appendChild(tr);
  });
  tbody.addEventListener("input", updateRataRata);
}

function updateRataRata() {
  const nilai = $$("#nilaiBody input")
    .map((i) => parseFloat(i.value))
    .filter((n) => !isNaN(n));
  const semuaTerisi = $$("#nilaiBody input").every((i) => i.value !== "" && !isNaN(parseFloat(i.value)));
  $("#rata_rata").value = semuaTerisi && nilai.length
    ? (nilai.reduce((a, b) => a + b, 0) / nilai.length).toFixed(2)
    : "";
}

function buildFotoGrid() {
  const grid = $("#fotoGrid");
  grid.innerHTML = "";
  FOTO_FIELDS.forEach((f) => {
    const item = document.createElement("div");
    item.className = "foto-item";
    item.id = `foto_${f.key}_item`;
    item.innerHTML = `
      <label for="file_${f.key}">${f.label} ${f.required ? '<span style="color:var(--danger)">*</span>' : ""}</label>
      <input type="file" id="file_${f.key}" accept="image/jpeg,image/png,image/webp">
      <div class="foto-placeholder">📷 Klik untuk pilih foto</div>
      <img class="foto-preview" id="prev_${f.key}" alt="Pratinjau">
      <div class="foto-status" id="st_${f.key}">Belum dipilih</div>`;
    grid.appendChild(item);

    const input = $("#file_" + f.key, item);
    input.addEventListener("change", async () => {
      const file = input.files[0];
      const st = $("#st_" + f.key, item);
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast("File harus berupa gambar.", "error");
        input.value = "";
        return;
      }
      if (file.size > CONFIG.MAX_FOTO_BYTES) {
        toast("Ukuran foto maksimal 5 MB.", "error");
        input.value = "";
        return;
      }
      st.textContent = "Memproses gambar…";
      try {
        const dataUrl = await compressImage(file);
        fotoState[f.key] = { dataUrl, filename: `${f.key}_${Date.now()}.jpg`, url: null };
        const prev = $("#prev_" + f.key, item);
        prev.src = dataUrl;
        prev.classList.add("show");
        item.classList.add("has-foto");
        st.textContent = `✓ ${(file.size / 1024 / 1024).toFixed(2)} MB (siap unggah)`;
      } catch (err) {
        st.textContent = "Gagal memproses gambar";
        toast("Gagal memproses gambar: " + err.message, "error");
      }
    });
  });
}

function buildJurusanOptions() {
  [1, 2, 3].forEach((n) => {
    const sel = $("#jurusan" + n);
    CONFIG.JURUSAN.forEach((j) => {
      const o = document.createElement("option");
      o.value = j;
      o.textContent = j;
      sel.appendChild(o);
    });
  });
}

function bindGlobalEvents() {
  $$("[data-next]").forEach((b) => b.addEventListener("click", () => gotoStep(Number(b.dataset.next))));
  $$("[data-prev]").forEach((b) => b.addEventListener("click", () => gotoStep(Number(b.dataset.prev))));
  $$(".step").forEach((s) => s.addEventListener("click", () => {
    const t = Number(s.dataset.step);
    if (t < currentStep) gotoStep(t);
  }));

  $("#modalClose").addEventListener("click", tutupModal);
  $("#modalOk").addEventListener("click", tutupModal);
  $("#overlay").addEventListener("click", (e) => { if (e.target.id === "overlay") tutupModal(); });
  $("#cariClose").addEventListener("click", () => $("#overlayCari").classList.remove("show"));
  $("#overlayCari").addEventListener("click", (e) => { if (e.target.id === "overlayCari") $("#overlayCari").classList.remove("show"); });

  $("#btnBantuan").addEventListener("click", bukaBantuan);
  $("#btnCari").addEventListener("click", () => {
    $("#overlayCari").classList.add("show");
    $("#cariHasil").style.display = "none";
    $("#cariNisn").value = "";
  });
  $("#cariGo").addEventListener("click", cariData);
  $("#cariNisn").addEventListener("keydown", (e) => { if (e.key === "Enter") cariData(); });

  $("#btnPdf").addEventListener("click", unduhPDF);
  form.addEventListener("submit", submitAkhir);

  /* Bersihkan error saat pengguna memperbaiki input */
  form.addEventListener("input", (e) => {
    const field = e.target.closest(".field");
    if (!field) return;
    field.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
    const msg = field.querySelector(":scope > .error-msg");
    if (msg) msg.style.display = "none";
  });

  /* Batasi input angka pada field tertentu */
  const angka = ["nik", "kk", "nik_ayah", "nik_ibu", "nik_wali", "no_hp_siswa", "no_hp_orang_tua", "no_hp_wali", "nisn", "kode_pos", "rt", "rw"];
  angka.forEach((name) => {
    const el = form.elements[name];
    if (el) el.addEventListener("input", () => { el.value = el.value.replace(/\D/g, ""); });
  });
}

/* ---------------------------- Validasi form ---------------------------- */
function setInvalid(el, invalid) {
  const field = el.closest(".field") || el;
  const target = el.type === "radio" ? field.querySelector(".radio-row") || el : el;
  target.classList.toggle("is-invalid", invalid);
  const msg = field.querySelector(":scope > .error-msg");
  if (msg) msg.style.display = invalid ? "block" : "none";
}

function validateStep(n) {
  const page = $(`.step-page[data-page="${n}"]`);
  if (!page) return true;
  let valid = true;

  $$('input[required], select[required], textarea[required]', page).forEach((el) => {
    if (el.closest(".hidden")) return;
    let ok;
    if (el.type === "radio") {
      ok = $$(`input[name="${el.name}"]`, page).some((r) => r.checked);
      setInvalid($$(`input[name="${el.name}"]`, page)[0], !ok);
    } else if (el.type === "checkbox") {
      ok = el.checked;
      setInvalid(el, !ok);
    } else {
      ok = el.value.trim() !== "" && el.checkValidity();
      setInvalid(el, !ok);
    }
    if (!ok) valid = false;
  });

  if (n === 6 && !window.cekJurusan()) valid = false;
  return valid;
}

function gotoStep(n) {
  if (n > currentStep && !validateStep(currentStep)) {
    toast("Lengkapi kolom wajib yang masih kosong.", "warn");
    return;
  }
  $$(".step-page").forEach((p) => p.classList.toggle("hidden", Number(p.dataset.page) !== n));
  currentStep = n;
  $$(".step").forEach((s) => {
    const i = Number(s.dataset.step);
    s.classList.toggle("active", i === n);
    s.classList.toggle("done", i < n);
  });
  const pct = ((n - 1) / (totalSteps - 1)) * 100;
  $("#stepperFill").style.width = `calc(${pct}% * 0.88)`;
  setStatus("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* -------------------------- Upload & submit ---------------------------- */
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format gambar tidak didukung"));
      img.onload = () => {
        let { width, height } = img;
        const max = CONFIG.FOTO_MAX_DIMENSION;
        if (width > max || height > max) {
          const r = Math.min(max / width, max / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", CONFIG.FOTO_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function uploadFoto(base64, filename, tahun) {
  if (!CONFIG.DRIVE_UPLOAD_URL || CONFIG.DRIVE_UPLOAD_URL.startsWith("__")) {
    throw new Error("URL Web App Google Apps Script belum diisi di assets/js/config.js");
  }
  const res = await fetch(CONFIG.DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      base64,
      filename,
      folderId: CONFIG.DRIVE_FOLDER_ID,
      tahun: tahun || tahunAktif,
    }),
  });
  const teks = await res.text();
  let json;
  try { json = JSON.parse(teks); }
  catch { throw new Error("Balasan server tidak valid: " + teks.slice(0, 120)); }
  if (!json.ok) throw new Error(json.error || "Gagal mengunggah foto");
  return json.url;
}

function bersihkan(val) {
  if (val === undefined || val === null || val === "") return null;
  return typeof val === "string" ? val.trim() || null : val;
}

async function submitAkhir(e) {
  e.preventDefault();
  for (let i = 1; i <= totalSteps; i++) {
    if (!validateStep(i)) {
      gotoStep(i);
      toast("Masih ada data wajib yang belum lengkap.", "error");
      return;
    }
  }

  const btn = $("#btnKirim");
  btn.disabled = true;
  btn.textContent = "⏳ Memproses…";
  setStatus("Mengunggah foto ke Google Drive…", "var(--info)");

  try {
    const urls = {};
    for (const f of FOTO_FIELDS) {
      if (!fotoState[f.key]) continue;
      setStatus(`Mengunggah ${f.label}…`, "var(--info)");
      urls[f.key] = await uploadFoto(fotoState[f.key].dataUrl, fotoState[f.key].filename, tahunAktif);
      fotoState[f.key].url = urls[f.key];
    }

    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries());
    const angkaField = ["anak_ke", "jumlah_saudara", "tinggi_badan", "berat_badan", "tahun_lulus", "peringkat_5"];
    const payload = {};
    Object.keys(raw).forEach((k) => {
      if (!k || k === "setuju") return;
      payload[k] = angkaField.includes(k) ? Number(raw[k]) : bersihkan(raw[k]);
    });
    payload.punya_kip = raw.punya_kip === "Ya";
    payload.rata_rata = parseFloat($("#rata_rata").value) || null;
    FOTO_FIELDS.forEach((f) => { payload[f.key] = urls[f.key] || null; });

    const nilai = [];
    MAPEL.forEach((mapel, mi) => SEMESTER.forEach((s) => {
      nilai.push({
        mapel,
        semester: s,
        nilai: parseFloat($(`[name="nilai_${mi}_${s}"]`).value),
      });
    }));

    setStatus("Menyimpan data ke database…", "var(--info)");
    const { data: hasil, error } = await supabase.rpc("simpan_pendaftaran", {
      p_data: payload,
      p_nilai: nilai,
    });
    if (error) throw error;

    const row = Array.isArray(hasil) ? hasil[0] : hasil;
    const waktu = new Date().toLocaleString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).replace(/\./g, ":");

    $("#p_tahun").textContent = raw.tahun_pelajaran || tahunAktif;
    $("#p_kode").textContent = row?.kode_pendaftaran || "-";
    $("#p_nama").textContent = (raw.nama || "").toUpperCase();
    $("#p_nisn").textContent = raw.nisn || "";
    $("#p_sekolah").textContent = raw.nama_sekolah || "";
    $("#p_j1").textContent = raw.jurusan1 || "";
    $("#p_j2").textContent = raw.jurusan2 || "";
    $("#p_j3").textContent = raw.jurusan3 || "";
    $("#p_waktu").textContent = waktu + " WIB";

    form.classList.add("hidden");
    $("#stepper").classList.add("hidden");
    $(".hero").classList.add("hidden");
    $("#buktiBox").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Pendaftaran berhasil disimpan.");
  } catch (err) {
    let pesan = err?.message || String(err);
    if (pesan.includes("duplicate key") || pesan.includes("23505")) {
      pesan = "NISN atau NIK sudah terdaftar. Silakan hubungi panitia bila ini kesalahan.";
    }
    setStatus("Gagal menyimpan: " + pesan, "var(--danger)");
    toast("Gagal: " + pesan, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Kirim Pendaftaran ✓";
  }
}

/* --------------------------- Cek & bantuan ----------------------------- */
async function cariData() {
  const nisn = $("#cariNisn").value.trim();
  const box = $("#cariHasil");
  const btn = $("#cariGo");
  if (!nisn) {
    box.style.display = "block";
    box.innerHTML = '<span style="color:var(--danger)">Masukkan NISN terlebih dahulu.</span>';
    return;
  }
  box.style.display = "block";
  box.innerHTML = '<span style="color:var(--warn);font-weight:600">Sedang mencari… ⏳</span>';
  btn.disabled = true;
  try {
    const { data, error } = await supabase.rpc("cek_nisn", { p_nisn: nisn });
    if (error) throw error;
    const r = Array.isArray(data) ? data[0] : data;
    if (r?.ditemukan) {
      box.innerHTML = `
        <div style="color:var(--primary);font-weight:700;margin-bottom:6px">✓ Data ditemukan</div>
        <div><b>Nama:</b> ${escapeHtml(r.nama)}</div>
        <div><b>Asal Sekolah:</b> ${escapeHtml(r.sekolah)}</div>
        <div><b>Pilihan 1:</b> ${escapeHtml(r.jurusan1)}</div>
        <div><b>Pilihan 2:</b> ${escapeHtml(r.jurusan2)}</div>
        <div><b>Pilihan 3:</b> ${escapeHtml(r.jurusan3)}</div>
        <div><b>Tahun Pelajaran:</b> ${escapeHtml(r.tahun_pelajaran || "-")}</div>
        <div style="color:var(--muted);font-size:11px;margin-top:6px">Waktu daftar: ${escapeHtml(r.waktu_daftar)} WIB</div>`;
    } else {
      box.innerHTML = `<span style="color:var(--danger)">Data dengan NISN <b>${escapeHtml(nisn)}</b> belum terdaftar.</span>`;
    }
  } catch (err) {
    box.innerHTML = `<span style="color:var(--danger)">Terjadi kesalahan: ${escapeHtml(err.message)}</span>`;
  } finally {
    btn.disabled = false;
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function bukaBantuan() {
  const wa = (no, nama) => `<div style="padding:7px 0;display:flex;justify-content:space-between;align-items:center;gap:10px">
      <span>${nama}</span><a href="https://wa.me/${no}" target="_blank" rel="noopener" class="btn btn-sm btn-primary">Chat WA</a></div>`;
  bukaModal("Bantuan Pendaftaran", `
    <p style="margin-top:0">Jika mengalami kendala, hubungi panitia SPMB:</p>
    ${wa("6281345497178", "Randika")}
    ${wa("6285174399784", "Luffi Mardiansyah")}
    ${wa("6289694213072", "Reza Irwanda")}
    ${wa("6289694108488", "Aldino S")}
    ${wa("6289693332583", "Jumbadi")}
    ${wa("6285142816705", "Wawan K")}`);
}

function unduhPDF() {
  const btn = $("#btnPdf");
  const teks = btn.textContent;
  btn.disabled = true;
  btn.textContent = "⏳ Menyiapkan PDF…";
  const el = $("#notaCetak");
  const opsi = {
    margin: 6,
    filename: `BUKTI_SPMB_${$("#p_nisn").textContent}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF: { unit: "px", format: [el.offsetWidth, el.offsetHeight + 15], orientation: "portrait" },
    pagebreak: { mode: "avoid-all" },
  };
  html2pdf().set(opsi).from(el).save().finally(() => {
    btn.disabled = false;
    btn.textContent = teks;
  });
}

/* --------------------------- Tahun pelajaran ---------------------------- */
async function muatTahunAktif() {
  tahunAktif = await ambilTahunAktif(supabase);
  $("#tahun_pelajaran").value = tahunAktif;
  $("#tahunTopbar").textContent = `Tahun Pelajaran ${tahunAktif}`;
  $("#tahunBukti").textContent = `Tahun Pelajaran ${tahunAktif}`;

  // Tahun lulus mengikuti tahun pertama pada tahun pelajaran aktif
  const tahunLulusAwal = tahunAwal(tahunAktif);
  const sel = $("#tahun_lulus");
  sel.innerHTML = '<option value="">-- Pilih --</option>' +
    Array.from({ length: 5 }, (_, i) => {
      const t = tahunLulusAwal - i;
      return `<option value="${t}">${t}</option>`;
    }).join("");
}

/* ------------------------------- Start --------------------------------- */
muatTahunAktif();
buildNilaiTable();
buildFotoGrid();
buildJurusanOptions();
bindGlobalEvents();
initWilayah();
gotoStep(1);

/* Jika dibuka dari beranda dengan #cek, langsung tampilkan popup pencarian */
if (location.hash === "#cek") {
  setTimeout(() => $("#overlayCari").classList.add("show"), 300);
} else {
/* Pengumuman awal */
setTimeout(() => {
  bukaModal("Selamat Datang!", `
    <p style="margin-top:0">Sebelum mengisi formulir, siapkan dokumen berikut:</p>
    <ul style="margin:8px 0 0;padding-left:20px;line-height:1.9">
      <li>Kartu Keluarga (KK)</li><li>Akta Lahir</li>
      <li>Rapor SMP / Sederajat</li><li>Kartu Indonesia Pintar (jika ada)</li>
      <li>Foto siswa terbaru</li>
    </ul>
    <p style="margin-bottom:0">Pastikan seluruh data diisi dengan benar dan jujur.</p>`);
}, 700);
}
