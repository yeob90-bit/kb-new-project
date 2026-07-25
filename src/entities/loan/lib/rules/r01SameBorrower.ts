import { RULE_SCORE } from "../../../../constants/index";
import {
  BusinessRuleId,
  RelationDirection,
  RemarkCategory,
  RemarkSeverity,
} from "../../../../enum/index";
import type { LoanRecord, LoanRule, RemarkResult, RuleContext } from "../../../../models/index";
import {
  isActiveMaturityBucket,
  resolveMaturityBucket,
} from "../maturityBucket";
import { createRemark } from "./createRemark";

/** R01 — 동일 차주 추가만기 (Active Window 내 2건 이상) */
export function evaluateR01(
  loan: LoanRecord,
  context: RuleContext,
): RemarkResult[] {
  if (!loan.borrowerPinPrefix) {
    return [];
  }

  const bucket = resolveMaturityBucket(loan.maturityDate, context.today);
  if (!isActiveMaturityBucket(bucket)) {
    return [];
  }

  const sameBorrower = context.loansByBorrowerPin.get(loan.borrowerPinPrefix) ?? [];
  const activePeers = sameBorrower.filter((peer) => {
    const peerBucket = resolveMaturityBucket(peer.maturityDate, context.today);
    return isActiveMaturityBucket(peerBucket);
  });

  if (activePeers.length < 2) {
    return [];
  }

  const relatedLoanIds = activePeers
    .map((peer) => peer.loanId)
    .filter((id) => id !== loan.loanId);

  if (relatedLoanIds.length === 0) {
    return [];
  }

  return [
    createRemark({
      ruleId: BusinessRuleId.R01,
      category: RemarkCategory.Schedule,
      severity: RemarkSeverity.Medium,
      title: "동일 차주 추가 만기계좌 존재",
      message: `동일 차주 기준 Active Window 내 추가 만기계좌 ${relatedLoanIds.length}건 존재`,
      score: RULE_SCORE.R01,
      recommendedAction:
        "고객 접촉 시 복수 계좌의 동시 연장 가능 여부 검토",
      relationDirection: RelationDirection.SameBorrowerMultiMaturity,
      relatedLoanIds,
    }),
  ];
}

export const ruleR01: LoanRule = {
  id: BusinessRuleId.R01,
  name: "동일 차주 추가만기",
  description: "Active Window 내 동일 KB-PIN prefix 만기계좌 2건 이상",
  category: RemarkCategory.Schedule,
  enabled: true,
  evaluate: evaluateR01,
};
