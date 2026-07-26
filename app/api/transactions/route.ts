import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.toLowerCase() || '';
  const type = searchParams.get('type') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const db = readDb();
  let items = [...db.transactions];

  // Filtering
  if (search) {
    items = items.filter(
      (t) =>
        t.description?.toLowerCase().includes(search) ||
        t.category?.name.toLowerCase().includes(search) ||
        t.amount.toString().includes(search)
    );
  }

  if (type) {
    items = items.filter((t) => t.type === type);
  }

  if (categoryId) {
    items = items.filter((t) => t.categoryId === categoryId);
  }

  if (dateFrom) {
    items = items.filter((t) => new Date(t.transactionDate) >= new Date(dateFrom));
  }

  if (dateTo) {
    const endOfDay = new Date(dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    items = items.filter((t) => new Date(t.transactionDate) <= endOfDay);
  }

  // Populate relational objects
  items = items.map((t) => {
    const cat = db.categories.find((c) => c.id === t.categoryId);
    const usr = db.users.find((u) => u.id === t.userId);
    return {
      ...t,
      category: cat ? { id: cat.id, name: cat.name, type: cat.type } : undefined,
      user: usr ? { id: usr.id, name: usr.name, email: usr.email } : undefined,
    };
  });

  // Sort descending by transactionDate
  items.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

  // Pagination
  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = items.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    data: paginatedItems,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  });
}

export async function POST(request: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Enforce ADMIN role requirement
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Hanya Admin yang dapat menambah transaksi.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { type, amount, categoryId, transactionDate, description, attachmentUrl, attachmentName, attachmentSize, attachmentMimeType } = body;

    // Validation
    if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json({ error: 'Jenis transaksi harus INCOME atau EXPENSE' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount < 1) {
      return NextResponse.json({ error: 'Nominal transaksi harus berupa angka minimal Rp 1' }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Kategori transaksi wajib dipilih' }, { status: 400 });
    }

    if (!transactionDate) {
      return NextResponse.json({ error: 'Tanggal transaksi wajib diisi' }, { status: 400 });
    }

    if (description && description.length > 255) {
      return NextResponse.json({ error: 'Keterangan maksimal 255 karakter' }, { status: 400 });
    }

    const db = readDb();
    const categoryExists = db.categories.find((c) => c.id === categoryId);
    if (!categoryExists) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const newTransaction = {
      id: `trx-${Date.now()}`,
      type,
      amount: numericAmount,
      description: description || null,
      transactionDate: new Date(transactionDate).toISOString(),
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentSize: attachmentSize || null,
      attachmentMimeType: attachmentMimeType || null,
      userId: session.id,
      categoryId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.transactions.unshift(newTransaction);
    writeDb(db);

    createAuditLog({
      userId: session.id,
      action: 'CREATE_TRANSACTION',
      module: 'TRANSACTION',
      recordId: newTransaction.id,
      description: `Menambah transaksi ${type} sebesar Rp ${numericAmount.toLocaleString('id-ID')} (${categoryExists.name})`,
    });

    return NextResponse.json({ message: 'Transaksi berhasil disimpan', data: newTransaction }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menyimpan transaksi' }, { status: 500 });
  }
}
