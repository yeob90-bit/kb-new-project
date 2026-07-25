import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseLocalDate } from "../../src/entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../src/entities/loan/lib/runAnalysis";
import fixture33 from "../../src/shared/fixtures/fixture_rule_valid_33.json";
import fixtureBoundary from "../../src/shared/fixtures/fixture_boundary_invalid.json";
import fixtureShowcase from "../../src/shared/fixtures/fixture_showcase.json";

type RawRow = Record<string, unknown>;

interface CompactLoan {
  loanId: string;
  borrowerName: string;
  maturityDate: string | null;
  maturityBucket: string;
  isInActiveWindow: boolean;
  dDay: number | null;
  scheduleStatus: string;
  priorityScore: number | null;
  priorityBand: string | null;
  exceptionLevel: string;
  remarkCount: number;
  remarks: string[];
  disabledDuplicate: boolean;
  validationIssueCodes: string[];
}

interface CompactCase {
  today?: string;
  summary: {
    inputRowCount: number;
    validLoanCount: number;
    activeWindowCount: number;
    outOfScopeCount: number;
    invalidDateCount: number;
    errorRowCount: number;
    realRemarkCount: number;
    topScore: number | null;
  };
  results: CompactLoan[];
}

type GoldenRoot = Record<string, CompactCase>;

const goldenPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../golden/ref_parity.json",
);

function formatLocalDate(value: Date | null): string | null {
  if (value === null) {
    return null;
  }
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function compact(run: ReturnType<typeof runAnalysis>): CompactCase {
  const results = run.results.map((r) => ({
    loanId: r.loan.loanId,
    borrowerName: r.loan.borrowerName,
    maturityDate: formatLocalDate(r.loan.maturityDate),
    maturityBucket: r.maturityBucket,
    isInActiveWindow: r.isInActiveWindow,
    dDay: r.dDay,
    scheduleStatus: r.scheduleStatus,
    priorityScore: r.priorityScore,
    priorityBand: r.priorityBand,
    exceptionLevel: r.exceptionLevel,
    remarkCount: r.remarks.length,
    remarks: [...r.remarks.map((m) => m.title)].sort(),
    disabledDuplicate: r.loan.disabledDuplicate,
    validationIssueCodes: [
      ...new Set(r.loan.validationIssues.map((i) => i.code)),
    ].sort(),
  }));
  results.sort((a, b) => a.loanId.localeCompare(b.loanId));

  return {
    summary: {
      inputRowCount: run.summary.inputRowCount,
      validLoanCount: run.summary.validLoanCount,
      activeWindowCount: run.summary.activeWindowCount,
      outOfScopeCount: run.summary.outOfScopeCount,
      invalidDateCount: run.summary.invalidDateCount,
      errorRowCount: run.summary.errorRowCount,
      realRemarkCount: run.summary.realRemarkCount,
      topScore: run.summary.topScore,
    },
    results,
  };
}

function assertParity(name: string, actual: CompactCase, expected: CompactCase) {
  expect(actual.summary, `${name} summary`).toEqual({
    inputRowCount: expected.summary.inputRowCount,
    validLoanCount: expected.summary.validLoanCount,
    activeWindowCount: expected.summary.activeWindowCount,
    outOfScopeCount: expected.summary.outOfScopeCount,
    invalidDateCount: expected.summary.invalidDateCount,
    errorRowCount: expected.summary.errorRowCount,
    realRemarkCount: expected.summary.realRemarkCount,
    topScore: expected.summary.topScore,
  });

  expect(
    actual.results.map((r) => r.loanId),
    `${name} loanId set`,
  ).toEqual(expected.results.map((r) => r.loanId));

  for (let i = 0; i < expected.results.length; i += 1) {
    expect(actual.results[i], `${name} ${expected.results[i]?.loanId}`).toEqual(
      expected.results[i],
    );
  }
}

function requireCase(golden: GoldenRoot, key: string): CompactCase {
  const value = golden[key];
  if (!value) {
    throw new Error(`golden missing case: ${key}`);
  }
  return value;
}

describe("Acceptance — Sprint12 Reference Engine 전수 패리티", () => {
  const golden = JSON.parse(readFileSync(goldenPath, "utf8")) as GoldenRoot;

  it("fixture_rule_valid_33 ≡ Reference (2026-08-03)", () => {
    const actual = compact(
      runAnalysis(fixture33 as RawRow[], parseLocalDate("2026-08-03"), {
        hasPolicyFundColumn: true,
      }),
    );
    assertParity(
      "fixture_rule_valid_33",
      actual,
      requireCase(golden, "fixture_rule_valid_33"),
    );
  });

  it("fixture_boundary_invalid Group A ≡ Reference (2026-08-03)", () => {
    const actual = compact(
      runAnalysis(fixtureBoundary as RawRow[], parseLocalDate("2026-08-03"), {
        hasPolicyFundColumn: true,
      }),
    );
    assertParity(
      "fixture_boundary_invalid_A",
      actual,
      requireCase(golden, "fixture_boundary_invalid_A"),
    );
  });

  it("fixture_boundary B12 ≡ Reference (2026-11-20)", () => {
    const b12 = (fixtureBoundary as RawRow[]).filter(
      (row) => row["계좌번호"] === "B12",
    );
    const actual = compact(
      runAnalysis(b12, parseLocalDate("2026-11-20"), {
        hasPolicyFundColumn: true,
      }),
    );
    assertParity(
      "fixture_boundary_B12",
      actual,
      requireCase(golden, "fixture_boundary_B12"),
    );
  });

  it("fixture_showcase ≡ Reference (2026-08-03)", () => {
    const actual = compact(
      runAnalysis(fixtureShowcase as RawRow[], parseLocalDate("2026-08-03"), {
        hasPolicyFundColumn: true,
      }),
    );
    assertParity(
      "fixture_showcase",
      actual,
      requireCase(golden, "fixture_showcase"),
    );
  });
});
