import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { generatePdfReport } from '@/lib/export/pdf';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      session.role === 'SUPERADMIN' ||
      session.role === 'ADMIN' ||
      session.permissions.includes('can_export_reports');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Hanya Admin yang dapat mengekspor laporan.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
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

    const pdfBuffer = generatePdfReport(transactions, 'Laporan Keuangan Kas Duitku');

    await logAudit(
      'EXPORT_PDF',
      'REPORT',
      `Mengekspor ${transactions.length} data transaksi ke dokumen PDF`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan-keuangan-${Date.now()}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengekspor laporan PDF' }, { status: 500 });
  }
}
