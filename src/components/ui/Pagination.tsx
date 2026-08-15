import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  unit?: string;
  className?: string;
  limit?: number;
  onLimitChange?: (limit: number) => void;
}

const PAGE_SIZES = [5, 10, 20, 50, 100];
/**
 * Reusable pager for every paginated table. Renders nothing when there's a
 * single page so callers can drop it in unconditionally.
 */
export function Pagination({ page, totalPages, onPageChange, total, unit = 'result', className = '', limit = 5, onLimitChange, }: PaginationProps) {
  if (totalPages === 0) return null;

  // Guarantee the current page size always has a matching <option>, even if a
  // caller initializes its state with a value outside the standard preset
  // (e.g. 25) — otherwise the <select> silently falls back to displaying its
  // first option while the table keeps loading the real (larger) page size.
  const sizeOptions = PAGE_SIZES.includes(limit) ? PAGE_SIZES : [...PAGE_SIZES, limit].sort((a, b) => a - b);

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-4">
      <span className="text-xs text-ink-3">
        Page {page} of {totalPages}
      </span>

      {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-3">Show</span>

            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-9 rounded-md border border-line bg-card px-2 text-sm focus:outline-none focus:border-sky-400"
            >
              {sizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <span className="text-xs text-ink-3">{unit}s</span>
          </div>
        )}
        </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          color="ink"
          size="sm"
          leftIcon={ChevronLeft}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          color="ink"
          size="sm"
          rightIcon={ChevronRight}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
