import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { FunlaneLogo } from '@/components/ui/Logo';

/**
 * Shared shell for public legal documents (Terms, Privacy). Plain, readable
 * prose layout that works in both themes and on mobile.
 */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-card border-b border-line">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Funlane home">
            <FunlaneLogo tone="dark" markClassName="w-8 h-8" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-brand transition-colors">
            <ChevronLeft aria-hidden="true" className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">{title}</h1>

        <article className="mt-6 space-y-8">{children}</article>
      </main>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink mb-2.5">{heading}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}
