'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';

/** Known `error` values the backend redirects with; anything else is generic. */
const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Google sign-in was interrupted. Please try again.',
  access_denied: 'You declined the Google sign-in request.',
  'Google sign-in is not configured': 'Google sign-in is temporarily unavailable. Please use your email and password.',
  'Invalid or expired Google authorization code': 'Your Google sign-in link expired or was already used. Please try again.',
  'Google account email is not verified': "Couldn't sign in with this Google account — its email isn't verified.",
  'This account has been suspended': 'This account has been suspended. Contact support for help.',
};

const GENERIC_ERROR = 'Something went wrong signing in with Google. Please try again.';

/**
 * Lands after the backend's full server-side Google OAuth redirect. It arrives
 * with `?token=` on success or `?error=` on failure — never both. The query
 * string is stripped immediately either way so a token never sits in history.
 */
export function GoogleCallbackContainer() {
  const { completeGoogleSignIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    window.history.replaceState({}, '', window.location.pathname);

    if (token) {
      completeGoogleSignIn(token).then((ok) => {
        if (!ok) setErrorMessage(GENERIC_ERROR);
      });
      return;
    }

    setErrorMessage(error ? (ERROR_MESSAGES[error] ?? GENERIC_ERROR) : GENERIC_ERROR);
    // Only ever run once, on mount — re-running would read an already-stripped query string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMessage) {
    return (
      <AuthLayout
        title="Streamlining Global Journeys."
        description="The gold standard in corporate travel and logistics. Your precision-engineered portal ensures every movement is managed with absolute transparency."
      >
        <div className="text-center">
          <div aria-hidden="true" className="w-14 h-14 rounded-full bg-red-soft text-red flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">Couldn&apos;t sign in with Google</h1>
          <p className="text-ink-3 text-sm mb-6 leading-relaxed">{errorMessage}</p>
          <Link href="/login" className="auth-btn">
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Streamlining Global Journeys."
      description="The gold standard in corporate travel and logistics. Your precision-engineered portal ensures every movement is managed with absolute transparency."
    >
      <div className="text-center py-8">
        <Loader2 aria-hidden="true" className="w-8 h-8 text-brand animate-spin mx-auto mb-4" />
        <p className="text-ink-2 text-sm">Finishing sign-in…</p>
      </div>
    </AuthLayout>
  );
}
