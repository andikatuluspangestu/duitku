import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_manage_categories');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

    const body = await req.json();
    const { name, type } = body;

    const existing = await prisma.category.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });

    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.category.findFirst({ where: { id: { not: params.id }, name: { equals: name.trim(), mode: 'insensitive' }, type: type || existing.type } });
      if (duplicate) return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id: params.id },
      data: { name: name ? name.trim() : existing.name, type: type || existing.type },
    });

    await logAudit('UPDATE_CATEGORY', 'CATEGORY', `Mengubah kategori: ${updated.name} (${updated.type})`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ message: 'Kategori berhasil diperbarui', data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_manage_categories');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

    const existing = await prisma.category.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });

    const isUsed = await prisma.transaction.count({ where: { categoryId: params.id } });
    if (isUsed > 0) return NextResponse.json({ error: 'Kategori ini tidak dapat dihapus karena sudah digunakan dalam transaksi.' }, { status: 400 });

    await prisma.category.delete({ where: { id: params.id } });

    await logAudit('DELETE_CATEGORY', 'CATEGORY', `Menghapus kategori: ${existing.name}`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus kategori' }, { status: 500 });
  }
}
