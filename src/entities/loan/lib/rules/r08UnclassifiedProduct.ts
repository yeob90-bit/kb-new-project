import { RULE_SCORE } from "../../../../constants/index";
import {
  BusinessRuleId,
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

/**
 * R08 — 상품코드 미분류
 * Reference Engine: loan_purpose가 null이고 product_code가 있을 때
 * (시설/운전 장기경과 분기에 들어가지 않은 경우)
 */
export function evaluateR08(
  loan: LoanRecord,
  _context: RuleContext,
): RemarkResult[] {
  if (loan.loanPurpose !== null) {
    return [];
  }
  if (!loan.productCode) {
    return [];
  }

  return [
    createRemark({
      ruleId: BusinessRuleId.R08,
      category: RemarkCategory.DataQuality,
      severity: RemarkSeverity.Low,
      title: "상품코드 미분류",
      message: `상품코드(${loan.productCode})가 시설/운전자금 목록에 없음 - 확인 필요`,
      score: RULE_SCORE.R08,
      recommendedAction: "상품코드 Master 확인 및 데이터 오류 여부 점검",
    }),
  ];
}

export const ruleR08: LoanRule = {
  id: BusinessRuleId.R08,
  name: "상품코드 미분류",
  description: "상품코드 [2:4]가 시설/운전 목록에 없음",
  category: RemarkCategory.DataQuality,
  enabled: true,
  evaluate: evaluateR08,
};
