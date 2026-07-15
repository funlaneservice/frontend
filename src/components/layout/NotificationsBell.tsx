'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Plane, Wallet, Info, CheckCheck, Inbox } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { NotificationType, NotificationView } from '@/interface/notification.interface';

const TYPE_META: Record<NotificationType, { icon: typeof Bell; tint: string }> = {
  REQUEST: { icon: Plane, tint: 'bg-brand-soft text-brand' },
  WALLET: { icon: Wallet, tint: 'bg-green-soft text-green-dark' },
  SYSTEM: { icon: Info, tint: 'bg-surface text-ink-2 border border-line' },
};

/** "3m ago" style relative timestamp, falling back to a date for old items. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/**
 * Topbar bell with unread badge and a dropdown notification panel. Shared by
 * every portal (client, agent, admin). Mock-backed until the backend's
 * real-time delivery ships — swap happens in notifications.api.ts only.
 */
export function NotificationsBell() {
  const router = useRouter();
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function openItem(n: NotificationView) {
    void markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount ? `Notifications — ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-brand/50"
      >
        <Bell aria-hidden="true" className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red text-white text-[9px] font-bold border-2 border-card">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-11 w-[min(92vw,380px)] bg-card border border-line rounded-2xl shadow-lg z-[80] overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <h2 className="text-sm font-semibold text-ink">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              >
                <CheckCheck aria-hidden="true" className="w-3.5 h-3.5" /> Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-lg bg-surface shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-surface rounded w-2/3" />
                      <div className="h-3 bg-surface rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="p-10 text-center">
                <Inbox aria-hidden="true" className="w-8 h-8 text-ink-3/60 mx-auto mb-3" />
                <p className="text-sm font-medium text-ink-2">You&apos;re all caught up</p>
                <p className="text-xs text-ink-3 mt-1">New activity on your requests and wallet shows up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((n) => {
                  const meta = TYPE_META[n.type];
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => openItem(n)}
                        className={`w-full text-left flex gap-3 px-4 py-3.5 transition-colors hover:bg-surface ${
                          n.read ? '' : 'bg-brand-soft/30'
                        }`}
                      >
                        <span aria-hidden="true" className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.tint}`}>
                          <meta.icon className="w-[18px] h-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className={`text-sm ${n.read ? 'font-medium text-ink-2' : 'font-semibold text-ink'}`}>{n.title}</span>
                            <span className="shrink-0 text-[11px] text-ink-3 whitespace-nowrap mt-0.5">{timeAgo(n.createdAt)}</span>
                          </span>
                          <span className="block text-xs text-ink-3 mt-0.5 leading-relaxed line-clamp-2">{n.body}</span>
                        </span>
                        {!n.read && <span aria-hidden="true" className="w-2 h-2 rounded-full bg-brand shrink-0 mt-2" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-line bg-surface/60 text-center">
            <span className="text-[11px] text-ink-3">
              <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-amber mr-1.5 align-middle" />
              Live updates are on the way — this preview refreshes on page load.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
