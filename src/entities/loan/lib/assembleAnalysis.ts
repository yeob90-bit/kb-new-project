import {
  ExceptionLevel,
  MaturityBucket,
  PriorityBand,
  ScheduleStatus,
} from "../../../enum/index";
import type {
  AnalysisSummary,
  LoanAnalysisResult,
  LoanRecord,
  RemarkResult,
} from "../../../models/index";
import {
  isActiveMaturityBucket,
  resolveMaturityBucket,
} from "./maturityBucket";
import {
  calculateDDay,
  resolveScheduleScore,
  resolveScheduleStatus,
} from "./schedule";
import {
  calculatePriorityScoreBreakdown,
  resolveExceptionLevel,
  resolvePriorityBand,
} from "./scoring";
import { buildRecommendedActions } from "./recommendation";

/**
 * Reference Engine 결과 조립:
 * Active만 Score/Band, Exception은 Bucket 무관.
 * 비Active: dDay=null, scheduleStatus=INVALID(만기없음) 또는 NORMAL.
 */
export function assembleLoanAnalysisResult(
  loan: LoanRecord,
  remarks: RemarkResult[],
  today: Date,
): LoanAnalysisResult {
  const maturityBucket = resolveMaturityBucket(loan.maturityDate, today);
  const isInActiveWindow =
    isActiveMaturityBucket(maturityBucket) && !loan.disabledDuplicate;

  let dDay: number | null = null;
  let scheduleStatus: ScheduleStatus;

  if (isInActiveWindow && loan.maturityDate !== null) {
    dDay = calculateDDay(loan.maturityDate, today);
    scheduleStatus = resolveScheduleStatus(dDay);
  } else if (loan.maturityDate === null) {
    scheduleStatus = ScheduleStatus.Invalid;
  } else {
    scheduleStatus = ScheduleStatus.Normal;
  }

  let priorityScore: number | null = null;
  let priorityBand: PriorityBand | null = null;
  let scoreBreakdown = null;

  if (isInActiveWindow) {
    const scheduleScore = resolveScheduleScore(dDay) ?? 0;
    scoreBreakdown = calculatePriorityScoreBreakdown(scheduleScore, remarks);
    priorityScore = scoreBreakdown.total;
    priorityBand = resolvePriorityBand(scheduleStatus, priorityScore, remarks);
  }

  const exceptionLevel = resolveExceptionLevel(remarks);

  const partial = {
    loan,
    maturityBucket,
    isInActiveWindow,
    isActionable: isInActiveWindow,
    dDay,
    scheduleStatus,
    priorityScore,
    priorityBand,
    exceptionLevel,
    scoreBreakdown,
    remarks,
  };

  return {
    ...partial,
    recommendedActions: buildRecommendedActions(partial),
  };
}

function emptyBucketCounts(): Record<MaturityBucket, number> {
  return {
    [MaturityBucket.CurrentMonth]: 0,
    [MaturityBucket.NextMonth]: 0,
    [MaturityBucket.TwoMonthsLater]: 0,
    [MaturityBucket.OutOfScope]: 0,
    [MaturityBucket.InvalidDate]: 0,
  };
}

/** Reference Engine summarize() */
export function buildAnalysisSummary(
  results: LoanAnalysisResult[],
  inputRowCount: number,
): AnalysisSummary {
  const active = results.filter((result) => result.isInActiveWindow);
  const maturityBucketCounts = emptyBucketCounts();
  for (const result of results) {
    maturityBucketCounts[result.maturityBucket] += 1;
  }

  const scheduleStatusCounts: Partial<Record<ScheduleStatus, number>> = {};
  const priorityBandCounts: Partial<Record<PriorityBand, number>> = {};
  const exceptionLevelCounts: Partial<Record<ExceptionLevel, number>> = {};
  const ruleHitCounts: Record<string, number> = {};

  for (const result of active) {
    scheduleStatusCounts[result.scheduleStatus] =
      (scheduleStatusCounts[result.scheduleStatus] ?? 0) + 1;
    if (result.priorityBand !== null) {
      priorityBandCounts[result.priorityBand] =
        (priorityBandCounts[result.priorityBand] ?? 0) + 1;
    }
    exceptionLevelCounts[result.exceptionLevel] =
      (exceptionLevelCounts[result.exceptionLevel] ?? 0) + 1;
    for (const remark of result.remarks) {
      ruleHitCounts[remark.ruleId] = (ruleHitCounts[remark.ruleId] ?? 0) + 1;
    }
  }

  const invalidDateCount = results.filter(
    (result) => result.maturityBucket === MaturityBucket.InvalidDate,
  ).length;
  const outOfScopeCount = results.filter(
    (result) => result.maturityBucket === MaturityBucket.OutOfScope,
  ).length;
  const errorRowCount = results.filter(
    (result) => result.loan.validationIssues.length > 0,
  ).length;
  const realRemarkCount = active.filter(
    (result) => result.remarks.length > 0,
  ).length;

  let topScore: number | null = null;
  for (const result of active) {
    if (result.priorityScore === null) {
      continue;
    }
    if (topScore === null || result.priorityScore > topScore) {
      topScore = result.priorityScore;
    }
  }

  return {
    inputRowCount,
    validLoanCount: results.length - invalidDateCount,
    activeWindowCount: active.length,
    outOfScopeCount,
    invalidDateCount,
    errorRowCount,
    maturityBucketCounts,
    scheduleStatusCounts,
    priorityBandCounts,
    exceptionLevelCounts,
    realRemarkCount,
    ruleHitCounts,
    topScore,
  };
}
