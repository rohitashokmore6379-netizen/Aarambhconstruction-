import { Response } from 'express';
import { Notification } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';

export async function getNotifications(req: AuthRequest, res: Response) {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30);
    const unreadCount = await Notification.countDocuments({ isRead: false });
    return res.json({ success: true, data: notifications, unreadCount });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markNotificationRead(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function markAllNotificationsRead(req: AuthRequest, res: Response) {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
