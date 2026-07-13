import type {
  AdminLoginResponse,
  AgentLoginResponse,
  BootstrapAdminPayload,
  BootstrapAdminResponse,
  CreateAdminPayload,
  CreateAdminResponse,
  CreateAgentPayload,
  CreateAgentResponse,
  GoogleLoginPayload,
  LoginPayload,
  LoginResponse,
  MessageResponse,
  PublicUser,
  RegisterPayload,
  RegisterResponse,
  StaffLoginPayload,
} from '@/interface';
import { apiFetch } from './client';

/** POST /auth/register — create a client account; triggers a verification email. */
export function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>('/auth/register', { method: 'POST', body: payload });
}

/** POST /auth/login — exchange credentials for the user + JWT. */
export function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: payload });
}

/**
 * POST /auth/google — exchange a Google ID token for the user + app JWT.
 * First-time emails auto-create a CLIENT account; an email that already has a
 * password account is silently linked and logged in. Only ever CLIENT accounts.
 */
export function googleLogin(payload: GoogleLoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/google', { method: 'POST', body: payload });
}

/** POST /admin/auth/login — staff login; 403s accounts that aren't admins. */
export function adminLogin(payload: StaffLoginPayload): Promise<AdminLoginResponse> {
  return apiFetch<AdminLoginResponse>('/admin/auth/login', { method: 'POST', body: payload });
}

/** POST /agent/auth/login — staff login; 403s accounts that aren't agents. */
export function agentLogin(payload: StaffLoginPayload): Promise<AgentLoginResponse> {
  return apiFetch<AgentLoginResponse>('/agent/auth/login', { method: 'POST', body: payload });
}

/** POST /admin/auth/bootstrap — create the first admin account (public, one-time). */
export function bootstrapAdmin(payload: BootstrapAdminPayload): Promise<BootstrapAdminResponse> {
  return apiFetch<BootstrapAdminResponse>('/admin/auth/bootstrap', { method: 'POST', body: payload });
}

/** POST /admin/admins — create another admin (requires an admin bearer token). */
export function createAdmin(payload: CreateAdminPayload): Promise<CreateAdminResponse> {
  return apiFetch<CreateAdminResponse>('/admin/admins', { method: 'POST', body: payload, auth: true });
}

/** POST /admin/agents — onboard and invite a new agent (requires an admin token). */
export function createAgent(payload: CreateAgentPayload): Promise<CreateAgentResponse> {
  return apiFetch<CreateAgentResponse>('/admin/agents', { method: 'POST', body: payload, auth: true });
}

/** POST /auth/verify-email — activate an account with the emailed token. */
export function verifyEmail(token: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/auth/verify-email', { method: 'POST', body: { token } });
}

/** POST /auth/resend-verification — re-send the activation email. */
export function resendVerification(email: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/auth/resend-verification', { method: 'POST', body: { email } });
}

/** POST /auth/forgot-password — request a password-reset email. */
export function forgotPassword(email: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/auth/forgot-password', { method: 'POST', body: { email } });
}

/** POST /auth/reset-password — set a new password using the emailed token. */
export function resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
  });
}

/** GET /auth/me — the current user, resolved from the stored bearer token. */
export function getCurrentUser(): Promise<PublicUser> {
  return apiFetch<PublicUser>('/auth/me', { method: 'GET', auth: true });
}
