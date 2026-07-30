'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import type { LegalDocumentView } from '@/interface';

/**
 * Renders the loading / error / content states for a live legal document.
 * Shared by `TermsContent` and `PrivacyContent` so the /terms, /privacy
 * pages and the signup modal all behave the same way.
 */
export function LegalDocumentBody({
  doc,
  loading,
  error,
  onRetry,
}: {
  doc: LegalDocumentView | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className={i === 4 ? 'h-3.5 w-2/3' : 'h-3.5 w-full'} />
        ))}
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="text-center py-8">
        <AlertTriangle aria-hidden="true" className="w-7 h-7 text-amber mx-auto mb-3" />
        <p className="text-sm text-ink-2">{error ?? 'This document is not available right now.'}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline"
        >
          <RefreshCw aria-hidden="true" className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  const paragraphs = doc.content.split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="space-y-4 text-sm leading-relaxed text-ink-2">
      {doc.updatedAt && (
        <p className="text-xs text-ink-3">
          Last updated:{' '}
          {new Date(doc.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      )}
      {paragraphs.length > 0 ? (
        paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))
      ) : (
        <p className="text-ink-3 italic">No content has been published yet.</p>
      )}
    </div>
  );
}
