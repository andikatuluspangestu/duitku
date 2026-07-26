import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getUserSession, setUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, userCode: true, role: true, isActive: true, permissions: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });

    return NextResponse.json({ data: user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });

    const updateData: any = {};

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: 'Password saat ini wajib diisi untuk mengubah password' }, { status: 400 });
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) return NextResponse.json({ error: 'Password saat ini tidak cocok' }, { status: 400 });
      if (newPassword.length < 6) return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (name && name.trim()) updateData.name = name.trim();

    const updated = await prisma.user.update({ where: { id: session.id }, data: updateData });

    setUserSession({ ...session, name: updated.name });

    await logAudit('UPDATE_PROFILE', 'USER', `Mengubah profil akun: ${updated.name} (${updated.userCode})`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: { id: updated.id, name: updated.name, userCode: updated.userCode, role: updated.role, permissions: updated.permissions },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
