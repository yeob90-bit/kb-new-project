import { REQUIRED_COLUMNS } from "../../constants/index";

export type RawLoanRow = Record<string, unknown>;

export class ExcelParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExcelParseError";
  }
}

/**
 * SheetJS Workbook → RawLoanRow[].
 * 시트 우선순위: "RAW원본" → 필수컬럼 헤더가 있는 첫 시트 → 첫 시트.
 */
export async function parseExcelWorkbook(
  data: ArrayBuffer,
): Promise<{ rows: RawLoanRow[]; sheetName: string; hasPolicyFundColumn: boolean }> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(data, { type: "array", raw: false });

  if (workbook.SheetNames.length === 0) {
    throw new ExcelParseError("엑셀에 시트가 없습니다.");
  }

  const sheetName = pickSourceSheet(workbook, XLSX);
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new ExcelParseError(`시트 '${sheetName}'을(를) 찾을 수 없습니다.`);
  }

  const rows = XLSX.utils.sheet_to_json<RawLoanRow>(sheet, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) {
    throw new ExcelParseError("데이터 행이 없습니다.");
  }

  assertRequiredColumns(rows[0] ?? {});

  const hasPolicyFundColumn = Object.prototype.hasOwnProperty.call(
    rows[0],
    "정책자금구분",
  );

  return {
    rows: rows.map(normalizeRawRow),
    sheetName,
    hasPolicyFundColumn,
  };
}

function pickSourceSheet(
  workbook: { SheetNames: string[]; Sheets: Record<string, unknown> },
  XLSX: typeof import("xlsx"),
): string {
  if (workbook.SheetNames.includes("RAW원본")) {
    return "RAW원본";
  }

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name] as import("xlsx").WorkSheet | undefined;
    if (!sheet) {
      continue;
    }
    const preview = XLSX.utils.sheet_to_json<RawLoanRow>(sheet, {
      defval: "",
      raw: false,
    });
    const header = preview[0] ?? {};
    if (REQUIRED_COLUMNS.every((column) => column in header)) {
      return name;
    }
  }

  return workbook.SheetNames[0]!;
}

function assertRequiredColumns(headerRow: RawLoanRow): void {
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in headerRow));
  if (missing.length > 0) {
    throw new ExcelParseError(
      `필수 컬럼이 없습니다: ${missing.join(", ")}`,
    );
  }
}

/** 전화·자동이체모계좌 등 민감 컬럼은 분석 입력에서 제거 */
function normalizeRawRow(row: RawLoanRow): RawLoanRow {
  const next: RawLoanRow = { ...row };
  delete next["자택전화번호"];
  delete next["직장전화번호"];
  delete next["휴대폰번호"];
  delete next["자동이체모계좌"];
  delete next["보증인KB-PIN"];
  delete next["보증인명"];
  return next;
}

export async function parseExcelFile(file: File): Promise<{
  rows: RawLoanRow[];
  sheetName: string;
  hasPolicyFundColumn: boolean;
  sourceFileName: string;
}> {
  const buffer = await file.arrayBuffer();
  const parsed = await parseExcelWorkbook(buffer);
  return {
    ...parsed,
    sourceFileName: file.name,
  };
}
