/** In-app notifications (real-time backend in progress). */

export type NotificationType = 'REQUEST' | 'WALLET' | 'SYSTEM';

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Internal path to open when the notification is clicked. */
  href?: string;
  read: boolean;
  createdAt: string;
}
