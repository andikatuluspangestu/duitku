import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      session.role === 'SUPERADMIN' ||
      session.role === 'ADMIN' ||
      session.permissions.includes('can_manage_categories') ||
      session.permissions.includes('can_view_categories');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin/Superadmin yang dapat mengelola kategori.' }, { status: 403 });
    }

    const body = await req.json();
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
      type: type as 'INCOME' | 'EXPENSE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.categories.push(newCategory);
    writeDb(db);

    await logAudit(
      'CREATE_CATEGORY',
      'CATEGORY',
      `Menambah kategori baru: ${newCategory.name} (${type})`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({ message: 'Kategori berhasil dibuat', data: newCategory }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal membuat kategori' }, { status: 500 });
  }
}
