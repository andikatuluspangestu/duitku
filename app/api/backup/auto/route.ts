import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [users, categories, transactions] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, userCode: true, passwordHash: true, role: true, isActive: true, permissions: true, createdAt: true, updatedAt: true } }),
      prisma.category.findMany(),
      prisma.transaction.findMany(),
    ]);

    const backupData = { users, categories, transactions };
    const jsonStr = JSON.stringify(backupData);
    const size = new TextEncoder().encode(jsonStr).length;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const name = `Auto backup ${yesterday.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    await prisma.backup.create({ data: { name, data: jsonStr, size } });

    // Keep only last 30 backups
    const allBackupIds = await prisma.backup.findMany({ orderBy: { createdAt: 'desc' }, skip: 30, select: { id: true } });
    const idsToDelete = allBackupIds.map((b) => b.id);
    if (idsToDelete.length > 0) {
      await prisma.backup.deleteMany({ where: { id: { in: idsToDelete } } });
    }

    return NextResponse.json({ success: true, name, size });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
