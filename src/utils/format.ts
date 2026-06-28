/** Currency, date and id helpers — ported from the original data.js. */

export function fmtNaira(n: number): string {
  return '₦' + Number(n || 0).toLocaleString('en-NG');
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short' }) +
    ', ' +
    d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
  );
}

/**
 * Formats a quote option's departure time. Accepts an ISO datetime (what the
 * backend expects/returns) and renders it as a friendly date + time; falls
 * back to the raw value for any legacy free-text entries (e.g. "08:00").
 */
export function fmtDepartTime(v?: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function uid(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 8);
}
