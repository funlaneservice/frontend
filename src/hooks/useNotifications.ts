'use client';

import { useCallback, useEffect, useState } from 'react';
import * as notificationsApi from '@/api/notifications.api';
import type { NotificationView } from '@/interface/notification.interface';

/**
 * Notification state shared by the bell + panel. Currently mock-backed; when
 * the real-time backend lands, point `notifications.api.ts` at the live
 * endpoints and (optionally) push WS/SSE events into `refresh` here — the UI
 * needs no changes.
 */
export function useNotifications() {
  const [items, setItems] = useState<NotificationView[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setItems(await notificationsApi.listNotifications());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unreadCount = items.filter((n) => !n.read).length;

  async function markRead(id: string) {
    // Optimistic — the panel feels instant even on a slow network.
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await notificationsApi.markRead(id);
  }

  async function markAllRead() {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    await notificationsApi.markAllRead();
  }

  return { items, unreadCount, loading, refresh, markRead, markAllRead };
}
