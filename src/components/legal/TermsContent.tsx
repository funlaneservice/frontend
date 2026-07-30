'use client';

import { useLegalDocument } from '@/hooks/useLegalDocument';
import { LegalDocumentBody } from './LegalDocumentBody';

/** Terms of Service body — shared by the /terms page and the signup modal. Live from GET /legal/terms. */
export function TermsContent() {
  const { doc, loading, error, reload } = useLegalDocument('terms');
  return <LegalDocumentBody doc={doc} loading={loading} error={error} onRetry={reload} />;
}
