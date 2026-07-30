'use client';

import { useLegalDocument } from '@/hooks/useLegalDocument';
import { LegalDocumentBody } from './LegalDocumentBody';

/** Privacy Policy body — shared by the /privacy page and the signup modal. Live from GET /legal/privacy. */
export function PrivacyContent() {
  const { doc, loading, error, reload } = useLegalDocument('privacy');
  return <LegalDocumentBody doc={doc} loading={loading} error={error} onRetry={reload} />;
}
