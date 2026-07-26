import { NextRequest, NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = readDb();
    const trx = db.transactions.find((t) => t.id === params.id);
    if (!trx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const cat = db.categories.find((c) => c.id === trx.categoryId);
    const usr = db.users.find((u) => u.id === trx.userId);

    return NextResponse.json({
      data: {
        ...trx,
        category: cat ? { id: cat.id, name: cat.name, type: cat.type } : undefined,
        user: usr ? { id: usr.id, name: usr.name, userCode: usr.userCode } : undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      session.role === 'SUPERADMIN' ||
      session.role === 'ADMIN' ||
      session.permissions.includes('can_view_transactions');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin/Superadmin yang dapat mengubah transaksi.' }, { status: 403 });
    }

    const body = await req.json();
    const { type, amount, categoryId, transactionDate, description, attachmentUrl, attachmentName, attachmentSize, attachmentMimeType } = body;

    const db = readDb();
    const index = db.transactions.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const existingTrx = db.transactions[index];
    const numericAmount = amount !== undefined ? Number(amount) : existingTrx.amount;

    if (numericAmount < 1) {
      return NextResponse.json({ error: 'Nominal transaksi minimal Rp 1' }, { status: 400 });
    }

    if (description && description.length > 255) {
      return NextResponse.json({ error: 'Keterangan maksimal 255 karakter' }, { status: 400 });
    }

    const updatedTrx = {
      ...existingTrx,
      type: type || existingTrx.type,
      amount: numericAmount,
      categoryId: categoryId || existingTrx.categoryId,
      transactionDate: transactionDate ? new Date(transactionDate).toISOString() : existingTrx.transactionDate,
      description: description !== undefined ? description : existingTrx.description,
      attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : existingTrx.attachmentUrl,
      attachmentName: attachmentName !== undefined ? attachmentName : existingTrx.attachmentName,
      attachmentSize: attachmentSize !== undefined ? attachmentSize : existingTrx.attachmentSize,
      attachmentMimeType: attachmentMimeType !== undefined ? attachmentMimeType : existingTrx.attachmentMimeType,
      updatedAt: new Date().toISOString(),
    };

    db.transactions[index] = updatedTrx;
    writeDb(db);

    await logAudit(
      'UPDATE_TRANSACTION',
      'TRANSACTION',
      `Mengubah transaksi ${updatedTrx.id} (${updatedTrx.type}) nominal Rp ${updatedTrx.amount.toLocaleString('id-ID')}`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({ message: 'Transaksi berhasil diperbarui', data: updatedTrx });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal memperbarui transaksi' }, { status: 500 });
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
      session.permissions.includes('can_view_transactions');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin/Superadmin yang dapat menghapus transaksi.' }, { status: 403 });
    }

    const db = readDb();
    const index = db.transactions.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    const deletedTrx = db.transactions[index];
    db.transactions.splice(index, 1);
    writeDb(db);

    await logAudit(
      'DELETE_TRANSACTION',
      'TRANSACTION',
      `Menghapus transaksi ${deletedTrx.id} (${deletedTrx.type}) nominal Rp ${deletedTrx.amount.toLocaleString('id-ID')}`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal menghapus transaksi' }, { status: 500 });
  }
}
