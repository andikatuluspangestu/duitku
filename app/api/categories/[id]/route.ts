import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const db = readDb();
    const index = db.categories.findIndex((c) => c.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    const existingCat = db.categories[index];

    if (name && name.trim() !== existingCat.name) {
      const duplicate = db.categories.find(
        (c) => c.id !== params.id && c.name.toLowerCase() === name.trim().toLowerCase() && c.type === (type || existingCat.type)
      );
      if (duplicate) {
        return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 400 });
      }
    }

    const updatedCat = {
      ...existingCat,
      name: name ? name.trim() : existingCat.name,
      type: type || existingCat.type,
      updatedAt: new Date().toISOString(),
    };

    db.categories[index] = updatedCat;
    writeDb(db);

    await logAudit(
      'UPDATE_CATEGORY',
      'CATEGORY',
      `Mengubah kategori: ${updatedCat.name} (${updatedCat.type})`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({ message: 'Kategori berhasil diperbarui', data: updatedCat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin/Superadmin yang dapat menghapus kategori.' }, { status: 403 });
    }

    const db = readDb();
    const index = db.categories.findIndex((c) => c.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    // Check if category is used in transactions
    const isUsed = db.transactions.some((t) => t.categoryId === params.id);
    if (isUsed) {
      return NextResponse.json({ error: 'Kategori ini tidak dapat dihapus karena sudah digunakan dalam transaksi.' }, { status: 400 });
    }

    const deletedCat = db.categories[index];
    db.categories.splice(index, 1);
    writeDb(db);

    await logAudit(
      'DELETE_CATEGORY',
      'CATEGORY',
      `Menghapus kategori: ${deletedCat.name}`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus kategori' }, { status: 500 });
  }
}
