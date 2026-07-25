import type { AnalysisRunResult } from "../../models/index";

/**
 * 신규 xlsx 다운로드 (xlsx는 동적 import — 초기 번들 분리).
 * URL.createObjectURL 사용 시 직후 revoke (PRD §7.4).
 */
export async function downloadAnalysisXlsx(
  run: AnalysisRunResult,
): Promise<string> {
  const XLSX = await import("xlsx");
  const { buildAnalysisWorkbook, buildExportFileName } = await import(
    "./buildAnalysisWorkbook"
  );

  const workbook = buildAnalysisWorkbook(run);
  const fileName = buildExportFileName(run.referenceDate);
  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(url);
  }

  return fileName;
}

export async function workbookToArrayBuffer(
  run: AnalysisRunResult,
): Promise<ArrayBuffer> {
  const XLSX = await import("xlsx");
  const { buildAnalysisWorkbook } = await import("./buildAnalysisWorkbook");
  const workbook = buildAnalysisWorkbook(run);
  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;
}
