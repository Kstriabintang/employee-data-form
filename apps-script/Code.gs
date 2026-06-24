/* ========================================
   Employee Data Portal — Google Apps Script
   Menerima data dari form dan menyimpannya
   ke Google Sheets + Google Drive.
   ======================================== */

const CONFIG = {
  // SPREADSHEET_ID: ambil dari URL Google Sheets (bagian antara /d/ dan /edit)
  SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
  SHEET_NAME: 'DataKaryawan',
  // GANTI dengan ID folder Google Drive tempat menyimpan dokumen
  FOLDER_ID: 'YOUR_FOLDER_ID',
  // GANTI dengan alamat email HRD (opsional, untuk notifikasi)
  HRD_EMAIL: 'your-email@example.com',
  // Token rahasia untuk membatasi akses. Ganti jika perlu.
  SECRET_TOKEN: 'YOUR_SECRET_TOKEN'
};

const FILE_LABELS = {
  file_ktp: 'KTP',
  file_kk: 'KK',
  file_npwp: 'NPWP'
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Validasi token jika diaktifkan
    if (CONFIG.SECRET_TOKEN && data.token !== CONFIG.SECRET_TOKEN) {
      return jsonResponse({ success: false, message: 'Akses ditolak. Token tidak valid.' });
    }

    // Validasi konfigurasi
    if (!CONFIG.SPREADSHEET_ID || CONFIG.SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID') {
      return jsonResponse({ success: false, message: 'Spreadsheet ID belum dikonfigurasi di Code.gs.' });
    }

    // Buka atau buat sheet
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow(getHeaders());
    }
    formatSheet(sheet);

    // Buat folder karyawan di Google Drive
    const mainFolder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    const employeeId = data.nik || data.no_hp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    const folderName = (data.nama_lengkap || 'Karyawan').trim() + ' - ' + employeeId;
    const employeeFolder = getOrCreateFolder(mainFolder, folderName);

    // Simpan file ke folder karyawan
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
          const driveFile = employeeFolder.createFile(blob);
          const ext = fileObj.name.split('.').pop();
          const newName = buildFileName(data.nama_lengkap, key, ext);
          driveFile.setName(newName);
          fileLinks[key] = makeHyperlink(driveFile.getUrl(), 'Lihat ' + (FILE_LABELS[key] || key));
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
      data.tanggal_masuk || '',         // Q. Tanggal Masuk
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
    formatDataRows(sheet);

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
                '\nFolder Drive: ' + employeeFolder.getUrl() +
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

function formatSheet(sheet) {
  const lastCol = getHeaders().length;
  const headerRange = sheet.getRange(1, 1, 1, lastCol);

  headerRange
    .setFontWeight('bold')
    .setFontColor('#FFFFFF')
    .setBackground('#0A0A0A')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  sheet.setFrozenRows(1);
  sheet.setAutoFilter(headerRange);

  const widths = [
    140, 160, 130, 130, 130, 110, 110, 110, 130, 100,
    140, 240, 240, 130, 180, 160, 120, 130, 150, 160,
    130, 130, 120, 120, 120
  ];
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));
}

function formatDataRows(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = getHeaders().length;
  if (lastRow < 2) return;

  const dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  dataRange
    .setVerticalAlignment('top')
    .setWrap(true)
    .setBorder(true, true, true, true, true, true, '#E0E0E0', SpreadsheetApp.BorderStyle.SOLID);

  for (let row = 2; row <= lastRow; row++) {
    const bgColor = (row % 2 === 0) ? '#FFFFFF' : '#F8F8F5';
    sheet.getRange(row, 1, 1, lastCol).setBackground(bgColor);
  }

  sheet.getRange(2, 1, lastRow - 1, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2, 3, lastRow - 1, 1).setNumberFormat('@');
  sheet.getRange(2, 4, lastRow - 1, 1).setNumberFormat('@');
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

function buildFileName(nama, jenisKey, ext) {
  const cleanNama = (nama || 'Karyawan').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const label = FILE_LABELS[jenisKey] || jenisKey;
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
  return cleanNama + ' - ' + label + ' ' + timestamp + '.' + ext;
}

function makeHyperlink(url, label) {
  if (!url || !url.startsWith('http')) return url || '-';
  return "=HYPERLINK('" + url + "','" + label + "')";
}
