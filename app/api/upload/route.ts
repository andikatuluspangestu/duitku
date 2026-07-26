import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request: Request) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Hanya Admin yang dapat mengunggah bukti transaksi.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File lampiran tidak ditemukan' }, { status: 400 });
    }

    // Size limit check: 5 MB (PRD Section 5.7)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Ukuran file melebihi batas maksimum 5 MB' }, { status: 400 });
    }

    // Allowed mime types (JPG, JPEG, PNG, PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file harus JPG, JPEG, PNG, atau PDF' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg');
    const safeName = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;

    createAuditLog({
      userId: session.id,
      action: 'UPLOAD_ATTACHMENT',
      module: 'ATTACHMENT',
      description: `Mengunggah file lampiran: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
    });

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
