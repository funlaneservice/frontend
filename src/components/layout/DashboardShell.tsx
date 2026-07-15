'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, CreditCard } from 'lucide-react';
import type { NavSection } from './navTypes';
import type { Role } from '@/interface';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { SessionTimeout } from '../security/SessionTimeout';
import { useAuthStore } from '@/store/useAuthStore';
import { useHydration } from '@/hooks/useHydration';
import { useRequestSearch } from '@/hooks/useRequestSearch';
import { homePathFor } from '@/services/auth.service';
import { ConciergeAssistant } from '../ui/ConciergeAssistant';
import { CommandPalette, type Command } from '../ui/CommandPalette';
import { FunlaneMark } from '../ui/Logo';

interface DashboardShellProps {
  role: Role;
  sections: NavSection[];
  children: ReactNode;
}

export function DashboardShell({ role, sections, children }: DashboardShellProps) {
  const hydrated = useHydration();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const searchRequests = useRequestSearch(role);

  // Restore the persisted desktop sidebar preference after hydration.
  useEffect(() => {
    setCollapsed(window.localStorage.getItem('funlane_sidebar_collapsed') === '1');
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      window.localStorage.setItem('funlane_sidebar_collapsed', c ? '0' : '1');
      return !c;
    });
  }

  // Command-palette quick actions. Client-only for now (agents/admins act from
  // their boards); navigation for every role comes from `sections` automatically.
  const quickActions = useMemo<Command[]>(() => {
    if (role !== 'client') return [];
    return [
      {
        id: 'qa:new-request',
        label: 'New request',
        icon: Plane,
        group: 'Quick actions',
        keywords: 'create booking flight trip',
        perform: () => router.push('/client/new'),
      },
      {
        id: 'qa:top-up',
        label: 'Top up wallet',
        icon: CreditCard,
        group: 'Quick actions',
        keywords: 'add funds money balance pay',
        perform: () => router.push('/client/wallet?topup=1'),
      },
    ];
  }, [role, router]);

  const authorized = Boolean(user) && user?.role === role;

  // Once hydration settles, never sit on the loading screen forever. If there's
  // no signed-in user (e.g. a stale auth cookie slipped past middleware but the
  // session is gone), clear the stale auth so middleware can't bounce us back,
  // then go to login. A signed-in user on the wrong area goes to their own home.
  useEffect(() => {
    if (!hydrated || authorized) return;
    if (!user) {
      logout();
      router.replace('/login');
    } else {
      router.replace(homePathFor(user.role));
    }
  }, [hydrated, authorized, user, logout, router]);

  if (!hydrated || !authorized) {
    return (
      <div className="grid place-items-center min-h-screen bg-surface text-ink-3">
        <div className="flex flex-col items-center gap-4">
          <FunlaneMark className="w-12 h-12 animate-pulse" />
          <span className="text-sm font-medium">Loading Funlane…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      <Topbar menuOpen={mobileMenuOpen} onToggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Fixed shell: topbar + sidebar stay put, only the main column scrolls.
          `min-h-0` lets the flex child establish its own scroll area. */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Desktop Sidebar + Mobile Drawer */}
        <Sidebar
          sections={sections}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />

        {/* Main View — the only scrollable region. `min-w-0` stops wide
            children (tables) from stretching the flex column past the
            viewport on mobile; they scroll inside their own wrappers instead. */}
        <main className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full animate-fade-in">
          <div className="max-w-7xl mx-auto w-full min-w-0">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Navigation — extra destinations fold into "More",
          which opens the full nav drawer. */}
      <BottomNav sections={sections} onMore={() => setMobileMenuOpen(true)} />

      <SessionTimeout />
      <ConciergeAssistant />
      <CommandPalette sections={sections} actions={quickActions} onSearchRequests={searchRequests} />
    </div>
  );
}
