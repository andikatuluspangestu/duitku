import { prisma } from './prisma';

export async function logAudit(
  action: string,
  module: string,
  description?: string,
  userId?: string | null,
  ipAddress?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        module,
        description: description || null,
        userId: userId || null,
        ipAddress: ipAddress || '127.0.0.1',
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Alias for backward compat
export const createAuditLog = ({
  action,
  module,
  description,
  userId,
  ipAddress,
}: {
  action: string;
  module: string;
  description?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  recordId?: string | null;
  userAgent?: string | null;
}) => logAudit(action, module, description ?? undefined, userId, ipAddress ?? undefined);
