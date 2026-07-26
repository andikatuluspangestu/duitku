import { readDb, writeDb } from './db';
import { AuditLogItem } from './types';

export function createAuditLog(params: {
  userId?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}): void {
  try {
    const db = readDb();
    const userObj = params.userId ? db.users.find((u) => u.id === params.userId) : null;
    
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: params.userId || null,
      user: userObj
        ? {
            id: userObj.id,
            name: userObj.name,
            userCode: userObj.userCode || 'USR001',
          }
        : null,
      action: params.action,
      module: params.module,
      recordId: params.recordId || null,
      description: params.description || null,
      ipAddress: params.ipAddress || '127.0.0.1',
      userAgent: params.userAgent || 'Web Browser',
      createdAt: new Date().toISOString(),
    };

    db.auditLogs.unshift(newLog);
    writeDb(db);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export function logAudit(
  action: string,
  module: string,
  description?: string,
  userId?: string | null,
  ipAddress?: string
) {
  createAuditLog({
    action,
    module,
    description,
    userId,
    ipAddress,
  });
}
