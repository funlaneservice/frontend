import type { NotificationView } from '@/interface/notification.interface';
import { simulate } from './client';

/**
 * Notifications — MOCKED while the backend builds real-time delivery.
 *
 * Expected contract to swap in when it ships (adjust here only; the hook and
 * UI are already wired):
 *   GET   /notifications?page&limit      → { notifications, pagination }
 *   PATCH /notifications/{id}/read       → { notification }
 *   POST  /notifications/read-all        → { message }
 *   WS/SSE stream for live pushes        → feed into useNotifications
 *
 * The mock keeps state at module level so read/unread survives navigation
 * within a session.
 */

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

let MOCK: NotificationView[] = [
  {
    id: 'n1',
    type: 'REQUEST',
    title: 'Travel options ready',
    body: 'Your agent sent 3 flight options for Lagos → London. Review and approve one.',
    href: '/client/requests',
    read: false,
    createdAt: minutesAgo(12),
  },
  {
    id: 'n2',
    type: 'WALLET',
    title: 'Funds locked',
    body: '₦480,000 locked for your approved Air Peace option. It is captured only at ticketing.',
    href: '/client/wallet',
    read: false,
    createdAt: minutesAgo(95),
  },
  {
    id: 'n3',
    type: 'SYSTEM',
    title: 'Welcome to Funlane',
    body: 'Your account is verified and ready. Create your first travel request to get started.',
    read: true,
    createdAt: minutesAgo(60 * 26),
  },
];

export function listNotifications(): Promise<NotificationView[]> {
  return simulate([...MOCK], 250);
}

export function markRead(id: string): Promise<void> {
  MOCK = MOCK.map((n) => (n.id === id ? { ...n, read: true } : n));
  return simulate(undefined, 120);
}

export function markAllRead(): Promise<void> {
  MOCK = MOCK.map((n) => ({ ...n, read: true }));
  return simulate(undefined, 120);
}
