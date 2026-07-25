import {
  PRIORITY_BAND_SCORE,
  PRIORITY_SCORE_CAP,
} from "../../../constants/index";
import {
  ExceptionLevel,
  PriorityBand,
  RemarkCategory,
  RemarkSeverity,
  ScheduleStatus,
} from "../../../enum/index";
import type { PriorityScoreBreakdown, RemarkResult } from "../../../models/index";

const SEVERITY_RANK: Record<RemarkSeverity, number> = {
  [RemarkSeverity.Critical]: 4,
  [RemarkSeverity.High]: 3,
  [RemarkSeverity.Medium]: 2,
  [RemarkSeverity.Low]: 1,
  [RemarkSeverity.Info]: 0,
};

/** PRD §14.2 B / Reference exception_level — Bucket 무관 */
export function resolveExceptionLevel(remarks: RemarkResult[]): ExceptionLevel {
  if (remarks.length === 0) {
    return ExceptionLevel.None;
  }
  const top = remarks.reduce((best, remark) =>
    SEVERITY_RANK[remark.severity] > SEVERITY_RANK[best.severity] ? remark : best,
  );
  if (
    top.severity === RemarkSeverity.Critical ||
    top.severity === RemarkSeverity.High
  ) {
    return ExceptionLevel.High;
  }
  if (top.severity === RemarkSeverity.Medium) {
    return ExceptionLevel.Medium;
  }
  return ExceptionLevel.Low;
}

function sumScoresByCategories(
  remarks: RemarkResult[],
  categories: readonly RemarkCategory[],
): number {
  const categorySet = new Set(categories);
  return remarks
    .filter((remark) => categorySet.has(remark.category))
    .reduce((sum, remark) => sum + remark.score, 0);
}

/**
 * Priority Score breakdown — Active Window 전용.
 * Reference: min(cap, category sums) + scheduleScore
 */
export function calculatePriorityScoreBreakdown(
  scheduleScore: number,
  remarks: RemarkResult[],
): PriorityScoreBreakdown {
  const collateralScore = Math.min(
    PRIORITY_SCORE_CAP.COLLATERAL,
    sumScoresByCategories(remarks, [
      RemarkCategory.Collateral,
      RemarkCategory.Relationship,
    ]),
  );
  const policyScore = Math.min(
    PRIORITY_SCORE_CAP.POLICY,
    sumScoresByCategories(remarks, [RemarkCategory.PolicyFund]),
  );
  const agingScore = Math.min(
    PRIORITY_SCORE_CAP.AGING,
    sumScoresByCategories(remarks, [
      RemarkCategory.Aging,
      RemarkCategory.DataQuality,
    ]),
  );
  const scheduleExtraScore = Math.min(
    PRIORITY_SCORE_CAP.SCHEDULE_EXTRA,
    sumScoresByCategories(remarks, [RemarkCategory.Schedule]),
  );
  const total = Math.min(
    PRIORITY_SCORE_CAP.TOTAL,
    scheduleScore +
      collateralScore +
      policyScore +
      agingScore +
      scheduleExtraScore,
  );

  return {
    scheduleScore,
    collateralScore,
    policyScore,
    agingScore,
    scheduleExtraScore,
    total,
  };
}

/** PRD §14.2 A / Reference priority_band — P1→P4 첫 만족 */
export function resolvePriorityBand(
  scheduleStatus: ScheduleStatus,
  priorityScore: number | null,
  remarks: RemarkResult[],
): PriorityBand {
  const hasHigh = remarks.some(
    (remark) => remark.severity === RemarkSeverity.High,
  );

  if (
    scheduleStatus === ScheduleStatus.Urgent ||
    scheduleStatus === ScheduleStatus.Overdue
  ) {
    return PriorityBand.P1Immediate;
  }
  if (
    priorityScore !== null &&
    priorityScore >= PRIORITY_BAND_SCORE.P1_MIN
  ) {
    return PriorityBand.P1Immediate;
  }
  if (scheduleStatus === ScheduleStatus.Warning && hasHigh) {
    return PriorityBand.P1Immediate;
  }
  if (scheduleStatus === ScheduleStatus.Warning) {
    return PriorityBand.P2Priority;
  }
  if (scheduleStatus === ScheduleStatus.Caution) {
    return PriorityBand.P2Priority;
  }
  if (
    priorityScore !== null &&
    priorityScore >= PRIORITY_BAND_SCORE.P2_MIN &&
    priorityScore < PRIORITY_BAND_SCORE.P1_MIN
  ) {
    return PriorityBand.P2Priority;
  }
  if (hasHigh) {
    return PriorityBand.P2Priority;
  }
  if (remarks.length > 0) {
    return PriorityBand.P3Prepare;
  }
  return PriorityBand.P4Routine;
}
