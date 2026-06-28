'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import { StatusBadge } from './ui/StatusBadge';
import { fmtDate } from '@/utils/format';
import { passengerSummary, routeText } from '@/utils/request.utils';
import type { RequestVM } from '@/services/requestView';

interface RequestTableProps {
  requests: RequestVM[];
  hrefFor: (id: string) => string;
  /** Show an assignment column (agent views). */
  showAssignment?: boolean;
}

const th = 'px-5 py-3.5 text-[11px] uppercase font-semibold text-ink-3 tracking-wide whitespace-nowrap';

export function RequestTable({ requests, hrefFor, showAssignment = false }: RequestTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-line bg-surface">
            <th className={th}>Reference</th>
            <th className={th}>Route</th>
            <th className={th}>Travelers</th>
            <th className={th}>Date</th>
            <th className={th}>Status</th>
            {showAssignment && <th className={th}>Assignment</th>}
            <th className={`${th} text-right`}>View</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {requests.map((r) => (
            <tr key={r.id} className="hover:bg-surface/60 transition-colors group">
              <td className="px-5 py-4">
                <Link href={hrefFor(r.id)} className="inline-block">
                  <span className="text-[11px] font-semibold text-ink-2 uppercase tracking-wide bg-surface px-2 py-1 rounded-md border border-line group-hover:border-brand/40 group-hover:bg-brand-soft group-hover:text-brand transition-colors">
                    {r.ref}
                  </span>
                </Link>
              </td>
              <td className="px-5 py-4">
                <Link href={hrefFor(r.id)} className="block">
                  <div className="text-sm font-semibold text-ink group-hover:text-brand transition-colors">{routeText(r)}</div>
                  <div className="text-xs text-ink-3 mt-0.5">{r.tripType === 'round' ? 'Round trip' : 'One way'}</div>
                </Link>
              </td>
              <td className="px-5 py-4">
                <div className="text-sm text-ink-2">{passengerSummary(r)}</div>
              </td>
              <td className="px-5 py-4">
                <div className="text-sm text-ink-2">{fmtDate(r.departureDate)}</div>
                {r.preferredTime && <div className="text-xs text-ink-3 capitalize">{r.preferredTime}</div>}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={r.status} />
              </td>
              {showAssignment && (
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium ${r.assignedAgentId ? 'text-ink-2' : 'text-amber-dark'}`}>
                    {r.assignedAgentId ? 'Claimed' : 'Unassigned'}
                  </span>
                </td>
              )}
              <td className="px-5 py-4">
                <div className="flex justify-end">
                  <Link
                    href={hrefFor(r.id)}
                    title="View request"
                    aria-label={`View request ${r.ref}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-brand hover:bg-brand-soft transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
