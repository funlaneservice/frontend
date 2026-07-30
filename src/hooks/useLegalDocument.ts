'use client';

import { useCallback, useEffect, useState } from 'react';
import { legalApi, ApiError } from '@/api';
import { toLegalDocumentView } from '@/services/legalView';
import type { LegalDocType, LegalDocumentView } from '@/interface';

/** Live Terms of Service / Privacy Policy content for public display, backed by `GET /legal/{type}`. */
export function useLegalDocument(type: LegalDocType) {
  const [doc, setDoc] = useState<LegalDocumentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await legalApi.getLegalDocument(type);
      setDoc(toLegalDocumentView(type, res));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this document. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  return { doc, loading, error, reload: load };
}
