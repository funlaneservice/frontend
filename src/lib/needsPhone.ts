/**
 * Google sign-in never collects a phone number, but the app needs one for
 * phone-dependent actions (e.g. submitting a travel request). This flag is set
 * right after a Google sign-in whose profile has no phone on file, and cleared
 * once the user completes it — see `CompletePhoneModal`.
 */
const KEY = 'funlane_needs_phone';

export function flagNeedsPhone(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(KEY, '1');
}

export function hasNeedsPhoneFlag(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(KEY) === '1';
}

export function clearNeedsPhoneFlag(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(KEY);
}
