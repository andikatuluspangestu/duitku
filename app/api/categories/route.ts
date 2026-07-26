import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = readDb();
  const categoriesWithCount = db.categories.map((c) => {
    const txCount = db.transactions.filter((t) => t.categoryId === c.id).length;
    return {
      ...c,
      _count: { transactions: txCount },
    };
  });

  return NextResponse.json({ data: categoriesWithCount });
}

export async function POST(request: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Hanya Admin yang dapat mengelola kategori.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
      return NextResponse.json({ error: 'Jenis kategori harus INCOME atau EXPENSE' }, { status: 400 });
    }

    const db = readDb();
    const duplicate = db.categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase() && c.type === type);
    if (duplicate) {
      return NextResponse.json({ error: `Kategori ${name} untuk ${type} sudah ada` }, { status: 400 });
    }

    const newCategory = {
      id: `cat-${type.toLowerCase().slice(0, 3)}-${Date.now()}`,
      name: name.trim(),
      type,
      createdAt: new Date().toISOString(),
    };

    db.categories.push(newCategory);
    writeDb(db);

    createAuditLog({
      userId: session.id,
      action: 'CREATE_CATEGORY',
      module: 'CATEGORY',
      recordId: newCategory.id,
      description: `Menambah kategori baru: ${newCategory.name} (${type})`,
    });

    return NextResponse.json({ message: 'Kategori berhasil dibuat', data: newCategory }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat kategori' }, { status: 500 });
  }
}
