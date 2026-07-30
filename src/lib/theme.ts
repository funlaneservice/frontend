/**
 * Light/dark theming — personal preference only, persisted per user in
 * localStorage (THEME_KEY) and toggled from the UI. The chosen mode is
 * applied as a `.dark` class on <html>. A tiny inline script in the root
 * layout applies the effective mode before first paint to avoid a flash.
 */
export type ThemeMode = 'light' | 'dark';

export const THEME_KEY = 'funlane_theme';

function readMode(key: string): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage.getItem(key);
  return v === 'light' || v === 'dark' ? v : null;
}

export function getStoredMode(): ThemeMode | null {
  return readMode(THEME_KEY);
}

export function systemMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Current mode from the actually-applied class (source of truth after paint). */
export function activeMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/** Personal preference → system preference. */
export function effectiveMode(): ThemeMode {
  return getStoredMode() ?? systemMode();
}

export function applyMode(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', mode === 'dark');
}

/** Persists and applies the user's personal preference. */
export function setMode(mode: ThemeMode): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(THEME_KEY, mode);
  applyMode(mode);
}

/** Inline <script> body that applies the effective mode before paint (no FOUC). */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem('${THEME_KEY}');if(m!=='light'&&m!=='dark'){m=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.toggle('dark',m==='dark');}catch(e){}})();`;
