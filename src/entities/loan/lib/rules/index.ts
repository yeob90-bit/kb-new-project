import type { AnalysisCapabilities } from "../../../../types/capabilities";
import type { LoanRecord, LoanRule, RemarkResult } from "../../../../models/index";
import { buildRuleContext } from "./buildRuleContext";
import { mergeRemarks } from "./createRemark";
import { ruleR01 } from "./r01SameBorrower";
import { ruleR02 } from "./r02ThirdPartyCollateral";
import { ruleR03 } from "./r03CrossRelationship";

/** Sprint04 Rules A — R01/R02/R03만 등록 */
export const RULES_A: LoanRule[] = [ruleR01, ruleR02, ruleR03];

export interface RulesAResult {
  remarksByLoanId: Map<string, RemarkResult[]>;
}

/**
 * R01~R03 평가.
 * disabledDuplicate 행은 인덱스/평가 대상에서 제외하되, 결과 Map에는 빈 배열로 유지.
 */
export function evaluateRulesA(
  loans: LoanRecord[],
  today: Date,
  capabilities?: AnalysisCapabilities,
): RulesAResult {
  const context = buildRuleContext(loans, today, capabilities);
  const remarksByLoanId = new Map<string, RemarkResult[]>();

  for (const loan of loans) {
    remarksByLoanId.set(loan.loanId, []);
  }

  for (const loan of context.allLoans) {
    const collected: RemarkResult[] = [];
    for (const rule of RULES_A) {
      if (!rule.enabled) {
        continue;
      }
      collected.push(...rule.evaluate(loan, context));
    }
    remarksByLoanId.set(loan.loanId, mergeRemarks(collected));
  }

  return { remarksByLoanId };
}

export function getRemarksForLoan(
  result: RulesAResult,
  loanId: string,
): RemarkResult[] {
  return result.remarksByLoanId.get(loanId) ?? [];
}

export function countRuleHits(
  result: RulesAResult,
  ruleId: string,
  options?: { loanIds?: Set<string> },
): number {
  let count = 0;
  for (const [loanId, remarks] of result.remarksByLoanId) {
    if (options?.loanIds && !options.loanIds.has(loanId)) {
      continue;
    }
    count += remarks.filter((remark) => remark.ruleId === ruleId).length;
  }
  return count;
}
