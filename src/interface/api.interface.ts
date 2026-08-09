/**
 * Wire shapes returned by the live Funlane backend (`/api/*`), mirroring the
 * OpenAPI schema exactly. These are mapped onto the app's own view-models by
 * the services layer. Monetary amounts are whole Naira integers.
 */
import type { BackendRole } from './auth.interface';

/* ----------------------------- Pagination ----------------------------- */

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ------------------------------- Requests ------------------------------ */

export type ApiRequestStatus =
  | 'PENDING'
  | 'OPTIONS_SENT'
  | 'APPROVED_LOCKED'
  | 'ISSUED'
  | 'COMPLETED'
  | 'CANCELLED';

export type ApiBudgetTier = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export type ApiPayoutStatus = 'NOT_APPLICABLE' | 'PENDING' | 'SUCCESS' | 'FAILED';

export interface PassengerView {
  id: string;
  fullName: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  dateOfBirth: string;
}

export interface QuoteOptionView {
  id: string;
  label: string;
  airline: string;
  flightNumber?: string;
  price: number;
  departureTime: string;
  arrivalTime?: string;
  stops?: number;
  cabinClass?: ApiBudgetTier;
  baggageAllowance?: string;
  bookingReference?: string;
  details?: string;
  /** True on the option the client approved. */
  isSelected?: boolean;
  createdAt: string;
}

export interface TravelRequestView {
  id: string;
  status: ApiRequestStatus;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  budgetTier: ApiBudgetTier;
  preferredAirline?: string;
  preferredTime?: string;
  assignedAgentId: string | null;
  /** Id of the quote option the client approved (null before approval). */
  approvedOptionId?: string | null;
  rejectionReason: string | null;
  issuedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  payoutStatus: ApiPayoutStatus;
  ticketDownloadUrl: string | null;
  createdAt: string;
  passengers: PassengerView[];
  quoteOptions: QuoteOptionView[];
}

export interface RequestSummaryView {
  id: string;
  status: ApiRequestStatus;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  budgetTier: ApiBudgetTier;
  preferredAirline?: string;
  preferredTime?: string;
  assignedAgentId: string | null;
  passengerCount: number;
  createdAt: string;
}

export interface RequestResponse {
  request: TravelRequestView;
}

export interface RequestListResponse {
  requests: RequestSummaryView[];
  pagination: Pagination;
}

export interface QuoteOptionResponse {
  option: QuoteOptionView;
}

/** Passenger payload for the multipart `POST /requests` submission. */
export interface PassengerInput {
  fullName: string;
  passportNumber: string;
  passportExpiry: string;
  nationality: string;
  dateOfBirth: string;
}

export interface AddQuoteOptionPayload {
  label: string;
  airline: string;
  flightNumber: string;
  price: number;
  departureTime: string;
  arrivalTime: string;
  cabinClass: ApiBudgetTier;
  stops?: number;
  baggageAllowance?: string;
  bookingReference?: string;
  details?: string;
}

/* -------------------------------- Wallet ------------------------------- */

export type ApiTransactionType =
  | 'TOPUP'
  | 'LOCK'
  | 'CAPTURE'
  | 'RELEASE'
  | 'PAYOUT_DEBIT'
  | 'ADJUSTMENT';

export interface WalletView {
  balance: number;
  lockedBalance: number;
  availableBalance: number;
  updatedAt: string;
}

export interface WalletTransactionView {
  id: string;
  type: ApiTransactionType;
  amount: number;
  balanceAfter: number;
  lockedAfter: number;
  reference: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface WalletResponse {
  wallet: WalletView;
}

export interface TransactionListResponse {
  transactions: WalletTransactionView[];
  pagination: Pagination;
}

/* ----------------------------- Admin / Users --------------------------- */

export type ApiUserStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminUserView {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: BackendRole;
  status: ApiUserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface ListUsersResponse {
  users: AdminUserView[];
  pagination: Pagination;
}

export interface UserResponse {
  user: AdminUserView;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: BackendRole;
  status?: ApiUserStatus;
  search?: string;
}
