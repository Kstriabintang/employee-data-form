# API Documentation — Employee Data Portal Employee Form

Form ini menggunakan **Google Apps Script Web App** sebagai backend API. API menerima data karyawan dalam format JSON, menyimpannya ke Google Sheets, dan mengunggah file dokumen ke Google Drive.

---

## 🔐 Autentikasi

Setiap request wajib menyertakan token di dalam body JSON:

```json
{
  "token": "YOUR_SECRET_TOKEN"
}
```

Token ini diset di `apps-script/Code.gs` bagian `SECRET_TOKEN` dan di `script.js` bagian `payload.token`.

---

## 🌐 Base URL

Base URL adalah URL deployment web app Google Apps Script-mu. Contoh:

```text
https://script.google.com/macros/s/AKfycb.../exec
```

---

## 📥 Endpoint

### `POST /`

Menerima seluruh data karyawan dan file dokumen.

#### Content-Type

Kirim sebagai **plain text JSON body** (tanpa header `Content-Type` khusus):

```http
POST / HTTP/1.1
Host: script.google.com

{ ... JSON payload ... }
```

#### Request Body Example

```json
{
  "token": "YOUR_SECRET_TOKEN",
  "nama_lengkap": "Budi Santoso",
  "nik": "3201234567890123",
  "no_kk": "3201234567890123",
  "status_kk": "Kepala Keluarga",
  "tempat_lahir": "Jakarta",
  "tanggal_lahir": "1995-08-17",
  "jenis_kelamin": "Laki-laki",
  "status_perkawinan": "Kawin",
  "agama": "Islam",
  "pendidikan_terakhir": "S1 / D4",
  "alamat_ktp": "Jl. Mawar No. 1, Jakarta",
  "alamat_domisili": "Jl. Melati No. 2, Jakarta",
  "no_hp": "081234567890",
  "email": "budi@email.com",
  "jabatan": "Teknisi Fiber Optik",
  "tanggal_masuk": "2024-01-15",
  "status_karyawan": "PKWTT",
  "npwp": "09.123.456.7-123.000",
  "nama_kd": "Siti Aminah",
  "hubungan_kd": "Istri",
  "no_hp_kd": "081298765432",
  "files": {
    "file_ktp": {
      "name": "ktp.jpg",
      "mime": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQ..."
    },
    "file_kk": {
      "name": "kk.jpg",
      "mime": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQ..."
    },
    "file_npwp": {
      "name": "npwp.jpg",
      "mime": "image/jpeg",
      "data": "/9j/4AAQSkZJRgABAQ..."
    }
  }
}
```

> File dikirim dalam format **base64** tanpa prefix `data:image/...`.

#### Response Success

```json
{
  "success": true,
  "message": "Data berhasil disimpan."
}
```

#### Response Error

```json
{
  "success": false,
  "message": "Token tidak valid."
}
```

---

## 📤 Endpoint Status (Health Check)

### `GET /`

Mengembalikan status API.

#### Response

```json
{
  "status": "ok",
  "message": "Employee Data Portal Form API aktif."
}
```

---

## 📝 Field yang Diterima

### Data Pribadi

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `nama_lengkap` | string | ✅ | Nama sesuai KTP |
| `nik` | string | ✅ | 16 digit |
| `no_kk` | string | ✅ | 16 digit |
| `status_kk` | string | ✅ | Status dalam KK |
| `tempat_lahir` | string | ✅ | Kota kelahiran |
| `tanggal_lahir` | string | ✅ | Format YYYY-MM-DD |
| `jenis_kelamin` | string | ✅ | Laki-laki / Perempuan |
| `status_perkawinan` | string | ✅ | Belum Kawin / Kawin / Cerai |
| `agama` | string | ✅ | Agama |
| `pendidikan_terakhir` | string | ✅ | Pendidikan terakhir |
| `alamat_ktp` | string | ✅ | Alamat lengkap |
| `alamat_domisili` | string | ✅ | Alamat domisili |
| `no_hp` | string | ✅ | Nomor HP aktif |
| `email` | string | ✅ | Email aktif |

### Data Kepegawaian

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `jabatan` | string | ✅ | Jabatan/posisi |
| `tanggal_masuk` | string | ✅ | Format YYYY-MM-DD |
| `status_karyawan` | string | ✅ | PKWTT / PKWT / Magang |
| `npwp` | string | ❌ | Opsional |

### Kontak Darurat

| Field | Tipe | Wajib |
|---|---|---|
| `nama_kd` | string | ✅ |
| `hubungan_kd` | string | ✅ |
| `no_hp_kd` | string | ✅ |

### Dokumen (Base64)

| Field | Wajib |
|---|---|
| `files.file_ktp` | ✅ |
| `files.file_kk` | ✅ |
| `files.file_npwp` | ❌ |

---

## 🔧 Cara Ganti Token

1. Buka `apps-script/Code.gs`.
2. Ganti nilai `SECRET_TOKEN`.
3. Buka `script.js`.
4. Ganti nilai `payload.token` dengan token yang sama.
5. Deploy ulang web app di Apps Script.
