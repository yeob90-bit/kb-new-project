import { SCHEDULE_DDAY, SCHEDULE_SCORE } from "../../../constants/index";
import { ScheduleStatus } from "../../../enum/index";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** 로컬 날짜 기준 D-Day (시간 제거) — Reference: (maturity - today).days */
export function calculateDDay(maturityDate: Date, today: Date): number {
  const maturityUtc = Date.UTC(
    maturityDate.getFullYear(),
    maturityDate.getMonth(),
    maturityDate.getDate(),
  );
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  return Math.round((maturityUtc - todayUtc) / MS_PER_DAY);
}

/** PRD §13.9 / Reference schedule_status */
export function resolveScheduleStatus(dDay: number | null): ScheduleStatus {
  if (dDay === null) {
    return ScheduleStatus.Invalid;
  }
  if (dDay < 0) {
    return ScheduleStatus.Overdue;
  }
  if (dDay <= SCHEDULE_DDAY.URGENT_MAX) {
    return ScheduleStatus.Urgent;
  }
  if (dDay <= SCHEDULE_DDAY.WARNING_MAX) {
    return ScheduleStatus.Warning;
  }
  if (dDay <= SCHEDULE_DDAY.CAUTION_MAX) {
    return ScheduleStatus.Caution;
  }
  return ScheduleStatus.Normal;
}

/** PRD §13.9 / Reference schedule_score — null dDay → null */
export function resolveScheduleScore(dDay: number | null): number | null {
  if (dDay === null) {
    return null;
  }
  if (dDay < 0) {
    return SCHEDULE_SCORE.OVERDUE;
  }
  if (dDay <= SCHEDULE_DDAY.URGENT_MAX) {
    return SCHEDULE_SCORE.URGENT;
  }
  if (dDay <= SCHEDULE_DDAY.WARNING_MAX) {
    return SCHEDULE_SCORE.WARNING;
  }
  if (dDay <= SCHEDULE_DDAY.CAUTION_MAX) {
    return SCHEDULE_SCORE.CAUTION;
  }
  if (dDay <= SCHEDULE_DDAY.NORMAL_NEAR_MAX) {
    return SCHEDULE_SCORE.NORMAL_NEAR;
  }
  if (dDay <= SCHEDULE_DDAY.NORMAL_MID_MAX) {
    return SCHEDULE_SCORE.NORMAL_MID;
  }
  return SCHEDULE_SCORE.NORMAL_FAR;
}
