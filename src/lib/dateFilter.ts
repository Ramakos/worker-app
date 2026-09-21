export type DatePreset =
  | 'today'
  | 'yesterday'
  | '7days'
  | 'this_week'
  | 'this_month'
  | 'all'
  | 'custom';

export interface DateFilterState {
  preset: DatePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

export interface ResolvedDateRange {
  start?: Date;
  end?: Date;
  label: string;
  isFiltered: boolean;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday as first day of week (day 1). If Sunday (day 0), diff is -6
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function formatMonthYear(d: Date): string {
  return `${FULL_MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Resolves a DateFilterState into concrete Date boundaries and human-friendly labels.
 */
export function resolveDateRange(
  filter: DateFilterState,
  referenceDate: Date = new Date()
): ResolvedDateRange {
  const now = referenceDate;

  switch (filter.preset) {
    case 'today': {
      const start = startOfDay(now);
      const end = endOfDay(now);
      return {
        start,
        end,
        label: `Today (${formatShortDate(now)})`,
        isFiltered: true,
      };
    }
    case 'yesterday': {
      const yDay = subDays(now, 1);
      const start = startOfDay(yDay);
      const end = endOfDay(yDay);
      return {
        start,
        end,
        label: `Yesterday (${formatShortDate(yDay)})`,
        isFiltered: true,
      };
    }
    case '7days': {
      const start = startOfDay(subDays(now, 6));
      const end = endOfDay(now);
      return {
        start,
        end,
        label: `Last 7 Days (${formatShortDate(start)} – ${formatShortDate(end)})`,
        isFiltered: true,
      };
    }
    case 'this_week': {
      const start = startOfWeek(now);
      const end = endOfDay(now);
      return {
        start,
        end,
        label: `This Week (${formatShortDate(start)} – ${formatShortDate(end)})`,
        isFiltered: true,
      };
    }
    case 'this_month': {
      const start = startOfMonth(now);
      const end = endOfDay(now);
      return {
        start,
        end,
        label: `This Month (${formatMonthYear(start)})`,
        isFiltered: true,
      };
    }
    case 'custom': {
      if (filter.startDate && filter.endDate) {
        const start = startOfDay(new Date(filter.startDate + 'T00:00:00'));
        const end = endOfDay(new Date(filter.endDate + 'T23:59:59'));
        return {
          start,
          end,
          label: `${formatShortDate(start)} – ${formatShortDate(end)}`,
          isFiltered: true,
        };
      }
      if (filter.startDate) {
        const start = startOfDay(new Date(filter.startDate + 'T00:00:00'));
        return {
          start,
          label: `From ${formatShortDate(start)}`,
          isFiltered: true,
        };
      }
      return {
        label: 'Custom Range',
        isFiltered: false,
      };
    }
    case 'all':
    default:
      return {
        label: 'All Time',
        isFiltered: false,
      };
  }
}

/**
 * Checks if a given timestamp or date string falls within the active DateFilterState.
 */
export function matchesDateFilter(
  dateOrTimestamp: string | number | Date | undefined | null,
  filter: DateFilterState
): boolean {
  if (filter.preset === 'all') return true;
  if (!dateOrTimestamp) return false;

  const targetDate = new Date(dateOrTimestamp);
  if (isNaN(targetDate.getTime())) return false;

  const { start, end } = resolveDateRange(filter);
  const targetTime = targetDate.getTime();

  if (start && targetTime < start.getTime()) return false;
  if (end && targetTime > end.getTime()) return false;

  return true;
}
