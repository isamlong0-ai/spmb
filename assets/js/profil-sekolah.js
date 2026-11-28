import { getInfo } from "./api.js";

const $ = (s, r = document) => r.querySelector(s);
function escapeHtml(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c])); }

function tableRows(rows) {
  if (!rows || rows.length === 0) return "<p style='color:var(--muted)'>Tidak ada data.</p>";
  return `<table class="table" style="margin-bottom:18px"><tbody>` +
    rows.map(([k,v]) => `<tr><th style="width:40%">${escapeHtml(k)}</th><td>${escapeHtml(v || "Tidak ada data")}</td></tr>`).join("") +
    `</tbody></table>`;
}

function linesToTable(text, cols) {
  if (!text) return "<p style='color:var(--muted)'>Tidak ada data.</p>";
  const rows = text.split("\n").map(l => l.trim()).filter(Boolean).map(l => l.split("|").map(x => x.trim()));
  if (rows.length === 0) return "<p style='color:var(--muted)'>Tidak ada data.</p>";
  // header
  let html = `<table class="table" style="margin-bottom:18px"><thead><tr>` + cols.map(c => `<th>${escapeHtml(c)}</th>`).join("") + `</tr></thead><tbody>`;
  rows.forEach(r => { html += `<tr>` + cols.map((_,i) => `<td>${escapeHtml(r[i] || "")}</td>`).join("") + `</tr>`; });
  html += `</tbody></table>`;
  return html;
}

async function main() {
  try {
    const info = await getInfo();
    if (info.logo_url) { const lg = $("#navLogo"); if (lg) lg.src = info.logo_url; }
    $("#psNama").textContent = info.nama_sekolah || "Profil Sekolah";
    const d = info.detail || {};
    const content = $("#psContent");
    let html = "";

    // A. Identitas
    html += `<h2 style="color:var(--navy)">A. Identitas Sekolah</h2>`;
    html += tableRows([
      ["NPSN", d.npsn],
      ["Nama Sekolah", info.nama_sekolah],
      ["Bentuk Pendidikan", d.bentuk],
      ["Status Sekolah", d.status_sekolah],
      ["Akreditasi", d.akreditasi],
      ["Alamat Jalan", d.alamat_jalan || info.alamat],
      ["Provinsi", d.provinsi],
      ["Kabupaten/Kota", d.kabupaten],
      ["Kecamatan", d.kecamatan],
      ["Desa/Kelurahan", d.desa],
      ["Kode Pos", d.kode_pos],
      ["Email", d.email || info.email],
      ["Website", d.website],
      ["Nomor Telepon", d.telepon || info.telepon],
      ["Luas Tanah (m²)", d.luas_tanah],
      ["Nomor SK Pendirian", d.sk_pendirian],
      ["Tanggal SK Pendirian", d.tgl_sk_pendirian],
      ["Nomor SK Akreditasi", d.sk_akreditasi],
      ["Tanggal SK Akreditasi", d.tgl_sk_akreditasi],
      ["Status Sertifikat ISO", d.iso],
      ["Sumber Listrik", d.listrik],
      ["Daya Listrik (VA)", d.daya],
      ["Akses Internet", d.internet],
      ["Penyedia Internet", d.provider],
      ["Lintang", d.lintang],
      ["Bujur", d.bujur],
    ]);

    // B. Siswa
    html += `<h2 style="color:var(--navy)">B. Siswa, Kelas, Rombel, dan Program Keahlian</h2>`;
    html += tableRows([
      ["Jumlah Peserta Didik", d.jml_siswa],
      ["Siswa Laki-laki", d.siswa_l],
      ["Siswa Perempuan", d.siswa_p],
      ["Jumlah Rombel", d.rombel],
      ["Jumlah Program Keahlian", d.jml_prog],
    ]);
    if (d.program) {
      html += `<h4 style="color:var(--navy)">Program Keahlian</h4><ul>` + d.program.split("\n").map(l => l.trim()).filter(Boolean).map(l => `<li>${escapeHtml(l)}</li>`).join("") + `</ul>`;
    }
    if (d.rombel_detail) {
      html += `<h4 style="color:var(--navy)">Rombel per Kompetensi</h4>`;
      html += linesToTable(d.rombel_detail, ["Kompetensi","Tingkat I","Tingkat II","Tingkat III","Tingkat IV","Total"]);
    }

    // C. Sarpras
    html += `<h2 style="color:var(--navy)">C. Sarana dan Prasarana</h2>`;
    if (d.ruangan) {
      html += `<h4 style="color:var(--navy)">Ruangan</h4>`;
      html += linesToTable(d.ruangan, ["Jenis Ruang","Jumlah","Luas (m²)"]);
    }
    if (d.peralatan) {
      html += `<h4 style="color:var(--navy)">Peralatan</h4>`;
      html += linesToTable(d.peralatan, ["Jenis Sarana","Nama","Jumlah","Status"]);
    }
    if (!d.ruangan && !d.peralatan) html += "<p style='color:var(--muted)'>Tidak ada data.</p>";

    // D. Ketenagaan
    html += `<h2 style="color:var(--navy)">D. Ketenagaan</h2>`;
    html += tableRows([
      ["Guru (Laki-laki)", d.guru_l],
      ["Guru (Perempuan)", d.guru_p],
      ["Tenaga Admin (Laki-laki)", d.admin_l],
      ["Tenaga Admin (Perempuan)", d.admin_p],
    ]);
    if (d.guru_mapel) {
      html += `<h4 style="color:var(--navy)">Guru per Mata Pelajaran</h4>`;
      html += linesToTable(d.guru_mapel, ["Mata Pelajaran","L","P","Total"]);
    }

    // E. DUDI
    html += `<h2 style="color:var(--navy)">E. Kerja Sama DUDI</h2>`;
    if (d.dudi) {
      html += linesToTable(d.dudi, ["Nama Mitra","Bentuk Kerjasama","Bidang Usaha","Status"]);
    } else {
      html += "<p style='color:var(--muted)'>Tidak ada data.</p>";
    }

    // Map
    if (d.lintang && d.bujur) {
      html += `<h2 style="color:var(--navy)">Peta Lokasi</h2>`;
      html += `<div class="map-wrap"><iframe src="https://www.google.com/maps?q=${encodeURIComponent(d.lintang + "," + d.bujur)}&output=embed" loading="lazy" allowfullscreen></iframe></div>`;
    }

    content.innerHTML = html;
  } catch (e) {
    $("#psContent").innerHTML = "<p style='color:var(--muted)'>Gagal memuat profil sekolah.</p>";
  }
  const hb = $("#hamburger");
  if (hb) hb.addEventListener("click", () => $("#menu").classList.toggle("open"));
}

main();