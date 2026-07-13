'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleSignInButtonProps {
  /** Matches Google's own button copy for sign-in vs sign-up screens. */
  text: 'signin_with' | 'signup_with';
  /** Forwards the ID token (JWT) to the backend; returns `unavailable` on a 503. */
  onCredential: (idToken: string) => Promise<{ ok: boolean; unavailable?: boolean } | void>;
}

/**
 * Renders Google's own "Sign in with Google" button via Google Identity
 * Services. The backend does all account creation/login logic — this
 * component's only job is to obtain the ID token and hand it off.
 */
export function GoogleSignInButton({ text, onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!scriptReady || !CLIENT_ID || unavailable) return;
    const container = containerRef.current;
    if (!container || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: async (response) => {
        const result = await onCredential(response.credential);
        if (result?.unavailable) setUnavailable(true);
      },
    });

    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text,
      width: container.offsetWidth || 320,
    });
  }, [scriptReady, unavailable, text, onCredential]);

  if (!CLIENT_ID || unavailable) {
    return (
      <p className="text-center text-xs text-ink-3">
        {unavailable
          ? 'Google sign-in is temporarily unavailable — please use your email and password.'
          : 'Google sign-in is not configured yet.'}
      </p>
    );
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={containerRef} className="w-full flex justify-center" />
    </>
  );
}
