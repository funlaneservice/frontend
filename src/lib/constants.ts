import type { RequestStatus, BudgetTierKey } from '@/interface';
import { Wallet, Lock, MapPin, Headphones, ShieldCheck, Ticket, PlaneTakeoff, Sparkles } from 'lucide-react';

/** localStorage key for the persisted portal dataset. */
export const STORE_KEY = 'funlane_portal_v1';
/** localStorage key for the persisted auth principal. */
export const AUTH_STORE_KEY = 'funlane_auth_v1';
/** localStorage key for the backend-issued JWT. */
export const AUTH_TOKEN_KEY = 'funlane_token_v1';
/** Non-HttpOnly cookie read by middleware for route authorization. */
export const AUTH_COOKIE = 'funlane_auth';

/**
 * Base URL of the Funlane backend API. Override per-environment with
 * `NEXT_PUBLIC_API_BASE_URL` (e.g. a local server); falls back to the
 * deployed Render instance. No trailing slash — paths are joined directly.
 */
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://backend-0u43.onrender.com/api'
).replace(/\/$/, '');

interface StatusMeta {
  key: RequestStatus;
  label: string;
  badge: string;
  col: string;
}

/* Pipeline statuses:
   pending  -> in agent queue (new or bounced-back from rejection)
   quoted   -> agent sent options, awaiting client review
   approved -> client approved, wallet funds LOCKED, ready to issue
   issued   -> ticket uploaded + completed, funds captured & agency paid */
export const STATUS: Record<RequestStatus, StatusMeta> = {
  pending: { key: 'pending', label: 'Pending', badge: 'badge-pending', col: 'New Requests' },
  quoted: { key: 'quoted', label: 'Options Sent', badge: 'badge-quoted', col: 'Quoted — Awaiting Client' },
  approved: { key: 'approved', label: 'Approved — Funds Locked', badge: 'badge-approved', col: 'Approved — Ready to Issue' },
  issued: { key: 'issued', label: 'Ticket Issued', badge: 'badge-issued', col: 'Completed' },
};

interface BudgetTier {
  key: BudgetTierKey;
  label: string;
  desc: string;
}

export const BUDGET_TIERS: BudgetTier[] = [
  { key: 'economy', label: 'Economy', desc: 'Lowest fare, flexible routing' },
  { key: 'standard', label: 'Standard', desc: 'Balance of price & timing' },
  { key: 'premium', label: 'Premium', desc: 'Premium / business, best times' },
];

export const AIRLINES = [
  'Air Peace',
  'Ibom Air',
  'Arik Air',
  'United Nigeria',
  'Green Africa',
  'Dana Air',
  'No preference',
];

export interface BoardColumn {
  status: RequestStatus;
  title: string;
  color: string;
}

export const BOARD_COLUMNS: BoardColumn[] = [
  { status: 'pending', title: 'New Requests', color: '#D97706' },
  { status: 'quoted', title: 'Quoted — Awaiting Client', color: '#7C3AED' },
  { status: 'approved', title: 'Approved — Ready to Issue', color: '#10B981' },
  { status: 'issued', title: 'Completed', color: '#0369A1' },
];

export const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Kano', 'London', 'Dubai', 'Accra', 'Johannesburg'];

export const STATS = [
  { value: '₦4.8b+', label: 'Travel secured' },
  { value: '12k+', label: 'Trips fulfilled' },
  { value: '< 2 hrs', label: 'Avg. quote time' },
  { value: '99.9%', label: 'Platform uptime' },
];

export const FEATURES = [
  // Note: never use `*-soft` tokens as dark-mode foregrounds — they flip to
  // dark backgrounds under `.dark`. The base tokens already flip light.
  { icon: Wallet, title: 'Pre-funded wallet', desc: 'Top up once and book freely. Funds stay yours until you approve a quote.', tint: 'bg-brand/10 text-brand dark:bg-brand/20' },
  { icon: Lock, title: 'Approve-to-lock', desc: 'Money is only locked on approval and captured at ticketing. Zero risk.', tint: 'bg-green/10 text-green-dark dark:bg-green/20 dark:text-green' },
  { icon: MapPin, title: 'Real-time tracking', desc: 'Follow every request from submission to issued ticket, live.', tint: 'bg-[#C5A059]/15 text-[#a07d35] dark:bg-[#C5A059]/20 dark:text-[#E5C185]' },
  { icon: Headphones, title: 'Dedicated agents', desc: 'A real agency team curates options and handles the heavy lifting.', tint: 'bg-[#7C3AED]/10 text-[#7C3AED] dark:bg-[#7C3AED]/20 dark:text-[#C4B5FD]' },
  { icon: ShieldCheck, title: 'NDPA-grade security', desc: 'Encrypted data and compliant handling of every passenger record.', tint: 'bg-blue/10 text-blue dark:bg-blue/20' },
  { icon: Ticket, title: 'Instant e-tickets', desc: 'Issued tickets land in your dashboard, ready to download.', tint: 'bg-brand/10 text-brand dark:bg-brand/20' },
];

export const STEPS = [
  { icon: PlaneTakeoff, title: 'Submit a request', desc: 'Tell us your route, dates and passengers in minutes.' },
  { icon: Sparkles, title: 'Get curated quotes', desc: 'Agents send tailored flight options to review.' },
  { icon: Lock, title: 'Approve & lock', desc: 'Pick an option — funds lock securely in your wallet.' },
  { icon: Ticket, title: 'Fly & auto-capture', desc: 'Your ticket is issued and funds captured. Done.' },
];

export const SECURITY_POINTS = [
  'Funds locked only on approval, captured only at issuance',
  'Cancel before issuance for an instant release',
  'Bank-grade encryption and NDPA-compliant data handling',
  'Payments processed securely through Paystack',
];

export const CLIENT_PERKS = ['Submit & track requests', 'One-tap quote approval', 'Pre-funded wallet & receipts'];
export const AGENT_PERKS = ['Shared request queue', 'Build & send quote options', 'Issue tickets & manage wallets'];

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Security', href: '#security' },
  { label: 'Portals', href: '#portals' },
];