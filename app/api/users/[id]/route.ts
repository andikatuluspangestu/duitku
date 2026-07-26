import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDb, writeDb } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      session.role === 'SUPERADMIN' ||
      session.role === 'ADMIN' ||
      session.permissions.includes('can_manage_users');

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Superadmin/Admin yang dapat mengubah pengguna' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, userCode, password, role, isActive, permissions } = body;

    const db = readDb();
    const index = db.users.findIndex((u) => u.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const currentUser = db.users[index];

    if (userCode) {
      const formattedCode = userCode.trim().toUpperCase();
      if (formattedCode !== currentUser.userCode?.toUpperCase()) {
        if (db.users.some((u) => u.userCode?.toUpperCase() === formattedCode)) {
          return NextResponse.json(
            { error: `Kode user "${formattedCode}" sudah digunakan` },
            { status: 400 }
          );
        }
        currentUser.userCode = formattedCode;
      }
    }

    if (name) currentUser.name = name.trim();
    if (role) currentUser.role = role;
    if (typeof isActive === 'boolean') currentUser.isActive = isActive;
    if (Array.isArray(permissions)) currentUser.permissions = permissions;
    if (password && password.trim()) {
      currentUser.passwordHash = await bcrypt.hash(password, 10);
    }

    currentUser.updatedAt = new Date().toISOString();
    writeDb(db);

    await logAudit(
      'UPDATE_USER',
      'USER',
      `Memperbarui data & hak akses pengguna: ${currentUser.name} (${currentUser.userCode})`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({
      success: true,
      data: {
        id: currentUser.id,
        name: currentUser.name,
        userCode: currentUser.userCode,
        role: currentUser.role,
        isActive: currentUser.isActive,
        permissions: currentUser.permissions,
        updatedAt: currentUser.updatedAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      session.role === 'SUPERADMIN' ||
      session.role === 'ADMIN' ||
      session.permissions.includes('can_manage_users');

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Superadmin/Admin yang dapat menghapus pengguna' },
        { status: 403 }
      );
    }

    if (session.id === params.id) {
      return NextResponse.json(
        { error: 'Anda tidak dapat menghapus akun Anda sendiri' },
        { status: 400 }
      );
    }

    const db = readDb();
    const index = db.users.findIndex((u) => u.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const deletedUser = db.users[index];
    db.users.splice(index, 1);
    writeDb(db);

    await logAudit(
      'DELETE_USER',
      'USER',
      `Menghapus pengguna: ${deletedUser.name} (${deletedUser.userCode})`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
