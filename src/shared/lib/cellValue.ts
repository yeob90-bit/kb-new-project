/** Excel/JSON 셀 → trim 문자열. null/undefined → "". */
export function cellToString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

/** 빈 문자열이면 null, 아니면 trim 문자열. */
export function cellToOptionalString(value: unknown): string | null {
  const s = cellToString(value);
  return s === "" ? null : s;
}
