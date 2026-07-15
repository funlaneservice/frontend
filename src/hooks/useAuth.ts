import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Credentials, PublicUser, RegisterPayload, Role } from '@/interface';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi, settingsApi, ApiError } from '@/api';
import { homePathFor, loginPathFor, toAuthUser } from '@/services/auth.service';
import { flagNeedsPhone } from '@/lib/needsPhone';
import { setToken } from '@/lib/token';
import { toast } from 'react-toastify'

/** Staff portals with dedicated login endpoints. */
export type StaffPortal = 'admin' | 'agent';

/**
 * Reads and clears a stashed post-login destination (e.g. a `/requests/{id}`
 * deep link the visitor hit while signed out). Only internal paths are honored.
 */
function consumeNext(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const next = sessionStorage.getItem('funlane-next');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      sessionStorage.removeItem('funlane-next');
      return next;
    }
  } catch {
    /* ignore storage failures */
  }
  return null;
}

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * The /login screen is the CLIENT portal only. Staff accounts must use
   * their own portals (dedicated endpoints + role checks). Returns `true`
   * when the account may proceed; otherwise toasts and redirects the user
   * to their correct login screen. Callers translate `false` into their own
   * failure shape (`false` or `{ ok: false }`).
   */
  function gateClientPortal(role: Role): boolean {
    if (role === 'client') return true;
    toast.error(`This is the client sign-in. Please use the ${role} portal to sign in.`);
    router.push(loginPathFor(role));
    return false;
  }

  async function signIn(creds: Credentials): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const { user: publicUser, token } = await authApi.login({
        email: creds.email.trim(),
        password: creds.password,
      });
      const authUser = toAuthUser(publicUser);

      if (!gateClientPortal(authUser.role)) return false;

      login(authUser, token);
      router.replace(consumeNext() ?? homePathFor(authUser.role));
      return true;
    } catch (err) {
      const e = err as ApiError;
      // 403 = account exists but email isn't verified yet. Send them to the
      // verification screen pre-filled so they can finish or resend.
      if (e instanceof ApiError && e.status === 403) {
        router.push(`/verify?email=${encodeURIComponent(creds.email.trim())}`);
        return false;
      }
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Finishes the redirect-based Google OAuth flow. The backend owns the whole
   * dance and hands back a JWT via `/auth/google/callback?token=`; this stores
   * it exactly like a password login (same store, same bearer header), then
   * best-effort checks whether the profile has a phone on file — Google never
   * provides one — flagging it so a completion prompt can show.
   */
  async function completeGoogleSignIn(token: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      // getCurrentUser() reads the bearer token via auth: true, so it must be
      // stored before we call it. `login()` below re-sets it via the store.
      setToken(token);
      const publicUser = await authApi.getCurrentUser();
      const authUser = toAuthUser(publicUser);

      // Same role gate as the password path — Google sign-in is client-only.
      if (!gateClientPortal(authUser.role)) return false;

      login(authUser, token);

      try {
        const profile = await settingsApi.getMyProfile();
        if (!profile.phone) flagNeedsPhone();
      } catch {
        // Best-effort only — if this check fails the phone prompt simply won't show.
      }

      router.replace(consumeNext() ?? homePathFor(authUser.role));
      return true;
    } catch (err) {
      const e = err as ApiError;
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong finishing Google sign-in. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Authenticate against a staff portal (admin/agent). These hit dedicated
   * endpoints that reject the wrong role with a 403; the backend message is
   * surfaced as a toast. Admins and agents both operate the agency dashboard.
   */
  async function signInStaff(
    portal: StaffPortal,
    creds: { email: string; password: string },
  ): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const payload = { email: creds.email.trim(), password: creds.password };
      let publicUser: PublicUser;
      let token: string;
      if (portal === 'admin') {
        const res = await authApi.adminLogin(payload);
        publicUser = res.admin;
        token = res.token;
      } else {
        const res = await authApi.agentLogin(payload);
        publicUser = res.agent;
        token = res.token;
      }
      const authUser = toAuthUser(publicUser);

      // Defense in depth: the endpoints are documented to 403 the wrong role,
      // but never trust that alone — verify the returned role matches the
      // portal before storing a session.
      if (authUser.role !== portal) {
        toast.error(
          `This is the ${portal} sign-in. Please use the ${authUser.role} portal to sign in.`,
        );
        router.push(loginPathFor(authUser.role));
        return false;
      }

      login(authUser, token);
      router.replace(consumeNext() ?? homePathFor(authUser.role));
      return true;
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        e instanceof ApiError ? e.message : 'Something went wrong. Please try again.',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Bootstrap the first admin account. On success the backend returns a token,
   * so we sign the new admin straight in and land them on the console. Returns
   * `true` on success; surfaces the backend message (e.g. "An admin account
   * already exists") as a toast otherwise.
   */
  async function registerAdmin(payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.bootstrapAdmin({
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        password: payload.password,
      });
      const authUser = toAuthUser(res.admin);
      login(authUser, res.token);
      toast.success('Login successfully.');
      router.replace(homePathFor(authUser.role));
      return true;
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        e instanceof ApiError ? e.message : 'Could not create the admin account. Please try again.',
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    const role = user?.role;

    logout();

    router.replace(loginPathFor(role));
  }

  function requireRole(role: Role): boolean {
    return user?.role === role;
  }

  /** Create a new account. Resolves to the API message; throws `ApiError`. */
  async function register(payload: RegisterPayload) {
    const response = await authApi.register(payload);

    toast.success(
      response.message ?? 'Account created successfully.'
    );

    return response;
  }

  /** Confirm an account with the emailed token. Throws `ApiError` on failure. */
  async function verifyEmail(token: string) {
    const response = await authApi.verifyEmail(token);

    toast.success(
      response.message ?? 'Email verified successfully.'
    );

    return response;
  }

  async function resendVerification(email: string) {
    const response = await authApi.resendVerification(email);

    toast.success(
      response.message ?? 'Verification email sent.'
    );

    return response;
  }

  async function forgotPassword(email: string) {
    const response = await authApi.forgotPassword(email);

    toast.success(
      response.message ?? 'Password reset email sent.'
    );

    return response;
  }

  async function resetPassword(token: string, newPassword: string) {
    const response = await authApi.resetPassword(token, newPassword);

    toast.success(
      response.message ?? 'Password reset successful.'
    );
    return authApi.resetPassword(token, newPassword);
  }

  return {
    user,
    loading,
    error,
    signIn,
    completeGoogleSignIn,
    signInStaff,
    registerAdmin,
    signOut,
    requireRole,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
  };
}
