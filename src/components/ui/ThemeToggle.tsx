'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { activeMode, getStoredMode, setMode, systemMode, type ThemeMode } from '@/lib/theme';

/**
 * Light/dark switch. Reads the applied mode on mount (the no-flash script has
 * already set it) so its icon matches, and toggles + persists on click.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setModeState(getStoredMode() ?? activeMode() ?? systemMode());
    setReady(true);
  }, []);

  function toggle() {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    setModeState(next);
  }

  const isDark = mode === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`w-9 h-9 flex items-center justify-center rounded-lg border border-line text-ink-3 hover:text-ink hover:bg-surface transition-colors ${className}`}
    >
      {/* Render deterministically until mounted to avoid a hydration mismatch. */}
      {ready && isDark ? (
        <Moon aria-hidden="true" className="w-[18px] h-[18px]" />
      ) : (
        <Sun aria-hidden="true" className="w-[18px] h-[18px]" />
      )}
    </button>
  );
}
