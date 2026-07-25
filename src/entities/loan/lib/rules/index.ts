import type { AnalysisCapabilities } from "../../../../types/capabilities";
import type { LoanRecord, LoanRule, RemarkResult } from "../../../../models/index";
import { buildRuleContext } from "./buildRuleContext";
import { mergeRemarks } from "./createRemark";
import { ruleR01 } from "./r01SameBorrower";
import { ruleR02 } from "./r02ThirdPartyCollateral";
import { ruleR03 } from "./r03CrossRelationship";
import { ruleR04 } from "./r04SharedProvider";
import { ruleR05 } from "./r05PolicyFund";
import { ruleR06 } from "./r06FacilityAging";
import { ruleR07 } from "./r07WorkingAging";
import { ruleR08 } from "./r08UnclassifiedProduct";

/** Sprint04 Rules A — R01/R02/R03 */
export const RULES_A: LoanRule[] = [ruleR01, ruleR02, ruleR03];

/** Sprint05 Rules B — R04/R05/R06/R07/R08 */
export const RULES_B: LoanRule[] = [ruleR04, ruleR05, ruleR06, ruleR07, ruleR08];

export const BUSINESS_RULES: LoanRule[] = [...RULES_A, ...RULES_B];

export interface RulesEvaluationResult {
  remarksByLoanId: Map<string, RemarkResult[]>;
}

/** @deprecated alias — Sprint04 호환 */
export type RulesAResult = RulesEvaluationResult;

function evaluateRuleSet(
  loans: LoanRecord[],
  today: Date,
  rules: LoanRule[],
  capabilities?: AnalysisCapabilities,
): RulesEvaluationResult {
  const context = buildRuleContext(loans, today, capabilities);
  const remarksByLoanId = new Map<string, RemarkResult[]>();

  for (const loan of loans) {
    remarksByLoanId.set(loan.loanId, []);
  }

  for (const loan of context.allLoans) {
    const collected: RemarkResult[] = [];
    for (const rule of rules) {
      if (!rule.enabled) {
        continue;
      }
      collected.push(...rule.evaluate(loan, context));
    }
    remarksByLoanId.set(loan.loanId, mergeRemarks(collected));
  }

  return { remarksByLoanId };
}

export function evaluateRulesA(
  loans: LoanRecord[],
  today: Date,
  capabilities?: AnalysisCapabilities,
): RulesEvaluationResult {
  return evaluateRuleSet(loans, today, RULES_A, capabilities);
}

export function evaluateRulesB(
  loans: LoanRecord[],
  today: Date,
  capabilities?: AnalysisCapabilities,
): RulesEvaluationResult {
  return evaluateRuleSet(loans, today, RULES_B, capabilities);
}

export function evaluateBusinessRules(
  loans: LoanRecord[],
  today: Date,
  capabilities?: AnalysisCapabilities,
): RulesEvaluationResult {
  return evaluateRuleSet(loans, today, BUSINESS_RULES, capabilities);
}

export function getRemarksForLoan(
  result: RulesEvaluationResult,
  loanId: string,
): RemarkResult[] {
  return result.remarksByLoanId.get(loanId) ?? [];
}

export function countRuleHits(
  result: RulesEvaluationResult,
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

export { ruleR01 } from "./r01SameBorrower";
export { ruleR02 } from "./r02ThirdPartyCollateral";
export { ruleR03 } from "./r03CrossRelationship";
export { ruleR04 } from "./r04SharedProvider";
export { ruleR05 } from "./r05PolicyFund";
export { ruleR06 } from "./r06FacilityAging";
export { ruleR07 } from "./r07WorkingAging";
export { ruleR08 } from "./r08UnclassifiedProduct";
