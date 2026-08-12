'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminTransactionsApi, ApiError } from '@/api';
import type {
  AdminTransactionEntry,
  PaymentAttemptEntry,
} from '@/api/adminTransactions.api';
import type { Pagination as PaginationInfo } from '@/interface';
import { fmtNaira, fmtDateTime } from '@/utils/format';
import { downloadCsv, csvFilename } from '@/utils/csv';
import { PageHeader, DataTable, Pagination, Spinner, Drawer } from '@/components/ui';
import {
  Landmark,
  Search,
  Download,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  Unlock,
  Scale,
  Wallet,
  Webhook,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'react-toastify';

type Tab = 'ledger' | 'attempts';

const TYPE_META: Record<string, { label: string; icon: typeof Wallet; tone: string }> = {
  TOPUP: { label: 'Top-up', icon: ArrowDownCircle, tone: 'bg-green-soft text-green-dark' },
  LOCK: { label: 'Lock', icon: Lock, tone: 'bg-amber-soft text-amber-dark' },
  CAPTURE: { label: 'Capture', icon: ArrowUpCircle, tone: 'bg-red-soft text-red-dark' },
  RELEASE: { label: 'Release', icon: Unlock, tone: 'bg-blue-soft text-blue' },
  PAYOUT_DEBIT: { label: 'Payout', icon: ArrowUpCircle, tone: 'bg-red-soft text-red-dark' },
  PAYOUT: { label: 'Payout', icon: ArrowUpCircle, tone: 'bg-red-soft text-red-dark' },
  ADJUSTMENT: { label: 'Adjustment', icon: Scale, tone: 'bg-surface text-ink-2 border border-line' },
};

function typeMeta(type: string) {
  return (
    TYPE_META[type.toUpperCase()] ?? {
      label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown',
      icon: Wallet,
      tone: 'bg-surface text-ink-2 border border-line',
    }
  );
}

function fmtEventType(eventType: string | null): string {
  if (!eventType) return 'Unknown event';
  return eventType
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function eventOutcomeTone(eventType: string | null): string {
  const t = (eventType ?? '').toLowerCase();
  if (t.includes('success')) return 'bg-green-soft text-green-dark';
  if (t.includes('fail') || t.includes('revers') || t.includes('declined')) return 'bg-red-soft text-red-dark';
  return 'bg-surface text-ink-2 border border-line';
}

function processingTone(status: string): string {
  const s = status.toUpperCase();
  if (s === 'PROCESSED') return 'bg-green-soft text-green-dark';
  if (s === 'FAILED') return 'bg-red-soft text-red-dark';
  if (s === 'PENDING') return 'bg-amber-soft text-amber-dark';
  return 'bg-surface text-ink-2 border border-line';
}

async function fetchAllTransactions(search?: string): Promise<AdminTransactionEntry[]> {
  const all: AdminTransactionEntry[] = [];
  const MAX_PAGES = 50;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await adminTransactionsApi.listTransactions({ page, limit: 100, search });
    all.push(...res.transactions);
    if (!res.pagination || page >= res.pagination.totalPages || res.transactions.length === 0) break;
  }
  return all;
}

async function fetchAllAttempts(search?: string): Promise<PaymentAttemptEntry[]> {
  const all: PaymentAttemptEntry[] = [];
  const MAX_PAGES = 50;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await adminTransactionsApi.listPaymentAttempts({ page, limit: 100, search });
    all.push(...res.attempts);
    if (!res.pagination || page >= res.pagination.totalPages || res.attempts.length === 0) break;
  }
  return all;
}

export function AdminTransactionsContainer() {
  const [tab, setTab] = useState<Tab>('ledger');
  const [txns, setTxns] = useState<AdminTransactionEntry[]>([]);
  const [txnPagination, setTxnPagination] = useState<PaginationInfo | null>(null);
  const [txnParams, setTxnParams] = useState<{ page: number; limit: number; search?: string }>({ page: 1, limit: 25 });
  const [txnSearch, setTxnSearch] = useState('');
  const [txnLoading, setTxnLoading] = useState(true);
  const [txnError, setTxnError] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<AdminTransactionEntry | null>(null);
  const [txnDetailLoading, setTxnDetailLoading] = useState(false);
  const [attempts, setAttempts] = useState<PaymentAttemptEntry[]>([]);
  const [attemptPagination, setAttemptPagination] = useState<PaginationInfo | null>(null);
  const [attemptParams, setAttemptParams] = useState<{ page: number; limit: number; search?: string }>({ page: 1, limit: 25 });
  const [attemptSearch, setAttemptSearch] = useState('');
  const [attemptLoading, setAttemptLoading] = useState(true);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<PaymentAttemptEntry | null>(null);
  const [attemptDetailLoading, setAttemptDetailLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  const loadTxns = useCallback(async () => {
    setTxnLoading(true);
    setTxnError(null);
    try {
      const res = await adminTransactionsApi.listTransactions(txnParams);
      setTxns(res.transactions);
      setTxnPagination(res.pagination);
    } catch (err) {
      setTxnError(err instanceof ApiError ? err.message : 'Could not load the wallet ledger. Please try again.');
    } finally {
      setTxnLoading(false);
    }
  }, [txnParams]);

  const loadAttempts = useCallback(async () => {
    setAttemptLoading(true);
    setAttemptError(null);
    try {
      const res = await adminTransactionsApi.listPaymentAttempts(attemptParams);
      setAttempts(res.attempts);
      setAttemptPagination(res.pagination);
    } catch (err) {
      setAttemptError(err instanceof ApiError ? err.message : 'Could not load payment attempts. Please try again.');
    } finally {
      setAttemptLoading(false);
    }
  }, [attemptParams]);

  useEffect(() => {
    loadTxns();
  }, [loadTxns]);

  useEffect(() => {
    loadAttempts();
  }, [loadAttempts]);

  // Debounced live search, per tab.
  useEffect(() => {
    const next = txnSearch.trim() || undefined;
    if (next === txnParams.search) return;
    const t = setTimeout(() => setTxnParams((p) => ({ ...p, page: 1, search: next })), 350);
    return () => clearTimeout(t);
  }, [txnSearch, txnParams.search]);

  useEffect(() => {
    const next = attemptSearch.trim() || undefined;
    if (next === attemptParams.search) return;
    const t = setTimeout(() => setAttemptParams((p) => ({ ...p, page: 1, search: next })), 350);
    return () => clearTimeout(t);
  }, [attemptSearch, attemptParams.search]);


  async function openTxn(row: AdminTransactionEntry) {
    setSelectedTxn(row);
    setTxnDetailLoading(true);
    try {
      const fresh = await adminTransactionsApi.getTransaction(row.id);
      if (fresh) setSelectedTxn(fresh);
    } catch {
      // Keep showing the row we already had — non-fatal.
    } finally {
      setTxnDetailLoading(false);
    }
  }

  async function openAttempt(row: PaymentAttemptEntry) {
    setSelectedAttempt(row);
    setAttemptDetailLoading(true);
    try {
      const fresh = await adminTransactionsApi.getPaymentAttempt(row.id);
      if (fresh) setSelectedAttempt(fresh);
    } catch {
      // Keep showing the row we already had — non-fatal.
    } finally {
      setAttemptDetailLoading(false);
    }
  }

  async function exportCurrentTab() {
    setExporting(true);
    try {
      if (tab === 'ledger') {
        const all = await fetchAllTransactions(txnParams.search);
        if (!all.length) {
          toast.info('There are no ledger entries to export.');
          return;
        }
        downloadCsv(
          csvFilename('wallet-ledger'),
          [
            'Timestamp',
            'Type',
            'User',
            'User email',
            'User role',
            'Amount',
            'Balance after',
            'Locked after',
            'Reference',
            'Request ID',
            'Route',
            'Request status',
            'Payout status',
          ],
          all.map((t) => [
            t.createdAt,
            typeMeta(t.type).label,
            t.user?.name ?? '',
            t.user?.email ?? '',
            t.user?.role ?? '',
            t.amount,
            t.balanceAfter ?? '',
            t.lockedAfter ?? '',
            t.reference ?? '',
            t.request?.id ?? '',
            t.request ? `${t.request.origin ?? ''} → ${t.request.destination ?? ''}` : '',
            t.request?.status ?? '',
            t.request?.payoutStatus ?? '',
          ]),
        );
        toast.success(`Exported ${all.length} ledger entr${all.length === 1 ? 'y' : 'ies'}.`);
      } else {
        const all = await fetchAllAttempts(attemptSearch.trim() || undefined);
        if (!all.length) {
          toast.info('There are no payment attempts to export.');
          return;
        }
        downloadCsv(
          csvFilename('payment-attempts'),
          ['Timestamp', 'Reference', 'Email', 'Amount', 'Payment event', 'Processing status', 'Processing error', 'Channel', 'Test'],
          all.map((a) => [
            a.createdAt,
            a.reference ?? '',
            a.email ?? '',
            a.amount ?? '',
            a.eventType ?? '',
            a.processingStatus,
            a.processingError ?? '',
            a.channel ?? '',
            a.isTest ? 'Yes' : 'No',
          ]),
        );
        toast.success(`Exported ${all.length} payment attempt${all.length === 1 ? '' : 's'}.`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not export. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        variant="plain"
        eyebrow="Finance"
        eyebrowIcon={Landmark}
        title="Transactions"
        subtitle="The full wallet ledger across every user, plus the raw Paystack webhook attempts behind each top-up."
        actions={
          <button
            type="button"
            onClick={exportCurrentTab}
            disabled={exporting}
            className="inline-flex items-center gap-2 bg-card border border-line text-ink px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-surface transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? <Spinner size="sm" /> : <Download aria-hidden="true" className="w-4 h-4" />}
            {exporting ? 'Exporting…' : `Export ${tab === 'ledger' ? 'ledger' : 'attempts'}`}
          </button>
        }
      />

      <div role="tablist" aria-label="Transactions view" className="inline-flex rounded-lg border border-line p-1 bg-surface">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'ledger'}
          onClick={() => setTab('ledger')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'ledger' ? 'bg-card text-ink shadow-sm' : 'text-ink-3 hover:text-ink'
          }`}
        >
          <Wallet aria-hidden="true" className="w-4 h-4" /> Ledger
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'attempts'}
          onClick={() => setTab('attempts')}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === 'attempts' ? 'bg-card text-ink shadow-sm' : 'text-ink-3 hover:text-ink'
          }`}
        >
          <Webhook aria-hidden="true" className="w-4 h-4" /> Payment attempts
        </button>
      </div>

      {tab === 'ledger' ? (
        <>
          <div className="relative">
            <Search className="w-5 h-5 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
              placeholder="Search by user, reference or request…"
              className="auth-field"
              aria-label="Search wallet ledger"
            />
            {txnLoading && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Spinner size="sm" className="text-brand" />
              </span>
            )}
          </div>

          <DataTable<AdminTransactionEntry>
            data={txns}
            rowKey={(t) => t.id}
            minWidth={900}
            loading={txnLoading}
            loadingLabel="Loading wallet ledger…"
            error={txnError}
            onRetry={loadTxns}
            emptyIcon={Wallet}
            empty="No wallet activity recorded yet."
            onRowClick={openTxn}
            columns={[
              {
                header: 'Timestamp',
                cell: (t) => <span className="text-xs text-ink-2 tabular-nums whitespace-nowrap">{fmtDateTime(t.createdAt)}</span>,
              },
              {
                header: 'Type',
                cell: (t) => {
                  const meta = typeMeta(t.type);
                  const Icon = meta.icon;
                  return (
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${meta.tone}`}>
                      <Icon aria-hidden="true" className="w-3 h-3" /> {meta.label}
                    </span>
                  );
                },
              },
              {
                header: 'User',
                cell: (t) => (
                  <div className="max-w-[190px]">
                    <div className="text-xs font-medium text-ink truncate">{t.user?.name ?? t.user?.email ?? '—'}</div>
                    {t.user?.role && <div className="text-[10px] text-ink-3 uppercase tracking-wide">{t.user.role}</div>}
                  </div>
                ),
              },
              {
                header: 'Amount',
                align: 'right',
                cell: (t) => <span className="text-sm font-semibold text-ink tabular-nums whitespace-nowrap">{fmtNaira(t.amount)}</span>,
              },
              {
                header: 'Balance after',
                align: 'right',
                cell: (t) => (
                  <span className="text-xs text-ink-3 tabular-nums whitespace-nowrap">{t.balanceAfter != null ? fmtNaira(t.balanceAfter) : '—'}</span>
                ),
              },
              {
                header: 'Booking',
                cell: (t) =>
                  t.request ? (
                    <div className="max-w-[180px]">
                      <div className="text-xs text-ink truncate">
                        {t.request.origin ?? '—'} → {t.request.destination ?? '—'}
                      </div>
                      <div className="text-[10px] text-ink-3">{t.request.status ?? ''}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-3">—</span>
                  ),
              },
              {
                header: 'Reference',
                cell: (t) => (
                  <code className="text-[11px] bg-surface border border-line px-2 py-1 rounded-md text-ink-2 font-mono whitespace-nowrap">
                    {t.reference ?? '—'}
                  </code>
                ),
              },
            ]}
          />

          {txnPagination && (
            <Pagination
              page={txnPagination.page}
              totalPages={txnPagination.totalPages}
              total={txnPagination.total}
              unit="entry"
              limit={txnParams.limit}
              onLimitChange={(limit) => setTxnParams((p) => ({ ...p, page: 1, limit }))}
              onPageChange={(page) => setTxnParams((p) => ({ ...p, page }))}
            />
          )}
        </>
      ) : (
        <>
          <div className="relative">
            <Search className="w-5 h-5 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              value={attemptSearch}
              onChange={(e) => setAttemptSearch(e.target.value)}
              placeholder="Search by email or reference…"
              className="auth-field"
              aria-label="Search payment attempts"
            />
            {attemptLoading && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Spinner size="sm" className="text-brand" />
              </span>
            )}
          </div>

          <DataTable<PaymentAttemptEntry>
            data={attempts}
            rowKey={(a) => a.id}
            minWidth={900}
            loading={attemptLoading}
            loadingLabel="Loading payment attempts…"
            error={attemptError}
            onRetry={loadAttempts}
            emptyIcon={Webhook}
            empty="No payment webhook attempts recorded yet."
            onRowClick={openAttempt}
            columns={[
              {
                header: 'Timestamp',
                cell: (a) => <span className="text-xs text-ink-2 tabular-nums whitespace-nowrap">{fmtDateTime(a.createdAt)}</span>,
              },
              {
                header: 'Reference',
                cell: (a) => (
                  <code className="text-[11px] bg-surface border border-line px-2 py-1 rounded-md text-ink-2 font-mono whitespace-nowrap">
                    {a.reference ?? '—'}
                  </code>
                ),
              },
              {
                header: 'Email',
                cell: (a) => (
                  <span className="text-xs text-ink truncate max-w-[200px] flex items-center gap-1.5">
                    {a.email ?? '—'}
                    {a.isTest && (
                      <span title="Paystack test-mode event" className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-surface border border-line text-ink-3">
                        <FlaskConical aria-hidden="true" className="w-2.5 h-2.5" /> Test
                      </span>
                    )}
                  </span>
                ),
              },
              {
                header: 'Amount',
                align: 'right',
                cell: (a) => <span className="text-sm font-semibold text-ink tabular-nums whitespace-nowrap">{a.amount != null ? fmtNaira(a.amount) : '—'}</span>,
              },
              {
                header: 'Payment event',
                cell: (a) => (
                  <span
                    title={a.gatewayResponse ?? undefined}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${eventOutcomeTone(a.eventType)}`}
                  >
                    {fmtEventType(a.eventType)}
                  </span>
                ),
              },
              {
                header: 'Processing',
                cell: (a) => (
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${processingTone(a.processingStatus)}`}>
                      {a.processingStatus}
                    </span>
                    {a.processingError && (
                      <span title={a.processingError} className="shrink-0">
                        <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 text-red" />
                      </span>
                    )}
                  </span>
                ),
              },
            ]}
          />

          {attemptPagination && (
            <Pagination
              page={attemptPagination.page}
              totalPages={attemptPagination.totalPages}
              total={attemptPagination.total}
              unit="attempt"
              limit={attemptParams.limit}
              onLimitChange={(limit) => setAttemptParams((p) => ({ ...p, page: 1, limit }))}
              onPageChange={(page) => setAttemptParams((p) => ({ ...p, page }))}
            />
          )}
        </>
      )}

      {/* Ledger entry detail */}
      <Drawer
        open={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        title={selectedTxn ? typeMeta(selectedTxn.type).label : ''}
        description={selectedTxn ? fmtDateTime(selectedTxn.createdAt) : undefined}
        width="md"
        side="responsive"
      >
        {selectedTxn && (
          <div className="space-y-5">
            {txnDetailLoading && (
              <div className="flex items-center gap-2 text-xs text-ink-3">
                <Spinner size="sm" /> Refreshing…
              </div>
            )}
            <div className="text-center py-4 bg-surface rounded-xl border border-line">
              <div className="text-2xl font-bold text-ink">{fmtNaira(selectedTxn.amount)}</div>
              <div className="text-xs text-ink-3 mt-1">{typeMeta(selectedTxn.type).label}</div>
            </div>

            {selectedTxn.user && (
              <div className="p-4 bg-surface rounded-xl border border-line">
                <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-2">Account</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{selectedTxn.user.name ?? '—'}</div>
                    <div className="text-xs text-ink-3 truncate">{selectedTxn.user.email ?? '—'}</div>
                  </div>
                  {selectedTxn.user.role && (
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-card border border-line text-ink-2">
                      {selectedTxn.user.role}
                    </span>
                  )}
                </div>
              </div>
            )}

            {selectedTxn.request && (
              <div className="p-4 bg-surface rounded-xl border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide">Linked booking</div>
                  {selectedTxn.request.status && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-card border border-line text-ink-2">
                      {selectedTxn.request.status}
                    </span>
                  )}
                </div>
                <div className="text-sm text-ink">
                  {selectedTxn.request.origin ?? '—'} → {selectedTxn.request.destination ?? '—'}
                </div>
                {selectedTxn.request.payoutStatus && (
                  <div className="text-xs text-ink-3">Payout: {selectedTxn.request.payoutStatus}</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <KV label="Reference" value={selectedTxn.reference ?? '—'} mono />
              <KV label="Entry ID" value={selectedTxn.id} mono />
              <KV label="Balance after" value={selectedTxn.balanceAfter != null ? fmtNaira(selectedTxn.balanceAfter) : '—'} />
              <KV label="Locked after" value={selectedTxn.lockedAfter != null ? fmtNaira(selectedTxn.lockedAfter) : '—'} />
              {selectedTxn.request && <KV label="Request ID" value={selectedTxn.request.id} mono />}
            </div>

            {selectedTxn.metadata && (
              <div>
                <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-2">Metadata</div>
                <pre className="text-[11px] font-mono text-ink-2 bg-surface border border-line rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedTxn.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Payment attempt detail */}
      <Drawer
        open={!!selectedAttempt}
        onClose={() => setSelectedAttempt(null)}
        title={selectedAttempt ? fmtEventType(selectedAttempt.eventType) : 'Payment attempt'}
        description={selectedAttempt ? fmtDateTime(selectedAttempt.createdAt) : undefined}
        width="md"
        side="responsive"
      >
        {selectedAttempt && (
          <div className="space-y-5">
            {attemptDetailLoading && (
              <div className="flex items-center gap-2 text-xs text-ink-3">
                <Spinner size="sm" /> Refreshing…
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line">
              <div className="space-y-1">
                <div className="text-xs text-ink-3">Payment outcome</div>
                <span
                  title={selectedAttempt.gatewayResponse ?? undefined}
                  className={`inline-block text-[11px] font-semibold px-2 py-1 rounded-full ${eventOutcomeTone(selectedAttempt.eventType)}`}
                >
                  {fmtEventType(selectedAttempt.eventType)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-xs text-ink-3 mb-1">Amount</div>
                <div className="text-lg font-bold text-ink">{selectedAttempt.amount != null ? fmtNaira(selectedAttempt.amount) : '—'}</div>
              </div>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-3">Webhook processing</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full ${processingTone(selectedAttempt.processingStatus)}`}>
                  {selectedAttempt.processingStatus}
                </span>
              </div>
              {selectedAttempt.processingError && (
                <div className="flex items-start gap-2 text-xs text-red-dark bg-red-soft/60 rounded-lg px-3 py-2">
                  <AlertTriangle aria-hidden="true" className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{selectedAttempt.processingError} — Paystack will retry delivery.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <KV label="Email" value={selectedAttempt.email ?? '—'} />
              <KV label="Reference" value={selectedAttempt.reference ?? '—'} mono />
              <KV label="Channel" value={selectedAttempt.channel ?? '—'} />
              <KV
                label="Card"
                value={selectedAttempt.cardBrand ? `${selectedAttempt.cardBrand} •••• ${selectedAttempt.cardLast4 ?? '····'}` : '—'}
              />
              <KV label="Bank" value={selectedAttempt.bank ?? '—'} />
              <KV label="Fees" value={selectedAttempt.fees != null ? fmtNaira(selectedAttempt.fees) : '—'} />
              <KV label="Paid at" value={selectedAttempt.paidAt ? fmtDateTime(selectedAttempt.paidAt) : '—'} />
              <KV label="Processed at" value={selectedAttempt.processedAt ? fmtDateTime(selectedAttempt.processedAt) : '—'} />
              <KV label="Event ID" value={selectedAttempt.eventId ?? '—'} mono />
              <KV label="Attempt ID" value={selectedAttempt.id} mono />
            </div>

            {selectedAttempt.payload && (
              <div>
                <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-2">Raw webhook payload</div>
                <pre className="text-[11px] font-mono text-ink-2 bg-surface border border-line rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedAttempt.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-1">{label}</div>
      <div className={`text-sm font-medium text-ink truncate ${mono ? 'font-mono text-xs' : ''}`} title={value}>
        {value}
      </div>
    </div>
  );
}
