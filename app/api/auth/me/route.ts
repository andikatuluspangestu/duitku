import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getUserSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}
