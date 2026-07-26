import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDb, writeDb } from '@/lib/db';
import { getUserSession, setUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = readDb();
    const user = db.users.find((u) => u.id === session.id);
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        userCode: user.userCode || 'USR001',
        role: user.role,
        isActive: user.isActive,
        permissions: user.permissions || [],
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, currentPassword, newPassword } = body;

    const db = readDb();
    const userIndex = db.users.findIndex((u) => u.id === session.id);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const user = db.users[userIndex];

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Password saat ini wajib diisi untuk mengubah password' }, { status: 400 });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Password saat ini tidak cocok' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
      }

      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    user.updatedAt = new Date().toISOString();
    db.users[userIndex] = user;
    writeDb(db);

    // Update Session Cookie with new name
    const updatedSession = {
      ...session,
      name: user.name,
    };
    setUserSession(updatedSession);

    await logAudit(
      'UPDATE_PROFILE',
      'USER',
      `Mengubah profil akun: ${user.name} (${user.userCode})`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: {
        id: user.id,
        name: user.name,
        userCode: user.userCode,
        role: user.role,
        permissions: user.permissions,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
