# UangKasir

Aplikasi pencatatan keuangan berbasis web untuk usaha kecil, organisasi, dan komunitas.  
Dibangun dengan **Next.js 14 (App Router)**, **Prisma ORM**, **PostgreSQL (Neon)**, dan **Tailwind CSS**.

> **Bukan software akuntansi** — sistem pencatatan kas sederhana dengan role-based access.

---

## Fitur

- **Dashboard** — ringkasan saldo, total pemasukan/pengeluaran, grafik interaktif (Line, Bar, Pie, Donut)
- **Manajemen Transaksi** — tambah, edit, hapus; filter, cari, dan sortir riwayat
- **Kategori** — kelola kategori INCOME / EXPENSE
- **Manajemen User** — tambah, edit, nonaktifkan, reset password
- **Upload Bukti** — gambar JPG/PNG otomatis dikonversi ke AVIF
- **Laporan** — ekspor PDF dan Excel
- **Audit Log** — catat seluruh aktivitas sistem
- **Backup & Restore** — backup manual/jadwal, restore dari file atau backup tersimpan
- **Role-based Access** — SUPERADMIN, ADMIN, USER
- **Responsive** — mobile, tablet, desktop

---

## Tech Stack

| Bagian         | Teknologi                          |
| -------------- | ---------------------------------- |
| Frontend       | Next.js 14 (App Router), React 18  |
| Backend        | Next.js API Routes + Server Actions |
| ORM            | Prisma                             |
| Database       | PostgreSQL (Neon)                  |
| Auth           | Custom JWT (HMAC-SHA256, httpOnly cookie) |
| Styling        | Tailwind CSS                       |
| Chart          | Recharts                           |
| Export Excel   | ExcelJS                            |
| Export PDF     | jsPDF + jspdf-autotable            |
| Image Conv     | sharp                              |
| Icons          | Lucide React                       |

---

## Prasyarat

- Node.js 18+
- PostgreSQL database (Neon, Supabase, atau lokal)

## Instalasi

```bash
# Clone repositori
git clone https://github.com/username/uangkasir.git
cd uangkasir

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

Edit `.env` dan isi credential database serta secret:

```env
JWT_SECRET="generate-string-random-panjang"
CRON_SECRET="generate-string-random-lain"
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/dbname?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Push schema ke database dan jalankan seed:

```bash
npm run db:push
npm run db:seed
```

Jalankan development server:

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## Akun Default (setelah seed)

| UserCode | Password  | Role       |
| -------- | --------- | ---------- |
| USR001   | 12345678  | SUPERADMIN |

---

## Scripts

| Perintah          | Deskripsi                               |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Jalankan development server             |
| `npm run build`   | Build production (Prisma generate + Next build) |
| `npm run start`   | Jalankan production server              |
| `npm run lint`    | Lint code                               |
| `npm run db:push` | Push Prisma schema ke database          |
| `npm run db:seed` | Seed data awal                          |
| `npm run db:studio` | Buka Prisma Studio                    |

---

## Struktur Direktori

```
app/
├── (auth)/login          # Halaman login
├── (dashboard)/          # Halaman utama (sidebar layout)
│   ├── dashboard/        # Dashboard dengan grafik
│   ├── transactions/     # Riwayat transaksi
│   ├── transactions/create  # Input transaksi
│   ├── transactions/[id]/edit # Edit transaksi
│   ├── categories/       # Manajemen kategori
│   ├── users/            # Manajemen user
│   ├── reports/          # Laporan PDF/Excel
│   ├── audit-log/        # Audit log
│   └── backup/           # Backup & restore
├── api/                  # API routes
│   ├── auth/             # Login, logout, session
│   ├── transactions/     # CRUD transaksi
│   ├── categories/       # CRUD kategori
│   ├── users/            # CRUD user
│   ├── backup/           # Backup & restore API
│   ├── reports/          # Export PDF & Excel
│   ├── dashboard/        # Data dashboard
│   ├── audit-logs/       # Data audit log
│   └── upload/           # Upload gambar (→ AVIF)
components/
├── dashboard/            # Widget dashboard, sidebar
├── transaction/          # Modal, form, proof viewer
├── chart/                # Grafik (Line, Bar, Pie, Donut)
├── report/               # Filter laporan
├── ui/                   # UI primitif (Toast, Modal, Confirm)
lib/
├── prisma.ts             # Prisma client singleton
├── auth.ts               # Custom JWT auth
├── audit.ts              # Audit log helper
├── utils.ts              # Format tanggal, rupiah
└── types.ts              # TypeScript tipe data
prisma/
├── schema.prisma         # Skema database
└── seed.ts               # Seeder
```

---

## Environment Variables

| Variabel              | Wajib | Deskripsi                                    |
| --------------------- | ----- | -------------------------------------------- |
| `DATABASE_URL`        | ✅    | Koneksi database PostgreSQL (dengan pgBouncer) |
| `DIRECT_URL`          | ✅    | Koneksi direct PostgreSQL (tanpa pgBouncer)   |
| `JWT_SECRET`          | ✅    | Secret untuk HMAC-SHA256 JWT token            |
| `CRON_SECRET`         | ✅    | Proteksi endpoint auto-backup cron            |
| `NEXT_PUBLIC_APP_URL` | ✅    | URL aplikasi (untuk PDF report)               |

---

## Keamanan

- **JWT_SECRET wajib diset** — aplikasi akan throw error jika tidak ada (tidak ada fallback lemah)
- **CRON_SECRET** melindungi endpoint auto-backup dari akses publik
- Password di-hash dengan bcrypt
- httpOnly cookie untuk session
- Role-based access control (SUPERADMIN/ADMIN/USER)
- Upload gambar dibatasi JPG/PNG, dikonversi ke AVIF untuk efisiensi
- `.env` sudah di `.gitignore` — tidak akan tercommit

---

## Deployment

Proyek ini dirancang untuk deployment di **Vercel** dengan **Neon PostgreSQL**.

1. Push ke GitHub
2. Import repositori di Vercel
3. Set environment variables di Vercel Dashboard
4. Deploy

Auto-backup cron sudah dikonfigurasi di `vercel.json` (setiap hari pukul 01:00 WIB).

---

## Lisensi

Hak cipta dilindungi. Tidak untuk didistribusikan tanpa izin.
