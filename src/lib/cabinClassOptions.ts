import type { ComboOption } from '@/components/form/ComboboxField';
import { BUDGET_TIERS } from '@/services/requestView';
import type { ApiBudgetTier } from '@/interface';


export const CABIN_CLASS_OPTIONS: ComboOption[] = BUDGET_TIERS.map((t) => ({ value: t.label, label: t.label }));

export const CABIN_CLASS_BY_LABEL: Record<string, ApiBudgetTier> = Object.fromEntries(
  BUDGET_TIERS.map((t): [string, ApiBudgetTier] => [t.label, t.value]),
);

/** Reverse of the above — for displaying a stored `cabinClass` enum value as a label. */
export const CABIN_CLASS_LABEL_BY_VALUE: Record<ApiBudgetTier, string> = Object.fromEntries(
  BUDGET_TIERS.map((t): [ApiBudgetTier, string] => [t.value, t.label]),
) as Record<ApiBudgetTier, string>;
