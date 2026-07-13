'use client';

import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CompletePhoneModal } from '@/components/auth/CompletePhoneModal';
import type { NavSection } from '@/components/layout/navTypes';

import { LayoutDashboard, Plane, ClipboardList, Bell, CreditCard, Settings } from 'lucide-react';

const SECTIONS: NavSection[] = [
  {
    title: 'Client',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/client/dashboard' },
      { label: 'New Request', icon: Plane, href: '/client/new' },
      { label: 'My Requests', icon: ClipboardList, href: '/client/requests' },
      { label: 'Review Options', icon: Bell, href: '/client/review' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Wallet', icon: CreditCard, href: '/client/wallet' },
      { label: 'Settings', icon: Settings, href: '/client/settings' },
    ],
  },
];

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="client" sections={SECTIONS}>
      {children}
      <CompletePhoneModal />
    </DashboardShell>
  );
}
