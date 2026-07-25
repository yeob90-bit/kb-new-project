import { RULE_SCORE } from "../../../../constants/index";
import type {
  BusinessRuleId,
  RelationDirection,
  RemarkCategory,
  RemarkSeverity,
} from "../../../../enum/index";
import type { RemarkResult } from "../../../../models/index";

/** Reference Engine remark() — remarkKey 형식 동일 */
export function createRemark(params: {
  ruleId: BusinessRuleId;
  category: RemarkCategory;
  severity: RemarkSeverity;
  title: string;
  message: string;
  score: number;
  recommendedAction: string;
  relationDirection?: RelationDirection;
  relatedLoanIds?: string[];
}): RemarkResult {
  const related = params.relatedLoanIds ?? [];
  const directionPart = params.relationDirection ?? "-";
  const relatedPart = related.length > 0 ? [...related].sort().join(",") : "-";
  const remarkKey = `${params.ruleId}:${directionPart}:${relatedPart}`;

  const result: RemarkResult = {
    remarkKey,
    ruleId: params.ruleId,
    category: params.category,
    severity: params.severity,
    title: params.title,
    message: params.message,
    score: params.score,
    recommendedAction: params.recommendedAction,
  };

  if (params.relationDirection !== undefined) {
    result.relationDirection = params.relationDirection;
  }
  if (related.length > 0) {
    result.relatedLoanIds = related;
  }

  return result;
}

export const RULE_A_SCORES = {
  R01: RULE_SCORE.R01,
  R02: RULE_SCORE.R02,
  R03: RULE_SCORE.R03,
} as const;

/** 동일 remarkKey면 relatedLoanIds 병합 (PRD §14.6) */
export function mergeRemarks(remarks: RemarkResult[]): RemarkResult[] {
  const byKey = new Map<string, RemarkResult>();

  for (const remark of remarks) {
    const existing = byKey.get(remark.remarkKey);
    if (!existing) {
      const cloned: RemarkResult = {
        remarkKey: remark.remarkKey,
        ruleId: remark.ruleId,
        category: remark.category,
        severity: remark.severity,
        title: remark.title,
        message: remark.message,
        score: remark.score,
        recommendedAction: remark.recommendedAction,
      };
      if (remark.relationDirection !== undefined) {
        cloned.relationDirection = remark.relationDirection;
      }
      if (remark.relatedLoanIds !== undefined) {
        cloned.relatedLoanIds = [...remark.relatedLoanIds];
      }
      if (remark.relatedPinPrefixes !== undefined) {
        cloned.relatedPinPrefixes = [...remark.relatedPinPrefixes];
      }
      if (remark.evidence !== undefined) {
        cloned.evidence = { ...remark.evidence };
      }
      byKey.set(remark.remarkKey, cloned);
      continue;
    }

    const mergedIds = new Set<string>([
      ...(existing.relatedLoanIds ?? []),
      ...(remark.relatedLoanIds ?? []),
    ]);
    if (mergedIds.size > 0) {
      existing.relatedLoanIds = [...mergedIds].sort();
    }
  }

  return [...byKey.values()];
}
