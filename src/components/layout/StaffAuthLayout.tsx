import { ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { FunlaneLogo } from '@/components/ui/Logo';

interface StaffAuthLayoutProps {
  /** Short portal label shown in the pill above the title. */
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Cross-link to the sibling staff portal. */
  altHref: string;
  altLabel: string;
}

/**
 * Deliberately plain, centered-card chrome for the internal staff portals
 * (admin / agent) — distinct from the client's marketing split-screen. Reuses
 * the shared `.auth-wrap` / `.auth-panel` styles for visual consistency.
 */
export function StaffAuthLayout({
  badge,
  badgeIcon: BadgeIcon,
  title,
  subtitle,
  children,
  altHref,
  altLabel,
}: StaffAuthLayoutProps) {
  return (
    <div className="auth-wrap flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" aria-label="Funlane home">
            <FunlaneLogo tone="dark" />
          </Link>
        </div>

        <div className="auth-panel">
          <div className="flex flex-col items-center text-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-2 mb-4">
              <BadgeIcon className="w-3.5 h-3.5" aria-hidden="true" />
              {badge}
            </span>
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            <p className="text-ink-3 text-sm mt-1.5 leading-relaxed">{subtitle}</p>
          </div>

          {children}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-ink-3">
          <Link href={altHref} className="font-medium hover:text-ink transition-colors">
            {altLabel}
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/login" className="font-medium hover:text-ink transition-colors">
            Client sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
