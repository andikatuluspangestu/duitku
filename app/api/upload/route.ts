import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import sharp from 'sharp';

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

    // Only allow images
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG atau PNG' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Convert to AVIF
    const avifBuffer = await sharp(buffer).avif({ quality: 80 }).toBuffer();
    const base64Str = avifBuffer.toString('base64');
    const fileUrl = `data:image/avif;base64,${base64Str}`;

    const avifName = file.name.replace(/\.[^.]+$/, '') + '.avif';

    await logAudit(
      'UPLOAD_ATTACHMENT',
      'ATTACHMENT',
      `Mengunggah file lampiran: ${file.name} → ${(avifBuffer.length / 1024).toFixed(1)} KB (AVIF)`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({
      url: fileUrl,
      name: avifName,
      size: avifBuffer.length,
      mimeType: 'image/avif',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Gagal mengunggah file' }, { status: 500 });
  }
}
