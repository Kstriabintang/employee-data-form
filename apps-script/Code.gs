/* ========================================
   Employee Data Portal — Google Apps Script
   Menerima data dari form dan menyimpannya
   ke Google Sheets + Google Drive.
   ======================================== */

const CONFIG = {
  SHEET_NAME: 'DataKaryawan',
  // GANTI dengan ID folder Google Drive tempat menyimpan dokumen
  FOLDER_ID: 'YOUR_FOLDER_ID',
  // GANTI dengan alamat email HRD (opsional, untuk notifikasi)
  HRD_EMAIL: 'your-email@example.com',
  // Token rahasia untuk membatasi akses. Ganti jika perlu.
  SECRET_TOKEN: 'YOUR_SECRET_TOKEN'
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validasi token jika diaktifkan
    if (CONFIG.SECRET_TOKEN && data.token !== CONFIG.SECRET_TOKEN) {
      return jsonResponse({ success: false, message: 'Akses ditolak. Token tidak valid.' });
    }

    // Buka atau buat sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow(getHeaders());
      sheet.getRange(1, 1, 1, getHeaders().length)
        .setFontWeight('bold')
        .setBackground('#0A0A0A')
        .setFontColor('#C9A227');
    }

    // Simpan file ke Google Drive
    const files = data.files || {};
    const fileLinks = {};
    for (const key of ['file_ktp', 'file_kk', 'file_npwp']) {
      const fileObj = files[key];
      if (fileObj && fileObj.data && fileObj.name && fileObj.mime) {
        try {
          const blob = Utilities.newBlob(
            Utilities.base64Decode(fileObj.data),
            fileObj.mime,
            fileObj.name
          );
          const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
          const driveFile = folder.createFile(blob);
          driveFile.setName(safeFileName(data.nama_lengkap, key, driveFile.getName()));
          fileLinks[key] = driveFile.getUrl();
        } catch (fileErr) {
          fileLinks[key] = 'Gagal upload: ' + fileErr.message;
        }
      } else {
        fileLinks[key] = '';
      }
    }

    // Susun baris data
    const row = [
      new Date(),                       // A. Timestamp
      data.nama_lengkap || '',          // B. Nama Lengkap
      data.nik || '',                   // C. NIK
      data.no_kk || '',                 // D. No KK
      data.status_kk || '',             // E. Status dalam KK
      data.tempat_lahir || '',          // F. Tempat Lahir
      data.tanggal_lahir || '',         // G. Tanggal Lahir
      data.jenis_kelamin || '',         // H. Jenis Kelamin
      data.status_perkawinan || '',     // I. Status Perkawinan
      data.agama || '',                 // J. Agama
      data.pendidikan_terakhir || '',   // K. Pendidikan Terakhir
      data.alamat_ktp || '',            // L. Alamat KTP
      data.alamat_domisili || '',       // M. Alamat Domisili
      data.no_hp || '',                 // N. No HP
      data.email || '',                 // O. Email
      data.jabatan || '',               // P. Jabatan
      data.tanggal_masuk || '',         // O. Tanggal Masuk
      data.status_karyawan || '',       // R. Status Karyawan
      data.npwp || '',                  // S. NPWP
      data.nama_kd || '',               // T. Nama Kontak Darurat
      data.hubungan_kd || '',           // U. Hubungan Kontak Darurat
      data.no_hp_kd || '',              // V. No HP Kontak Darurat
      fileLinks.file_ktp || '',         // W. File KTP
      fileLinks.file_kk || '',          // X. File KK
      fileLinks.file_npwp || ''         // Y. File NPWP
    ];

    sheet.appendRow(row);

    // Kirim notifikasi email (opsional)
    if (CONFIG.HRD_EMAIL) {
      try {
        MailApp.sendEmail({
          to: CONFIG.HRD_EMAIL,
          subject: 'Data Karyawan Baru: ' + (data.nama_lengkap || '-'),
          body: 'Halo HRD,\n\nAda data karyawan baru yang dikirim melalui form online.' +
                '\n\nNama: ' + (data.nama_lengkap || '-') +
                '\nJabatan: ' + (data.jabatan || '-') +
                '\nNo HP: ' + (data.no_hp || '-') +
                '\n\nSilakan cek Google Sheets untuk detail lengkap.'
        });
      } catch (emailErr) {
        // Notifikasi gagal tidak menggagalkan penyimpanan data
        console.log('Email gagal: ' + emailErr.message);
      }
    }

    return jsonResponse({ success: true, message: 'Data berhasil disimpan.' });

  } catch (err) {
    return jsonResponse({ success: false, message: err.message });
  }
}

function doGet(e) {
  return jsonResponse({
    status: 'ok',
    message: 'Employee Data Portal Form API aktif.'
  });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getHeaders() {
  return [
    'Timestamp',
    'Nama Lengkap',
    'NIK',
    'No KK',
    'Status dalam KK',
    'Tempat Lahir',
    'Tanggal Lahir',
    'Jenis Kelamin',
    'Status Perkawinan',
    'Agama',
    'Pendidikan Terakhir',
    'Alamat KTP',
    'Alamat Domisili',
    'No HP',
    'Email',
    'Jabatan',
    'Tanggal Masuk',
    'Status Karyawan',
    'NPWP',
    'Nama Kontak Darurat',
    'Hubungan Kontak Darurat',
    'No HP Kontak Darurat',
    'File KTP',
    'File KK',
    'File NPWP'
  ];
}

function safeFileName(nama, jenis, originalName) {
  const cleanNama = (nama || 'karyawan').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const ext = originalName.split('.').pop();
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
  return cleanNama + '_' + jenis + '_' + timestamp + '.' + ext;
}
