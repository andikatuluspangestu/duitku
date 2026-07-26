import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { generateExcelReport } from '@/lib/export/excel';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Hanya Admin yang dapat mengekspor laporan.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const db = readDb();
  let transactions = [...db.transactions];

  if (dateFrom) {
    transactions = transactions.filter((t) => new Date(t.transactionDate) >= new Date(dateFrom));
  }
  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    transactions = transactions.filter((t) => new Date(t.transactionDate) <= endOfDay);
  }

  // Populate categories & users
  transactions = transactions.map((t) => ({
    ...t,
    category: db.categories.find((c) => c.id === t.categoryId),
    user: db.users.find((u) => u.id === t.userId),
  }));

  transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  const excelBuffer = await generateExcelReport(transactions, 'Laporan Arus Kas Simple Finance');

  createAuditLog({
    userId: session.id,
    action: 'EXPORT_EXCEL',
    module: 'REPORT',
    description: `Mengekspor ${transactions.length} data transaksi ke Excel (.xlsx)`,
  });

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="laporan-keuangan-${Date.now()}.xlsx"`,
    },
  });
}
