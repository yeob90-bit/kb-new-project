import { describe, expect, it } from "vitest";
import { REFERENCE_DATES } from "../../src/constants/index";
import { BusinessRuleId, RelationDirection } from "../../src/enum/index";
import {
  isActiveMaturityBucket,
  parseLocalDate,
  resolveMaturityBucket,
} from "../../src/entities/loan/lib/maturityBucket";
import {
  countRuleHits,
  evaluateRulesB,
  getRemarksForLoan,
} from "../../src/entities/loan/lib/rules/index";
import { validateLoans } from "../../src/entities/loan/lib/validation/index";
import type { AnalysisCapabilities } from "../../src/types/capabilities";
import fixtureBoundaryInvalid from "../../src/shared/fixtures/fixture_boundary_invalid.json";
import fixtureRuleValid33 from "../../src/shared/fixtures/fixture_rule_valid_33.json";

type RawRow = Record<string, unknown>;

const fixture33 = fixtureRuleValid33 as RawRow[];
const fixtureBoundary = fixtureBoundaryInvalid as RawRow[];
const today = parseLocalDate(REFERENCE_DATES.RULE_VALID);

const CAPABILITIES_ON: AnalysisCapabilities = {
  canAnalyzePolicyFund: true,
  canAnalyzeCollateral: true,
  canAnalyzeRelationship: true,
  canAnalyzeAging: true,
};

const CAPABILITIES_POLICY_OFF: AnalysisCapabilities = {
  canAnalyzePolicyFund: false,
  canAnalyzeCollateral: true,
  canAnalyzeRelationship: true,
  canAnalyzeAging: true,
};

function runRulesB(
  rawRows: RawRow[],
  options?: {
    hasPolicyFundColumn?: boolean;
    capabilities?: AnalysisCapabilities;
  },
) {
  const hasPolicyFundColumn = options?.hasPolicyFundColumn ?? true;
  const capabilities = options?.capabilities ?? CAPABILITIES_ON;
  const loans = validateLoans(rawRows, { hasPolicyFundColumn });
  const result = evaluateRulesB(loans, today, capabilities);
  const activeLoanIds = new Set(
    loans
      .filter((loan) => {
        if (loan.disabledDuplicate) {
          return false;
        }
        return isActiveMaturityBucket(
          resolveMaturityBucket(loan.maturityDate, today),
        );
      })
      .map((loan) => loan.loanId),
  );
  return { loans, result, activeLoanIds };
}

describe("Acceptance — fixture_rule_valid_33 Rules B (R04~R08)", () => {
  it("R04: L0019↔L0020 동일 담보제공자 복수여신", () => {
    const { result } = runRulesB(fixture33);
    const l19 = getRemarksForLoan(result, "L0019").find(
      (r) => r.ruleId === BusinessRuleId.R04,
    );
    const l20 = getRemarksForLoan(result, "L0020").find(
      (r) => r.ruleId === BusinessRuleId.R04,
    );
    expect(l19).toBeDefined();
    expect(l20).toBeDefined();
    expect(l19!.relationDirection).toBe(RelationDirection.SharedProvider);
    expect(l19!.relatedLoanIds).toContain("L0020");
    expect(l20!.relatedLoanIds).toContain("L0019");
  });

  it("R04 Active Window 적중 건수는 2이다", () => {
    const { result, activeLoanIds } = runRulesB(fixture33);
    expect(
      countRuleHits(result, BusinessRuleId.R04, { loanIds: activeLoanIds }),
    ).toBe(2);
  });

  it("R05 Active Window 적중 건수는 4이다 (컬럼 있음)", () => {
    const { result, activeLoanIds } = runRulesB(fixture33);
    expect(
      countRuleHits(result, BusinessRuleId.R05, { loanIds: activeLoanIds }),
    ).toBe(4);
  });

  it("R05: 정책자금 컬럼 없으면 Active 적중 0건", () => {
    const { result, activeLoanIds } = runRulesB(fixture33, {
      hasPolicyFundColumn: false,
      capabilities: CAPABILITIES_POLICY_OFF,
    });
    expect(
      countRuleHits(result, BusinessRuleId.R05, { loanIds: activeLoanIds }),
    ).toBe(0);
  });

  it("R06 Active Window 적중 건수는 4이다", () => {
    const { result, activeLoanIds } = runRulesB(fixture33);
    expect(
      countRuleHits(result, BusinessRuleId.R06, { loanIds: activeLoanIds }),
    ).toBe(4);
  });

  it("R06: OUT_OF_SCOPE L0021에도 Remark는 유지된다", () => {
    const { result, activeLoanIds } = runRulesB(fixture33);
    expect(activeLoanIds.has("L0021")).toBe(false);
    expect(
      getRemarksForLoan(result, "L0021").some(
        (r) => r.ruleId === BusinessRuleId.R06,
      ),
    ).toBe(true);
  });

  it("R07 Active Window 적중 건수는 1이다", () => {
    const { result, activeLoanIds } = runRulesB(fixture33);
    expect(
      countRuleHits(result, BusinessRuleId.R07, { loanIds: activeLoanIds }),
    ).toBe(1);
  });

  it("R07: OUT_OF_SCOPE L0023에도 Remark는 유지된다", () => {
    const { result, activeLoanIds } = runRulesB(fixture33);
    expect(activeLoanIds.has("L0023")).toBe(false);
    expect(
      getRemarksForLoan(result, "L0023").some(
        (r) => r.ruleId === BusinessRuleId.R07,
      ),
    ).toBe(true);
  });

  it("R08: L0033 상품코드 미분류", () => {
    const { result, activeLoanIds } = runRulesB(fixture33);
    expect(
      getRemarksForLoan(result, "L0033").some(
        (r) => r.ruleId === BusinessRuleId.R08,
      ),
    ).toBe(true);
    expect(
      countRuleHits(result, BusinessRuleId.R08, { loanIds: activeLoanIds }),
    ).toBe(1);
  });

  it("L0029는 R05 + R07을 가진다", () => {
    const remarks = getRemarksForLoan(runRulesB(fixture33).result, "L0029");
    expect(remarks.some((r) => r.ruleId === BusinessRuleId.R05)).toBe(true);
    expect(remarks.some((r) => r.ruleId === BusinessRuleId.R07)).toBe(true);
  });
});

describe("Acceptance — boundary aging R06/R07 (B18~B21)", () => {
  it("B18 시설 정확 3년 적용, B19 하루 전 미적용", () => {
    const { result } = runRulesB(fixtureBoundary);
    expect(
      getRemarksForLoan(result, "B18").some(
        (r) => r.ruleId === BusinessRuleId.R06,
      ),
    ).toBe(true);
    expect(
      getRemarksForLoan(result, "B19").some(
        (r) => r.ruleId === BusinessRuleId.R06,
      ),
    ).toBe(false);
  });

  it("B20 운전 정확 5년 적용, B21 하루 전 미적용", () => {
    const { result } = runRulesB(fixtureBoundary);
    expect(
      getRemarksForLoan(result, "B20").some(
        (r) => r.ruleId === BusinessRuleId.R07,
      ),
    ).toBe(true);
    expect(
      getRemarksForLoan(result, "B21").some(
        (r) => r.ruleId === BusinessRuleId.R07,
      ),
    ).toBe(false);
  });
});
