import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_view_audit_logs');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak: Hanya Admin/Superadmin yang dapat melihat Audit Log.' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || '';
    const moduleParam = searchParams.get('module') || '';
    const userId = searchParams.get('userId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);

    const where: any = {};
    if (action) where.action = action;
    if (moduleParam) where.module = { equals: moduleParam, mode: 'insensitive' };
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, name: true, userCode: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
