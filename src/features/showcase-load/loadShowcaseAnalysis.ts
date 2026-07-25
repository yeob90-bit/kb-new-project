import { REFERENCE_DATES } from "../../constants/index";
import { parseLocalDate } from "../../entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../entities/loan/lib/runAnalysis";
import type { AnalysisRunResult } from "../../models/index";
import fixtureShowcase from "../../shared/fixtures/fixture_showcase.json";

type RawRow = Record<string, unknown>;

/**
 * Showcase 전용 로더 — fixture_showcase.json만 사용.
 * upload/sample-load 모듈을 import하지 않는다 (PRD §7.5).
 */
export function loadShowcaseAnalysis(
  referenceDate: Date = parseLocalDate(REFERENCE_DATES.RULE_VALID),
): AnalysisRunResult {
  return runAnalysis(fixtureShowcase as RawRow[], referenceDate, {
    hasPolicyFundColumn: true,
    sourceFileName: "fixture_showcase.json",
    runId: "showcase-fixture",
  });
}
