import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';

const isVercel = Boolean(
  process.env.VERCEL ||
  process.env.NEXT_PUBLIC_VERCEL_ENV ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NODE_ENV === 'production'
);

// Use /tmp directory on Vercel Serverless environment, otherwise local ./data directory
const DATA_DIR = isVercel ? os.tmpdir() : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'uangkasir_database.json');
const SEED_DB_FILE = path.join(process.cwd(), 'data', 'database.json');

export interface LocalDbData {
  users: Array<{
    id: string;
    name: string;
    userCode: string;
    passwordHash: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'USER';
    isActive: boolean;
    permissions: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    createdAt: string;
    updatedAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    categoryId: string;
    userId: string;
    transactionDate: string;
    description?: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
    attachmentSize?: number | null;
    attachmentMimeType?: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    userId?: string | null;
    user?: {
      id: string;
      name: string;
      userCode: string;
    } | null;
    action: string;
    module: string;
    recordId?: string | null;
    description?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: string;
  }>;
}

const ALL_PERMS = [
  'can_view_dashboard',
  'can_view_transactions',
  'can_manage_transactions',
  'can_view_categories',
  'can_manage_categories',
  'can_manage_users',
  'can_export_reports',
  'can_view_audit_logs',
];

export function resetUsersAndSeedMaster(): LocalDbData {
  const superadminPass = bcrypt.hashSync('12345678', 10);
  const masterUser = {
    id: 'usr_master_superadmin',
    name: 'Super Administrator',
    userCode: 'USR001',
    passwordHash: superadminPass,
    role: 'SUPERADMIN' as const,
    isActive: true,
    permissions: ALL_PERMS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let dbData: LocalDbData = {
    users: [masterUser],
    categories: [
      { id: 'cat_penjualan', name: 'Penjualan Produk', type: 'INCOME', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cat_jasa', name: 'Pendapatan Jasa', type: 'INCOME', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cat_operasional', name: 'Biaya Operasional', type: 'EXPENSE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'cat_gaji', name: 'Gaji Karyawan', type: 'EXPENSE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ],
    transactions: [],
    auditLogs: [],
  };

  if (fs.existsSync(SEED_DB_FILE)) {
    try {
      const raw = fs.readFileSync(SEED_DB_FILE, 'utf-8');
      const existing = JSON.parse(raw);
      dbData.categories = existing.categories || dbData.categories;
      dbData.transactions = existing.transactions || [];
      dbData.auditLogs = existing.auditLogs || [];
    } catch {}
  }

  dbData.users = [masterUser];
  writeDb(dbData);
  return dbData;
}

export function readDb(): LocalDbData {
  if (!fs.existsSync(DB_FILE)) {
    if (fs.existsSync(SEED_DB_FILE)) {
      try {
        const rawSeed = fs.readFileSync(SEED_DB_FILE, 'utf-8');
        const seedData = JSON.parse(rawSeed);
        writeDb(seedData);
        return seedData;
      } catch {}
    }
    return resetUsersAndSeedMaster();
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);

    const master = data.users?.find((u: any) => u.userCode === 'USR001');
    if (!master || !bcrypt.compareSync('12345678', master.passwordHash)) {
      return resetUsersAndSeedMaster();
    }
    return data;
  } catch {
    return resetUsersAndSeedMaster();
  }
}

export function writeDb(data: LocalDbData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}
