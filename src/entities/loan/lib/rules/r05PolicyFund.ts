import { RULE_SCORE } from "../../../../constants/index";
import {
  BusinessRuleId,
  PolicyFundType,
  RemarkCategory,
  RemarkSeverity,
} from "../../../../enum/index";
import type {
  LoanRecord,
  LoanRule,
  RemarkResult,
  RuleContext,
} from "../../../../models/index";
import { createRemark } from "./createRemark";

/** R05 — 정책자금 (C1/C2), capabilities.canAnalyzePolicyFund 필수 */
export function evaluateR05(
  loan: LoanRecord,
  context: RuleContext,
): RemarkResult[] {
  if (!context.capabilities.canAnalyzePolicyFund) {
    return [];
  }

  const fundType = loan.policyFundType;
  if (fundType !== PolicyFundType.C1 && fundType !== PolicyFundType.C2) {
    return [];
  }

  return [
    createRemark({
      ruleId: BusinessRuleId.R05,
      category: RemarkCategory.PolicyFund,
      severity: RemarkSeverity.Medium,
      title: `정책자금 상품 (${fundType})`,
      message: "정책자금 사용 조건 재확인 필요",
      score: RULE_SCORE.R05,
      recommendedAction: "정책자금 연장요건 및 자금용도 재점검",
    }),
  ];
}

export const ruleR05: LoanRule = {
  id: BusinessRuleId.R05,
  name: "정책자금",
  description: "정책자금구분 C1/C2",
  category: RemarkCategory.PolicyFund,
  enabled: true,
  evaluate: evaluateR05,
};
