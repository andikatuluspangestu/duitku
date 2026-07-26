import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin yang dapat membuat backup.' }, { status: 403 });
    }

    const [users, categories, transactions] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, userCode: true, passwordHash: true, role: true, isActive: true, permissions: true, createdAt: true, updatedAt: true } }),
      prisma.category.findMany(),
      prisma.transaction.findMany(),
    ]);

    const backupData = { users, categories, transactions };
    const jsonStr = JSON.stringify(backupData);
    const size = new TextEncoder().encode(jsonStr).length;
    const now = new Date();
    const name = `Manual backup ${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    const backup = await prisma.backup.create({ data: { name, data: jsonStr, size } });

    await logAudit('CREATE_BACKUP', 'BACKUP', `Membuat backup manual: ${name} (${(size / 1024).toFixed(1)} KB)`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ message: 'Backup berhasil dibuat', data: { id: backup.id, name: backup.name, size: backup.size, createdAt: backup.createdAt } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat backup' }, { status: 500 });
  }
}
