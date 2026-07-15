'use client';

import { useEffect, useState } from 'react';
import { Formik, Form, type FormikHelpers } from 'formik';
import { useAuthStore } from '@/store/useAuthStore';
import { useWallet } from '@/hooks/useWallet';
import { fmtNaira, fmtDateTime } from '@/utils/format';
import { PageHeader, DataTable } from '@/components/ui';
import { TextField } from '@/components/form';
import { topupSchema } from '@/lib/validation/schemas';
import { downloadCsv, csvFilename } from '@/utils/csv';
import type { ApiTransactionType, WalletTransactionView } from '@/interface';
import { Plus, ShieldCheck, Receipt, Lock, AlertTriangle, RefreshCw, Wallet as WalletIcon, Banknote, Download } from 'lucide-react';

const TXN_META: Record<ApiTransactionType, { label: string; credit: boolean }> = {
  TOPUP: { label: 'Top-up', credit: true },
  RELEASE: { label: 'Funds released', credit: true },
  LOCK: { label: 'Funds locked', credit: false },
  CAPTURE: { label: 'Payment captured', credit: false },
  PAYOUT_DEBIT: { label: 'Agency payout', credit: false },
  ADJUSTMENT: { label: 'Adjustment', credit: true },
};

export function WalletContainer() {
  const name = useAuthStore((s) => s.user?.name) ?? 'Your account';
  const { wallet, transactions, loading, error, refresh, topUp } = useWallet();

  const [showTopup, setShowTopup] = useState(false);

  // Deep-link from the command palette ("Top up wallet") opens the form directly.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('topup') === '1') setShowTopup(true);
  }, []);

  async function onTopUp(values: { amount: string }, helpers: FormikHelpers<{ amount: string }>) {
    const ok = await topUp(Number(values.amount));
    if (ok) {
      helpers.resetForm();
      setShowTopup(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        variant="plain"
        eyebrow="Wallet"
        eyebrowIcon={WalletIcon}
        title="Wallet"
        subtitle="Manage your funds and view transaction history."
        actions={
          <button
            onClick={() => setShowTopup((v) => !v)}
            className="inline-flex items-center justify-center gap-2 bg-brand text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-brand-dark transition-colors"
          >
            <Plus aria-hidden="true" className="w-4 h-4" /> Top up balance
          </button>
        }
      />

      {showTopup && (
        <Formik initialValues={{ amount: '' }} validationSchema={topupSchema} onSubmit={onTopUp}>
          {({ isSubmitting }) => (
            <Form noValidate className="bg-card rounded-2xl border border-line shadow-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start gap-4 animate-fade-in">
              <div className="flex-1">
                <TextField
                  name="amount"
                  type="number"
                  label="Amount (₦)"
                  placeholder="50000"
                  icon={Banknote}
                  inputMode="numeric"
                  id="topup-amount"
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="auth-btn sm:w-auto sm:px-6">
                {isSubmitting ? 'Starting…' : 'Continue to payment'}
              </button>
            </Form>
          )}
        </Formik>
      )}

      {error ? (
        <div className="bg-card rounded-2xl border border-line shadow-card p-8 text-center">
          <AlertTriangle aria-hidden="true" className="w-8 h-8 text-amber mx-auto mb-3" />
          <p className="text-sm text-ink-2">{error}</p>
          <button onClick={refresh} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline">
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gradient-to-br from-navy-light to-navy text-white rounded-2xl p-6 sm:p-8">
              <div className="text-[11px] uppercase tracking-wide font-medium text-white/50 mb-2">Available balance</div>
              <div className="text-3xl sm:text-4xl font-bold mb-6">
                {loading ? <span className="inline-block w-40 h-9 rounded bg-white/10 animate-pulse" /> : fmtNaira(wallet?.availableBalance ?? 0)}
              </div>

              <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-6">
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-white/40 mb-1">Account name</dt>
                  <dd className="text-sm font-medium text-white/90">{name}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-white/40 mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Locked</dt>
                  <dd className="text-sm font-medium text-white/90">{fmtNaira(wallet?.lockedBalance ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-white/40 mb-1">Total balance</dt>
                  <dd className="text-sm font-medium text-white/90">{fmtNaira(wallet?.balance ?? 0)}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-card rounded-2xl border border-line shadow-card p-6 flex flex-col justify-center items-center text-center gap-3">
              <div aria-hidden="true" className="w-12 h-12 rounded-xl bg-green-soft text-green flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-ink text-sm">Zero risk</h3>
              <p className="text-xs text-ink-3 leading-relaxed">
                Funds are only locked when you approve a quotation, and captured when ticketing is finalized.
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">Transaction history</h2>
              {transactions.length > 0 && (
                <button
                  onClick={() =>
                    downloadCsv(
                      csvFilename('wallet-transactions'),
                      ['Date', 'Type', 'Reference', 'Amount', 'Balance after'],
                      transactions.map((t) => [
                        t.createdAt,
                        TXN_META[t.type]?.label ?? t.type,
                        t.reference ?? (t.requestId ? `Request ${t.requestId.slice(0, 8)}` : ''),
                        t.amount,
                        t.balanceAfter,
                      ]),
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 border border-line rounded-lg px-3.5 py-2 hover:bg-surface hover:text-ink transition-colors"
                >
                  <Download aria-hidden="true" className="w-4 h-4" /> Export CSV
                </button>
              )}
            </div>

            <DataTable<WalletTransactionView>
              data={transactions}
              rowKey={(t) => t.id}
              minWidth={560}
              loading={loading}
              loadingLabel="Loading transactions…"
              emptyIcon={Receipt}
              empty="No transactions yet."
              columns={[
                {
                  header: 'Date & time',
                  cell: (t) => <span className="text-sm text-ink-2 whitespace-nowrap">{fmtDateTime(t.createdAt)}</span>,
                },
                {
                  header: 'Description',
                  cell: (t) => {
                    const meta = TXN_META[t.type] ?? { label: t.type, credit: t.amount >= 0 };
                    const note = t.reference || (t.requestId ? `Request ${t.requestId.slice(0, 8)}` : '');
                    return (
                      <div>
                        <div className="text-sm font-medium text-ink">{meta.label}</div>
                        {note && <div className="text-xs text-ink-3 mt-0.5">{note}</div>}
                      </div>
                    );
                  },
                },
                {
                  header: 'Balance after',
                  align: 'right',
                  cell: (t) => <span className="text-sm text-ink-2 tabular-nums">{fmtNaira(t.balanceAfter)}</span>,
                },
                {
                  header: 'Amount',
                  align: 'right',
                  cell: (t) => {
                    const meta = TXN_META[t.type] ?? { label: t.type, credit: t.amount >= 0 };
                    return (
                      <span className={`text-sm font-semibold tabular-nums ${meta.credit ? 'text-green-dark' : 'text-red'}`}>
                        {meta.credit ? '+' : '−'}
                        {fmtNaira(Math.abs(t.amount))}
                      </span>
                    );
                  },
                },
              ]}
            />
          </section>
        </>
      )}
    </div>
  );
}

