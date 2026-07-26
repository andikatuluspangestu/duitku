import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAuthorized =
      session.role === 'SUPERADMIN' ||
      session.role === 'ADMIN' ||
      session.permissions.includes('can_view_audit_logs');

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Admin/Superadmin yang dapat melihat Audit Log.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || '';
    const moduleParam = searchParams.get('module') || '';
    const userId = searchParams.get('userId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const db = readDb();
    let logs = [...db.auditLogs];

    if (action) {
      logs = logs.filter((l) => l.action === action);
    }
    if (moduleParam) {
      logs = logs.filter((l) => l.module.toLowerCase() === moduleParam.toLowerCase());
    }
    if (userId) {
      logs = logs.filter((l) => l.userId === userId);
    }

    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = logs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedLogs = logs.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: paginatedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
