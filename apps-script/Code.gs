/**
 * =============================================================================
 * SPMB SMK Negeri 1 Teluk Keramat — Google Drive Upload Proxy
 * =============================================================================
 * Web App ini menerima foto (base64) dari form HTML, lalu menyimpannya ke
 * folder Google Drive panitia. Frontend memanggil doPost lewat fetch().
 *
 * Cara pasang: lihat apps-script/PANDUAN.md
 */

const DEFAULT_FOLDER_ID = '1iRtqkKP46f-hVwdpKlioHxdF2I8FDlQT';
// Token sederhana: mencegah penyalahgunaan URL Web App oleh pihak yang hanya punya link.
// Catatan: token ini tetap dapat dibaca di frontend, jadi bukan pengamanan kuat.
const UPLOAD_SECRET = 'spmb-upload-2026';

/** Health check sederhana: buka URL Web App di browser. */
function doGet(e) {
  return balasan({
    ok: true,
    layanan: 'SPMB Drive Upload Proxy',
    folderId: DEFAULT_FOLDER_ID,
    pesan: 'Web App aktif. Gunakan POST untuk mengunggah foto.'
  });
}

/** Terima upload foto dari form. */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return balasan({ ok: false, error: 'Tidak ada data yang dikirim.' });
    }

    const req = JSON.parse(e.postData.contents);
    if (req.secret !== UPLOAD_SECRET) {
      return balasan({ ok: false, error: 'Akses ditolak.' });
    }

    // Aksi khusus: tarik info dari portal dinas (dipanggil panel admin)
    if (req.aksi === 'scrape_dinas' || req.action === 'scrape_dinas') {
      return balasan({ ok: true, data: ambilInfoDinas() });
    }

    const folderId = req.folderId || DEFAULT_FOLDER_ID;
    const base64 = String(req.base64 || '');
    const filename = String(req.filename || 'foto.jpg');

    if (!base64) return balasan({ ok: false, error: 'Data gambar kosong.' });

    // Buang header "data:image/jpeg;base64," bila ada
    const bersih = base64.indexOf(',') !== -1 ? base64.substring(base64.indexOf(',') + 1) : base64;
    const bytes = Utilities.base64Decode(bersih);
    if (bytes.length > 8 * 1024 * 1024) {
      return balasan({ ok: false, error: 'Ukuran gambar terlalu besar (maks. 8 MB setelah diproses).' });
    }

    const blob = Utilities.newBlob(bytes, 'image/jpeg', filename);

    // Buat/pakai subfolder sesuai tahun pelajaran pendaftaran
    const tahun = String(req.tahun || req.tahunPelajaran || '').trim();
    const folder = tahun ? ambilFolderTahun(folderId, tahun) : DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);

    // Biarkan panitia bisa membuka gambar tanpa login (link langsung).
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (err) {
      // Jika domain melarang sharing publik, file tetap tersimpan di folder.
    }

    return balasan({
      ok: true,
      id: file.getId(),
      name: file.getName(),
      folder: folder.getName(),
      url: 'https://drive.google.com/uc?export=view&id=' + file.getId(),
      webViewLink: file.getUrl()
    });
  } catch (err) {
    return balasan({ ok: false, error: err.message });
  }
}

/** Ambil (atau buat) subfolder tahun pelajaran di dalam folder utama. */
function ambilFolderTahun(folderId, tahun) {
  const induk = DriveApp.getFolderById(folderId);
  const nama = String(tahun).replace(/[\\/:*?"<>|]/g, '-');
  const sudahAda = induk.getFoldersByName(nama);
  if (sudahAda.hasNext()) return sudahAda.next();
  return induk.createFolder(nama);
}

/** -------------------- Info dari portal dinas (semi-otomatis) ---------------- */
const PORTAL_DINAS = 'https://spmb-dikbud.kalbarprov.go.id';
const NAMA_SEKOLAH = 'SMKN 1 TELUK KERAMAT';

function bersihkanTeks(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tarik pengumuman, tautan dokumen/video, dan angka minat dari portal dinas. */
function ambilInfoDinas() {
  const hasil = {
    pengumuman: [],
    jadwal_url: PORTAL_DINAS + '/jadwal',
    surat_url: '',
    video_smk_url: '',
    minat_nama_sekolah: NAMA_SEKOLAH,
    minat_pendaftar: null,
    minat_kuota: null,
    minat_persen: '',
    sumber_update: '',
    fetched_at: new Date().toISOString()
  };

  try {
    const resp = UrlFetchApp.fetch(PORTAL_DINAS + '/', {
      muteHttpExceptions: true, followRedirects: true
    });
    if (resp.getResponseCode() !== 200) throw new Error('HTTP ' + resp.getResponseCode());
    const html = resp.getContentText();

    const blok = html.match(/<div class="announcement-content"[^>]*>([\s\S]*?)<\/div>/i);
    if (blok) {
      const re = /<li[^>]*>[\s\S]*?check_circle<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/li>/gi;
      let m;
      while ((m = re.exec(blok[1])) !== null && hasil.pengumuman.length < 10) {
        const t = bersihkanTeks(m[1]);
        if (t) hasil.pengumuman.push(t);
      }
    }

    const pdf = html.match(/href="[^"]+\.pdf"/gi) || [];
    const surat = pdf
      .map(x => x.replace(/^href="/i, '').replace(/"$/, ''))
      .find(u => /PERNYATAAN/i.test(u));
    if (surat) hasil.surat_url = surat.replace(/ /g, '%20');

    const video = html.match(/data-video-title="Video Panduan Pendaftaran SMK"[\s\S]{0,2000}?data-video-link="([^"]+)"/i);
    if (video) hasil.video_smk_url = video[1];

    const upd = html.match(/Terakhir diperbarui:\s*([^<]+)/i);
    if (upd) hasil.sumber_update = 'Terakhir diperbarui: ' + bersihkanTeks(upd[1]);
  } catch (e) {
    hasil.error_halaman = e.message;
  }

  try {
    const r2 = UrlFetchApp.fetch(PORTAL_DINAS + '/home/sekolah-list', { muteHttpExceptions: true });
    if (r2.getResponseCode() === 200) {
      const json = JSON.parse(r2.getContentText());
      const data = json.data || [];
      const baris = data.find(d => String(d.sekolah_nama).toUpperCase() === NAMA_SEKOLAH)
        || data.find(d => String(d.sekolah_nama).toUpperCase().indexOf(NAMA_SEKOLAH) !== -1);
      if (baris) {
        hasil.minat_nama_sekolah = baris.sekolah_nama;
        hasil.minat_pendaftar = Number(baris.total_pendaftar) || 0;
        hasil.minat_kuota = Number(baris.total_kuota) || 0;
        hasil.minat_persen = String(baris.persen || '');
      }
    }
  } catch (e) {
    hasil.error_minat = e.message;
  }

  return hasil;
}

function balasan(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
