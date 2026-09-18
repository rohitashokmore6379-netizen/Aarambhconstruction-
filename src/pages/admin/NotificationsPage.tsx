import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Check, Trash2 } from 'lucide-react';
import api from '../../services/api.ts';
import { formatDate } from '../../utils/formatters.ts';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.patch('/admin/notifications/mark-all-read');
      loadNotifications();
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            System Alerts & Notifications
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time milestone alerts, payment receipt notifications, and inventory stock warnings.
          </p>
        </div>

        <button
          onClick={markAllAsRead}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto border border-slate-700"
        >
          <Check className="w-4 h-4" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading alert center...</div>
        ) : notifications.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm bg-slate-900 rounded-3xl border border-slate-800">
            No active notifications.
          </div>
        ) : (
          notifications.map((n) => {
            const isWarning = n.type === 'WARNING';
            return (
              <div
                key={n._id}
                onClick={() => markAsRead(n._id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  n.isRead
                    ? 'bg-slate-900/40 border-slate-800 opacity-70'
                    : 'bg-slate-900 border-slate-700 shadow-lg'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isWarning
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  }`}
                >
                  {isWarning ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold ${n.isRead ? 'text-slate-300' : 'text-white'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                </div>

                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 self-center" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
