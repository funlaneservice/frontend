'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import type { NavSection } from '@/components/layout/navTypes';
import { LayoutDashboard, UserPlus, Users, ClipboardList, Settings, ShieldCheck } from 'lucide-react';

/** Public auth pages under /admin that must render without the dashboard shell. */
const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/register'];

const SECTIONS: NavSection[] = [
  {
    title: 'Administration',
    items: [
      { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
      { label: 'Requests', icon: ClipboardList, href: '/admin/requests' },
      { label: 'Users', icon: Users, href: '/admin/users' },
      { label: 'Team Onboarding', icon: UserPlus, href: '/admin/onboarding' },
      { label: 'Security Audit', icon: ShieldCheck, href: '/admin/audit' },
      { label: 'Settings', icon: Settings, href: '/admin/settings' },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (PUBLIC_ADMIN_ROUTES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <DashboardShell role="admin" sections={SECTIONS}>
      {children}
    </DashboardShell>
  );
}
