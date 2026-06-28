'use client';

import Link from 'next/link';
import { useRequestDetail } from '@/hooks/useRequestsLive';
import { StatusBadge, ProgressSteps, Timeline, EmptyState, Loader } from '@/components/ui';
import { fmtNaira, fmtDate, fmtDateTime, fmtDepartTime } from '@/utils/format';
import { routeText } from '@/utils/request.utils';
import type { HistoryEntry } from '@/interface';
import type { RequestVM } from '@/services/requestView';
import {
  HelpCircle, ChevronLeft, Plane, MapPin, Repeat, Calendar, Undo2, PlaneTakeoff,
  Coins, RefreshCw, UserCog, Lightbulb,
} from 'lucide-react';
import type { ElementType } from 'react';

function synthTimeline(r: RequestVM): HistoryEntry[] {
  const items: HistoryEntry[] = [{ ts: r.createdAt, text: 'Request submitted by client' }];
  if (r.issuedAt) items.push({ ts: r.issuedAt, text: 'Ticket issued' });
  if (r.completedAt) items.push({ ts: r.completedAt, text: 'Completed — funds captured' });
  if (r.cancelledAt) items.push({ ts: r.cancelledAt, text: `Cancelled${r.cancellationReason ? ` — ${r.cancellationReason}` : ''}` });
  return items;
}

export function AdminRequestDetailContainer({ id }: { id: string }) {
  const { request: r, loading, error, refresh } = useRequestDetail(id);

  if (loading) return <div className="max-w-5xl mx-auto"><Loader label="Loading request…" size="lg" /></div>;
  if (error)
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState icon={HelpCircle}>
          <div className="space-y-3">
            <p>{error}</p>
            <button onClick={refresh} className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline">
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
          </div>
        </EmptyState>
      </div>
    );
  if (!r) return <EmptyState icon={HelpCircle}>Request not found.</EmptyState>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <Link href="/admin/requests" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-brand transition-colors">
        <ChevronLeft aria-hidden="true" className="w-4 h-4" /> Back to requests
      </Link>

      <div className="bg-white rounded-2xl border border-line shadow-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div aria-hidden="true" className="w-12 h-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <Plane className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-ink">{routeText(r)}</h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-ink-3 text-sm mt-1">
            Ref <span className="font-medium text-ink-2">{r.ref}</span> · {r.assignedAgentId ? 'Claimed' : 'Unassigned'} · Submitted {fmtDate(r.createdAt)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-line shadow-card p-5 overflow-x-auto">
        <ProgressSteps status={r.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Booking details */}
          <section className="bg-white rounded-2xl border border-line shadow-card p-6">
            <h2 className="text-lg font-semibold text-ink mb-5">Booking details</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <DetailGroup label="Travel route" value={routeText(r)} icon={MapPin} />
              <DetailGroup label="Trip type" value={r.tripType === 'round' ? 'Round trip' : 'One way'} icon={Repeat} />
              <DetailGroup label="Departure date" value={`${fmtDate(r.departureDate)}${r.preferredTime ? ` (${r.preferredTime})` : ''}`} icon={Calendar} />
              <DetailGroup label="Return date" value={r.returnDate ? fmtDate(r.returnDate) : 'N/A'} icon={Undo2} />
              <DetailGroup label="Preferred airline" value={r.preferredAirline || 'No preference'} icon={PlaneTakeoff} />
              <DetailGroup label="Cabin class" value={r.budgetLabel} icon={Coins} />

              <div className="sm:col-span-2">
                <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-2">Passengers ({r.passengers.length})</div>
                <div className="space-y-2">
                  {r.passengers.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 bg-surface rounded-lg p-3 border border-line">
                      <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center font-semibold text-xs border border-line">{i + 1}</div>
                      <div>
                        <div className="font-medium text-ink text-sm">{p.fullName}</div>
                        <div className="text-xs text-ink-3">Passport: <span className="font-mono">{p.passportNumber}</span> · {p.nationality}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {r.ticketDownloadUrl && (
                <div className="sm:col-span-2">
                  <a href={r.ticketDownloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
                    <PlaneTakeoff className="w-4 h-4" /> Download issued ticket
                  </a>
                </div>
              )}
            </div>
          </section>

          {/* Quote options */}
          {r.quoteOptions.length > 0 && (
            <section className="bg-white rounded-2xl border border-line shadow-card p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">Quote options</h2>
              <div className="grid gap-3">
                {r.quoteOptions.map((o) => (
                  <div key={o.id} className="rounded-xl border border-line p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-ink">{o.airline}</div>
                        <div className="text-xs text-ink-3 mt-0.5">{o.label}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-ink-3 mb-0.5">Departs</div>
                        <div className="font-semibold text-ink text-sm">{fmtDepartTime(o.departureTime)}</div>
                      </div>
                      <div className="text-lg font-bold text-brand">{fmtNaira(o.price)}</div>
                    </div>
                    {o.details && (
                      <div className="mt-3 pt-3 border-t border-line text-xs text-ink-3 flex items-center gap-1.5">
                        <Lightbulb aria-hidden="true" className="w-3.5 h-3.5 shrink-0" /> {o.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-2xl border border-line shadow-card p-6">
            <h3 className="text-base font-semibold text-ink mb-4">Overview</h3>
            <dl className="space-y-3.5 text-sm">
              <Meta label="Assignment" icon={UserCog} value={r.assignedAgentId ? `Agent ${r.assignedAgentId.slice(0, 8)}` : 'Unassigned'} />
              <Meta label="Passengers" value={String(r.passengers.length || r.passengerCount)} />
              <Meta label="Submitted" value={fmtDateTime(r.createdAt)} />
              {r.issuedAt && <Meta label="Issued" value={fmtDateTime(r.issuedAt)} />}
              {r.completedAt && <Meta label="Completed" value={fmtDateTime(r.completedAt)} />}
              {r.cancelledAt && <Meta label="Cancelled" value={fmtDateTime(r.cancelledAt)} />}
            </dl>
            {(r.rejectionReason || r.cancellationReason) && (
              <p className="mt-4 pt-4 border-t border-line text-xs text-ink-3">
                {r.cancellationReason ? `Cancellation: ${r.cancellationReason}` : `Rejection: ${r.rejectionReason}`}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-ink">Timeline</h3>
            <Timeline history={synthTimeline(r)} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailGroup({ label, value, icon: Icon }: { label: string; value: string; icon: ElementType }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon aria-hidden="true" className="w-3.5 h-3.5 text-ink-3" />
        <span className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide">{label}</span>
      </div>
      <div className="font-medium text-ink text-sm">{value}</div>
    </div>
  );
}

function Meta({ label, value, icon: Icon }: { label: string; value: string; icon?: ElementType }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-ink-3">
        {Icon ? <Icon className="w-3.5 h-3.5" aria-hidden="true" /> : null} {label}
      </dt>
      <dd className="font-medium text-ink text-right">{value}</dd>
    </div>
  );
}
