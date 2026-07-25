import { describe, expect, it } from "vitest";
import { REFERENCE_DATES } from "../../src/constants/index";
import {
  ExceptionLevel,
  MaturityBucket,
  PriorityBand,
  ScheduleStatus,
} from "../../src/enum/index";
import { parseLocalDate } from "../../src/entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../src/entities/loan/lib/runAnalysis";
import fixtureBoundaryInvalid from "../../src/shared/fixtures/fixture_boundary_invalid.json";
import fixtureRuleValid33 from "../../src/shared/fixtures/fixture_rule_valid_33.json";

type RawRow = Record<string, unknown>;

const fixture33 = fixtureRuleValid33 as RawRow[];
const fixtureBoundary = fixtureBoundaryInvalid as RawRow[];
const today = parseLocalDate(REFERENCE_DATES.RULE_VALID);

function findResult(loanId: string) {
  const run = runAnalysis(fixture33, today, { hasPolicyFundColumn: true });
  const result = run.results.find((row) => row.loan.loanId === loanId);
  expect(result).toBeDefined();
  return result!;
}

describe("Acceptance — Schedule/Score/Band/Exception ≡ Reference", () => {
  it("fixture_rule_valid_33 summary가 Reference와 동일하다", () => {
    const { summary } = runAnalysis(fixture33, today, {
      hasPolicyFundColumn: true,
    });

    expect(summary.inputRowCount).toBe(33);
    expect(summary.validLoanCount).toBe(33);
    expect(summary.activeWindowCount).toBe(27);
    expect(summary.outOfScopeCount).toBe(6);
    expect(summary.invalidDateCount).toBe(0);
    expect(summary.errorRowCount).toBe(0);

    expect(summary.maturityBucketCounts).toEqual({
      [MaturityBucket.CurrentMonth]: 9,
      [MaturityBucket.NextMonth]: 4,
      [MaturityBucket.TwoMonthsLater]: 14,
      [MaturityBucket.OutOfScope]: 6,
      [MaturityBucket.InvalidDate]: 0,
    });

    expect(summary.scheduleStatusCounts).toEqual({
      [ScheduleStatus.Urgent]: 2,
      [ScheduleStatus.Warning]: 2,
      [ScheduleStatus.Caution]: 1,
      [ScheduleStatus.Normal]: 22,
    });

    expect(summary.priorityBandCounts).toEqual({
      [PriorityBand.P1Immediate]: 2,
      [PriorityBand.P2Priority]: 7,
      [PriorityBand.P3Prepare]: 9,
      [PriorityBand.P4Routine]: 9,
    });

    expect(summary.exceptionLevelCounts).toEqual({
      [ExceptionLevel.High]: 4,
      [ExceptionLevel.Medium]: 11,
      [ExceptionLevel.Low]: 1,
      [ExceptionLevel.None]: 11,
    });

    expect(summary.realRemarkCount).toBe(16);
    expect(summary.topScore).toBe(75);
  });

  it("L0025: D-2 Remark없음 → P1 + Exception NONE + score 50", () => {
    const result = findResult("L0025");
    expect(result.dDay).toBe(2);
    expect(result.scheduleStatus).toBe(ScheduleStatus.Urgent);
    expect(result.priorityScore).toBe(50);
    expect(result.priorityBand).toBe(PriorityBand.P1Immediate);
    expect(result.exceptionLevel).toBe(ExceptionLevel.None);
    expect(result.remarks).toHaveLength(0);
  });

  it("L0029: topScore 75 → P1_IMMEDIATE", () => {
    const result = findResult("L0029");
    expect(result.priorityScore).toBe(75);
    expect(result.priorityBand).toBe(PriorityBand.P1Immediate);
    expect(result.scheduleStatus).toBe(ScheduleStatus.Urgent);
  });

  it("OUT_OF_SCOPE L0021: score/band null, Remark·Exception 유지", () => {
    const result = findResult("L0021");
    expect(result.maturityBucket).toBe(MaturityBucket.OutOfScope);
    expect(result.isInActiveWindow).toBe(false);
    expect(result.priorityScore).toBeNull();
    expect(result.priorityBand).toBeNull();
    expect(result.dDay).toBeNull();
    expect(result.remarks.length).toBeGreaterThan(0);
    expect(result.exceptionLevel).toBe(ExceptionLevel.Medium);
  });

  it("정책자금 컬럼 없으면 L0029 점수가 8점 감소한다", () => {
    const withCol = runAnalysis(fixture33, today, {
      hasPolicyFundColumn: true,
    });
    const withoutCol = runAnalysis(fixture33, today, {
      hasPolicyFundColumn: false,
    });
    const a = withCol.results.find((r) => r.loan.loanId === "L0029")!;
    const b = withoutCol.results.find((r) => r.loan.loanId === "L0029")!;
    expect(a.priorityScore! - b.priorityScore!).toBe(8);
  });
});

describe("Acceptance — boundary Schedule (Reference 동일)", () => {
  it("B13~B17 D-Day/상태/점수가 Reference와 동일하다", () => {
    const run = runAnalysis(fixtureBoundary, today, {
      hasPolicyFundColumn: true,
    });
    const expectSchedule = (
      loanId: string,
      dDay: number,
      status: ScheduleStatus,
      score: number,
    ) => {
      const result = run.results.find((r) => r.loan.loanId === loanId)!;
      expect(result.dDay).toBe(dDay);
      expect(result.scheduleStatus).toBe(status);
      expect(result.priorityScore).toBe(score);
    };

    expectSchedule("B13", 14, ScheduleStatus.Caution, 30);
    expectSchedule("B14", 10, ScheduleStatus.Warning, 40);
    expectSchedule("B15", 7, ScheduleStatus.Urgent, 50);
    expectSchedule("B16", 0, ScheduleStatus.Urgent, 50);
    expectSchedule("B17", -1, ScheduleStatus.Overdue, 50);
  });

  it("B01: INVALID_DATE, schedule INVALID, score null, 행 유지", () => {
    const run = runAnalysis(fixtureBoundary, today, {
      hasPolicyFundColumn: true,
    });
    const b01 = run.results.find((r) => r.loan.loanId === "B01")!;
    expect(b01).toBeDefined();
    expect(b01.maturityBucket).toBe(MaturityBucket.InvalidDate);
    expect(b01.scheduleStatus).toBe(ScheduleStatus.Invalid);
    expect(b01.priorityScore).toBeNull();
    expect(b01.priorityBand).toBeNull();
    expect(b01.isInActiveWindow).toBe(false);
  });

  it("B12: 연도 경계 (기준일 2026-11-20) Reference 동일", () => {
    const b12 = fixtureBoundary.filter((row) => row["계좌번호"] === "B12");
    const run = runAnalysis(
      b12,
      parseLocalDate(REFERENCE_DATES.YEAR_BOUNDARY_B12),
      { hasPolicyFundColumn: true },
    );
    expect(run.results).toHaveLength(1);
    const result = run.results[0]!;
    expect(result.loan.loanId).toBe("B12");
    expect(result.maturityBucket).toBe(MaturityBucket.TwoMonthsLater);
    expect(result.isInActiveWindow).toBe(true);
    expect(result.dDay).toBe(56);
    expect(result.scheduleStatus).toBe(ScheduleStatus.Normal);
    expect(result.priorityScore).toBe(5);
    expect(result.priorityBand).toBe(PriorityBand.P4Routine);
    expect(result.exceptionLevel).toBe(ExceptionLevel.None);
  });
});
