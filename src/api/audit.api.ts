import type { Pagination } from '@/interface';
import { apiFetch } from './client';

/**
 * Security audit log (`GET /admin/audit-logs`, ADMIN only). Covers auth events
 * (login/register/password reset/email verification) and admin/user-management
 * actions, each with actor, status and source IP/user-agent.
 *
 * The wire field names are normalized here so the UI has one stable shape even
 * if the backend evolves (e.g. `ip` vs `ipAddress`, `createdAt` vs `timestamp`).
 */

export interface AuditLogEntry {
  id: string;
  action: string;
  status: string;
  actor: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  logs: AuditLogEntry[];
  pagination: Pagination | null;
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  search?: string;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);

function normalizeEntry(raw: Record<string, unknown>, index: number): AuditLogEntry {
  const actorObj = (raw.actor && typeof raw.actor === 'object' ? raw.actor : null) as Record<string, unknown> | null;
  return {
    id: str(raw.id) ?? `audit-${index}`,
    action: str(raw.action) ?? str(raw.event) ?? 'UNKNOWN',
    status: str(raw.status) ?? str(raw.outcome) ?? 'UNKNOWN',
    actor:
      str(raw.actorEmail) ??
      str(raw.actorName) ??
      str(actorObj?.email) ??
      str(actorObj?.name) ??
      str(typeof raw.actor === 'string' ? raw.actor : null) ??
      str(raw.actorId) ??
      'System',
    ip: str(raw.ip) ?? str(raw.ipAddress) ?? str(raw.sourceIp),
    userAgent: str(raw.userAgent) ?? str(raw.sourceUserAgent),
    createdAt: str(raw.createdAt) ?? str(raw.timestamp) ?? new Date(0).toISOString(),
  };
}

export async function listAuditLogs(params: ListAuditLogsParams = {}): Promise<AuditLogPage> {
  const res = await apiFetch<Record<string, unknown>>('/admin/audit-logs', {
    auth: true,
    query: { page: params.page, limit: params.limit, search: params.search },
  });

  const rawList = (res.logs ?? res.auditLogs ?? res.items ?? res.data ?? []) as Record<string, unknown>[];
  return {
    logs: Array.isArray(rawList) ? rawList.map(normalizeEntry) : [],
    pagination: (res.pagination as Pagination | undefined) ?? null,
  };
}
