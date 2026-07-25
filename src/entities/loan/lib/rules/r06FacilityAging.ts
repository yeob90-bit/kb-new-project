import { AGING_YEARS, RULE_SCORE } from "../../../../constants/index";
import {
  BusinessRuleId,
  LoanPurpose,
  RemarkCategory,
  RemarkSeverity,
} from "../../../../enum/index";
import type {
  LoanRecord,
  LoanRule,
  RemarkResult,
  RuleContext,
} from "../../../../models/index";
import { hasReachedAnniversary } from "../anniversary";
import { createRemark } from "./createRemark";

/** R06 — 시설자금 장기경과 (기념일 3년) */
export function evaluateR06(
  loan: LoanRecord,
  context: RuleContext,
): RemarkResult[] {
  if (loan.loanPurpose !== LoanPurpose.Facility) {
    return [];
  }
  if (loan.firstExecutionDate === null) {
    return [];
  }

  const years = AGING_YEARS[LoanPurpose.Facility];
  if (!hasReachedAnniversary(context.today, loan.firstExecutionDate, years)) {
    return [];
  }

  return [
    createRemark({
      ruleId: BusinessRuleId.R06,
      category: RemarkCategory.Aging,
      severity: RemarkSeverity.Medium,
      title: `${LoanPurpose.Facility} ${years}년 경과`,
      message: `최초실행 후 ${years}년 이상 경과 - 재무상태 재점검 권장`,
      score: RULE_SCORE.R06,
      recommendedAction: "최근 재무상태 및 사업현황 점검",
    }),
  ];
}

export const ruleR06: LoanRule = {
  id: BusinessRuleId.R06,
  name: "시설자금 장기경과",
  description: "시설자금 최초실행일 기준 3년 기념일 도달",
  category: RemarkCategory.Aging,
  enabled: true,
  evaluate: evaluateR06,
};
