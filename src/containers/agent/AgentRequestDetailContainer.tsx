'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Formik, Form, type FormikHelpers } from 'formik';
import { useRequestDetail } from '@/hooks/useRequestsLive';
import { useAuthStore } from '@/store/useAuthStore';
import { StatusBadge, ProgressSteps, Timeline, Modal, EmptyState, Loader } from '@/components/ui';
import { MinorBadge } from '@/components/MinorBadge';
import { OTHER_AIRLINE } from '@/lib/constants';
import { AIRLINE_SELECT_OPTIONS } from '@/lib/airlineOptions';
import { CABIN_CLASS_OPTIONS, CABIN_CLASS_BY_LABEL } from '@/lib/cabinClassOptions';
import { quoteOptionSchema } from '@/lib/validation/schemas';
import { fmtNaira, fmtDate, fmtDateTime, fmtDepartTime, fmtOptionMeta, initials } from '@/utils/format';
import { routeText } from '@/utils/request.utils';
import type { HistoryEntry } from '@/interface';
import type { RequestVM } from '@/services/requestView';
import { TextField, DateTimeField, ComboboxField } from '@/components/form';
import {
  HelpCircle, Send, Lock, Ticket, ChevronLeft, Plane, Undo2,
  Plus, ShieldCheck, CheckCircle2, FileText, Paperclip, X, RefreshCw, Hand,
  Tag, Banknote, Info, Hash, Armchair, Repeat, Luggage, KeyRound,
} from 'lucide-react';

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

function synthTimeline(r: RequestVM): HistoryEntry[] {
  const items: HistoryEntry[] = [{ ts: r.createdAt, text: 'Request submitted by client' }];
  if (r.issuedAt) items.push({ ts: r.issuedAt, text: 'Ticket issued' });
  if (r.completedAt) items.push({ ts: r.completedAt, text: 'Completed — funds captured' });
  return items;
}

export function AgentRequestDetailContainer({ id }: { id: string }) {
  const { request: r, loading, error, busy, refresh, claim, addOption, removeOption, sendOptions, complete, uploadTicket } = useRequestDetail(id);
  const me = useAuthStore((s) => s.user);

  const [addOpen, setAddOpen] = useState(false);
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [authorized, setAuthorized] = useState(false);

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

  async function commitOption(values: QuoteDraftValues, helpers: FormikHelpers<QuoteDraftValues>) {
    // "Other" resolves to the free-text airline typed in.
    const airline = values.airline === OTHER_AIRLINE ? values.airlineOther.trim() : values.airline;
    // The combobox shows the friendly label ("Economy"); resolve back to the API enum.
    const cabinClass = CABIN_CLASS_BY_LABEL[values.cabinClass] ?? 'ECONOMY';
    // The backend expects an ISO datetime; the picker gives local "YYYY-MM-DDTHH:mm".
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

  async function issueTicket() {
    if (!ticketFile) return;
    await uploadTicket(ticketFile);
    setTicketFile(null);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <Link href="/agent/board" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-3 hover:text-brand transition-colors">
        <ChevronLeft aria-hidden="true" className="w-4 h-4" /> Back to queue
      </Link>

      <div className="bg-card rounded-2xl border border-line shadow-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div aria-hidden="true" className="w-12 h-12 rounded-xl bg-brand-soft text-brand flex items-center justify-center shrink-0">
          <Plane className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-ink">{r.ref}</h1>
            <StatusBadge status={r.status} />
          </div>
          <p className="text-ink-3 text-sm mt-1">
            {routeText(r)} ·{' '}
            {r.assignedAgentId
              ? r.assignedAgentId === me?.id
                ? <>Claimed by <span className="font-medium text-ink-2">you ({me?.name})</span></>
                : 'Claimed'
              : 'Unassigned'}{' '}
            · Submitted {fmtDate(r.createdAt)}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-line shadow-card p-5 overflow-x-auto">
        <ProgressSteps status={r.status} />
      </div>

      {r.rejectionReason && (
        <div className="bg-red-soft border border-red/15 rounded-2xl p-5 flex gap-4">
          <Undo2 aria-hidden="true" className="w-6 h-6 text-red shrink-0" />
          <div>
            <strong className="block text-red-dark font-semibold text-sm mb-1">Client feedback</strong>
            <p className="text-ink-2 text-sm leading-relaxed">{r.rejectionReason}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 min-w-0 space-y-6">
          {/* --- Status-driven action panel --- */}
          {r.status === 'PENDING' && !r.assignedAgentId && (
            <section className="bg-card rounded-2xl border border-line shadow-card p-6 text-center">
              <Hand aria-hidden="true" className="w-8 h-8 text-brand mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-ink">Claim this request</h2>
              <p className="text-sm text-ink-3 mt-1 mb-4">Claim it to start building a quotation for the client.</p>
              <button onClick={claim} disabled={busy} className="bg-brand text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-50">
                {busy ? 'Claiming…' : 'Claim request'}
              </button>
            </section>
          )}

          {r.status === 'PENDING' && r.assignedAgentId && (
            <section className="bg-card rounded-2xl border border-line shadow-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-ink">Build quotation</h2>
                  <p className="text-sm text-ink-3 mt-0.5">Add the flight options to send to the client.</p>
                </div>
                <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 bg-brand-soft text-brand px-3.5 py-2 rounded-lg font-semibold text-sm hover:bg-brand hover:text-white transition-colors">
                  <Plus aria-hidden="true" className="w-4 h-4" /> Add option
                </button>
              </div>

              <div className="space-y-2.5 mb-5">
                {r.quoteOptions.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-card border border-line flex items-center justify-center text-xs font-semibold text-ink-2">{initials(o.airline)}</div>
                      <div>
                        <div className="text-sm font-medium text-ink">{o.airline} <span className="text-[11px] text-ink-3 ml-1">{o.label}</span></div>
                        <div className="text-xs text-ink-3 mt-0.5">
                          Departs {fmtDepartTime(o.departureTime)}
                          {fmtOptionMeta(o) ? ` · ${fmtOptionMeta(o)}` : ''}
                          {o.details ? ` · ${o.details}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-semibold text-ink">{fmtNaira(o.price)}</div>
                      <button onClick={() => removeOption(o.id)} aria-label={`Remove ${o.airline} option`} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-red-soft hover:text-red transition-colors">
                        <X aria-hidden="true" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {!r.quoteOptions.length && <div className="py-12 border border-dashed border-line rounded-xl text-center text-ink-3 text-sm">No options added yet.</div>}
              </div>

              <div className="flex items-center justify-between border-t border-line pt-5">
                <span className="text-sm text-ink-3">{r.quoteOptions.length} option{r.quoteOptions.length === 1 ? '' : 's'}</span>
                <button onClick={sendOptions} disabled={!r.quoteOptions.length || busy} className="inline-flex items-center gap-1.5 bg-brand text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <Send aria-hidden="true" className="w-4 h-4" /> Send to client
                </button>
              </div>
            </section>
          )}

          {r.status === 'OPTIONS_SENT' && (
            <section className="bg-card rounded-2xl border border-line shadow-card p-6">
              <span className="inline-flex items-center text-[11px] font-semibold uppercase tracking-wide text-purple bg-purple-soft px-2.5 py-1 rounded-full mb-5">Awaiting client review</span>
              <div className="space-y-2.5">
                {r.quoteOptions.map((o) => (
                  <div key={o.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-line">
                    <div>
                      <div className="text-sm font-medium text-ink">{o.airline} <span className="text-[11px] text-ink-3 ml-1">{o.label}</span></div>
                      <div className="text-xs text-ink-3 mt-0.5">
                        Departs {fmtDepartTime(o.departureTime)}
                        {fmtOptionMeta(o) ? ` · ${fmtOptionMeta(o)}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-semibold text-ink">{fmtNaira(o.price)}</div>
                      {r.assignedAgentId && (
                        <button onClick={() => removeOption(o.id)} disabled={busy} aria-label={`Remove ${o.airline} option`} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:bg-red-soft hover:text-red transition-colors disabled:opacity-50">
                          <X aria-hidden="true" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-ink-3 border-t border-line pt-5 mt-5">
                Pending the client&apos;s selection. You can still remove an option while they review — the client may also send it back for revisions.
              </p>
            </section>
          )}

          {r.status === 'APPROVED_LOCKED' && (
            <section className="bg-card rounded-2xl border border-line shadow-card p-6 animate-scale-in">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-green-dark bg-green-soft px-2.5 py-1 rounded-full mb-5">
                <Lock aria-hidden="true" className="w-3 h-3" /> Funds locked
              </span>
              <h2 className="text-lg font-semibold text-ink mb-1">Issue the ticket</h2>
              <p className="text-sm text-ink-3 mb-5">The client approved an option and funds are secured. Attach the e-ticket to issue it.</p>

              {r.approvedOption && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 mb-5 bg-green-soft/40 border border-green/30 rounded-xl">
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase font-semibold text-green-dark tracking-wide mb-0.5">Client&apos;s approved option</div>
                    <div className="text-sm font-medium text-ink truncate">{r.approvedOption.airline} <span className="text-[11px] text-ink-3 ml-1">{r.approvedOption.label}</span></div>
                    <div className="text-xs text-ink-3 mt-0.5">
                      Departs {fmtDepartTime(r.approvedOption.departureTime)}
                      {fmtOptionMeta(r.approvedOption) ? ` · ${fmtOptionMeta(r.approvedOption)}` : ''}
                    </div>
                    {r.approvedOption.bookingReference && (
                      <div className="text-[11px] text-ink-3 mt-0.5">Ref: {r.approvedOption.bookingReference}</div>
                    )}
                  </div>
                  <div className="text-base font-bold text-green-dark shrink-0">{fmtNaira(r.approvedOption.price)}</div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-surface rounded-lg border border-line mb-4">
                <ShieldCheck aria-hidden="true" className="w-5 h-5 mt-0.5 text-ink-2 shrink-0" />
                <label className="text-xs text-ink-2 leading-relaxed flex items-start gap-2">
                  <input type="checkbox" checked={authorized} onChange={(e) => setAuthorized(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-line text-brand" />
                  Maker-checker: I confirm the GDS confirmation matches the PNR and this issuance is authorized.
                </label>
              </div>

              <span className="block text-[11px] font-semibold text-ink-3 uppercase tracking-wide mb-2">Digital e-ticket</span>
              <label htmlFor="ticket-file" className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${ticketFile ? 'border-green bg-green-soft text-green-dark' : 'border-line hover:border-brand hover:bg-brand-soft/50 text-ink-3'}`}>
                {ticketFile ? <FileText aria-hidden="true" className="w-6 h-6 mb-2" /> : <Paperclip aria-hidden="true" className="w-6 h-6 mb-2" />}
                <span className="text-sm font-semibold">{ticketFile ? ticketFile.name : 'Attach e-ticket (PDF/JPEG/PNG)'}</span>
              </label>
              <input id="ticket-file" type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(e) => setTicketFile(e.target.files?.[0] ?? null)} />

              <button onClick={issueTicket} disabled={!ticketFile || !authorized || busy} className="mt-4 w-full bg-brand text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {busy ? 'Uploading…' : 'Issue ticket'}
              </button>
            </section>
          )}

          {r.status === 'ISSUED' && (
            <section className="bg-card rounded-2xl border border-line shadow-card p-6">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-blue-dark bg-blue-soft px-2.5 py-1 rounded-full mb-5">
                <Ticket aria-hidden="true" className="w-3 h-3" /> Ticket issued
              </span>
              <h2 className="text-lg font-semibold text-ink mb-1">Capture funds to complete</h2>
              <p className="text-sm text-ink-3 mb-5">The ticket is uploaded. Mark complete to capture the locked funds and pay the agency.</p>
              {r.ticketDownloadUrl && (
                <a href={r.ticketDownloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline mb-5">
                  <FileText className="w-4 h-4" /> View uploaded ticket
                </a>
              )}
              <button onClick={complete} disabled={busy} className="w-full bg-green text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-green-dark transition-colors disabled:opacity-50">
                {busy ? 'Processing…' : 'Mark complete & capture funds'}
              </button>
            </section>
          )}

          {(r.status === 'COMPLETED' || r.status === 'CANCELLED') && (
            <section className="bg-card rounded-2xl border border-line shadow-card p-6">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full mb-4 ${r.status === 'COMPLETED' ? 'text-green-dark bg-green-soft' : 'text-red-dark bg-red-soft'}`}>
                {r.status === 'COMPLETED' ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />} {r.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
              </span>
              <p className="text-sm text-ink-3">{r.status === 'COMPLETED' ? 'Funds captured and the ticket delivered to the traveler.' : (r.cancellationReason || 'This request was cancelled and any locked funds released.')}</p>
              {r.ticketDownloadUrl && (
                <a href={r.ticketDownloadUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline mt-4">
                  <FileText className="w-4 h-4" /> View ticket
                </a>
              )}
            </section>
          )}

          <section className="bg-card rounded-2xl border border-line shadow-card p-6">
            <h2 className="text-lg font-semibold text-ink mb-5">Request details</h2>
            <div className="grid sm:grid-cols-2 gap-5">
              <KV label="Itinerary" value={routeText(r)} />
              <KV label="Trip type" value={r.tripType === 'round' ? 'Round trip' : 'One way'} />
              <KV label="Departure" value={`${fmtDate(r.departureDate)}${r.preferredTime ? ` · ${r.preferredTime}` : ''}`} />
              <KV label="Return" value={r.returnDate ? fmtDate(r.returnDate) : 'N/A'} />
              <KV label="Carrier preference" value={r.preferredAirline || 'No preference'} />
              <KV label="Cabin class" value={r.budgetLabel} />

              <div className="sm:col-span-2 space-y-2.5">
                <div className="text-[11px] uppercase font-semibold text-ink-3 tracking-wide">Passenger manifest</div>
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
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-3">
          <h3 className="text-base font-semibold text-ink">Activity</h3>
          <Timeline history={synthTimeline(r)} />
        </aside>
      </div>

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
                  id="opt-airline"
                />
                <TextField name="flightNumber" label="Flight number" placeholder="e.g. QR1234" icon={Hash} id="opt-flight-number" />
              </div>
              {values.airline === OTHER_AIRLINE && (
                <div className="animate-fade-in">
                  <TextField name="airlineOther" label="Airline name" placeholder="e.g. Rwandair" icon={Plane} id="opt-airline-other" />
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField name="label" label="Label" placeholder="e.g. Direct · 23kg" icon={Tag} id="opt-label" />
                <ComboboxField
                  name="cabinClass"
                  label="Cabin class"
                  placeholder="Search cabin class"
                  icon={Armchair}
                  options={CABIN_CLASS_OPTIONS}
                  strict
                  id="opt-cabin-class"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <DateTimeField name="departureTime" label="Departure date & time" id="opt-depart" />
                <DateTimeField name="arrivalTime" label="Arrival date & time" min={values.departureTime || undefined} id="opt-arrive" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField name="price" type="number" label="Price (₦)" placeholder="180000" icon={Banknote} inputMode="numeric" id="opt-price" />
                <TextField name="stops" type="number" label="Stops" placeholder="0" icon={Repeat} inputMode="numeric" id="opt-stops" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <TextField name="baggageAllowance" label="Baggage allowance (optional)" placeholder="e.g. 23kg checked" icon={Luggage} id="opt-baggage" />
                <TextField name="bookingReference" label="Booking reference (optional)" placeholder="e.g. PNR code" icon={KeyRound} id="opt-booking-ref" />
              </div>
              <TextField name="details" label="Details (optional)" placeholder="e.g. Aisle seat, refundable" icon={Info} id="opt-details" />
            </Form>
          </Modal>
        )}
      </Formik>
    </div>
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
