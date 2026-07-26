import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      session.role === 'SUPERADMIN' ||
      session.role === 'ADMIN' ||
      session.permissions.includes('can_manage_transactions') ||
      session.permissions.includes('can_view_transactions');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin/Superadmin yang dapat mengunggah bukti transaksi.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File lampiran tidak ditemukan' }, { status: 400 });
    }

    // Size limit check: 5 MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas maksimum 5 MB' }, { status: 400 });
    }

    // Allowed mime types (JPG, JPEG, PNG, PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, JPEG, PNG, atau PDF' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Str = buffer.toString('base64');
    
    // Serverless-safe Vercel Data URI
    const fileUrl = `data:${file.type};base64,${base64Str}`;

    await logAudit(
      'UPLOAD_ATTACHMENT',
      'ATTACHMENT',
      `Mengunggah file lampiran: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({
      url: fileUrl,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengunggah file' }, { status: 500 });
  }
}
