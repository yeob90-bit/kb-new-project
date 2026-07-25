/**
 * Reference Engine has_reached_anniversary —
 * 정확한 기념일 비교. 2/29 시작일은 비윤년 대상 연도에서 2/28로 귀속.
 */
export function hasReachedAnniversary(
  today: Date,
  startDate: Date,
  years: number,
): boolean {
  const targetYear = startDate.getFullYear() + years;
  const month = startDate.getMonth();
  const day = startDate.getDate();

  let threshold = new Date(targetYear, month, day);
  if (threshold.getMonth() !== month || threshold.getDate() !== day) {
    threshold = new Date(targetYear, month, 28);
  }

  const todayDateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const thresholdDateOnly = new Date(
    threshold.getFullYear(),
    threshold.getMonth(),
    threshold.getDate(),
  );

  return todayDateOnly.getTime() >= thresholdDateOnly.getTime();
}
