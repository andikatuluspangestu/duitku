import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import type { Prisma } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin yang dapat melakukan restore.' }, { status: 403 });
    }

    const backup = await prisma.backup.findUnique({ where: { id: params.id } });
    if (!backup) {
      return NextResponse.json({ error: 'Backup tidak ditemukan' }, { status: 404 });
    }

    let backupData: any;
    try {
      backupData = JSON.parse(backup.data);
    } catch {
      return NextResponse.json({ error: 'Data backup rusak' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let users = 0, categories = 0, transactions = 0;

      for (const u of backupData.users || []) {
        await tx.user.upsert({
          where: { id: u.id },
          update: { name: u.name, userCode: u.userCode, role: u.role, isActive: u.isActive, permissions: u.permissions },
          create: { id: u.id, name: u.name, userCode: u.userCode, passwordHash: u.passwordHash, role: u.role, isActive: u.isActive ?? true, permissions: u.permissions ?? [] },
        });
        users++;
      }

      for (const c of backupData.categories || []) {
        await tx.category.upsert({
          where: { id: c.id },
          update: { name: c.name, type: c.type },
          create: { id: c.id, name: c.name, type: c.type },
        });
        categories++;
      }

      for (const t of backupData.transactions || []) {
        await tx.transaction.upsert({
          where: { id: t.id },
          update: { type: t.type, amount: t.amount, description: t.description, transactionDate: new Date(t.transactionDate), categoryId: t.categoryId, userId: t.userId },
          create: { id: t.id, type: t.type, amount: t.amount, description: t.description, transactionDate: new Date(t.transactionDate), categoryId: t.categoryId, userId: t.userId, attachmentUrl: t.attachmentUrl, attachmentName: t.attachmentName, attachmentSize: t.attachmentSize, attachmentMimeType: t.attachmentMimeType },
        });
        transactions++;
      }

      return { users, categories, transactions };
    });

    await logAudit('RESTORE_BACKUP', 'BACKUP', `Merestore backup "${backup.name}": ${result.users} user, ${result.categories} kategori, ${result.transactions} transaksi`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ message: 'Restore berhasil', data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal merestore backup' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin yang dapat menghapus backup.' }, { status: 403 });
    }

    await prisma.backup.delete({ where: { id: params.id } });

    return NextResponse.json({ message: 'Backup berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus backup' }, { status: 500 });
  }
}
