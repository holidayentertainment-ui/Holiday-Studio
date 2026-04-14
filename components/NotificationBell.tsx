'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  user: { id: string; email: string } | null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  success: '#34d399',
  info: '#818cf8',
  warning: '#f59e0b',
};

export default function NotificationBell({ user }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount and every 60s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Mark all as read when opening
  const handleOpen = async () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) {
      try {
        await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      } catch {
        // silently fail
      }
    }
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
        style={{
          background: open ? 'rgba(99,102,241,0.12)' : 'transparent',
          border: '1px solid transparent',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        title="Notifications"
      >
        <svg width="17" height="17" viewBox="0 0 17 17" fill="none" className="text-[#8888a0]">
          <path
            d="M8.5 2a5.5 5.5 0 00-5.5 5.5v2.5L1.5 12h14l-1.5-2V7.5A5.5 5.5 0 008.5 2z"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
          />
          <path d="M7 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ background: '#6366f1' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl border overflow-hidden z-50 shadow-2xl"
          style={{
            background: 'rgba(12,12,20,0.98)',
            borderColor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <p className="text-sm font-semibold text-white">Notifications</p>
            {notifications.length > 0 && (
              <span className="text-xs text-[#44444f]">{notifications.length} total</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center">
                <svg className="mx-auto animate-spin text-[#44444f]" width="18" height="18" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
                  <path d="M7 1.5A5.5 5.5 0 0112.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <svg className="mx-auto mb-2.5 text-[#33333f]" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3a8 8 0 00-8 8v3.5L2.5 17h19l-1.5-2.5V11a8 8 0 00-8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 17.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-sm text-[#44444f]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif, idx) => (
                <div
                  key={notif.id}
                  className="px-4 py-3.5 transition-colors"
                  style={{
                    borderTop: idx === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    background: notif.is_read ? 'transparent' : 'rgba(99,102,241,0.04)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Type dot */}
                    <div
                      className="mt-1 w-2 h-2 rounded-full shrink-0"
                      style={{ background: TYPE_COLORS[notif.type] ?? '#818cf8' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white leading-snug mb-0.5">{notif.title}</p>
                      <p className="text-xs text-[#8888a0] leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-[#44444f] mt-1.5">{timeAgo(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#6366f1' }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
