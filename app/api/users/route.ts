import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

function generateNextUserCode(existingCodes: string[]): string {
  let maxNum = 0;
  existingCodes.forEach((code) => {
    const match = code.match(/^USR(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `USR${(maxNum + 1).toString().padStart(3, '0')}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, userCode: true, role: true, isActive: true, permissions: true, createdAt: true, updatedAt: true, _count: { select: { transactions: true, auditLogs: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_manage_users');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin/Admin yang dapat membuat pengguna' }, { status: 403 });

    const body = await req.json();
    let { name, userCode, password, role, isActive, permissions } = body;

    if (!name) return NextResponse.json({ error: 'Nama pengguna wajib diisi' }, { status: 400 });
    if (!password) return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 });

    // Auto-generate userCode if not provided
    if (!userCode || !userCode.trim()) {
      const allUsers = await prisma.user.findMany({ select: { userCode: true } });
      userCode = generateNextUserCode(allUsers.map((u) => u.userCode));
    }

    const formattedCode = userCode.trim().toUpperCase();
    const existing = await prisma.user.findUnique({ where: { userCode: formattedCode } });
    if (existing) return NextResponse.json({ error: `Kode user "${formattedCode}" sudah terdaftar` }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        userCode: formattedCode,
        passwordHash,
        role: role || 'USER',
        isActive: isActive ?? true,
        permissions: Array.isArray(permissions) ? permissions : [],
      },
    });

    await logAudit('CREATE_USER', 'USER', `Membuat pengguna baru: ${newUser.name} (${newUser.userCode}) [Role: ${newUser.role}]`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ success: true, data: { id: newUser.id, name: newUser.name, userCode: newUser.userCode, role: newUser.role, isActive: newUser.isActive, permissions: newUser.permissions, createdAt: newUser.createdAt } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
