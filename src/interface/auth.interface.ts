/**
 * DTOs mirroring the Funlane backend auth contract (`/api/auth/*`).
 * These match the server's wire shapes exactly; the app's own `AuthUser`
 * (see user.interface) is a mapped, role-normalized projection of `PublicUser`.
 */

/** Roles as the backend reports them. */
export type BackendRole = 'CLIENT' | 'AGENT' | 'ADMIN';

/** The user object the backend returns from register / login / me. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: BackendRole;
}

/** POST /auth/register */
export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  user: PublicUser;
}

/** POST /auth/login */
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: PublicUser;
  token: string;
}

/**
 * Staff portals authenticate against dedicated endpoints that reject the wrong
 * role with a 403. The credential shape is identical to the client login; only
 * the response envelope key differs (`admin` vs `agent`).
 */
export interface StaffLoginPayload {
  email: string;
  password: string;
}

/** POST /admin/auth/login */
export interface AdminLoginResponse {
  admin: PublicUser;
  token: string;
}

/** POST /agent/auth/login */
export interface AgentLoginResponse {
  agent: PublicUser;
  token: string;
}

/** POST /admin/auth/bootstrap — create the first admin (public, one-time). */
export interface BootstrapAdminPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface BootstrapAdminResponse {
  admin: PublicUser;
  token: string;
}

/** POST /admin/admins — an authenticated admin creates another admin. */
export interface CreateAdminPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface CreateAdminResponse {
  admin: PublicUser;
}

/** POST /admin/agents — an authenticated admin onboards (and invites) an agent. */
export interface CreateAgentPayload {
  name: string;
  email: string;
  phone: string;
}

export interface CreateAgentResponse {
  agent: PublicUser;
}

/** Generic `{ message }` envelope returned by verify/resend/forgot/reset. */
export interface MessageResponse {
  message: string;
  statusCode: number;
  role: BackendRole;
}
