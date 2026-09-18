import { Response } from 'express';
import { AuditLog } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function getAuditLogs(req: AuthRequest, res: Response) {
  try {
    const { action, entityType, projectId } = req.query;
    const filter: any = {};
    if (action && action !== 'ALL') filter.action = action;
    if (entityType && entityType !== 'ALL') filter.entityType = entityType;
    if (projectId && projectId !== 'ALL') filter.projectId = projectId;

    const logs = await AuditLog.find(filter)
      .populate('projectId', 'projectName projectCode')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ success: true, data: logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
