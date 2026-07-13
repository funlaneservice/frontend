import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Credentials, PublicUser, RegisterPayload, Role } from '@/interface';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi, settingsApi, ApiError } from '@/api';
import { homePathFor, loginPathFor, toAuthUser } from '@/services/auth.service';
import { flagNeedsPhone } from '@/lib/needsPhone';
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

  async function signIn(creds: Credentials): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const { user: publicUser, token } = await authApi.login({
        email: creds.email.trim(),
        password: creds.password,
      });
      const authUser = toAuthUser(publicUser);
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
   * Exchange a Google ID token (the `credential` JWT from Google Identity
   * Services) for an app session. Mirrors `signIn`'s success path, then
   * best-effort checks whether the resulting profile has a phone on file —
   * Google never provides one — and flags it so a completion prompt can show.
   * Returns `unavailable: true` on a 503 so the caller can hide the button.
   */
  async function signInWithGoogle(idToken: string): Promise<{ ok: boolean; unavailable?: boolean }> {
    setLoading(true);
    setError(null);
    try {
      const { user: publicUser, token } = await authApi.googleLogin({ idToken });
      const authUser = toAuthUser(publicUser);
      login(authUser, token);

      try {
        const profile = await settingsApi.getMyProfile();
        if (!profile.phone) flagNeedsPhone();
      } catch {
        // Best-effort only — if this check fails the phone prompt simply won't show.
      }

      router.replace(consumeNext() ?? homePathFor(authUser.role));
      return { ok: true };
    } catch (err) {
      const e = err as ApiError;
      if (e instanceof ApiError && e.status === 503) {
        toast.error(e.message || 'Google sign-in is temporarily unavailable. Please use your email and password.');
        return { ok: false, unavailable: true };
      }
      if (e instanceof ApiError && e.status === 400) {
        toast.error(e.message || "Couldn't sign in with this Google account.");
        return { ok: false };
      }
      if (e instanceof ApiError && e.status === 401) {
        toast.error(e.message || 'Your Google sign-in could not be verified. Please try again.');
        return { ok: false };
      }
      if (e instanceof ApiError && e.status === 403) {
        toast.error(e.message || 'This account is suspended.');
        return { ok: false };
      }
      toast.error(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
      return { ok: false };
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
    signInWithGoogle,
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
