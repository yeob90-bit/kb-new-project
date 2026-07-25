import { RULE_SCORE } from "../../../../constants/index";
import {
  BusinessRuleId,
  RelationDirection,
  RemarkCategory,
  RemarkSeverity,
} from "../../../../enum/index";
import type { LoanRecord, LoanRule, RemarkResult, RuleContext } from "../../../../models/index";
import { createRemark } from "./createRemark";

/**
 * R03 — 담보제공자-타차주 교차관계 (양방향)
 * - PROVIDER_TO_BORROWER: 본 건 담보제공자 = 다른 여신 차주
 * - BORROWER_AS_PROVIDER: 본 차주 = 다른 여신의 담보제공자
 */
export function evaluateR03(
  loan: LoanRecord,
  context: RuleContext,
): RemarkResult[] {
  const remarks: RemarkResult[] = [];
  const borrowerPrefix = loan.borrowerPinPrefix;
  const providerPrefix = loan.collateralProviderPinPrefix;

  if (
    providerPrefix &&
    providerPrefix !== borrowerPrefix &&
    context.loansByBorrowerPin.has(providerPrefix)
  ) {
    const others = (context.loansByBorrowerPin.get(providerPrefix) ?? []).filter(
      (other) => other.loanId !== loan.loanId,
    );
    if (others.length > 0) {
      remarks.push(
        createRemark({
          ruleId: BusinessRuleId.R03,
          category: RemarkCategory.Relationship,
          severity: RemarkSeverity.High,
          title: "담보제공자가 다른 만기대상 차주와 동일",
          message:
            "동일 식별정보 연결 발견 - 차주·담보제공자 관계 확인 필요",
          score: RULE_SCORE.R03,
          recommendedAction:
            "차주·담보제공자 관계 및 약정 참여 가능 일정 확인",
          relationDirection: RelationDirection.ProviderToBorrower,
          relatedLoanIds: others.map((other) => other.loanId),
        }),
      );
    }
  }

  if (borrowerPrefix) {
    const asProviderFor = context.allLoans.filter((other) => {
      if (other.loanId === loan.loanId) {
        return false;
      }
      if (!other.collateralProviderPinPrefix) {
        return false;
      }
      if (other.collateralProviderPinPrefix === other.borrowerPinPrefix) {
        return false;
      }
      return other.collateralProviderPinPrefix === borrowerPrefix;
    });

    if (asProviderFor.length > 0) {
      remarks.push(
        createRemark({
          ruleId: BusinessRuleId.R03,
          category: RemarkCategory.Relationship,
          severity: RemarkSeverity.High,
          title: "본 차주가 다른 여신의 담보제공자로 연결됨",
          message:
            "동일 식별정보 연결 발견 - 복수 여신 연결관계 확인 필요",
          score: RULE_SCORE.R03,
          recommendedAction: "복수 여신 연결관계와 담보제공 범위 확인",
          relationDirection: RelationDirection.BorrowerAsProvider,
          relatedLoanIds: asProviderFor.map((other) => other.loanId),
        }),
      );
    }
  }

  return remarks;
}

export const ruleR03: LoanRule = {
  id: BusinessRuleId.R03,
  name: "담보제공자-타차주 교차관계",
  description: "담보제공자 PIN이 다른 여신 차주와 동일한 양방향 관계",
  category: RemarkCategory.Relationship,
  enabled: true,
  evaluate: evaluateR03,
};
