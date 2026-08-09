'use client';

import { AlertCircle } from 'lucide-react';

/**
 * Shared chrome around every form control: the input "frame" (border + focus
 * glow + validation tint), the floating label that straddles the frame's top
 * border, and the error/hint row underneath. Individual field components
 * render their control inside the frame.
 */

export type FieldTone = 'default' | 'error' | 'valid';

export function frameClass(tone: FieldTone) {
  const base =
    'relative flex items-center rounded-xl border bg-surface transition-all duration-200 ' +
    'focus-within:bg-card focus-within:shadow-sm focus-within:ring-4';
  if (tone === 'error') {
    return `${base} border-red/50 bg-red-soft/40 focus-within:border-red focus-within:ring-red-soft`;
  }
  if (tone === 'valid') {
    return `${base} border-green/40 focus-within:border-brand focus-within:ring-brand-soft hover:border-green/60`;
  }
  return `${base} border-line hover:border-ink-3/40 focus-within:border-brand focus-within:ring-brand-soft`;
}

export const controlClass =
  'peer w-full bg-transparent py-3 text-sm text-ink focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60';

export const leadingIconClass =
  'pointer-events-none absolute left-3.5 w-[18px] h-[18px] text-ink-3/70 transition-colors duration-200 peer-focus:text-brand';

const floatedClass =
  'top-0 left-3 text-[11px] font-semibold tracking-wide px-1.5 rounded bg-card';

interface FloatingLabelProps {
  htmlFor: string;
  hasIcon?: boolean;
  error?: boolean;
  always?: boolean;
  children: React.ReactNode;
}

export function FloatingLabel({ htmlFor, hasIcon, error, always, children }: FloatingLabelProps) {
  const color = error ? 'text-red-dark' : 'text-ink-3/80 peer-focus:text-brand';
  const position = always
    ? floatedClass
    : `top-1/2 ${hasIcon ? 'left-11' : 'left-4'} text-sm ` +
      'peer-focus:top-0 peer-focus:left-3 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:tracking-wide peer-focus:px-1.5 peer-focus:rounded peer-focus:bg-card ' +
      'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-3 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-wide peer-[:not(:placeholder-shown)]:px-1.5 peer-[:not(:placeholder-shown)]:rounded peer-[:not(:placeholder-shown)]:bg-card';

  return (
    <label
      htmlFor={htmlFor}
      title={typeof children === 'string' ? children : undefined}
      className={`pointer-events-none absolute -translate-y-1/2 whitespace-nowrap truncate max-w-[calc(100%-2.25rem)] select-none transition-all duration-200 ${color} ${position}`}
    >
      {children}
    </label>
  );
}

interface FieldShellProps {
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}

export function FieldShell({ error, hint, children }: FieldShellProps) {
  return (
    <div>
      {children}
      {(error || hint) && (
        <div className="mt-1.5 flex items-start justify-between gap-3">
          {error ? (
            <p role="alert" className="flex items-start gap-1 text-xs text-red-dark animate-fade-in">
              <AlertCircle aria-hidden="true" className="mt-px w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          ) : (
            <span />
          )}
          {hint && <span className="ml-auto shrink-0 text-[11px] text-ink-3/70">{hint}</span>}
        </div>
      )}
    </div>
  );
}
