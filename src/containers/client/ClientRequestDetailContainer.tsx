'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRequestDetail } from '@/hooks/useRequestsLive';
import { useWallet } from '@/hooks/useWallet';
import { StatusBadge, ProgressSteps, Timeline, Modal, EmptyState, Loader, Button, ConfirmDialog } from '@/components/ui';
import { fmtNaira, fmtDate, fmtDepartTime } from '@/utils/format';
import { routeText } from '@/utils/request.utils';
import type { HistoryEntry, QuoteOptionView } from '@/interface';
import {
  HelpCircle, ChevronLeft, Plane, Lightbulb, MapPin,
  Repeat, Calendar, Undo2, PlaneTakeoff, Coins, Lock, RefreshCw,
} from 'lucide-react';
import type { ElementType } from 'react';

function synthTimeline(createdAt: string, issuedAt: string | null, completedAt: string | null, cancelledAt: string | null, cancellationReason: string | null): HistoryEntry[] {
  const items: HistoryEntry[] = [{ ts: createdAt, text: 'Request submitted' }];
  if (issuedAt) items.push({ ts: issuedAt, text: 'Ticket issued' });
  if (completedAt) items.push({ ts: completedAt, text: 'Completed — funds captured' });
  if (cancelledAt) items.push({ ts: cancelledAt, text: `Cancelled${cancellationReason ? ` — ${cancellationReason}` : ''}` });
  return items;
}

export function ClientRequestDetailContainer({ id }: { id: string }) {
  const { request: r, loading, error, busy, refresh, approve, reject, cancel } = useRequestDetail(id);
  const { wallet } = useWallet();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<QuoteOptionView | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  if (loading) return <div className="max-w-5xl mx-auto"><Loader label="Loading request…" size="lg" /></div>;
  if (error) return (
    <div className="max-w-5xl mx-auto">
      <EmptyState icon={HelpCircle}>
        <div className="space-y-3">
          <p>{error}</p>
          <button onClick={refresh} className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline"><RefreshCw className="w-4 h-4" /> Try again</button>
        </div>
      </EmptyState>
    </div>
  );
  if (!r) return <EmptyState icon={HelpCircle}>Request not found.</EmptyState>;

  async function handleApprove() {
    if (!selectedOpt) return;
    const ok = await approve(selectedOpt.id);
    if (ok) setConfirmOpen(false);
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;
    const ok = await reject(rejectReason.trim());
    if (ok) {
      setRejectOpen(false);
      setRejectReason('');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <Link href="/client/requests" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-brand transition-colors">
        <ChevronLeft aria-hidden="true" className="w-4 h-4" /> Back to my requests
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
          <p className="text-ink-3 text-sm mt-1">Ref <span className="font-medium text-ink-2">{r.ref}</span> · Submitted {fmtDate(r.createdAt)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-line shadow-card p-5 overflow-x-auto">
        <ProgressSteps status={r.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {r.status === 'OPTIONS_SENT' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">Travel options</h2>
                <span className="text-xs font-semibold text-purple bg-purple-soft px-2.5 py-1 rounded-full">Awaiting review</span>
              </div>

              <div className="grid gap-3">
                {r.quoteOptions.map((o) => (
                  <div key={o.id} className="bg-white rounded-2xl border border-line p-5 hover:border-brand/40 hover:shadow-card transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div>
                        <div className="font-semibold text-ink">{o.airline}</div>
                        <div className="text-xs text-ink-3 mt-0.5">{o.label}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-ink-3 mb-0.5">Departs</div>
                        <div className="font-semibold text-ink">{fmtDepartTime(o.departureTime)}</div>
                      </div>
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-3 border-t md:border-t-0 border-line pt-3 md:pt-0">
                        <div className="text-lg font-bold text-brand">{fmtNaira(o.price)}</div>
                        <button onClick={() => { setSelectedOpt(o); setConfirmOpen(true); }} className="bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-dark transition-colors">Approve</button>
                      </div>
                    </div>
                    {o.details && (
                      <div className="mt-3 pt-3 border-t border-line text-xs text-ink-3 flex items-center gap-1.5">
                        <Lightbulb aria-hidden="true" className="w-3.5 h-3.5 shrink-0" />{o.details}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-surface rounded-xl p-5 text-center border border-line">
                <p className="text-ink-2 text-sm mb-2">Don&apos;t see something you like?</p>
                <button onClick={() => setRejectOpen(true)} className="text-red font-semibold text-sm hover:underline">Request different options</button>
              </div>
            </section>
          )}

          {r.status === 'APPROVED_LOCKED' && (
            <section className="bg-white rounded-2xl border border-line shadow-card p-6">
              <h2 className="text-lg font-semibold text-ink mb-1">Approved — funds locked</h2>
              <p className="text-sm text-ink-3 mb-4">Your funds are held securely while Funlane issues your ticket. You can still cancel to release them.</p>
              <button onClick={() => setRejectOpen(true)} className="text-red font-semibold text-sm hover:underline">Cancel this request</button>
            </section>
          )}

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
                <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide mb-2">Passengers</div>
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
        </div>

        <aside className="space-y-6">
          <div className="bg-gradient-to-br from-navy-light to-navy text-white rounded-2xl p-6">
            <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1.5">My wallet</div>
            <div className="text-2xl font-bold mb-4">{fmtNaira(wallet?.availableBalance ?? 0)}</div>
            <div className="flex items-center gap-2 text-xs text-white/70 border-t border-white/10 pt-4">
              <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-green" />
              {fmtNaira(wallet?.lockedBalance ?? 0)} currently locked
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-ink">Timeline</h3>
            <Timeline history={synthTimeline(r.createdAt, r.issuedAt, r.completedAt, r.cancelledAt, r.cancellationReason)} />
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm approval"
        danger={false}
        confirmColor="brand"
        confirmLabel="Secure & approve"
        cancelLabel="Cancel"
        loading={busy}
        onConfirm={handleApprove}
        onCancel={() => setConfirmOpen(false)}
        message={
          <div className="space-y-4">
            <p className="text-sm text-ink-2 leading-relaxed">
              You&apos;re approving the <span className="font-semibold text-ink">{selectedOpt?.airline}</span> flight for{' '}
              <span className="font-semibold text-ink">{fmtNaira(selectedOpt?.price || 0)}</span>.
            </p>
            <div className="bg-brand-soft p-3.5 rounded-lg text-brand text-sm font-medium flex items-start gap-2">
              <Lock aria-hidden="true" className="w-4 h-4 mt-0.5 shrink-0" />
              <span>This locks the exact amount in your wallet until the ticket is issued.</span>
            </div>
          </div>
        }
      />

      <Modal open={rejectOpen} title={r.status === 'APPROVED_LOCKED' ? 'Cancel request' : 'Request alternatives'} onClose={() => setRejectOpen(false)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" color="ink" onClick={() => setRejectOpen(false)} disabled={busy}>Back</Button>
            <Button
              color="red"
              loading={busy}
              onClick={
                r.status === 'APPROVED_LOCKED'
                  ? async () => {
                      const ok = await cancel(rejectReason.trim() || 'Cancelled by client');
                      if (ok) {
                        setRejectOpen(false);
                        setRejectReason('');
                      }
                    }
                  : handleReject
              }
            >
              {r.status === 'APPROVED_LOCKED' ? 'Cancel request' : 'Send request'}
            </Button>
          </div>
        }>
        <div className="py-1">
          <label htmlFor="reject-reason" className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-2">
            {r.status === 'APPROVED_LOCKED' ? 'Reason for cancelling' : 'What would you like changed?'}
          </label>
          <textarea id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Please find earlier flights, or Ibom Air instead of Air Peace…"
            className="w-full min-h-[110px] p-3.5 text-sm bg-surface border border-line rounded-xl focus:outline-none focus:border-red focus:ring-2 focus:ring-red-soft transition-colors" />
        </div>
      </Modal>
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
