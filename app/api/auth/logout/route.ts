import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = getUserSession();
    if (session) {
      await logAudit(
        'LOGOUT',
        'AUTH',
        `Pengguna ${session.name} (${session.userCode}) logout`,
        session.id,
        req.headers.get('x-forwarded-for') || '127.0.0.1'
      );
    }
    clearSessionCookie();
    return NextResponse.json({ message: 'Logout berhasil' });
  } catch (err: any) {
    clearSessionCookie();
    return NextResponse.json({ message: 'Logout berhasil' });
  }
}
