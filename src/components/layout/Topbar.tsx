'use client';

import { Search, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FunlaneLogo, FunlaneMark } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { openCommandPalette } from '@/components/ui/CommandPalette';
import { NotificationsBell } from './NotificationsBell';

interface TopbarProps {
  onToggleMenu: () => void;
  menuOpen?: boolean;
}

export function Topbar({ onToggleMenu, menuOpen = false }: TopbarProps) {
  const { user, signOut } = useAuth();

  // Helper to get initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-card/90 backdrop-blur-md border-b border-line shadow-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleMenu}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-lg text-ink hover:bg-surface transition-colors"
        >
          <span aria-hidden="true" className="w-5 h-0.5 bg-current rounded-full" />
          <span aria-hidden="true" className="w-5 h-0.5 bg-current rounded-full" />
          <span aria-hidden="true" className="w-5 h-0.5 bg-current rounded-full" />
        </button>

        {/* Wordmark on >=sm, compact mark on mobile */}
        <FunlaneLogo tone="dark" className="hidden sm:inline-flex" />
        <FunlaneMark className="w-9 h-9 sm:hidden" />
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        {/* Command palette trigger */}
        <button
          onClick={openCommandPalette}
          aria-label="Open command palette"
          className="group flex items-center gap-2 h-9 rounded-full bg-surface border border-line hover:border-ink-3/50 text-ink-3 hover:text-ink transition-all px-3 sm:pr-2 focus:outline-none focus:ring-2 focus:ring-brand/50"
        >
          <Search aria-hidden="true" className="w-4 h-4 text-ink-3 group-hover:text-ink transition-colors" />
          <span className="hidden sm:inline text-[13px] mr-2">Search...</span>
          <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-semibold bg-card border border-line rounded text-ink-3 shadow-sm group-hover:text-ink group-hover:border-ink-3/30 transition-all">⌘K</kbd>
        </button>

        <div className="w-px h-5 bg-line hidden sm:block"></div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end text-right">
            <div className="font-semibold text-[13px] text-ink leading-tight">{user?.name}</div>
            <div className="text-[11px] text-ink-3">
              {user?.role === 'client' ? 'Client' : user?.role === 'admin' ? 'Administrator' : 'Agency Agent'}
            </div>
          </div>
          
          {user && (
            <div className="w-9 h-9 rounded-full bg-brand/10 text-brand border border-brand/20 flex items-center justify-center text-sm font-bold shadow-sm">
              {getInitials(user.name)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <NotificationsBell />
          <ThemeToggle />

          <button
            onClick={signOut}
            title="Sign out"
            className="w-9 h-9 flex items-center justify-center text-ink-3 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <LogOut aria-hidden="true" className="w-[18px] h-[18px]" />
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
