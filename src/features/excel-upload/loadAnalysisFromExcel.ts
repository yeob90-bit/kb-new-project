import { REFERENCE_DATES } from "../../constants/index";
import { parseLocalDate } from "../../entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../entities/loan/lib/runAnalysis";
import type { AnalysisRunResult } from "../../models/index";
import {
  parseExcelFile,
  type RawLoanRow,
} from "../excel-upload/parseExcelWorkbook";

export async function loadAnalysisFromExcelFile(
  file: File,
  referenceDate: Date = parseLocalDate(REFERENCE_DATES.RULE_VALID),
): Promise<AnalysisRunResult> {
  const parsed = await parseExcelFile(file);
  return runAnalysis(parsed.rows as RawLoanRow[], referenceDate, {
    hasPolicyFundColumn: parsed.hasPolicyFundColumn,
    sourceFileName: parsed.sourceFileName,
    runId: `upload-${Date.now()}`,
  });
}
