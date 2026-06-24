# Panduan Setup Form Employee Data Portal (Mudah)

Panduan ini akan membantu kamu menghubungkan form ke **Google Sheets** dan **Google Drive** milik akun perusahaan `your-email@example.com`.

> **Catatan penting:** Form ini menggunakan **Google Apps Script**, bukan Google Cloud API langsung. Jadi meski kamu sudah mengaktifkan **Google Drive API** di Google Cloud Console, langkah-langkah di bawah ini tidak membutuhkannya. Cloud Console hanya opsional jika nanti ingin menggunakan project khusus.

---

## 📋 Persiapan

Pastikan kamu login di browser dengan akun:

```
your-email@example.com
```

---

## 1. Buat Google Sheet

1. Buka [sheets.new](https://sheets.new) — pastikan akun aktif adalah `your-email@example.com`.
2. Beri nama spreadsheet, misalnya: **"Employee Data Sheet"**.
3. Copy URL spreadsheet-nya dan simpan dulu.

---

## 2. Buat Folder Google Drive

1. Buka [Google Drive](https://drive.google.com) dengan akun yang sama.
2. Klik **New → Folder**.
3. Beri nama folder, misalnya: **"Employee Documents"**.
4. Buka folder tersebut.
5. Dari URL browser, copy ID folder-nya.

Contoh URL:
```
https://drive.google.com/drive/folders/1ABC123xyz
```
ID-nya adalah:
```
1ABC123xyz
```

---

## 3. Pasang Google Apps Script

1. Di Google Sheet yang baru dibuat, klik menu **Extensions → Apps Script**.
2. Hapus kode default yang ada di editor (`function myFunction()`).
3. Copy seluruh isi file `apps-script/Code.gs` dari project ini.
4. Paste ke editor Apps Script.
5. Ganti bagian ini dengan ID folder Drive tadi:

   ```js
   FOLDER_ID: 'YOUR_GOOGLE_DRIVE_FOLDER_ID',
   ```

   Contoh:
   ```js
   FOLDER_ID: '1ABC123xyz',
   ```

6. Email notifikasi sudah di-set ke `your-email@example.com`. Jika ingin diganti, ubah bagian:

   ```js
   HRD_EMAIL: 'your-email@example.com',
   ```

7. Klik **Save** (ikon disk) atau tekan `Ctrl + S`.

---

## 4. Deploy Web App

1. Di Apps Script, klik tombol **Deploy → New deployment**.
2. Klik ikon roda gigi ⚙️ pada bagian **Select type**, lalu pilih **Web app**.
3. Isi pengaturan:
   - **Description**: `Employee Data Form API`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone`
4. Klik **Deploy**.
5. Google akan meminta izin permission. Klik **Review Permissions**, pilih akun `your-email@example.com`, lalu klik **Allow**.
6. Setelah berhasil, akan muncul **Web app URL**. Copy URL tersebut.

---

## 5. Hubungkan ke Form HTML

1. Buka file `script.js` di project ini.
2. Cari baris:

   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXXXXX/exec';
   ```

3. Ganti URL tersebut dengan **Web app URL** yang sudah dicopy tadi.
4. Save.

---

## 6. Upload ke Hosting/Domain

1. Upload semua file berikut ke folder `public_html` hosting kamu:

   ```text
   index.html
   mobile.css
   desktop.css
   script.js
   remove-bg.png
   favicon.png
   apple-touch-icon.png
   ```

2. Pastikan domain `your-domain.com` sudah mengarah ke hosting tersebut.
3. Akses `https://your-domain.com` dan coba isi form.

---

## 7. Cek Hasil

1. Setelah submit form, buka Google Sheet "Employee Data Sheet".
2. Data karyawan akan muncul di baris baru.
3. File KTP, KK, dan NPWP akan tersimpan di folder Google Drive yang sudah dibuat.
4. Email notifikasi akan dikirim ke `your-email@example.com`.

---

## ⚠️ Catatan tentang Google Cloud Console

Kamu sudah mengaktifkan **Google Drive API** di Google Cloud Console. Itu bagus, tapi **tidak wajib** untuk Google Apps Script.

Jika nanti ingin menghubungkan Apps Script ke project Cloud Console `rimba-raya-inventory`, baru diperlukan konfigurasi OAuth consent screen. Untuk setup awal, ikuti langkah-langkah di atas saja — lebih mudah dan langsung jalan.

---

## 🆘 Kalau Ada Error

- **"Akses ditolak"** → Pastikan deployment web app menggunakan **Execute as: Me** dan **Who has access: Anyone**.
- **File tidak masuk Drive** → Pastikan `FOLDER_ID` sudah benar dan folder ada di akun yang sama.
- **Data tidak masuk Sheet** → Pastikan `APPS_SCRIPT_URL` di `script.js` sudah diganti dengan URL deployment terbaru. Setiap kali edit Code.gs, wajib deploy ulang.
