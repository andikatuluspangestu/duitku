import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.toLowerCase() || '';
    const type = searchParams.get('type') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where: any = {};
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (dateFrom || dateTo) {
      where.transactionDate = {};
      if (dateFrom) where.transactionDate.gte = new Date(dateFrom);
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        where.transactionDate.lte = endOfDay;
      }
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true, user: { select: { id: true, name: true, userCode: true } } },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_view_transactions');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak: Hanya Admin/Superadmin yang dapat menambah transaksi.' }, { status: 403 });

    const body = await req.json();
    const { type, amount, categoryId, transactionDate, description, attachmentUrl, attachmentName, attachmentSize, attachmentMimeType } = body;

    if (!type || !['INCOME', 'EXPENSE'].includes(type)) return NextResponse.json({ error: 'Jenis transaksi harus INCOME atau EXPENSE' }, { status: 400 });
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 1) return NextResponse.json({ error: 'Nominal transaksi harus berupa angka minimal Rp 1' }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: 'Kategori transaksi wajib dipilih' }, { status: 400 });
    if (!transactionDate) return NextResponse.json({ error: 'Tanggal transaksi wajib diisi' }, { status: 400 });
    if (description && description.length > 255) return NextResponse.json({ error: 'Keterangan maksimal 255 karakter' }, { status: 400 });

    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });

    const newTransaction = await prisma.transaction.create({
      data: {
        type,
        amount: numericAmount,
        description: description || null,
        transactionDate: new Date(transactionDate),
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentSize: attachmentSize || null,
        attachmentMimeType: attachmentMimeType || null,
        userId: session.id,
        categoryId,
      },
      include: { category: true, user: { select: { id: true, name: true, userCode: true } } },
    });

    await logAudit('CREATE_TRANSACTION', 'TRANSACTION', `Menambah transaksi ${type} sebesar Rp ${numericAmount.toLocaleString('id-ID')} (${categoryExists.name})`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ message: 'Transaksi berhasil disimpan', data: newTransaction }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menyimpan transaksi' }, { status: 500 });
  }
}
