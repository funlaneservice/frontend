'use client';

import Link from 'next/link';
import { Drawer, StatusBadge, ProgressSteps, Skeleton } from '@/components/ui';
import { MinorBadge } from '@/components/MinorBadge';
import { useRequestDetail } from '@/hooks/useRequestsLive';
import { routeText } from '@/utils/request.utils';
import { fmtNaira, fmtDate, fmtDepartTime, fmtOptionMeta } from '@/utils/format';
import type { RequestVM } from '@/services/requestView';
import { ArrowUpRight, Hand, Undo2 } from 'lucide-react';

interface AgentRequestPeekProps {
  /** Summary from the board — powers the header instantly while detail loads. */
  summary: RequestVM;
  open: boolean;
  onClose: () => void;
  /** Called after a mutating action (e.g. claim) so the board can refresh. */
  onChanged: () => void;
}

export function AgentRequestPeek({ summary, open, onClose, onChanged }: AgentRequestPeekProps) {
  const { request, loading, busy, claim } = useRequestDetail(summary.id);
  const r = request ?? summary;
  const claimable = r.status === 'PENDING' && !r.assignedAgentId;

  async function onClaim() {
    const ok = await claim();
    if (ok) onChanged();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="lg"
      side="responsive"
      title={
        <span className="inline-flex items-center gap-2.5">
          {summary.ref}
          <StatusBadge status={r.status} />
        </span>
      }
      description={routeText(summary)}
      footer={
        <div className="flex items-center gap-3">
          {claimable && (
            <button
              type="button"
              onClick={onClaim}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 flex-1 bg-brand text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
            >
              <Hand aria-hidden="true" className="w-4 h-4" /> {busy ? 'Claiming…' : 'Claim request'}
            </button>
          )}
          <Link
            href={`/agent/requests/${summary.id}`}
            className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
              claimable
                ? 'px-4 bg-card border border-line text-ink hover:bg-surface'
                : 'flex-1 bg-brand text-white hover:bg-brand-dark'
            }`}
          >
            Open full request <ArrowUpRight aria-hidden="true" className="w-4 h-4" />
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <ProgressSteps status={r.status} />

        {r.rejectionReason && (
          <div className="bg-red-soft border border-red/15 rounded-xl p-4 flex gap-3">
            <Undo2 aria-hidden="true" className="w-5 h-5 text-red shrink-0" />
            <div>
              <strong className="block text-red-dark font-semibold text-sm mb-0.5">Client feedback</strong>
              <p className="text-ink-2 text-sm leading-relaxed">{r.rejectionReason}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <KV label="Itinerary" value={routeText(summary)} />
          <KV label="Trip type" value={summary.tripType === 'round' ? 'Round trip' : 'One way'} />
          <KV label="Departure" value={`${fmtDate(summary.departureDate)}${summary.preferredTime ? ` · ${summary.preferredTime}` : ''}`} />
          <KV label="Return" value={summary.returnDate ? fmtDate(summary.returnDate) : 'N/A'} />
          <KV label="Cabin class" value={summary.budgetLabel} />
          <KV label="Carrier preference" value={summary.preferredAirline || 'No preference'} />
        </div>

        <section>
          <h3 className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-2.5">
            Passengers {request && <span className="text-ink-2">· {request.passengers.length}</span>}
          </h3>
          {loading && !request ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" rounded="rounded-lg" />
              <Skeleton className="h-12 w-full" rounded="rounded-lg" />
            </div>
          ) : (
            <div className="grid gap-2">
              {r.passengers.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-line">
                  <div className="font-medium text-ink text-sm flex items-center gap-2 flex-wrap">
                    {p.fullName} <span className="text-xs text-ink-3 font-normal">· {p.nationality}</span>
                    <MinorBadge dateOfBirth={p.dateOfBirth} />
                  </div>
                  <div className="text-xs font-mono text-ink-3">{p.passportNumber}</div>
                </div>
              ))}
              {!r.passengers.length && <p className="text-sm text-ink-3">No passenger details.</p>}
            </div>
          )}
        </section>

        {(request?.quoteOptions.length ?? 0) > 0 && (
          <section>
            <h3 className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-2.5">
              Quote options · {request!.quoteOptions.length}
            </h3>
            <div className="space-y-2">
              {request!.quoteOptions.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-line">
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {o.airline} <span className="text-[11px] text-ink-3 ml-1">{o.label}</span>
                    </div>
                    <div className="text-xs text-ink-3 mt-0.5">
                      Departs {fmtDepartTime(o.departureTime)}
                      {fmtOptionMeta(o) ? ` · ${fmtOptionMeta(o)}` : ''}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-ink">{fmtNaira(o.price)}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Drawer>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-1">{label}</div>
      <div className="text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
