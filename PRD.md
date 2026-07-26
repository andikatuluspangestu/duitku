# Product Requirements Document (PRD)

# Aplikasi Pencatatan Keuangan Sederhana (Simple Finance)

**Versi:** 2.0
**Status:** Final Draft
**Target Platform:** Web Application
**Deployment:** Vercel (Free Tier)

---

# 1. Ringkasan Produk

## Nama Produk

**Simple Finance**

Simple Finance adalah aplikasi pencatatan keuangan berbasis web yang dirancang untuk membantu usaha kecil, organisasi, maupun komunitas dalam mencatat arus kas secara sederhana.

Seluruh transaksi dikelola oleh **1 orang Admin (Kepala Kasir)**, sedangkan **User** hanya dapat melihat informasi keuangan secara **read-only** untuk menjaga transparansi tanpa mengubah data.

Aplikasi tidak ditujukan sebagai software akuntansi, melainkan sebagai sistem pencatatan kas sederhana.

---

# 2. Tujuan Produk

Aplikasi dibuat untuk:

* Mencatat seluruh pemasukan dan pengeluaran.
* Menampilkan saldo secara real-time.
* Menyediakan histori transaksi.
* Menyimpan bukti transaksi.
* Menyediakan laporan yang dapat diekspor.
* Memberikan visualisasi kondisi keuangan.
* Menyediakan audit log seluruh aktivitas sistem.

---

# 3. Target Pengguna

## Admin

Satu orang yang bertanggung jawab terhadap seluruh transaksi.

Hak akses:

* CRUD transaksi
* CRUD kategori
* CRUD user
* Upload bukti transaksi
* Export laporan
* Melihat dashboard
* Melihat audit log

---

## User

User hanya bertugas melihat informasi.

Hak akses:

* Login
* Dashboard
* Melihat transaksi
* Melihat lampiran
* Filter transaksi
* Melihat grafik

Tidak dapat mengubah data.

---

# 4. Role dan Hak Akses

| Fitur            | Admin | User |
| ---------------- | :---: | :--: |
| Login            |   ✅   |   ✅  |
| Dashboard        |   ✅   |   ✅  |
| CRUD Transaksi   |   ✅   |   ❌  |
| CRUD Kategori    |   ✅   |   ❌  |
| CRUD User        |   ✅   |   ❌  |
| Upload Bukti     |   ✅   |   ❌  |
| Lihat Bukti      |   ✅   |   ✅  |
| Export Excel     |   ✅   |   ❌  |
| Export PDF       |   ✅   |   ❌  |
| Dashboard Grafik |   ✅   |   ✅  |
| Audit Log        |   ✅   |   ❌  |

---

# 5. Fitur Utama

## 5.1 Login

### Fitur

* Login Email
* Password
* Logout
* Session Management
* Role Based Authentication

Teknologi:

* Auth.js

---

## 5.2 Dashboard

Menampilkan:

* Total Pemasukan
* Total Pengeluaran
* Saldo
* Jumlah Transaksi
* 5 Transaksi Terbaru

---

## 5.3 Manajemen Transaksi

Admin dapat:

* Tambah transaksi
* Edit transaksi
* Hapus transaksi

Field transaksi:

| Field      | Wajib |
| ---------- | ----- |
| Tanggal    | ✅     |
| Jenis      | ✅     |
| Kategori   | ✅     |
| Nominal    | ✅     |
| Keterangan | ❌     |
| Lampiran   | ❌     |

Jenis transaksi:

* INCOME
* EXPENSE

---

## 5.4 Riwayat Transaksi

Fitur:

* Pagination
* Search
* Filter tanggal
* Filter kategori
* Filter jenis transaksi
* Sorting terbaru

---

## 5.5 Manajemen Kategori

Kategori terdiri dari:

### Income

Contoh:

* Penjualan
* Gaji
* Bonus
* Investasi

### Expense

Contoh:

* Operasional
* Transport
* Listrik
* Makan

Fitur:

* Tambah
* Edit
* Hapus

---

## 5.6 Manajemen User

Admin dapat:

* Tambah user
* Edit user
* Nonaktifkan user
* Reset password
* Hapus user

---

## 5.7 Lampiran Bukti Transaksi

Admin dapat mengunggah bukti transaksi.

Format:

* JPG
* JPEG
* PNG
* PDF

Ukuran maksimum:

* 5 MB

Jumlah file:

* Maksimal 1 lampiran per transaksi

Storage:

* Supabase Storage

---

## 5.8 Export Laporan

Admin dapat mengekspor laporan.

Format:

### Excel (.xlsx)

Kolom:

* Tanggal
* Jenis
* Kategori
* Nominal
* Keterangan
* Dibuat Oleh

---

### PDF

Isi laporan:

* Logo
* Judul
* Periode
* Ringkasan
* Total Income
* Total Expense
* Saldo
* Daftar Transaksi

---

## 5.9 Dashboard Grafik

Grafik:

### 1. Line Chart

Saldo berdasarkan waktu.

---

### 2. Bar Chart

Perbandingan:

* Income
* Expense

---

### 3. Pie Chart

Komposisi pengeluaran berdasarkan kategori.

---

### 4. Donut Chart

Komposisi pemasukan berdasarkan kategori.

---

## 5.10 Audit Log

Audit log mencatat seluruh aktivitas penting.

Aktivitas:

* Login
* Logout
* Login gagal
* Tambah transaksi
* Edit transaksi
* Hapus transaksi
* Upload lampiran
* Export PDF
* Export Excel
* CRUD kategori
* CRUD user

---

# 6. Dashboard

Widget:

* Total Income
* Total Expense
* Saldo
* Jumlah Transaksi
* Grafik
* Transaksi Terbaru

---

# 7. Validasi Data

## Nominal

* Angka
* Minimal 1
* Tidak boleh negatif

---

## Keterangan

* Maksimal 255 karakter

---

## Email

* Unik

---

## Password

* Minimal 8 karakter

---

## Lampiran

* Maksimal 5 MB

---

# 8. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  USER
}

enum TransactionType {
  INCOME
  EXPENSE
}

enum AuditAction {
  LOGIN
  LOGOUT
  LOGIN_FAILED

  CREATE_USER
  UPDATE_USER
  DELETE_USER

  CREATE_CATEGORY
  UPDATE_CATEGORY
  DELETE_CATEGORY

  CREATE_TRANSACTION
  UPDATE_TRANSACTION
  DELETE_TRANSACTION

  UPLOAD_ATTACHMENT
  DELETE_ATTACHMENT

  EXPORT_EXCEL
  EXPORT_PDF
}

model User {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String
  role      Role     @default(USER)
  isActive  Boolean  @default(true)

  transactions Transaction[]
  auditLogs    AuditLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Category {
  id        String @id @default(uuid())
  name      String
  type      TransactionType

  transactions Transaction[]

  createdAt DateTime @default(now())
}

model Transaction {
  id                 String @id @default(uuid())

  type               TransactionType
  amount             Decimal
  description        String?

  transactionDate    DateTime

  attachmentUrl      String?
  attachmentName     String?
  attachmentSize     Int?
  attachmentMimeType String?

  userId             String
  user               User @relation(fields: [userId], references: [id])

  categoryId         String
  category           Category @relation(fields: [categoryId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([transactionDate])
  @@index([type])
}

model AuditLog {
  id          String @id @default(uuid())

  userId      String?
  user        User? @relation(fields: [userId], references: [id])

  action      AuditAction

  module      String

  recordId    String?

  description String?

  ipAddress   String?

  userAgent   String?

  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

# 9. Arsitektur Sistem

```text
Browser

    │

    ▼

Next.js (App Router)

    │

Server Actions / API Routes

    │

Prisma ORM

    │

PostgreSQL (Supabase)

    │

Supabase Storage
```

---

# 10. Struktur Folder

```text
app/
├── (auth)
│   └── login
├── (dashboard)
│   ├── dashboard
│   ├── transactions
│   ├── categories
│   ├── users
│   ├── reports
│   ├── audit-log
│   └── settings
│
components/
│
├── dashboard
├── transaction
├── chart
├── report
├── audit
└── ui

lib/
services/
hooks/
prisma/
types/
```

---

# 11. Alur Sistem

## Login

```text
Login

↓

Auth.js

↓

Session

↓

Dashboard
```

---

## Tambah Transaksi

```text
Form

↓

Validasi

↓

Upload Lampiran

↓

Simpan Database

↓

Catat Audit Log

↓

Update Dashboard
```

---

## Export

```text
Pilih Periode

↓

Generate Data

↓

Excel / PDF

↓

Download
```

---

# 12. Perhitungan

```text
Saldo = Total Income - Total Expense
```

Dashboard menggunakan hasil agregasi database.

---

# 13. Audit Log

Data yang disimpan:

* User
* Aktivitas
* Modul
* Record ID
* IP Address
* Browser
* Waktu

---

# 14. Non Functional Requirements

## Performa

* Response < 2 detik
* Pagination server-side
* Optimasi query Prisma

---

## Security

* Password Hashing
* Auth.js Session
* Role Based Access
* Input Validation
* CSRF Protection
* XSS Protection

---

## Responsive

* Desktop
* Tablet
* Mobile

---

## Browser

* Chrome
* Firefox
* Edge
* Safari

---

# 15. Teknologi

| Bagian         | Teknologi              |
| -------------- | ---------------------- |
| Frontend       | Next.js                |
| Backend        | Next.js Server Actions |
| ORM            | Prisma                 |
| Database       | PostgreSQL             |
| Authentication | Auth.js                |
| Storage        | Supabase Storage       |
| Styling        | Tailwind CSS           |
| Component      | shadcn/ui              |
| Chart          | Recharts               |
| Export Excel   | ExcelJS                |
| Export PDF     | pdf-lib                |
| Deployment     | Vercel                 |

---

# 16. Deployment

```text
GitHub

↓

Vercel

↓

Build Next.js

↓

Supabase PostgreSQL

↓

Supabase Storage

↓

Production
```

---

# 17. Scope Versi 2.0

## Termasuk

* Login
* Logout
* Dashboard
* CRUD User
* CRUD Kategori
* CRUD Transaksi
* Upload Bukti
* Riwayat Transaksi
* Filter
* Search
* Export Excel
* Export PDF
* Dashboard Grafik
* Audit Log
* Responsive
* Deploy Vercel

---

## Tidak Termasuk

* Multi perusahaan
* Multi cabang
* Approval transaksi
* Multi mata uang
* Akuntansi
* Jurnal Umum
* Neraca
* Laba Rugi
* Hutang Piutang
* Stok Barang
* API Publik
* Mobile App
* Notifikasi
* Integrasi Payment Gateway

---

# 18. Definition of Done (DoD)

Aplikasi dinyatakan selesai apabila:

* Admin dapat login.
* User dapat login.
* Admin dapat mengelola user.
* Admin dapat mengelola kategori.
* Admin dapat mengelola transaksi.
* User hanya dapat melihat data.
* Lampiran transaksi dapat diunggah dan dilihat.
* Dashboard menampilkan saldo yang akurat.
* Grafik menampilkan data sesuai periode.
* Laporan dapat diekspor ke Excel dan PDF.
* Audit Log mencatat seluruh aktivitas penting.
* Seluruh fitur berjalan pada Vercel Free Tier menggunakan Supabase PostgreSQL dan Supabase Storage.
* Seluruh halaman responsif pada desktop, tablet, dan perangkat mobile.
