import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getUserSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_manage_users');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin/Admin yang dapat mengubah pengguna' }, { status: 403 });

    const body = await req.json();
    const { name, userCode, password, role, isActive, permissions } = body;

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });

    const updateData: any = {};

    if (userCode) {
      const formattedCode = userCode.trim().toUpperCase();
      if (formattedCode !== existing.userCode) {
        const taken = await prisma.user.findUnique({ where: { userCode: formattedCode } });
        if (taken) return NextResponse.json({ error: `Kode user "${formattedCode}" sudah digunakan` }, { status: 400 });
        updateData.userCode = formattedCode;
      }
    }

    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (Array.isArray(permissions)) updateData.permissions = permissions;
    if (password && password.trim()) updateData.passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({ where: { id: params.id }, data: updateData });

    await logAudit('UPDATE_USER', 'USER', `Memperbarui data & hak akses pengguna: ${updated.name} (${updated.userCode})`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ success: true, data: { id: updated.id, name: updated.name, userCode: updated.userCode, role: updated.role, isActive: updated.isActive, permissions: updated.permissions, updatedAt: updated.updatedAt } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = getUserSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAuthorized = session.role === 'SUPERADMIN' || session.role === 'ADMIN' || session.permissions.includes('can_manage_users');
    if (!isAuthorized) return NextResponse.json({ error: 'Akses ditolak: Hanya Superadmin/Admin yang dapat menghapus pengguna' }, { status: 403 });

    if (session.id === params.id) return NextResponse.json({ error: 'Anda tidak dapat menghapus akun Anda sendiri' }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });

    await prisma.user.delete({ where: { id: params.id } });

    await logAudit('DELETE_USER', 'USER', `Menghapus pengguna: ${existing.name} (${existing.userCode})`, session.id, req.headers.get('x-forwarded-for') || '127.0.0.1');

    return NextResponse.json({ success: true, message: 'Pengguna berhasil dihapus' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
