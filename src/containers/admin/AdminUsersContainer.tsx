'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUsers } from '@/hooks/useUsers';
import { usersApi } from '@/api';
import { fmtDateTime } from '@/utils/format';
import { downloadCsv, csvFilename } from '@/utils/csv';
import { toast } from 'react-toastify';
import { Button, ConfirmDialog, Spinner, PageHeader, DataTable, Pagination } from '@/components/ui';
import type { AdminUserView, BackendRole, ApiUserStatus } from '@/interface';
import {
  Search, RefreshCw, Ban, RotateCcw, Trash2, Users as UsersIcon,
  ShieldCheck, UserCog, UserRound, Eye, Download,
} from 'lucide-react';

const ROLE_BADGE: Record<BackendRole, string> = {
  ADMIN: 'bg-surface text-ink border border-line',
  AGENT: 'bg-blue-soft text-blue',
  CLIENT: 'bg-green-soft text-green-dark',
};

/** Avatar ring/text color per role so the directory reads at a glance. */
const ROLE_AVATAR: Record<BackendRole, string> = {
  ADMIN: 'bg-ink text-card',
  AGENT: 'bg-blue text-white',
  CLIENT: 'bg-green text-white',
};

type RoleTab = '' | BackendRole;
const ROLE_TABS: { value: RoleTab; label: string; icon: typeof UsersIcon }[] = [
  { value: '', label: 'Everyone', icon: UsersIcon },
  { value: 'CLIENT', label: 'Clients', icon: UserRound },
  { value: 'AGENT', label: 'Agents', icon: UserCog },
  { value: 'ADMIN', label: 'Admins', icon: ShieldCheck },
];

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';

export function AdminUsersContainer() {
  const { users, pagination, loading, error, params, setParams, refresh, suspend, reactivate, changeRole, remove } = useUsers();
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<{ type: 'delete' | 'suspend'; user: AdminUserView } | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  /** Client-side CSV export of every user matching the current filters. */
  async function exportUsers() {
    setExporting(true);
    try {
      const all: AdminUserView[] = [];
      for (let page = 1; page <= 50; page++) {
        const res = await usersApi.listUsers({ ...params, page, limit: 100 });
        all.push(...res.users);
        if (page >= res.pagination.totalPages || res.users.length === 0) break;
      }
      if (!all.length) {
        toast.info('No users match the current filters.');
        return;
      }
      downloadCsv(
        csvFilename('users'),
        ['Name', 'Email', 'Phone', 'Role', 'Status', 'Email verified', 'Joined'],
        all.map((u) => [u.name, u.email, u.phone, u.role, u.status, u.emailVerifiedAt ?? 'No', u.createdAt]),
      );
      toast.success(`Exported ${all.length} user${all.length === 1 ? '' : 's'}.`);
    } catch {
      toast.error('Could not export users. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  // Live search: debounce keystrokes and push into the query params. No submit
  // needed — results refresh ~350ms after the user stops typing.
  useEffect(() => {
    const next = search.trim() || undefined;
    if (next === params.search) return;
    const t = setTimeout(() => setParams((p) => ({ ...p, page: 1, search: next })), 350);
    return () => clearTimeout(t);
  }, [search, params.search, setParams]);

  const activeCount = useMemo(() => users.filter((u) => u.status === 'ACTIVE').length, [users]);

  function setRoleFilter(role: RoleTab) {
    setParams({ ...params, page: 1, role: (role || undefined) as BackendRole | undefined });
  }
  function setStatusFilter(status: string) {
    setParams({ ...params, page: 1, status: (status || undefined) as ApiUserStatus | undefined });
  }
  function goPage(page: number) {
    setParams({ ...params, page });
  }
  function changeLimit(limit: number) {
  setParams({
    ...params,
    page: 1,
    limit,
  });
}

  async function onConfirm() {
    if (!pending) return;
    setBusy(true);
    if (pending.type === 'delete') {
      const ok = await remove(pending.user.id);
      setBusy(false);
      if (ok) setPending(null);
    } else {
      await suspend(pending.user.id);
      setBusy(false);
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="User directory"
        eyebrowIcon={UsersIcon}
        title="Manage accounts"
        subtitle="Search, filter and manage every account on the platform."
        actions={
          <>
            <div>
              <div className="text-3xl font-bold leading-none">{pagination?.total ?? '—'}</div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 mt-1">Total accounts</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-white/15" />
            <div className="hidden sm:block">
              <div className="text-3xl font-bold leading-none text-green-soft">{activeCount}</div>
              <div className="text-[11px] uppercase tracking-wide text-white/50 mt-1">Active here</div>
            </div>
            <Button
              variant="outline"
              color="ink"
              leftIcon={RefreshCw}
              onClick={refresh}
              className="!border-white/25 !text-white hover:!bg-white/10 self-start"
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* Role tabs — single scrollable row on mobile, wraps on desktop */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mb-1 sm:flex-wrap sm:overflow-x-visible sm:pb-0 sm:mb-0">
        {ROLE_TABS.map((t) => {
          const active = (params.role ?? '') === t.value;
          return (
            <button
              key={t.value || 'all'}
              onClick={() => setRoleFilter(t.value)}
              className={`shrink-0 whitespace-nowrap inline-flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-semibold border transition-colors ${
                active
                  ? 'bg-ink text-card border-ink shadow-sm'
                  : 'bg-card text-ink-2 border-line hover:border-ink/30 hover:text-ink'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="auth-field"
            aria-label="Search users"
          />
          {/* Inline spinner while a search/filter request is in flight */}
          {loading && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Spinner size="sm" className="text-brand" />
            </span>
          )}
        </div>
        <select
          value={params.status ?? ''}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-12 px-4 bg-card border border-line rounded-lg text-sm text-ink shadow-sm focus:outline-none focus:border-sky-400"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <Button variant="outline" color="ink" size="lg" leftIcon={Download} loading={exporting} onClick={exportUsers} className="self-start md:self-auto">
          Export CSV
        </Button>
      </div>

      <DataTable<AdminUserView>
        data={users}
        rowKey={(u) => u.id}
        minWidth={720}
        loading={loading}
        loadingLabel="Loading users…"
        error={error}
        onRetry={refresh}
        emptyIcon={UsersIcon}
        empty={
          <>
            No users match your filters.
            <span className="block text-xs text-ink-3 mt-1 font-normal">Try a different search term or clear the filters.</span>
          </>
        }
        columns={[
          {
            header: 'User',
            cell: (u) => (
              <div className="flex items-center gap-3">
                <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${ROLE_AVATAR[u.role]}`}>
                  {initials(u.name)}
                </div>
                <div>
                  <Link href={`/admin/users/${u.id}`} className="text-sm font-medium text-ink hover:text-brand hover:underline transition-colors">
                    {u.name}
                  </Link>
                  <div className="text-xs text-ink-3">{u.email}</div>
                </div>
              </div>
            ),
          },
          {
            header: 'Role',
            cell: (u) => (
              <select
                value={u.role}
                onChange={(e) => changeRole(u.id, e.target.value as BackendRole)}
                className={`text-[11px] font-semibold px-2 py-1 rounded-md cursor-pointer ${ROLE_BADGE[u.role]}`}
                aria-label={`Change role for ${u.name}`}
              >
                <option value="CLIENT">CLIENT</option>
                <option value="AGENT">AGENT</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            ),
          },
          {
            header: 'Status',
            cell: (u) => (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded-md ${u.status === 'ACTIVE' ? 'bg-green-soft text-green-dark' : 'bg-red-soft text-red-dark'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-green' : 'bg-red'}`} />
                {u.status}
              </span>
            ),
          },
          {
            header: 'Joined',
            cell: (u) => <span className="text-sm text-ink-2 whitespace-nowrap">{fmtDateTime(u.createdAt)}</span>,
          },
          {
            header: 'Actions',
            align: 'right',
            cell: (u) => (
              <div className="flex items-center justify-end gap-1.5">
                <Link href={`/admin/users/${u.id}`} title="View" className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-brand hover:bg-brand-soft transition-colors">
                  <Eye className="w-4 h-4" />
                </Link>
                {u.status === 'ACTIVE' ? (
                  <button onClick={() => setPending({ type: 'suspend', user: u })} title="Suspend" className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-amber hover:bg-amber-soft transition-colors">
                    <Ban className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => reactivate(u.id)} title="Reactivate" className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-green-dark hover:bg-green-soft transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setPending({ type: 'delete', user: u })} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-red hover:bg-red-soft transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
      />

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          unit="user"
          limit={params.limit ?? pagination.limit}
          onLimitChange={changeLimit}
          onPageChange={goPage}
        />
      )}

      {/* Confirmation for destructive actions */}
      <ConfirmDialog
        open={!!pending}
        title={pending?.type === 'delete' ? 'Delete user' : 'Suspend user'}
        confirmLabel={pending?.type === 'delete' ? 'Yes, delete' : 'Yes, suspend'}
        cancelLabel="Cancel"
        loading={busy}
        message={
          pending?.type === 'delete' ? (
            <>
              Permanently delete <strong className="text-ink">{pending?.user.name}</strong>? This action cannot be undone
              and all of their data will be removed.
            </>
          ) : (
            <>
              Suspend <strong className="text-ink">{pending?.user.name}</strong>? They will be signed out and blocked
              from accessing the platform until reactivated.
            </>
          )
        }
        onConfirm={onConfirm}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
