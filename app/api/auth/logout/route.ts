import { NextResponse } from 'next/server';
import { clearSessionCookie, getSession } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function POST() {
  const session = getSession();
  if (session) {
    createAuditLog({
      userId: session.id,
      action: 'LOGOUT',
      module: 'AUTH',
      description: `User ${session.email} logout`,
    });
  }
  clearSessionCookie();
  return NextResponse.json({ message: 'Logout berhasil' });
}
