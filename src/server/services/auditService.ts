import { AuditLog, Notification } from '../models/index.ts';

export async function createAuditLog(params: {
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  projectId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await AuditLog.create({
      userId: params.userId,
      userName: params.userName || 'System/Admin',
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      projectId: params.projectId,
      description: params.description,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

export async function createNotification(params: {
  title: string;
  message: string;
  type: 'PAYMENT_RECEIVED' | 'PAYMENT_REVERSED' | 'WORKER_PAYMENT' | 'LOW_STOCK' | 'OVERPAYMENT' | 'ALERT';
  link?: string;
}) {
  try {
    await Notification.create({
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      isRead: false,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
