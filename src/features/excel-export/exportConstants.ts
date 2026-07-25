/** PRD §25 — 신규 Workbook 시트명 (고정) */
export const EXPORT_SHEET_NAMES = [
  "분석요약",
  "ActiveQueue",
  "분석범위외",
  "데이터오류",
  "Remark상세",
  "ActionList",
  "관계인분석",
] as const;

export type ExportSheetName = (typeof EXPORT_SHEET_NAMES)[number];

export const EXPORT_FILE_PREFIX = "기업여신_만기관리_분석결과_";
