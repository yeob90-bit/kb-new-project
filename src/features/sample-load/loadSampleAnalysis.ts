import { REFERENCE_DATES } from "../../constants/index";
import { parseLocalDate } from "../../entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../entities/loan/lib/runAnalysis";
import type { AnalysisRunResult } from "../../models/index";
import fixtureRuleValid33 from "../../shared/fixtures/fixture_rule_valid_33.json";

type RawRow = Record<string, unknown>;

/** Dashboard 샘플 로드 — fixture_rule_valid_33 + 기준일 2026-08-03 */
export function loadSampleAnalysis(
  referenceDate: Date = parseLocalDate(REFERENCE_DATES.RULE_VALID),
): AnalysisRunResult {
  return runAnalysis(fixtureRuleValid33 as RawRow[], referenceDate, {
    hasPolicyFundColumn: true,
    sourceFileName: "fixture_rule_valid_33.json",
    runId: "sample-rule-valid-33",
  });
}
