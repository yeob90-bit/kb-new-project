import { REFERENCE_DATES } from "../../constants/index";
import { parseLocalDate } from "../../entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../entities/loan/lib/runAnalysis";
import type { AnalysisRunResult } from "../../models/index";
import fixtureExtensionDemo from "../../shared/fixtures/fixture_extension_demo.json";

type RawRow = Record<string, unknown>;

/**
 * Dashboard 샘플 로드 —
 * `연장데이터_예시수정.xlsx` RAW원본 기반 fixture (실명·실계좌 형태 데모).
 * Acceptance 검증용 fixture_rule_valid_33 은 별도 유지.
 */
export function loadSampleAnalysis(
  referenceDate: Date = parseLocalDate(REFERENCE_DATES.RULE_VALID),
): AnalysisRunResult {
  return runAnalysis(fixtureExtensionDemo as RawRow[], referenceDate, {
    hasPolicyFundColumn: true,
    sourceFileName: "연장데이터_예시수정.xlsx",
    runId: "sample-extension-demo",
  });
}
