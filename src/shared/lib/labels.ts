import {
  ExceptionLevel,
  MaturityBucket,
  PriorityBand,
  ScheduleStatus,
} from "../../enum/index";

export const PRIORITY_BAND_LABEL: Record<PriorityBand, string> = {
  [PriorityBand.P1Immediate]: "우선순위 최상",
  [PriorityBand.P2Priority]: "우선순위 상",
  [PriorityBand.P3Prepare]: "우선순위 중",
  [PriorityBand.P4Routine]: "우선순위 하",
};

export const PRIORITY_BAND_ORDER: PriorityBand[] = [
  PriorityBand.P1Immediate,
  PriorityBand.P2Priority,
  PriorityBand.P3Prepare,
  PriorityBand.P4Routine,
];

export const EXCEPTION_LEVEL_LABEL: Record<ExceptionLevel, string> = {
  [ExceptionLevel.High]: "높음",
  [ExceptionLevel.Medium]: "중간",
  [ExceptionLevel.Low]: "낮음",
  [ExceptionLevel.None]: "없음",
};

export const SCHEDULE_STATUS_LABEL: Record<ScheduleStatus, string> = {
  [ScheduleStatus.Overdue]: "연체",
  [ScheduleStatus.Urgent]: "긴급",
  [ScheduleStatus.Warning]: "주의",
  [ScheduleStatus.Caution]: "경계",
  [ScheduleStatus.Normal]: "정상",
  [ScheduleStatus.Complete]: "완료",
  [ScheduleStatus.Invalid]: "무효",
};

export const MATURITY_BUCKET_LABEL: Record<MaturityBucket, string> = {
  [MaturityBucket.CurrentMonth]: "당월",
  [MaturityBucket.NextMonth]: "+1개월",
  [MaturityBucket.TwoMonthsLater]: "+2개월",
  [MaturityBucket.OutOfScope]: "분석범위 외",
  [MaturityBucket.InvalidDate]: "날짜오류",
};

export function formatDate(value: Date | null): string {
  if (!value) {
    return "-";
  }
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatScore(value: number | null): string {
  return value === null ? "-" : String(value);
}

export function formatDDay(value: number | null): string {
  if (value === null) {
    return "-";
  }
  if (value < 0) {
    return `D+${Math.abs(value)}`;
  }
  return `D-${value}`;
}
