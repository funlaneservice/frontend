import { AlertTriangle } from 'lucide-react';
import { calcAge, isMinor, minorAdvisory } from '@/utils/age';

/**
 * Small amber pill flagging a traveller under 18, with their age — cues
 * agents/admins to confirm an accompanying adult or documented travel
 * consent before issuing. Renders nothing for adults or an unset/invalid
 * date of birth.
 */
export function MinorBadge({ dateOfBirth }: { dateOfBirth?: string | null }) {
  if (!isMinor(dateOfBirth)) return null;
  const age = calcAge(dateOfBirth);
  return (
    <span
      title={minorAdvisory(dateOfBirth) ?? undefined}
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-dark bg-amber-soft px-2 py-0.5 rounded-full"
    >
      <AlertTriangle aria-hidden="true" className="w-3 h-3" /> Minor · {age}y
    </span>
  );
}
