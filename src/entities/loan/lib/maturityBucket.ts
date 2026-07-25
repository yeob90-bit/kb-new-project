import {
  ACTIVE_MATURITY_BUCKETS,
  ACTIVE_WINDOW_MAX_MONTH_OFFSET,
} from "../../../constants/index";
import { MaturityBucket } from "../../../enum/index";

/** Reference Engine add_months — 일자는 1일로 정규화해 연·월만 비교 */
export function addCalendarMonths(base: Date, months: number): Date {
  const idx = base.getMonth() + months;
  const year = base.getFullYear() + Math.floor(idx / 12);
  const month = ((idx % 12) + 12) % 12;
  return new Date(year, month, 1);
}

/** PRD §11.1 / Reference Engine maturity_bucket */
export function resolveMaturityBucket(
  maturityDate: Date | null,
  today: Date,
  maxOffset: number = ACTIVE_WINDOW_MAX_MONTH_OFFSET,
): MaturityBucket {
  if (maturityDate === null) {
    return MaturityBucket.InvalidDate;
  }

  const buckets = [
    MaturityBucket.CurrentMonth,
    MaturityBucket.NextMonth,
    MaturityBucket.TwoMonthsLater,
  ] as const;

  for (let offset = 0; offset <= maxOffset; offset += 1) {
    const target = addCalendarMonths(today, offset);
    if (
      maturityDate.getFullYear() === target.getFullYear() &&
      maturityDate.getMonth() === target.getMonth()
    ) {
      return buckets[offset] ?? MaturityBucket.OutOfScope;
    }
  }

  return MaturityBucket.OutOfScope;
}

export function isActiveMaturityBucket(bucket: MaturityBucket): boolean {
  return (ACTIVE_MATURITY_BUCKETS as readonly MaturityBucket[]).includes(bucket);
}

/** YYYY-MM-DD → 로컬 날짜 (타임존 흔들림 방지) */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date string: ${isoDate}`);
  }
  return new Date(year, month - 1, day);
}
