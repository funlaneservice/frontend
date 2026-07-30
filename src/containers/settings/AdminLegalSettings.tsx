'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FileText, RefreshCw, AlertTriangle } from 'lucide-react';
import { legalApi, ApiError } from '@/api';
import { toLegalDocumentView } from '@/services/legalView';
import type { LegalDocType, LegalDocumentView } from '@/interface';
import { Skeleton } from '@/components/ui';

const DOCS: { value: LegalDocType; label: string }[] = [
  { value: 'terms', label: 'Terms of Service' },
  { value: 'privacy', label: 'Privacy Policy' },
];

/**
 * Admin-only editor for the public Terms of Service and Privacy Policy,
 * backed by `GET /legal/{type}` and `PUT /admin/legal/{type}`. Whatever is
 * saved here is what renders on the /terms and /privacy pages and in the
 * signup modal.
 */
export function AdminLegalSettings() {
  const [active, setActive] = useState<LegalDocType>('terms');
  const [docs, setDocs] = useState<Partial<Record<LegalDocType, LegalDocumentView>>>({});
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (type: LegalDocType) => {
    setLoading(true);
    setError(null);
    try {
      const res = await legalApi.getLegalDocument(type);
      const view = toLegalDocumentView(type, res);
      setDocs((d) => ({ ...d, [type]: view }));
      setDraft(view.content);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this document. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function select(type: LegalDocType) {
    setActive(type);
    setDraft(docs[type]?.content ?? '');
  }

  async function save() {
    setSaving(true);
    try {
      const res = await legalApi.updateLegalDocument(active, draft);
      const view = toLegalDocumentView(active, res);
      setDocs((d) => ({ ...d, [active]: view }));
      setDraft(view.content);
      toast.success(`${DOCS.find((d) => d.value === active)?.label} updated.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const currentDoc = docs[active];
  const dirty = draft !== (currentDoc?.content ?? '');

  return (
    <section className="bg-card rounded-2xl border border-line shadow-card overflow-hidden">
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
            <FileText aria-hidden="true" className="w-[18px] h-[18px]" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Legal documents</h2>
            <p className="text-sm text-ink-3 mt-0.5">
              Edit the Terms of Service and Privacy Policy shown at signup and on the public /terms and /privacy pages.
            </p>
          </div>
        </div>

        <div role="tablist" aria-label="Legal document" className="inline-flex rounded-lg border border-line p-1 bg-surface">
          {DOCS.map((d) => (
            <button
              key={d.value}
              type="button"
              role="tab"
              aria-selected={active === d.value}
              onClick={() => select(d.value)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                active === d.value ? 'bg-card text-ink shadow-sm' : 'text-ink-3 hover:text-ink'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton className="h-40 w-full" rounded="rounded-xl" />
        ) : error ? (
          <div className="text-center py-6">
            <AlertTriangle aria-hidden="true" className="w-7 h-7 text-amber mx-auto mb-3" />
            <p className="text-sm text-ink-2">{error}</p>
            <button
              type="button"
              onClick={() => load(active)}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline"
            >
              <RefreshCw aria-hidden="true" className="w-4 h-4" /> Try again
            </button>
          </div>
        ) : (
          <>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={14}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/50 font-mono"
              placeholder="Document content…"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-ink-3">
                {currentDoc?.updatedAt
                  ? `Last saved ${new Date(currentDoc.updatedAt).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : ''}
              </p>
              <button
                type="button"
                onClick={save}
                disabled={saving || !dirty}
                className="inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
