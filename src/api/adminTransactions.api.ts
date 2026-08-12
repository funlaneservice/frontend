import type { Pagination } from '@/interface';
import { apiFetch } from './client';

export interface AdminTransactionUser {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
}

export interface AdminTransactionRequestRef {
  id: string;
  status: string | null;
  origin: string | null;
  destination: string | null;
  payoutStatus: string | null;
}

export interface AdminTransactionEntry {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number | null;
  lockedAfter: number | null;
  reference: string | null;
  metadata: Record<string, unknown> | null;
  user: AdminTransactionUser | null;
  request: AdminTransactionRequestRef | null;
  createdAt: string;
}

export interface PaymentAttemptEntry {
  id: string;
  eventId: string | null;
  eventType: string | null;
  processingStatus: string;
  processingError: string | null;
  reference: string | null;
  amount: number | null;
  fees: number | null;
  currency: string | null;
  channel: string | null;
  gatewayStatus: string | null;
  gatewayResponse: string | null;
  email: string | null;
  userId: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  bank: string | null;
  isTest: boolean;
  paidAt: string | null;
  createdAt: string;
  processedAt: string | null;
  payload: Record<string, unknown> | null;
}

export interface AdminTransactionsPage {
  transactions: AdminTransactionEntry[];
  pagination: Pagination | null;
}

export interface PaymentAttemptsPage {
  attempts: PaymentAttemptEntry[];
  pagination: Pagination | null;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

function normalizeTxnUser(raw: Record<string, unknown>): AdminTransactionUser | null {
  const userObj = obj(raw.user);
  const id = str(userObj?.id) ?? str(raw.userId) ?? str(raw.user_id);
  if (!id) return null;
  return {
    id,
    email: str(userObj?.email) ?? str(raw.userEmail),
    name: str(userObj?.name) ?? str(userObj?.fullName) ?? str(raw.userName),
    role: str(userObj?.role),
  };
}


function normalizeTxnRequest(raw: Record<string, unknown>): AdminTransactionRequestRef | null {
  const reqObj = obj(raw.request);
  const id = str(reqObj?.id) ?? str(raw.requestId) ?? str(raw.request_id);
  if (!id) return null;
  return {
    id,
    status: str(reqObj?.status),
    origin: str(reqObj?.origin),
    destination: str(reqObj?.destination),
    payoutStatus: str(reqObj?.payoutStatus),
  };
}

function normalizeTransaction(raw: Record<string, unknown>, index: number): AdminTransactionEntry {
  return {
    id: str(raw.id) ?? `txn-${index}`,
    type: str(raw.type) ?? str(raw.transactionType) ?? 'UNKNOWN',
    amount: num(raw.amount) ?? 0,
    balanceAfter: num(raw.balanceAfter) ?? num(raw.balance_after),
    lockedAfter: num(raw.lockedAfter) ?? num(raw.locked_after),
    reference: str(raw.reference) ?? str(raw.ref),
    metadata: obj(raw.metadata),
    user: normalizeTxnUser(raw),
    request: normalizeTxnRequest(raw),
    createdAt: str(raw.createdAt) ?? str(raw.timestamp) ?? new Date(0).toISOString(),
  };
}

function toNaira(kobo: unknown): number | null {
  const n = num(kobo);
  return n === null ? null : n / 100;
}

function normalizeAttempt(raw: Record<string, unknown>, index: number): PaymentAttemptEntry {
  const payload = obj(raw.payload) ?? obj(raw.rawPayload) ?? obj(raw.data);
  const customer = obj(payload?.customer);
  const metadata = obj(payload?.metadata);
  const authorization = obj(payload?.authorization);

  return {
    id: str(raw.id) ?? `attempt-${index}`,
    eventId: str(raw.eventId) ?? str(raw.event_id),
    eventType: str(raw.eventType) ?? str(raw.event_type) ?? str(raw.event),
    processingStatus: str(raw.status) ?? 'UNKNOWN',
    processingError: str(raw.error),
    reference: str(payload?.reference) ?? str(raw.reference) ?? str(raw.ref),
    amount: toNaira(payload?.amount) ?? num(raw.amount),
    fees: toNaira(payload?.fees),
    currency: str(payload?.currency),
    channel: str(payload?.channel) ?? str(raw.channel),
    gatewayStatus: str(payload?.status),
    gatewayResponse: str(payload?.gateway_response),
    email: str(customer?.email) ?? str(raw.email),
    userId: str(metadata?.userId) ?? str(metadata?.user_id) ?? str(raw.userId) ?? str(raw.user_id),
    cardBrand: str(authorization?.brand),
    cardLast4: str(authorization?.last4),
    bank: str(authorization?.bank),
    isTest: str(payload?.domain) === 'test',
    paidAt: str(payload?.paidAt) ?? str(payload?.paid_at),
    createdAt: str(raw.createdAt) ?? str(raw.timestamp) ?? new Date(0).toISOString(),
    processedAt: str(raw.processedAt),
    payload,
  };
}

export async function listTransactions(params: ListParams = {}): Promise<AdminTransactionsPage> {
  const res = await apiFetch<Record<string, unknown>>('/admin/transactions', {
    auth: true,
    query: { page: params.page, limit: params.limit, search: params.search },
  });
  const rawList = (res.transactions ?? res.ledger ?? res.items ?? res.data ?? []) as Record<string, unknown>[];
  return {
    transactions: Array.isArray(rawList) ? rawList.map(normalizeTransaction) : [],
    pagination: obj(res.pagination) as Pagination | null,
  };
}

export async function getTransaction(id: string): Promise<AdminTransactionEntry | null> {
  const res = await apiFetch<Record<string, unknown>>(`/admin/transactions/${id}`, { auth: true });
  const raw = obj(res.transaction) ?? obj(res.data) ?? res;
  return raw ? normalizeTransaction(raw, 0) : null;
}

export async function listPaymentAttempts(params: ListParams = {}): Promise<PaymentAttemptsPage> {
  const res = await apiFetch<Record<string, unknown>>('/admin/transactions/payment-attempts', {
    auth: true,
    query: { page: params.page, limit: params.limit, search: params.search },
  });
  const rawList = (res.paymentAttempts ?? res.attempts ?? res.items ?? res.data ?? []) as Record<string, unknown>[];
  return {
    attempts: Array.isArray(rawList) ? rawList.map(normalizeAttempt) : [],
    pagination: obj(res.pagination) as Pagination | null,
  };
}

export async function getPaymentAttempt(id: string): Promise<PaymentAttemptEntry | null> {
  const res = await apiFetch<Record<string, unknown>>(`/admin/transactions/payment-attempts/${id}`, { auth: true });
  const raw = obj(res.paymentAttempt) ?? obj(res.attempt) ?? obj(res.data) ?? res;
  return raw ? normalizeAttempt(raw, 0) : null;
}
