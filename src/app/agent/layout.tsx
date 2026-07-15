'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { NavSection } from '@/components/layout/navTypes';

import { FolderKanban, Ticket, ClipboardList, Settings } from 'lucide-react';

const SECTIONS: NavSection[] = [
  {
    title: 'Agency',
    items: [
      { label: 'Request Queue', icon: FolderKanban, href: '/agent/board' },
      { label: 'Ready to Issue', icon: Ticket, href: '/agent/issue' },
      { label: 'All Requests', icon: ClipboardList, href: '/agent/list' },
    ],
  },
  // The security audit log is ADMIN-only on the backend, so it lives in the
  // admin portal (/admin/audit) rather than here.
  {
    title: 'Account',
    items: [{ label: 'Settings', icon: Settings, href: '/agent/settings' }],
  },
];

export default function AgentLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // The agent login is a public, full-page auth screen — it must not be wrapped
  // in the authenticated dashboard shell (sidebar/nav).
  if (pathname === '/agent/login') {
    return <>{children}</>;
  }

  return (
    <DashboardShell role="agent" sections={SECTIONS}>
      {children}
    </DashboardShell>
  );
}
