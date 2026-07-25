import * as XLSX from "xlsx";
import type { AnalysisRunResult } from "../../models/index";
import {
  buildAnalysisWorkbook,
  buildExportFileName,
} from "./buildAnalysisWorkbook";

/**
 * 신규 xlsx 다운로드.
 * URL.createObjectURL 사용 시 직후 revoke (PRD §7.4).
 */
export function downloadAnalysisXlsx(run: AnalysisRunResult): string {
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

export function workbookToArrayBuffer(run: AnalysisRunResult): ArrayBuffer {
  const workbook = buildAnalysisWorkbook(run);
  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;
}
