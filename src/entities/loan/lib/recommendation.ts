import { PRIORITY_BAND_TO_URGENCY } from "../../../constants/index";
import { ActionUrgency, BusinessRuleId, PriorityBand } from "../../../enum/index";
import type {
  AnalysisRunResult,
  LoanAnalysisResult,
  RecommendedAction,
} from "../../../models/index";

function urgencyFromBand(band: PriorityBand | null): ActionUrgency {
  if (!band) {
    return ActionUrgency.Routine;
  }
  return PRIORITY_BAND_TO_URGENCY[band];
}

/** PRD §20 — Remark 기반 RecommendedAction 생성 */
export function buildRecommendedActions(
  result: Omit<LoanAnalysisResult, "recommendedActions">,
): RecommendedAction[] {
  const urgency = urgencyFromBand(result.priorityBand);

  return result.remarks.map((remark, index) => {
    const action: RecommendedAction = {
      actionId: `${result.loan.loanId}:${remark.ruleId}:${index}`,
      title: remark.recommendedAction,
      reason: remark.message,
      urgency,
      recommendedDueDate: null,
      relatedRuleIds: [remark.ruleId],
    };
    return action;
  });
}

export interface OpinionSection {
  id: "today" | "thisWeek" | "relationship" | "prepare";
  title: string;
  items: Array<{
    loanId: string;
    borrowerName: string;
    summary: string;
  }>;
}

/** PRD §21 — Rule 기반 4단 종합의견 */
export function buildRuleBasedOpinion(
  run: AnalysisRunResult,
): OpinionSection[] {
  const active = run.results.filter((result) => result.isInActiveWindow);

  const today = active
    .filter((result) => result.priorityBand === PriorityBand.P1Immediate)
    .map((result) => toOpinionItem(result));

  const thisWeek = active
    .filter((result) => result.priorityBand === PriorityBand.P2Priority)
    .map((result) => toOpinionItem(result));

  const relationship = active
    .filter((result) =>
      result.remarks.some(
        (remark) =>
          remark.ruleId === BusinessRuleId.R03 ||
          remark.ruleId === BusinessRuleId.R04,
      ),
    )
    .map((result) => toOpinionItem(result));

  const prepare = active
    .filter((result) => result.priorityBand === PriorityBand.P3Prepare)
    .map((result) => toOpinionItem(result));

  return [
    { id: "today", title: "오늘 우선처리", items: today },
    { id: "thisWeek", title: "이번 주 확인사항", items: thisWeek },
    { id: "relationship", title: "관계인 연결 점검", items: relationship },
    { id: "prepare", title: "사전준비 대상", items: prepare },
  ];
}

function toOpinionItem(result: LoanAnalysisResult) {
  const topRemark = result.remarks[0]?.title ?? "특이사항 없음";
  return {
    loanId: result.loan.loanId,
    borrowerName: result.loan.borrowerName,
    summary: `${topRemark} · Score ${result.priorityScore ?? "-"}`,
  };
}

export const RULE_OPINION_DISCLAIMER =
  "본 의견은 Rule 기반 업무지원 결과이며 최종 심사 및 고객관계 확인은 담당자가 수행해야 합니다.";
