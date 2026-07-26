import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readDb, writeDb } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
    };

    db.categories[index] = updatedCat;
    writeDb(db);

    createAuditLog({
      userId: session.id,
      action: 'UPDATE_CATEGORY',
      module: 'CATEGORY',
      recordId: updatedCat.id,
      description: `Mengubah kategori: ${updatedCat.name} (${updatedCat.type})`,
    });

    return NextResponse.json({ message: 'Kategori berhasil diperbarui', data: updatedCat });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Hanya Admin yang dapat menghapus kategori.' }, { status: 403 });
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

  createAuditLog({
    userId: session.id,
    action: 'DELETE_CATEGORY',
    module: 'CATEGORY',
    recordId: deletedCat.id,
    description: `Menghapus kategori: ${deletedCat.name}`,
  });

  return NextResponse.json({ message: 'Kategori berhasil dihapus' });
}
