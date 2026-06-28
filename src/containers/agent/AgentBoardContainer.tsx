'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useAgentQueue } from '@/hooks/useRequestsLive';
import { fmtDate, initials } from '@/utils/format';
import { passengerSummary, shortRoute } from '@/utils/request.utils';
import { StatusBadge, Spinner, PageHeader } from '@/components/ui';
import type { RequestVM } from '@/services/requestView';
import type { ApiRequestStatus } from '@/interface';
import { Inbox, AlertTriangle, RefreshCw, LayoutGrid } from 'lucide-react';

const COLUMNS: { title: string; color: string; statuses: ApiRequestStatus[] }[] = [
  { title: 'New Requests', color: '#D97706', statuses: ['PENDING'] },
  { title: 'Quoted — Awaiting Client', color: '#7C3AED', statuses: ['OPTIONS_SENT'] },
  { title: 'Approved — Ready to Issue', color: '#10B981', statuses: ['APPROVED_LOCKED'] },
  { title: 'Completed', color: '#0369A1', statuses: ['ISSUED', 'COMPLETED'] },
];

export function AgentBoardContainer() {
  const router = useRouter();
  const name = useAuthStore((s) => s.user?.name) ?? 'Agent';
  const { items, loading, error, refresh } = useAgentQueue();

  return (
    <div className="space-y-6 animate-fade-in flex flex-col min-h-[calc(100vh-140px)]">
      <PageHeader
        eyebrow="Agent workspace"
        eyebrowIcon={LayoutGrid}
        title="Request queue"
        subtitle="Manage processing, quoting, and ticketing across all clients."
        actions={
          <div className="flex items-center gap-2.5 bg-white/10 px-3.5 py-2 rounded-xl border border-white/15 self-start">
            <div className="w-7 h-7 rounded-full bg-white text-navy flex items-center justify-center text-[11px] font-semibold">{initials(name)}</div>
            <div className="text-sm font-medium text-white">{name}</div>
          </div>
        }
      />

      {error ? (
        <div className="bg-white rounded-2xl border border-line shadow-card p-8 text-center">
          <AlertTriangle aria-hidden="true" className="w-8 h-8 text-amber mx-auto mb-3" />
          <p className="text-sm text-ink-2">{error}</p>
          <button onClick={refresh} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline"><RefreshCw className="w-4 h-4" /> Try again</button>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {COLUMNS.map((col) => {
            const cards = items.filter((r) => col.statuses.includes(r.status));
            return (
              <div className="flex-shrink-0 w-80 flex flex-col gap-3" key={col.title}>
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                    <h2 className="font-semibold text-ink-2 text-sm">{col.title}</h2>
                  </div>
                  <span className="bg-surface text-ink-3 text-xs font-semibold px-2 py-0.5 rounded-md border border-line">{cards.length}</span>
                </div>

                <div className="flex-1 bg-surface border border-line rounded-2xl p-2.5 space-y-2.5 min-h-[400px]">
                  {loading ? (
                    <div className="h-28 flex items-center justify-center"><Spinner className="text-brand" /></div>
                  ) : cards.length ? (
                    cards.map((r) => <BoardCard key={r.id} r={r} onOpen={() => router.push(`/agent/requests/${r.id}`)} />)
                  ) : (
                    <div className="h-28 flex flex-col items-center justify-center text-center text-ink-3 text-sm">
                      <Inbox aria-hidden="true" className="w-5 h-5 mb-1.5 opacity-60" /> No requests
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BoardCard({ r, onOpen }: { r: RequestVM; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen}
      className="group w-full text-left bg-white p-4 rounded-xl border border-line shadow-card hover:shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="flex justify-between items-start mb-2.5">
        <span className="text-[11px] font-semibold text-ink-2 bg-surface px-2 py-0.5 rounded border border-line uppercase tracking-wide">{r.ref}</span>
        <StatusBadge status={r.status} />
      </div>

      <h3 className="font-semibold text-ink text-sm group-hover:text-brand transition-colors">{shortRoute(r)}</h3>
      <div className="text-xs text-ink-3 flex items-center gap-1.5 mt-1 mb-3">
        <span>{passengerSummary(r)}</span>
        <span aria-hidden="true">·</span>
        <span>{fmtDate(r.departureDate)}</span>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="text-[11px] font-semibold py-0.5 px-2 rounded-full bg-surface text-ink-3 border border-line">{r.budgetLabel}</span>
        <span className={`text-[11px] font-medium ${r.assignedAgentId ? 'text-ink-3' : 'text-amber-dark'}`}>{r.assignedAgentId ? 'Claimed' : 'Unassigned'}</span>
      </div>
    </button>
  );
}
