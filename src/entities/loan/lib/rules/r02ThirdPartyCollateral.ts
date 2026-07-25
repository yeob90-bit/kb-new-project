import { RULE_SCORE } from "../../../../constants/index";
import {
  BusinessRuleId,
  RemarkCategory,
  RemarkSeverity,
} from "../../../../enum/index";
import type { LoanRecord, LoanRule, RemarkResult, RuleContext } from "../../../../models/index";
import { createRemark } from "./createRemark";

/** R02 — 제3자 담보 (provider prefix ≠ borrower prefix) */
export function evaluateR02(
  loan: LoanRecord,
  _context: RuleContext,
): RemarkResult[] {
  const providerPrefix = loan.collateralProviderPinPrefix;
  const borrowerPrefix = loan.borrowerPinPrefix;

  if (!providerPrefix) {
    return [];
  }
  if (providerPrefix === borrowerPrefix) {
    return [];
  }

  return [
    createRemark({
      ruleId: BusinessRuleId.R02,
      category: RemarkCategory.Collateral,
      severity: RemarkSeverity.Medium,
      title: "제3자 담보",
      message: "담보제공자가 차주 본인이 아닌 제3자로 확인됨",
      score: RULE_SCORE.R02,
      recommendedAction:
        "담보제공자의 연장 동의 및 전자약정 가능 일정 확인",
    }),
  ];
}

export const ruleR02: LoanRule = {
  id: BusinessRuleId.R02,
  name: "제3자 담보",
  description: "담보제공자 KB-PIN이 차주와 다른 경우",
  category: RemarkCategory.Collateral,
  enabled: true,
  evaluate: evaluateR02,
};
