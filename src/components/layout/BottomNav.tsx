'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import type { NavSection } from './navTypes';
import { bestMatchHref } from './navTypes';

const MAX_TABS = 5;

interface BottomNavProps {
  sections: NavSection[];
  /** Opens the full navigation drawer (used by the "More" tab). */
  onMore?: () => void;
}

export function BottomNav({ sections, onMore }: BottomNavProps) {
  const pathname = usePathname();
  const activeHref = bestMatchHref(sections, pathname);

  const all = sections.flatMap((s) => s.items);

  // With more items than tabs fit, show the first few and fold the rest
  // behind a "More" tab that opens the nav drawer — instead of silently
  // dropping destinations or cramming the bar.
  const overflow = all.length > MAX_TABS;
  const visible = overflow ? all.slice(0, MAX_TABS - 1) : all;
  const hiddenActive = overflow && !visible.some((i) => i.href === activeHref);

  const tabClass = (active: boolean) =>
    `flex flex-col items-center justify-center gap-1 flex-1 min-w-0 relative transition-colors ${
      active ? 'text-brand' : 'text-ink-3'
    }`;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-t border-line z-50 lg:hidden flex items-stretch justify-around px-1"
    >
      {visible.map((item) => {
        const active = item.href === activeHref;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            aria-label={item.label}
            className={tabClass(active)}
          >
            <span aria-hidden="true" className={`transition-transform flex items-center justify-center ${active ? 'scale-110 text-brand' : 'text-ink-3'}`}>
              <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            </span>
            <span className="text-[10px] font-medium max-w-full truncate px-0.5">{item.label}</span>
            {item.badge ? (
              <span className="absolute top-1.5 right-[22%] bg-red text-white text-[9px] min-w-[15px] h-[15px] flex items-center justify-center px-1 rounded-full font-semibold border border-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}

      {overflow && (
        <button
          type="button"
          onClick={onMore}
          aria-label="More navigation options"
          className={tabClass(hiddenActive)}
        >
          <span aria-hidden="true" className={`flex items-center justify-center ${hiddenActive ? 'scale-110 text-brand' : 'text-ink-3'}`}>
            <MoreHorizontal size={20} strokeWidth={hiddenActive ? 2.5 : 2} />
          </span>
          <span className="text-[10px] font-medium">More</span>
        </button>
      )}
    </nav>
  );
}
