import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const trx = await prisma.transaction.findUnique({
      where: { id: params.id },
      include: { category: true, user: { select: { id: true, name: true, userCode: true } } },
    });

    if (!trx) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ data: trx });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_view_transactions');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

    const body = await req.json();
    const { type, amount, categoryId, transactionDate, description, attachmentUrl, attachmentName, attachmentSize, attachmentMimeType } = body;

    const existing = await prisma.transaction.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });

    const numericAmount = amount !== undefined ? Number(amount) : existing.amount;
    if (numericAmount < 1) return NextResponse.json({ error: 'Nominal transaksi minimal Rp 1' }, { status: 400 });
    if (description && description.length > 255) return NextResponse.json({ error: 'Keterangan maksimal 255 karakter' }, { status: 400 });

    const updated = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        type: type || existing.type,
        amount: numericAmount,
        categoryId: categoryId || existing.categoryId,
        transactionDate: transactionDate ? new Date(transactionDate) : existing.transactionDate,
        description: description !== undefined ? description : existing.description,
        attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existing.attachmentUrl,
        attachmentName: attachmentName !== undefined ? attachmentName : existing.attachmentName,
        attachmentSize: attachmentSize !== undefined ? attachmentSize : existing.attachmentSize,
        attachmentMimeType: attachmentMimeType !== undefined ? attachmentMimeType : existing.attachmentMimeType,
      },
      include: { category: true, user: { select: { id: true, name: true, userCode: true } } },
    });

    await logAudit('UPDATE_TRANSACTION', 'TRANSACTION', `Mengubah transaksi ${updated.id} (${updated.type}) nominal Rp ${updated.amount.toLocaleString('id-ID')}`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ message: 'Transaksi berhasil diperbarui', data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui transaksi' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_view_transactions');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });

    const existing = await prisma.transaction.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });

    await prisma.transaction.delete({ where: { id: params.id } });

    await logAudit('DELETE_TRANSACTION', 'TRANSACTION', `Menghapus transaksi ${existing.id} (${existing.type}) nominal Rp ${existing.amount.toLocaleString('id-ID')}`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
