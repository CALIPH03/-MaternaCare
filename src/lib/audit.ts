import { saveToLocal, addToSyncQueue } from './offline';
import { AuditLog, UserRole } from '../types';

export async function logAction(
  userId: string,
  userName: string,
  role: UserRole,
  action: string,
  entityType: string,
  entityId: string,
  details: string
) {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    userId,
    userName,
    role,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    await saveToLocal('audit_logs', log);
    await addToSyncQueue({ tableName: 'audit_logs', operation: 'INSERT', payload: log });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
}
