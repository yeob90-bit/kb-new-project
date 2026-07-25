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
  evaluateRulesA,
  getRemarksForLoan,
} from "../../src/entities/loan/lib/rules/index";
import { validateLoans } from "../../src/entities/loan/lib/validation/index";
import fixtureRuleValid33 from "../../src/shared/fixtures/fixture_rule_valid_33.json";

type RawRow = Record<string, unknown>;

const fixture = fixtureRuleValid33 as RawRow[];
const today = parseLocalDate(REFERENCE_DATES.RULE_VALID);

function runRulesA() {
  const loans = validateLoans(fixture, { hasPolicyFundColumn: true });
  const result = evaluateRulesA(loans, today);
  const activeLoanIds = new Set(
    loans
      .filter((loan) => {
        if (loan.disabledDuplicate) {
          return false;
        }
        const bucket = resolveMaturityBucket(loan.maturityDate, today);
        return isActiveMaturityBucket(bucket);
      })
      .map((loan) => loan.loanId),
  );
  return { loans, result, activeLoanIds };
}

describe("Acceptance — fixture_rule_valid_33 Rules A (R01/R02/R03)", () => {
  it("fixture 33건을 로드한다", () => {
    expect(fixture).toHaveLength(33);
  });

  it("R01: L0031↔L0032 양방향 동일 차주 추가만기", () => {
    const { result } = runRulesA();
    const l31 = getRemarksForLoan(result, "L0031");
    const l32 = getRemarksForLoan(result, "L0032");

    const r01_31 = l31.find((r) => r.ruleId === BusinessRuleId.R01);
    const r01_32 = l32.find((r) => r.ruleId === BusinessRuleId.R01);

    expect(r01_31).toBeDefined();
    expect(r01_32).toBeDefined();
    expect(r01_31!.relationDirection).toBe(
      RelationDirection.SameBorrowerMultiMaturity,
    );
    expect(r01_31!.relatedLoanIds).toContain("L0032");
    expect(r01_32!.relatedLoanIds).toContain("L0031");
  });

  it("R01 Active Window 적중 건수는 2이다", () => {
    const { result, activeLoanIds } = runRulesA();
    expect(
      countRuleHits(result, BusinessRuleId.R01, { loanIds: activeLoanIds }),
    ).toBe(2);
  });

  it("R02 Active Window 적중 건수는 9이다", () => {
    const { result, activeLoanIds } = runRulesA();
    expect(
      countRuleHits(result, BusinessRuleId.R02, { loanIds: activeLoanIds }),
    ).toBe(9);
  });

  it("R03: L0017↔L0018 양방향 교차관계", () => {
    const { result } = runRulesA();
    const l17 = getRemarksForLoan(result, "L0017");
    const l18 = getRemarksForLoan(result, "L0018");

    const r03_17 = l17.find((r) => r.ruleId === BusinessRuleId.R03);
    const r03_18 = l18.find((r) => r.ruleId === BusinessRuleId.R03);

    expect(r03_17).toBeDefined();
    expect(r03_18).toBeDefined();
    expect(r03_17!.relationDirection).toBe(
      RelationDirection.ProviderToBorrower,
    );
    expect(r03_18!.relationDirection).toBe(
      RelationDirection.BorrowerAsProvider,
    );
    expect(r03_17!.relatedLoanIds).toContain("L0018");
    expect(r03_18!.relatedLoanIds).toContain("L0017");
  });

  it("R03 Active Window 적중 건수는 2이다 (1쌍 양방향)", () => {
    const { result, activeLoanIds } = runRulesA();
    expect(
      countRuleHits(result, BusinessRuleId.R03, { loanIds: activeLoanIds }),
    ).toBe(2);
  });

  it("L0017은 R02와 R03을 함께 가진다", () => {
    const { result } = runRulesA();
    const remarks = getRemarksForLoan(result, "L0017");
    expect(remarks.some((r) => r.ruleId === BusinessRuleId.R02)).toBe(true);
    expect(remarks.some((r) => r.ruleId === BusinessRuleId.R03)).toBe(true);
  });
});
