'use client';

import { useAgentQueue } from '@/hooks/useRequestsLive';
import { RequestTable } from '@/components/RequestTable';
import { EmptyState, Loader, PageHeader } from '@/components/ui';
import { ClipboardList, AlertTriangle, RefreshCw } from 'lucide-react';

export function AllRequestsContainer() {
  // Pool + claimed-by-me, merged — so a request stays visible after the agent claims it.
  const { items, loading, error, refresh } = useAgentQueue();

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        variant="plain"
        eyebrow="Pipeline"
        eyebrowIcon={ClipboardList}
        title="All requests"
        subtitle="The unclaimed pool plus every request assigned to you."
      />

      <div className="bg-white rounded-2xl border border-line shadow-card overflow-hidden">
        {error ? (
          <div className="p-8 text-center">
            <AlertTriangle aria-hidden="true" className="w-8 h-8 text-amber mx-auto mb-3" />
            <p className="text-sm text-ink-2">{error}</p>
            <button onClick={refresh} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline"><RefreshCw className="w-4 h-4" /> Try again</button>
          </div>
        ) : loading ? (
          <Loader label="Loading requests…" />
        ) : items.length ? (
          <RequestTable requests={items} hrefFor={(id) => `/agent/requests/${id}`} showAssignment />
        ) : (
          <EmptyState icon={ClipboardList}>No requests in the pipeline yet.</EmptyState>
        )}
      </div>
    </div>
  );
}
