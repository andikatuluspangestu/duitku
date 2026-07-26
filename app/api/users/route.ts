import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDb, writeDb } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

function generateNextUserCode(existingUsers: Array<{ userCode: string }>): string {
  let maxNum = 0;
  existingUsers.forEach((u) => {
    if (u.userCode) {
      const match = u.userCode.match(/^USR(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `USR${nextNum.toString().padStart(3, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = readDb();
    const formatted = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      userCode: u.userCode || 'USR001',
      role: u.role,
      isActive: u.isActive,
      permissions: u.permissions || [],
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      _count: {
        transactions: db.transactions.filter((t) => t.userId === u.id).length,
        auditLogs: db.auditLogs.filter((a) => a.userId === u.id).length,
      },
    }));

    return NextResponse.json({ data: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
        { error: 'Akses ditolak: Hanya Superadmin/Admin yang dapat membuat pengguna' },
        { status: 403 }
      );
    }

    const body = await req.json();
    let { name, userCode, password, role, isActive, permissions } = body;

    if (!name || (!password && !body.userCode)) {
      if (!name) {
        return NextResponse.json({ error: 'Nama pengguna wajib diisi' }, { status: 400 });
      }
      if (!password) {
        return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 });
      }
    }

    const db = readDb();

    // Auto-generate code if empty
    if (!userCode || !userCode.trim()) {
      userCode = generateNextUserCode(db.users);
    }

    const formattedCode = userCode.trim().toUpperCase();

    if (db.users.some((u) => u.userCode && u.userCode.toUpperCase() === formattedCode)) {
      return NextResponse.json(
        { error: `Kode user "${formattedCode}" sudah terdaftar` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name.trim(),
      userCode: formattedCode,
      passwordHash,
      role: role || 'USER',
      isActive: isActive ?? true,
      permissions: Array.isArray(permissions) ? permissions : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    writeDb(db);

    await logAudit(
      'CREATE_USER',
      'USER',
      `Membuat pengguna baru: ${newUser.name} (${newUser.userCode}) [Role: ${newUser.role}]`,
      session.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        userCode: newUser.userCode,
        role: newUser.role,
        isActive: newUser.isActive,
        permissions: newUser.permissions,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
