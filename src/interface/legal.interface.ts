/**
 * Terms of Service / Privacy Policy, admin-editable. Backed by the live
 * `GET /legal/{type}` (public) and `PUT /admin/legal/{type}` (admin-only)
 * endpoints. The published docs confirm the two routes but not the exact
 * payload field names, so this tolerates the common variants
 * (`content`/`body`/`text`, `updatedAt`/`updated_at`, and either a bare
 * object or one wrapped under `legal`/`document`) — see
 * `toLegalDocumentView` in `@/services/legalView`.
 */
export type LegalDocType = 'terms' | 'privacy';

export interface ApiLegalDocument {
  type?: string;
  content?: string;
  body?: string;
  text?: string;
  updatedAt?: string;
  updated_at?: string;
}

export type LegalDocumentResponse = ApiLegalDocument & {
  legal?: ApiLegalDocument;
  document?: ApiLegalDocument;
};

/** App-facing shape the UI renders. */
export interface LegalDocumentView {
  type: LegalDocType;
  content: string;
  updatedAt: string | null;
}
