import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { generateExcelReport } from '@/lib/export/excel';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_export_reports');
    if (!isAuthorized) return NextResponse.json({ error: 'Hanya Admin yang dapat mengekspor laporan.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.transactionDate.lte = endOfDay;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: { select: { id: true, name: true, type: true } }, user: { select: { id: true, name: true, userCode: true } } },
      orderBy: { transactionDate: 'desc' },
    });

    const excelBuffer = await generateExcelReport(transactions, 'Laporan Arus Kas UangKasir');

    await logAudit('EXPORT_EXCEL', 'REPORT', `Mengekspor ${transactions.length} data transaksi ke Excel (.xlsx)`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return new NextResponse(new Uint8Array(excelBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan-keuangan-${Date.now()}.xlsx"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengekspor laporan Excel' }, { status: 500 });
  }
}
