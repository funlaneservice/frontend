import type { LegalDocType, LegalDocumentResponse } from '@/interface';
import { apiFetch } from './client';

/**
 * Legal — Terms & Conditions and Privacy Policy content, admin-editable:
 *   GET /legal/{type}       → the current published content (public)
 *   PUT /admin/legal/{type} → set the content (admin-only)
 */

/** GET /legal/{type} — public; current Terms of Service or Privacy Policy content. */
export function getLegalDocument(type: LegalDocType): Promise<LegalDocumentResponse> {
  return apiFetch<LegalDocumentResponse>(`/legal/${type}`);
}

/** PUT /admin/legal/{type} — admin-only; sets the content served by GET /legal/{type}. */
export function updateLegalDocument(type: LegalDocType, content: string): Promise<LegalDocumentResponse> {
  return apiFetch<LegalDocumentResponse>(`/admin/legal/${type}`, { method: 'PUT', body: { content }, auth: true });
}
