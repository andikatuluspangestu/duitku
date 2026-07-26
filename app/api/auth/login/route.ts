import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { readDb, writeDb } from '@/lib/db';
import { createToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userCode, password } = body;

    if (!userCode || !password) {
      return NextResponse.json(
        { error: 'Kode user dan password wajib diisi' },
        { status: 400 }
      );
    }

    const db = readDb();
    const targetCode = userCode.trim().toUpperCase();

    // Match by userCode (or fallback to email if legacy)
    const user = db.users.find(
      (u) =>
        (u.userCode && u.userCode.toUpperCase() === targetCode) ||
        (u.email && u.email.toUpperCase() === targetCode)
    );

    if (!user) {
      await logAudit(
        'LOGIN_FAILED',
        'AUTH',
        `Percobaan login gagal untuk kode user: ${userCode}`,
        undefined,
        req.headers.get('x-forwarded-for') || '127.0.0.1'
      );
      return NextResponse.json(
        { error: 'Kode user atau password salah' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      await logAudit(
        'LOGIN_FAILED',
        'AUTH',
        `Percobaan login akun nonaktif: ${userCode}`,
        user.id,
        req.headers.get('x-forwarded-for') || '127.0.0.1'
      );
      return NextResponse.json(
        { error: 'Akun Anda nonaktif. Hubungi Superadmin.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await logAudit(
        'LOGIN_FAILED',
        'AUTH',
        `Password salah untuk kode user: ${userCode}`,
        user.id,
        req.headers.get('x-forwarded-for') || '127.0.0.1'
      );
      return NextResponse.json(
        { error: 'Kode user atau password salah' },
        { status: 401 }
      );
    }

    const userSession = {
      id: user.id,
      name: user.name,
      userCode: user.userCode || userCode,
      role: user.role,
      permissions: user.permissions || [],
    };

    const token = createToken(userSession);

    await logAudit(
      'LOGIN',
      'AUTH',
      `Pengguna ${user.name} (${user.userCode}) berhasil login [Role: ${user.role}]`,
      user.id,
      req.headers.get('x-forwarded-for') || '127.0.0.1'
    );

    const response = NextResponse.json({
      success: true,
      user: userSession,
    });

    response.cookies.set({
      name: 'sf_session',
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
