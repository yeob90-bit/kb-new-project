/** Excel serial epoch (SheetJS / Excel 1900 date system) */
const EXCEL_SERIAL_EPOCH_UTC_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function isValidYmd(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

function fromYmd(year: number, month: number, day: number): Date | null {
  if (!isValidYmd(year, month, day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

/**
 * PRD §10 / Reference Engine — 지원 형식만 파싱.
 * 실패 시 null → V02 INVALID_DATE.
 */
export function parseDateValue(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const utc = new Date(EXCEL_SERIAL_EPOCH_UTC_MS + value * MS_PER_DAY);
    return fromYmd(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
  }

  const raw = String(value).trim();

  if (/^\d{8}$/.test(raw)) {
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6));
    const day = Number(raw.slice(6, 8));
    return fromYmd(year, month, day);
  }

  const dashed = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (dashed) {
    return fromYmd(Number(dashed[1]), Number(dashed[2]), Number(dashed[3]));
  }

  const slashed = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(raw);
  if (slashed) {
    return fromYmd(Number(slashed[1]), Number(slashed[2]), Number(slashed[3]));
  }

  return null;
}

/** 원본 날짜 셀이 "값이 있었는지" (공란 여부) */
export function hasDateRawValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "string" && value.trim() === "") {
    return false;
  }
  return true;
}
