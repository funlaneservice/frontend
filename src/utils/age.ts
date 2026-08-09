/**
 * Age helpers for passenger records. Minors need extra handling before
 * issuance (an accompanying adult or documented travel consent), so the
 * request form and every passenger manifest surface this automatically
 * instead of relying on someone noticing a birth year.
 */

export const ADULT_AGE = 18;

/** Whole years between an ISO date-of-birth and `at` (defaults to now). NaN for an empty/invalid date. */
export function calcAge(iso?: string | null, at: Date = new Date()): number {
  if (!iso) return NaN;
  const dob = new Date(iso);
  if (Number.isNaN(dob.getTime())) return NaN;
  let age = at.getFullYear() - dob.getFullYear();
  const m = at.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < dob.getDate())) age--;
  return age;
}

export function isMinor(iso?: string | null): boolean {
  const age = calcAge(iso);
  return !Number.isNaN(age) && age >= 0 && age < ADULT_AGE;
}

/**
 * Staff-facing note for a minor traveller — what to double-check before
 * issuing. Returns null for adults or an unset/invalid date of birth.
 */
export function minorAdvisory(iso?: string | null): string | null {
  const age = calcAge(iso);
  if (Number.isNaN(age) || age < 0 || age >= ADULT_AGE) return null;
  return `Minor — ${age} year${age === 1 ? '' : 's'} old. Confirm an accompanying adult or documented travel consent before issuing.`;
}
