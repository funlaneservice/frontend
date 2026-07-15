'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRequestList } from '@/hooks/useRequestsLive';
import { useAgentDirectory } from '@/hooks/useAgentDirectory';
import { requestsApi } from '@/api';
import { RequestTable } from '@/components/RequestTable';
import { Button, Loader, PageHeader, Pagination } from '@/components/ui';
import { STATUS_META, summaryToVM, refOf } from '@/services/requestView';
import { downloadCsv, csvFilename } from '@/utils/csv';
import { toast } from 'react-toastify';
import type { ApiRequestStatus } from '@/interface';
import { ClipboardList, AlertTriangle, RefreshCw, Inbox, Plus, Download } from 'lucide-react';

const STATUS_OPTIONS: ApiRequestStatus[] = [
  'PENDING', 'OPTIONS_SENT', 'APPROVED_LOCKED', 'ISSUED', 'COMPLETED', 'CANCELLED',
];

export function AdminRequestsContainer() {
  const { items, pagination, loading, error, params, setParams, refresh } = useRequestList('all', { page: 1, limit: 20 });
  const { agentName } = useAgentDirectory();
  const [exporting, setExporting] = useState(false);

  function setStatus(status: string) {
    setParams({ ...params, page: 1, status: (status || undefined) as ApiRequestStatus | undefined });
  }

  /** Client-side CSV export of every request matching the current filter. */
  async function exportRequests() {
    setExporting(true);
    try {
      const all = [];
      for (let page = 1; page <= 50; page++) {
        const res = await requestsApi.listAll({ status: params.status, page, limit: 100 });
        all.push(...res.requests.map(summaryToVM));
        if (page >= res.pagination.totalPages || res.requests.length === 0) break;
      }
      if (!all.length) {
        toast.info('No requests match the current filter.');
        return;
      }
      downloadCsv(
        csvFilename('requests'),
        ['Reference', 'Origin', 'Destination', 'Trip type', 'Departure', 'Return', 'Cabin', 'Status', 'Passengers', 'Assigned agent', 'Created'],
        all.map((r) => [
          refOf(r.id), r.origin, r.destination, r.tripType === 'round' ? 'Round trip' : 'One way',
          r.departureDate, r.returnDate ?? '', r.budgetLabel, STATUS_META[r.status]?.label ?? r.status,
          r.passengerCount, agentName(r.assignedAgentId) ?? 'Unassigned', r.createdAt,
        ]),
      );
      toast.success(`Exported ${all.length} request${all.length === 1 ? '' : 's'}.`);
    } catch {
      toast.error('Could not export requests. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Travel requests"
        eyebrowIcon={ClipboardList}
        title="All requests"
        subtitle="Every travel request across the platform, from submission to issued ticket."
        actions={
          <>
            <div>
              <div className="text-3xl font-bold leading-none">{pagination?.total ?? '—'}</div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 mt-1">Total requests</div>
            </div>
            <Button
              variant="outline"
              color="ink"
              leftIcon={RefreshCw}
              onClick={refresh}
              className="!border-white/25 !text-white hover:!bg-white/10 self-start"
            >
              Refresh
            </Button>
            <Button
              variant="outline"
              color="ink"
              leftIcon={Download}
              loading={exporting}
              onClick={exportRequests}
              className="!border-white/25 !text-white hover:!bg-white/10 self-start"
            >
              Export CSV
            </Button>
            <Link
              href="/admin/new"
              className="inline-flex items-center justify-center gap-2 bg-white text-navy px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#E4F1FB] transition-colors self-start"
            >
              <Plus aria-hidden="true" className="w-4 h-4" /> New request
            </Link>
          </>
        }
      />

      {/* Status filter — single scrollable row on mobile, wraps on desktop */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0 sm:mb-0">
        <FilterChip active={!params.status} onClick={() => setStatus('')} label="All" />
        {STATUS_OPTIONS.map((s) => (
          <FilterChip key={s} active={params.status === s} onClick={() => setStatus(s)} label={STATUS_META[s]?.label ?? s} />
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden">
        {error ? (
          <div className="p-10 text-center">
            <AlertTriangle aria-hidden="true" className="w-8 h-8 text-amber mx-auto mb-3" />
            <p className="text-sm text-ink-2">{error}</p>
            <Button variant="ghost" color="ink" leftIcon={RefreshCw} onClick={refresh} className="mt-4 mx-auto">
              Try again
            </Button>
          </div>
        ) : loading ? (
          <Loader label="Loading requests…" />
        ) : items.length ? (
          <RequestTable requests={items} hrefFor={(id) => `/admin/requests/${id}`} showAssignment agentNameFor={agentName} />
        ) : (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
              <Inbox aria-hidden="true" className="w-7 h-7 text-ink-3" />
            </div>
            <p className="text-sm font-medium text-ink-2">No requests match this filter.</p>
          </div>
        )}
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          unit="request"
          limit={params.limit ?? pagination.limit}
          onLimitChange={(limit) => setParams({ ...params, page: 1, limit })}
          onPageChange={(p) => setParams({ ...params, page: p })}
        />
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap px-3.5 h-9 rounded-lg text-sm font-semibold border transition-colors ${
        active ? 'bg-ink text-card border-ink shadow-sm' : 'bg-card text-ink-2 border-line hover:border-ink/30 hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}
