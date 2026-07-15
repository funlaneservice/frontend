'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useWallet } from '@/hooks/useWallet';
import { useRequestList } from '@/hooks/useRequestsLive';
import { RequestTable } from '@/components/RequestTable';
import { EmptyState, Loader, PageHeader, StatCard } from '@/components/ui';
import { fmtNaira, fmtDate } from '@/utils/format';
import { routeText } from '@/utils/request.utils';
import { dailyCounts, weekOverWeek } from '@/utils/trend';
import { Plus, CreditCard, Lock, Plane, Bell, CheckCircle2 } from 'lucide-react';

const clientHref = (id: string) => `/client/requests/${id}`;

export function ClientDashboardContainer() {
  const name = useAuthStore((s) => s.user?.name) ?? 'there';
  const { wallet } = useWallet();
  const { items: reqs, loading } = useRequestList('mine');

  const active = reqs.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length;
  const needsReview = reqs.filter((r) => r.status === 'OPTIONS_SENT').length;
  const reviewReq = reqs.find((r) => r.status === 'OPTIONS_SENT');

  const requestSpark = dailyCounts(reqs, 7);
  const requestTrend = weekOverWeek(reqs);
  const hasSpark = requestSpark.some((n) => n > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Welcome back"
        title={name.split(' ')[0]}
        subtitle="Here's an overview of your travel requests and wallet activity."
        actions={
          <Link href="/client/new" className="inline-flex items-center justify-center gap-2 bg-white text-navy px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#E4F1FB] transition-colors shrink-0">
            <Plus aria-hidden="true" className="w-4 h-4" /> New request
          </Link>
        }
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Available balance" value={fmtNaira(wallet?.availableBalance ?? 0)} icon={CreditCard} iconTone="green" />
        <StatCard label="Locked funds" value={fmtNaira(wallet?.lockedBalance ?? 0)} icon={Lock} iconTone="ink" />
        <StatCard
          label="Active requests"
          value={active}
          icon={Plane}
          iconTone="brand"
          sparkline={hasSpark ? requestSpark : undefined}
          trend={requestTrend !== null ? { value: requestTrend, label: 'vs last week' } : undefined}
        />
        <StatCard label="Awaiting review" value={needsReview} icon={Bell} iconTone="purple" highlight={needsReview > 0} />
      </section>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* min-w-0: let the column shrink below the table's min width so the
            table scrolls inside its card instead of stretching the page. */}
        <section className="lg:col-span-2 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Recent requests</h2>
            <Link href="/client/requests" className="text-sm font-medium text-brand hover:underline">View all</Link>
          </div>

          <div className="bg-card rounded-2xl border border-line shadow-card overflow-hidden">
            {loading ? (
              <Loader />
            ) : reqs.length ? (
              <RequestTable requests={reqs.slice(0, 5)} hrefFor={clientHref} />
            ) : (
              <EmptyState icon={Plane}>
                <div className="space-y-3">
                  <p>You haven&apos;t made any travel requests yet.</p>
                  <Link href="/client/new" className="inline-block bg-brand text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-dark transition-colors">
                    Create your first request
                  </Link>
                </div>
              </EmptyState>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-4">
          {reviewReq ? (
            <div className="bg-card rounded-2xl border border-line shadow-card p-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-purple bg-purple-soft px-2.5 py-1 rounded-full">Action needed</span>
              <h3 className="font-semibold text-ink text-base mt-3">{routeText(reviewReq)}</h3>
              <p className="text-sm text-ink-3 mt-1">{fmtDate(reviewReq.departureDate)} · {reviewReq.ref}</p>
              <p className="text-sm text-ink-2 mt-3 leading-relaxed">New travel options are ready for your review.</p>
              <Link href={clientHref(reviewReq.id)} className="mt-4 flex items-center justify-center gap-2 bg-brand text-white w-full py-2.5 rounded-lg font-semibold text-sm hover:bg-brand-dark transition-colors">
                Review options
              </Link>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-line shadow-card p-6 text-center">
              <CheckCircle2 aria-hidden="true" className="w-8 h-8 text-green mx-auto mb-3" />
              <h3 className="font-semibold text-ink text-sm">You&apos;re all caught up</h3>
              <p className="text-ink-3 text-sm mt-1.5 leading-relaxed">No requests need your attention right now.</p>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-line shadow-card p-5">
            <h3 className="font-semibold text-ink text-sm mb-3">How it works</h3>
            <ol className="space-y-3">
              {[
                'Submit a travel request with your trip details.',
                'Our agents send you flight options to review.',
                'Approve an option — funds are locked, not charged.',
                'Your e-ticket is issued and funds are captured.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-ink-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-brand-soft text-brand text-[11px] font-semibold flex items-center justify-center">{i + 1}</span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
