import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getUserSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin yang dapat melakukan backup.' }, { status: 403 });
    }

    const [users, categories, transactions, auditLogs, backups] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, userCode: true, role: true, isActive: true, permissions: true, createdAt: true, updatedAt: true } }),
      prisma.category.findMany(),
      prisma.transaction.findMany(),
      prisma.auditLog.findMany(),
      prisma.backup.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);

    return NextResponse.json({ data: { users, categories, transactions, auditLogs }, backups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin yang dapat melakukan restore.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File backup tidak ditemukan' }, { status: 400 });
    }

    if (!file.name.endsWith('.json')) {
      return NextResponse.json({ error: 'Format file harus .json' }, { status: 400 });
    }

    const text = await file.text();
    let backupData: any;
    try {
      backupData = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'File backup tidak valid (bukan JSON)' }, { status: 400 });
    }

    if (!backupData.users || !backupData.categories || !backupData.transactions) {
      return NextResponse.json({ error: 'File backup tidak valid (struktur data tidak lengkap)' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const restoredUsers: any[] = [];
      const restoredCategories: any[] = [];
      const restoredTransactions: any[] = [];

      for (const u of backupData.users) {
        const created = await tx.user.upsert({
          where: { id: u.id },
          update: { name: u.name, userCode: u.userCode, role: u.role, isActive: u.isActive, permissions: u.permissions },
          create: { id: u.id, name: u.name, userCode: u.userCode, passwordHash: u.passwordHash, role: u.role, isActive: u.isActive ?? true, permissions: u.permissions ?? [] },
        });
        restoredUsers.push(created);
      }

      for (const c of backupData.categories) {
        const created = await tx.category.upsert({
          where: { id: c.id },
          update: { name: c.name, type: c.type },
          create: { id: c.id, name: c.name, type: c.type },
        });
        restoredCategories.push(created);
      }

      for (const t of backupData.transactions) {
        const created = await tx.transaction.upsert({
          where: { id: t.id },
          update: { type: t.type, amount: t.amount, description: t.description, transactionDate: new Date(t.transactionDate), categoryId: t.categoryId, userId: t.userId },
          create: { id: t.id, type: t.type, amount: t.amount, description: t.description, transactionDate: new Date(t.transactionDate), categoryId: t.categoryId, userId: t.userId, attachmentUrl: t.attachmentUrl, attachmentName: t.attachmentName, attachmentSize: t.attachmentSize, attachmentMimeType: t.attachmentMimeType },
        });
        restoredTransactions.push(created);
      }

      return { users: restoredUsers.length, categories: restoredCategories.length, transactions: restoredTransactions.length };
    });

    await logAudit('RESTORE_BACKUP', 'BACKUP', `Merestore backup: ${result.users} user, ${result.categories} kategori, ${result.transactions} transaksi`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ message: 'Restore berhasil', data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal merestore backup' }, { status: 500 });
  }
}
