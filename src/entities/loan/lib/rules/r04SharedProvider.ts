import { RULE_SCORE } from "../../../../constants/index";
import {
  BusinessRuleId,
  RelationDirection,
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

/** R04 — 동일 담보제공자 복수여신 */
export function evaluateR04(
  loan: LoanRecord,
  context: RuleContext,
): RemarkResult[] {
  const providerPrefix = loan.collateralProviderPinPrefix;
  if (!providerPrefix) {
    return [];
  }

  const group = context.loansByCollateralPin.get(providerPrefix) ?? [];
  if (group.length <= 1) {
    return [];
  }

  const relatedLoanIds = group
    .map((peer) => peer.loanId)
    .filter((id) => id !== loan.loanId);

  if (relatedLoanIds.length === 0) {
    return [];
  }

  return [
    createRemark({
      ruleId: BusinessRuleId.R04,
      category: RemarkCategory.Relationship,
      severity: RemarkSeverity.High,
      title: "동일 담보제공자 복수여신 연결",
      message:
        "동일 담보제공자가 여러 여신에 연결됨 - 특수관계 가능성 확인 필요",
      score: RULE_SCORE.R04,
      recommendedAction: "복수 여신 연결관계와 담보제공 범위 확인",
      relationDirection: RelationDirection.SharedProvider,
      relatedLoanIds,
    }),
  ];
}

export const ruleR04: LoanRule = {
  id: BusinessRuleId.R04,
  name: "동일 담보제공자 복수여신",
  description: "동일 담보제공자 PIN이 2건 이상 여신에 연결된 경우",
  category: RemarkCategory.Relationship,
  enabled: true,
  evaluate: evaluateR04,
};
