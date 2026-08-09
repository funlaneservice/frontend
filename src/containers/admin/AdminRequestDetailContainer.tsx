'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Formik, Form, type FormikHelpers } from 'formik';
import { useRequestDetail } from '@/hooks/useRequestsLive';
import { useAgentDirectory } from '@/hooks/useAgentDirectory';
import { StatusBadge, ProgressSteps, Timeline, EmptyState, Loader, Modal, Button, ConfirmDialog } from '@/components/ui';
import { MinorBadge } from '@/components/MinorBadge';
import { TextField, DateTimeField, ComboboxField } from '@/components/form';
import { OTHER_AIRLINE } from '@/lib/constants';
import { AIRLINE_SELECT_OPTIONS } from '@/lib/airlineOptions';
import { CABIN_CLASS_OPTIONS, CABIN_CLASS_BY_LABEL } from '@/lib/cabinClassOptions';
import { quoteOptionSchema } from '@/lib/validation/schemas';
import { STATUS_META } from '@/services/requestView';
import { fmtNaira, fmtDate, fmtDateTime, fmtDepartTime, fmtOptionMeta } from '@/utils/format';
import { routeText } from '@/utils/request.utils';
import type { ApiRequestStatus, HistoryEntry, QuoteOptionView } from '@/interface';
import type { RequestVM } from '@/services/requestView';
import {
  HelpCircle, ChevronLeft, Plane, MapPin, Repeat, Calendar, Undo2, PlaneTakeoff,
  Coins, RefreshCw, UserCog, Lightbulb, Plus, Send, X, Paperclip, FileText,
  CheckCircle2, Lock, Tag, Banknote, Info, Wrench, ShieldAlert, Ban, GitBranch,
  Hash, Armchair, Luggage, KeyRound,
} from 'lucide-react';
import type { ElementType } from 'react';

const ALL_STATUSES: ApiRequestStatus[] = [
  'PENDING', 'OPTIONS_SENT', 'APPROVED_LOCKED', 'ISSUED', 'COMPLETED', 'CANCELLED',
];

function synthTimeline(r: RequestVM): HistoryEntry[] {
  const items: HistoryEntry[] = [{ ts: r.createdAt, text: 'Request submitted by client' }];
  if (r.issuedAt) items.push({ ts: r.issuedAt, text: 'Ticket issued' });
  if (r.completedAt) items.push({ ts: r.completedAt, text: 'Completed — funds captured' });
  if (r.cancelledAt) items.push({ ts: r.cancelledAt, text: `Cancelled${r.cancellationReason ? ` — ${r.cancellationReason}` : ''}` });
  return items;
}

/** Price/stops stay strings in the form; yup casts them on validate, we cast on submit. */
interface QuoteDraftValues {
  airline: string;
  /** Free-text airline, used when `airline` is the "Other" sentinel. */
  airlineOther: string;
  flightNumber: string;
  label: string;
  departureTime: string;
  arrivalTime: string;
  /** Combobox display label (e.g. "Economy") — resolved to the API's cabin-class enum on submit. */
  cabinClass: string;
  stops: string;
  baggageAllowance: string;
  bookingReference: string;
  price: string;
  details: string;
}

const blankDraft = (): QuoteDraftValues => ({
  airline: AIRLINE_SELECT_OPTIONS[0]?.value ?? '',
  airlineOther: '',
  flightNumber: '',
  label: '',
  departureTime: '',
  arrivalTime: '',
  cabinClass: CABIN_CLASS_OPTIONS[0]?.value ?? '',
  stops: '0',
  baggageAllowance: '',
  bookingReference: '',
  price: '',
  details: '',
});

/** Which reason-collecting action is open, if any. */
type ReasonAction = 'reject' | 'cancel' | 'admin-cancel';

const REASON_COPY: Record<ReasonAction, { title: string; label: string; confirm: string; placeholder: string }> = {
  reject: {
    title: 'Reject options (as client)',
    label: 'What should be changed?',
    confirm: 'Send back to agent',
    placeholder: 'e.g. Please find earlier flights…',
  },
  cancel: {
    title: 'Cancel request (as client)',
    label: 'Reason for cancelling',
    confirm: 'Cancel request',
    placeholder: 'e.g. Trip postponed…',
  },
  'admin-cancel': {
    title: 'Force-cancel request (admin)',
    label: 'Reason for force-cancelling',
    confirm: 'Force-cancel',
    placeholder: 'e.g. Duplicate request, client unreachable…',
  },
};

/**
 * Admin request detail. Read-only overview plus a full lifecycle console
 * mirroring the backend's ADMIN grants: quote-building, sending, approving,
 * rejecting, cancelling, issuing and completing on any request — plus the
 * admin-only overrides (agent assignment, force-cancel, force-status).
 * Admins don't claim; they assign an agent (PATCH /requests/{id}/assign).
 */
export function AdminRequestDetailContainer({ id }: { id: string }) {
  const {
    request: r, loading, error, busy, refresh,
    addOption, removeOption, sendOptions, approve, reject, cancel, complete, uploadTicket,
    assignAgent, adminCancel, forceStatus,
  } = useRequestDetail(id);

  const { agents, agentName } = useAgentDirectory();
  const [agentId, setAgentId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<QuoteOptionView | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [reasonAction, setReasonAction] = useState<ReasonAction | null>(null);
  const [reason, setReason] = useState('');
  const [targetStatus, setTargetStatus] = useState<ApiRequestStatus | ''>('');
  const [forceOpen, setForceOpen] = useState(false);

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

  const isTerminal = r.status === 'COMPLETED' || r.status === 'CANCELLED';
  /** Options can be staged while PENDING or OPTIONS_SENT (backend rule). */
  const canEditOptions = r.status === 'PENDING' || r.status === 'OPTIONS_SENT';
  const canForceCancel = r.status === 'PENDING' || r.status === 'OPTIONS_SENT' || r.status === 'APPROVED_LOCKED';

  async function commitOption(values: QuoteDraftValues, helpers: FormikHelpers<QuoteDraftValues>) {
    // "Other" resolves to the free-text airline typed in.
    const airline = values.airline === OTHER_AIRLINE ? values.airlineOther.trim() : values.airline;
    // The combobox shows the friendly label ("Economy"); resolve back to the API enum.
    const cabinClass = CABIN_CLASS_BY_LABEL[values.cabinClass] ?? 'ECONOMY';
    const ok = await addOption({
      airline,
      flightNumber: values.flightNumber.trim(),
      label: values.label,
      details: values.details,
      price: Number(values.price),
      departureTime: new Date(values.departureTime).toISOString(),
      arrivalTime: new Date(values.arrivalTime).toISOString(),
      cabinClass,
      stops: values.stops.trim() ? Number(values.stops) : undefined,
      baggageAllowance: values.baggageAllowance.trim() || undefined,
      bookingReference: values.bookingReference.trim() || undefined,
    });
    if (ok) {
      helpers.resetForm();
      setAddOpen(false);
    }
  }

  async function handleApprove() {
    if (!selectedOpt) return;
    const ok = await approve(selectedOpt.id);
    if (ok) setApproveOpen(false);
  }

  async function handleReason() {
    if (!reasonAction || !reason.trim()) return;
    const run = { reject, cancel, 'admin-cancel': adminCancel }[reasonAction];
    const ok = await run(reason.trim());
    if (ok) {
      setReasonAction(null);
      setReason('');
    }
  }

  async function handleForceStatus() {
    if (!targetStatus) return;
    const ok = await forceStatus(targetStatus);
    if (ok) {
      setForceOpen(false);
      setTargetStatus('');
    }
  }

  async function issueTicket() {
    if (!ticketFile) return;
    const ok = await uploadTicket(ticketFile);
    if (ok) setTicketFile(null);
  }

  const selectClass =
    'h-11 px-3 bg-card border border-line rounded-lg text-sm text-ink shadow-sm focus:outline-none focus:border-brand min-w-0';

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <Link href="/admin/requests" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-brand transition-colors">
        <ChevronLeft aria-hidden="true" className="w-4 h-4" /> Back to requests
      </Link>

      <div className="bg-card rounded-2xl border border-line shadow-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div aria-hidden="true" className="w-12 h-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <Plane className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-ink">{routeText(r)}</h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-ink-3 text-sm mt-1">
            Ref <span className="font-medium text-ink-2">{r.ref}</span> ·{' '}
            {r.assignedAgentId ? <>Assigned to <span className="font-medium text-ink-2">{agentName(r.assignedAgentId)}</span></> : 'Unassigned'} · Submitted {fmtDate(r.createdAt)}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-line shadow-card p-5 overflow-x-auto">
        <ProgressSteps status={r.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 min-w-0 space-y-6">
          {/* ------- Lifecycle console (agent + client powers) ------- */}
          <section className="bg-card rounded-2xl border-2 border-dashed border-brand/30 p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
                <Wrench aria-hidden="true" className="w-[18px] h-[18px]" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-ink">Lifecycle console</h2>
                <p className="text-xs text-ink-3">Act as the agent or the client to move this request through the flow.</p>
              </div>
            </div>

            {canEditOptions && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  {r.quoteOptions.map((o) => (
                    <div key={o.id} className="flex items-center justify-between gap-3 p-3.5 bg-surface rounded-xl border border-line">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{o.airline} <span className="text-[11px] text-ink-3 ml-1">{o.label}</span></div>
                        <div className="text-xs text-ink-3 mt-0.5">
                          Departs {fmtDepartTime(o.departureTime)}
                          {fmtOptionMeta(o) ? ` · ${fmtOptionMeta(o)}` : ''} · {fmtNaira(o.price)}
                        </div>
                      </div>
                      <button onClick={() => removeOption(o.id)} disabled={busy} aria-label={`Remove ${o.airline} option`} className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-red-soft hover:text-red transition-colors disabled:opacity-50">
                        <X aria-hidden="true" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {!r.quoteOptions.length && (
                    <div className="py-8 border border-dashed border-line rounded-xl text-center text-ink-3 text-sm">No quote options staged yet.</div>
                  )}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button color="brand" variant="outline" leftIcon={Plus} onClick={() => setAddOpen(true)} disabled={busy}>
                    Add option
                  </Button>
                  {r.status === 'PENDING' && (
                    <Button color="brand" leftIcon={Send} loading={busy} disabled={!r.quoteOptions.length} onClick={sendOptions}>
                      Send options to client
                    </Button>
                  )}
                </div>
              </div>
            )}

            {r.status === 'OPTIONS_SENT' && (
              <div className="space-y-4 border-t border-line pt-5">
                <p className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide">Client decisions</p>
                <div className="space-y-2.5">
                  {r.quoteOptions.map((o) => (
                    <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-surface rounded-xl border border-line">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{o.airline} <span className="text-[11px] text-ink-3 ml-1">{o.label}</span></div>
                        <div className="text-xs text-ink-3 mt-0.5">
                          Departs {fmtDepartTime(o.departureTime)}
                          {fmtOptionMeta(o) ? ` · ${fmtOptionMeta(o)}` : ''} · <span className="font-semibold text-brand">{fmtNaira(o.price)}</span>
                        </div>
                      </div>
                      <Button color="brand" onClick={() => { setSelectedOpt(o); setApproveOpen(true); }} disabled={busy}>
                        Approve (as client)
                      </Button>
                    </div>
                  ))}
                </div>
                <Button color="red" variant="outline" leftIcon={Undo2} onClick={() => setReasonAction('reject')} disabled={busy}>
                  Reject options (as client)
                </Button>
              </div>
            )}

            {r.status === 'APPROVED_LOCKED' && (
              <div className="space-y-4">
                <label htmlFor="admin-ticket-file" className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${ticketFile ? 'border-green bg-green-soft text-green-dark' : 'border-line hover:border-brand hover:bg-brand-soft/50 text-ink-3'}`}>
                  {ticketFile ? <FileText aria-hidden="true" className="w-6 h-6 mb-2" /> : <Paperclip aria-hidden="true" className="w-6 h-6 mb-2" />}
                  <span className="text-sm font-semibold">{ticketFile ? ticketFile.name : 'Attach e-ticket (PDF/JPEG/PNG)'}</span>
                </label>
                <input id="admin-ticket-file" type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(e) => setTicketFile(e.target.files?.[0] ?? null)} />
                <div className="flex flex-wrap gap-3">
                  <Button color="brand" leftIcon={Lock} loading={busy} disabled={!ticketFile} onClick={issueTicket}>
                    Issue ticket (as agent)
                  </Button>
                  <Button color="red" variant="outline" onClick={() => setReasonAction('cancel')} disabled={busy}>
                    Cancel request (as client)
                  </Button>
                </div>
              </div>
            )}

            {r.status === 'ISSUED' && (
              <Button color="green" leftIcon={CheckCircle2} loading={busy} onClick={complete}>
                Mark complete &amp; capture funds
              </Button>
            )}

            {isTerminal && (
              <p className="text-sm text-ink-3">
                This request is {r.status === 'COMPLETED' ? 'completed' : 'cancelled'} — no further lifecycle actions are available.
              </p>
            )}
          </section>

          {/* ------- Admin overrides (assignment + force tools) ------- */}
          {!isTerminal && (
            <section className="bg-card rounded-2xl border-2 border-dashed border-red/30 p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg bg-red-soft text-red flex items-center justify-center shrink-0">
                  <ShieldAlert aria-hidden="true" className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-ink">Admin overrides</h2>
                  <p className="text-xs text-ink-3">Bypass the normal rules. Use with care.</p>
                </div>
              </div>

              {/* Agent assignment — replaces claiming for admins */}
              <div className="space-y-2">
                <p className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide">Agent assignment</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    aria-label="Select agent"
                    className={`${selectClass} flex-1`}
                  >
                    <option value="">Select an agent…</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <Button color="ink" leftIcon={UserCog} loading={busy} disabled={!agentId} onClick={() => assignAgent(agentId)}>
                      Assign
                    </Button>
                    {r.assignedAgentId && (
                      <Button color="ink" variant="outline" loading={busy} onClick={() => assignAgent(null)}>
                        Unassign
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-ink-3">
                  {r.assignedAgentId ? `Currently assigned to ${agentName(r.assignedAgentId)}.` : 'Currently in the shared queue (unassigned).'}
                </p>
              </div>

              {/* Force tools */}
              <div className="space-y-2 border-t border-line pt-5">
                <p className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide">Force tools</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as ApiRequestStatus | '')}
                    aria-label="Force status"
                    className={`${selectClass} flex-1`}
                  >
                    <option value="">Force status to…</option>
                    {ALL_STATUSES.filter((s) => s !== r.status).map((s) => (
                      <option key={s} value={s}>{STATUS_META[s]?.label ?? s}</option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <Button color="red" variant="outline" leftIcon={GitBranch} disabled={!targetStatus || busy} onClick={() => setForceOpen(true)}>
                      Force status
                    </Button>
                    {canForceCancel && (
                      <Button color="red" leftIcon={Ban} disabled={busy} onClick={() => setReasonAction('admin-cancel')}>
                        Force-cancel
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-ink-3">
                  Forcing a status skips wallet locking/release/capture — reconcile the wallet manually if you cross a funds boundary.
                  Force-cancel releases locked funds and works on any request before it&apos;s issued.
                </p>
              </div>
            </section>
          )}

          {/* Booking details */}
          <section className="bg-card rounded-2xl border border-line shadow-card p-6">
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
                      <div className="w-7 h-7 rounded-full bg-card flex items-center justify-center font-semibold text-xs border border-line">{i + 1}</div>
                      <div>
                        <div className="font-medium text-ink text-sm flex items-center gap-2 flex-wrap">
                          {p.fullName} <MinorBadge dateOfBirth={p.dateOfBirth} />
                        </div>
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

          {/* Quote options (read-only recap once past staging) */}
          {!canEditOptions && r.quoteOptions.length > 0 && (
            <section className="bg-card rounded-2xl border border-line shadow-card p-6">
              <h2 className="text-lg font-semibold text-ink mb-4">Quote options</h2>
              <div className="grid gap-3">
                {r.quoteOptions.map((o) => (
                  <div key={o.id} className={`rounded-xl border p-4 ${o.isSelected ? 'border-green/40 bg-green-soft/30' : 'border-line'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{o.airline}</span>
                          {o.isSelected && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-green-dark bg-green-soft px-2 py-0.5 rounded-full">
                              <CheckCircle2 aria-hidden="true" className="w-3 h-3" /> Selected by client
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-ink-3 mt-0.5">{o.label}</div>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-ink-3 mb-0.5">Departs</div>
                        <div className="font-semibold text-ink text-sm">{fmtDepartTime(o.departureTime)}</div>
                        {fmtOptionMeta(o) && <div className="text-[11px] text-ink-3 mt-0.5">{fmtOptionMeta(o)}</div>}
                      </div>
                      <div className="text-lg font-bold text-brand">{fmtNaira(o.price)}</div>
                    </div>
                    {o.bookingReference && (
                      <div className="mt-1 text-[11px] text-ink-3">Ref: {o.bookingReference}</div>
                    )}
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

        <aside className="min-w-0 space-y-6">
          <div className="bg-card rounded-2xl border border-line shadow-card p-6">
            <h3 className="text-base font-semibold text-ink mb-4">Overview</h3>
            <dl className="space-y-3.5 text-sm">
              <Meta label="Assignment" icon={UserCog} value={agentName(r.assignedAgentId) ?? 'Unassigned'} />
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

      {/* Add quote option (agent power) */}
      <Formik initialValues={blankDraft()} validationSchema={quoteOptionSchema} onSubmit={commitOption}>
        {({ submitForm, isSubmitting, values }) => (
          <Modal open={addOpen} title="Add travel option" onClose={() => setAddOpen(false)}
            footer={
              <div className="flex gap-3 w-full">
                <button type="button" className="flex-1 py-2.5 bg-card border border-line text-ink font-medium text-sm rounded-lg hover:bg-surface transition-colors" onClick={() => setAddOpen(false)}>Cancel</button>
                <button type="button" className="flex-1 py-2.5 bg-brand text-white font-semibold text-sm rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50" onClick={() => void submitForm()} disabled={busy || isSubmitting}>Add option</button>
              </div>
            }>
            <Form noValidate className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <ComboboxField
                  name="airline"
                  label="Airline"
                  placeholder="Search airline"
                  icon={Plane}
                  options={AIRLINE_SELECT_OPTIONS}
                  strict
                  id="admin-opt-airline"
                />
                <TextField name="flightNumber" label="Flight number" placeholder="e.g. QR1234" icon={Hash} id="admin-opt-flight-number" />
              </div>
              {values.airline === OTHER_AIRLINE && (
                <div className="animate-fade-in">
                  <TextField name="airlineOther" label="Airline name" placeholder="e.g. Rwandair" icon={Plane} id="admin-opt-airline-other" />
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField name="label" label="Label" placeholder="e.g. Direct · 23kg" icon={Tag} id="admin-opt-label" />
                <ComboboxField
                  name="cabinClass"
                  label="Cabin class"
                  placeholder="Search cabin class"
                  icon={Armchair}
                  options={CABIN_CLASS_OPTIONS}
                  strict
                  id="admin-opt-cabin-class"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <DateTimeField name="departureTime" label="Departure date & time" id="admin-opt-depart" />
                <DateTimeField name="arrivalTime" label="Arrival date & time" min={values.departureTime || undefined} id="admin-opt-arrive" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField name="price" type="number" label="Price (₦)" placeholder="180000" icon={Banknote} inputMode="numeric" id="admin-opt-price" />
                <TextField name="stops" type="number" label="Stops" placeholder="0" icon={Repeat} inputMode="numeric" id="admin-opt-stops" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField name="baggageAllowance" label="Baggage (optional)" placeholder="e.g. 23kg checked" icon={Luggage} id="admin-opt-baggage" />
                <TextField name="bookingReference" label="Booking ref. (optional)" placeholder="e.g. PNR code" icon={KeyRound} id="admin-opt-booking-ref" />
              </div>
              <TextField name="details" label="Details (optional)" placeholder="e.g. Aisle seat, refundable" icon={Info} id="admin-opt-details" />
            </Form>
          </Modal>
        )}
      </Formik>

      {/* Approve confirmation (client power) */}
      <ConfirmDialog
        open={approveOpen}
        title="Approve option (as client)"
        danger={false}
        confirmColor="brand"
        confirmLabel="Approve & lock funds"
        cancelLabel="Back"
        loading={busy}
        onConfirm={handleApprove}
        onCancel={() => setApproveOpen(false)}
        message={
          <p className="text-sm text-ink-2 leading-relaxed">
            Approving the <span className="font-semibold text-ink">{selectedOpt?.airline}</span> option for{' '}
            <span className="font-semibold text-ink">{fmtNaira(selectedOpt?.price || 0)}</span> locks that amount in the
            <span className="font-semibold text-ink"> request owner&apos;s</span> wallet (never yours) until the ticket is issued.
          </p>
        }
      />

      {/* Force-status confirmation */}
      <ConfirmDialog
        open={forceOpen}
        title="Force status (admin)"
        confirmLabel={`Yes, force to ${targetStatus || '—'}`}
        cancelLabel="Back"
        loading={busy}
        onConfirm={handleForceStatus}
        onCancel={() => setForceOpen(false)}
        message={
          <p className="text-sm text-ink-2 leading-relaxed">
            This bypasses the state machine entirely and does <strong className="text-ink">not</strong> lock, release or
            capture wallet funds. If forcing from <span className="font-mono text-xs">{r.status}</span> to{' '}
            <span className="font-mono text-xs">{targetStatus}</span> crosses a funds boundary, reconcile the wallet
            manually afterwards. Continue?
          </p>
        }
      />

      {/* Shared reason modal for reject / cancel / force-cancel */}
      <Modal
        open={reasonAction !== null}
        title={reasonAction ? REASON_COPY[reasonAction].title : ''}
        onClose={() => setReasonAction(null)}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" color="ink" onClick={() => setReasonAction(null)} disabled={busy}>Back</Button>
            <Button color="red" loading={busy} disabled={!reason.trim()} onClick={handleReason}>
              {reasonAction ? REASON_COPY[reasonAction].confirm : ''}
            </Button>
          </div>
        }
      >
        <div className="py-1">
          <label htmlFor="admin-reason" className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-2">
            {reasonAction ? REASON_COPY[reasonAction].label : ''}
          </label>
          <textarea
            id="admin-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={reasonAction ? REASON_COPY[reasonAction].placeholder : ''}
            className="w-full min-h-[110px] p-3.5 text-sm bg-surface border border-line rounded-xl focus:outline-none focus:border-red focus:ring-2 focus:ring-red-soft transition-colors"
          />
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
