import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

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
    description?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentSize?: number;
    attachmentMimeType?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  auditLogs: Array<{
    id: string;
    userId?: string;
    action: string;
    module: string;
    description?: string;
    ipAddress?: string;
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
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

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

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const existing = JSON.parse(raw);
      dbData.categories = existing.categories || dbData.categories;
      dbData.transactions = existing.transactions || [];
      dbData.auditLogs = existing.auditLogs || [];
    } catch {}
  }

  dbData.users = [masterUser];
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  return dbData;
}

export function readDb(): LocalDbData {
  if (!fs.existsSync(DB_FILE)) {
    return resetUsersAndSeedMaster();
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);

    // If master user does not exist or userCode is not USR001 or hash fails, reset
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
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
