'use client';

import { useCallback, useEffect, useState } from 'react';
import { auditApi, ApiError } from '@/api';
import type { AuditLogEntry } from '@/api/audit.api';
import type { Pagination as PaginationInfo } from '@/interface';
import { fmtDateTime } from '@/utils/format';
import { downloadCsv, csvFilename } from '@/utils/csv';
import { PageHeader, DataTable, Pagination, Spinner } from '@/components/ui';
import { ShieldCheck, Search, Download } from 'lucide-react';
import { toast } from 'react-toastify';

/** Fetches every page of the audit log (respecting the active search). */
async function fetchAllLogs(search?: string): Promise<AuditLogEntry[]> {
  const all: AuditLogEntry[] = [];
  const MAX_PAGES = 50; // safety cap (~5000 rows)
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await auditApi.listAuditLogs({ page, limit: 100, search });
    all.push(...res.logs);
    if (!res.pagination || page >= res.pagination.totalPages || res.logs.length === 0) break;
  }
  return all;
}

/** Status → badge tone. Unknown statuses fall back to a neutral chip. */
function statusBadge(status: string): string {
  const s = status.toUpperCase();
  if (s.includes('SUCCESS')) return 'bg-green-soft text-green-dark';
  if (s.includes('FAIL') || s.includes('DENIED') || s.includes('ERROR')) return 'bg-red-soft text-red-dark';
  return 'bg-surface text-ink-2 border border-line';
}

/**
 * Security audit trail backed by `GET /admin/audit-logs` (ADMIN only):
 * auth events and admin/user-management actions with actor, status and
 * source IP/user-agent.
 */
export function AuditLogContainer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [params, setParams] = useState<{ page: number; limit: number; search?: string }>({ page: 1, limit: 25 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function exportTrail() {
    setExporting(true);
    try {
      const all = await fetchAllLogs(params.search);
      if (!all.length) {
        toast.info('There are no audit events to export.');
        return;
      }
      downloadCsv(
        csvFilename('audit-trail'),
        ['Timestamp', 'Actor', 'Action', 'Status', 'Source IP', 'User agent'],
        all.map((l) => [l.createdAt, l.actor, l.action, l.status, l.ip ?? '', l.userAgent ?? '']),
      );
      toast.success(`Exported ${all.length} audit event${all.length === 1 ? '' : 's'}.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not export the audit trail.');
    } finally {
      setExporting(false);
    }
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.listAuditLogs(params);
      setLogs(res.logs);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load the audit log. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  // Debounced live search.
  useEffect(() => {
    const next = search.trim() || undefined;
    if (next === params.search) return;
    const t = setTimeout(() => setParams((p) => ({ ...p, page: 1, search: next })), 350);
    return () => clearTimeout(t);
  }, [search, params.search]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        variant="plain"
        eyebrow="Governance"
        eyebrowIcon={ShieldCheck}
        title="Security audit trail"
        subtitle="Immutable logs of system activity, cryptography events, and data access."
      />

      <div className="relative">
        <Search className="w-5 h-5 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by actor, action or IP…"
          className="auth-field"
          aria-label="Search audit log"
        />
        {loading && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Spinner size="sm" className="text-brand" />
          </span>
        )}
      </div>

      <DataTable<AuditLogEntry>
        data={logs}
        rowKey={(log) => log.id}
        minWidth={860}
        loading={loading}
        loadingLabel="Loading audit log…"
        error={error}
        onRetry={load}
        emptyIcon={ShieldCheck}
        empty="No audit events recorded yet."
        columns={[
          {
            header: 'Timestamp',
            cell: (log) => <span className="text-xs text-ink-2 tabular-nums whitespace-nowrap">{fmtDateTime(log.createdAt)}</span>,
          },
          {
            header: 'Actor',
            cell: (log) => (
              <span className="text-xs font-medium text-ink flex items-center gap-2">
                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                <span className="truncate max-w-[220px]">{log.actor}</span>
              </span>
            ),
          },
          {
            header: 'Action',
            cell: (log) => (
              <code className="text-[11px] bg-surface border border-line px-2 py-1 rounded-md text-ink-2 font-mono whitespace-nowrap">
                {log.action}
              </code>
            ),
          },
          {
            header: 'Status',
            cell: (log) => (
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${statusBadge(log.status)}`}>
                {log.status}
              </span>
            ),
          },
          {
            header: 'Source IP',
            cell: (log) => <span className="text-[11px] font-mono text-ink-3 whitespace-nowrap">{log.ip ?? '—'}</span>,
          },
          {
            header: 'User agent',
            cell: (log) => (
              <span className="block text-[11px] text-ink-3 truncate max-w-[240px]" title={log.userAgent ?? undefined}>
                {log.userAgent ?? '—'}
              </span>
            ),
          },
        ]}
      />

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          unit="event"
          limit={params.limit}
          onLimitChange={(limit) => setParams((p) => ({ ...p, page: 1, limit }))}
          onPageChange={(page) => setParams((p) => ({ ...p, page }))}
        />
      )}

      {/* Compliance footer with client-side CSV export of the full trail. */}
      <div className="bg-gradient-to-br from-navy-light to-navy rounded-2xl p-6 sm:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-lg">
            {/* Fixed light blue — this card is always navy, and `brand-soft`
                flips to a dark background token in dark mode. */}
            <div className="text-[#8AC4EC] text-[11px] font-semibold uppercase tracking-wide mb-2">Compliance</div>
            <h3 className="text-lg text-white font-semibold mb-2">NDPA &amp; regulatory integrity</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Every authentication and administrative action is recorded with its actor, outcome and
              source. Export the full trail{params.search ? ' (current search applied)' : ''} as CSV
              for compliance reviews.
            </p>
          </div>
          <button
            onClick={exportTrail}
            disabled={exporting}
            className="shrink-0 self-start md:self-auto inline-flex items-center gap-2 bg-white text-navy px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#E4F1FB] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {exporting ? <Spinner size="sm" /> : <Download aria-hidden="true" className="w-4 h-4" />}
            {exporting ? 'Exporting…' : 'Export audit trail'}
          </button>
        </div>
      </div>
    </div>
  );
}
