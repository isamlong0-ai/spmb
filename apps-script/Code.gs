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

function balasan(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
