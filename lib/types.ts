export type TransactionType = 'INCOME' | 'EXPENSE';
export type Role = 'SUPERADMIN' | 'ADMIN' | 'USER';

export interface UserSession {
  id: string;
  name: string;
  userCode: string;
  role: Role;
  permissions: string[];
}

export interface UserItem {
  id: string;
  name: string;
  userCode: string;
  role: Role;
  isActive: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
    auditLogs: number;
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  type: TransactionType;
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
}

export interface TransactionItem {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  category?: CategoryItem;
  userId: string;
  user?: UserItem;
  transactionDate: string;
  description?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentMimeType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  userId?: string | null;
  user?: UserItem | null;
  action: string;
  module: string;
  description?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalTransactions: number;
  monthlyChart: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  expenseByCategory: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  incomeByCategory: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  recentTransactions: TransactionItem[];
}

// Available Granular Permission Keys
export const ALL_PERMISSIONS = [
  { key: 'can_view_dashboard', label: 'Akses Dashboard Kas', category: 'Dashboard' },
  { key: 'can_view_transactions', label: 'Lihat Riwayat Transaksi', category: 'Transaksi' },
  { key: 'can_manage_transactions', label: 'Tambah / Edit / Hapus Transaksi', category: 'Transaksi' },
  { key: 'can_view_categories', label: 'Lihat Kategori Transaksi', category: 'Kategori' },
  { key: 'can_manage_categories', label: 'Tambah / Edit / Hapus Kategori', category: 'Kategori' },
  { key: 'can_manage_users', label: 'Kelola Pengguna & Hak Akses', category: 'Pengguna' },
  { key: 'can_export_reports', label: 'Export Laporan (Excel / PDF)', category: 'Laporan' },
  { key: 'can_view_audit_logs', label: 'Lihat Audit Log Sistem', category: 'Audit Log' },
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number]['key'];
