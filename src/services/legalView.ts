/**
 * Maps the backend's legal-document DTO onto the UI's `LegalDocumentView`.
 * The published endpoint docs don't pin down the exact field names yet, so
 * this tolerates the reasonable variants instead of assuming one exact shape
 * — tighten it once the schema is confirmed.
 */
import type { ApiLegalDocument, LegalDocType, LegalDocumentResponse, LegalDocumentView } from '@/interface';

export function toLegalDocumentView(type: LegalDocType, raw: LegalDocumentResponse): LegalDocumentView {
  const doc: ApiLegalDocument = raw.legal ?? raw.document ?? raw;
  const content = doc.content?.trim() || doc.body?.trim() || doc.text?.trim() || '';
  const updatedAt = doc.updatedAt ?? doc.updated_at ?? null;

  return { type, content, updatedAt };
}
