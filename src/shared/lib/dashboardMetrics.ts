import { BusinessRuleId } from "../../enum/index";
import type { AnalysisRunResult, LoanAnalysisResult } from "../../models/index";

/** Active Window 내 R03/R04 Remark가 있는 계좌 수 */
export function countRelationshipTargets(
  results: LoanAnalysisResult[],
): number {
  return results.filter(
    (result) =>
      result.isInActiveWindow &&
      result.remarks.some(
        (remark) =>
          remark.ruleId === BusinessRuleId.R03 ||
          remark.ruleId === BusinessRuleId.R04,
      ),
  ).length;
}

export function countRuleHitsOnActive(
  run: AnalysisRunResult,
  ruleId: BusinessRuleId,
): number {
  return run.results.filter(
    (result) =>
      result.isInActiveWindow &&
      result.remarks.some((remark) => remark.ruleId === ruleId),
  ).length;
}

export function sortActiveQueue(
  results: LoanAnalysisResult[],
): LoanAnalysisResult[] {
  const bandRank: Record<string, number> = {
    P1_IMMEDIATE: 0,
    P2_PRIORITY: 1,
    P3_PREPARE: 2,
    P4_ROUTINE: 3,
  };

  return [...results]
    .filter((result) => result.isInActiveWindow)
    .sort((a, b) => {
      const bandA = a.priorityBand ? (bandRank[a.priorityBand] ?? 99) : 99;
      const bandB = b.priorityBand ? (bandRank[b.priorityBand] ?? 99) : 99;
      if (bandA !== bandB) {
        return bandA - bandB;
      }
      return (b.priorityScore ?? -1) - (a.priorityScore ?? -1);
    });
}
