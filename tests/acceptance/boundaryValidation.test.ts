import { describe, expect, it } from "vitest";
import { REFERENCE_DATES } from "../../src/constants/index";
import {
  ValidationIssueCode,
  ValidationSeverity,
} from "../../src/enum/index";
import { validateLoans } from "../../src/entities/loan/lib/validation/index";
import fixtureBoundaryInvalid from "../../src/shared/fixtures/fixture_boundary_invalid.json";
import { pinPrefix } from "../../src/shared/lib/pin";

type RawRow = Record<string, unknown>;

const fixture = fixtureBoundaryInvalid as RawRow[];

function findByLoanId(loanId: string) {
  const loans = validateLoans(fixture, { hasPolicyFundColumn: true });
  return loans.filter((l) => l.loanId === loanId);
}

describe("Acceptance — fixture_boundary_invalid Validation (Group A)", () => {
  it("fixture는 21건이며 기준일 상수는 RULE_VALID를 사용한다", () => {
    expect(fixture).toHaveLength(21);
    expect(REFERENCE_DATES.RULE_VALID).toBe("2026-08-03");
  });

  it("오류 행도 삭제되지 않고 전체 건수가 유지된다", () => {
    const loans = validateLoans(fixture, { hasPolicyFundColumn: true });
    expect(loans).toHaveLength(21);
  });

  it("B01: 만기일 누락 → INVALID_DATE ERROR, maturityDate=null, 행 유지", () => {
    const [b01] = findByLoanId("B01");
    expect(b01).toBeDefined();
    expect(b01!.maturityDate).toBeNull();
    expect(
      b01!.validationIssues.some(
        (i) =>
          i.code === ValidationIssueCode.InvalidDate &&
          i.field === "만기년월일" &&
          i.severity === ValidationSeverity.Error,
      ),
    ).toBe(true);
  });

  it("B02: 신규년월일 누락 → WARNING, maturityDate는 정상", () => {
    const [b02] = findByLoanId("B02");
    expect(b02).toBeDefined();
    expect(b02!.maturityDate).not.toBeNull();
    expect(b02!.firstExecutionDate).toBeNull();
    const warnings = b02!.validationIssues.filter(
      (i) =>
        i.field === "신규년월일" &&
        i.code === ValidationIssueCode.InvalidDate &&
        i.severity === ValidationSeverity.Warning,
    );
    expect(warnings).toHaveLength(1);
  });

  it("B03: 잘못된 날짜(20260230) → INVALID_DATE ERROR", () => {
    const [b03] = findByLoanId("B03");
    expect(b03).toBeDefined();
    expect(b03!.maturityDate).toBeNull();
    expect(
      b03!.validationIssues.some(
        (i) =>
          i.code === ValidationIssueCode.InvalidDate &&
          i.field === "만기년월일" &&
          i.severity === ValidationSeverity.Error,
      ),
    ).toBe(true);
  });

  it("B04: KB-PIN 10자리 미만 → INVALID_PIN WARNING, prefix=null", () => {
    const [b04] = findByLoanId("B04");
    expect(b04).toBeDefined();
    expect(b04!.borrowerPinPrefix).toBeNull();
    expect(
      b04!.validationIssues.some(
        (i) =>
          i.code === ValidationIssueCode.InvalidPin &&
          i.severity === ValidationSeverity.Warning,
      ),
    ).toBe(true);
  });

  it("B05: 하이픈 없는 PIN → 정상 prefix 생성", () => {
    const [b05] = findByLoanId("B05");
    expect(b05).toBeDefined();
    expect(b05!.borrowerPinPrefix).toBe(pinPrefix("100050000100001"));
    expect(
      b05!.validationIssues.some((i) => i.code === ValidationIssueCode.InvalidPin),
    ).toBe(false);
  });

  it("B06: 앞자리 0 PIN → 정상 prefix 생성", () => {
    const [b06] = findByLoanId("B06");
    expect(b06).toBeDefined();
    expect(b06!.borrowerPinPrefix).toBe(pinPrefix("01006-00000-00001"));
    expect(
      b06!.validationIssues.some((i) => i.code === ValidationIssueCode.InvalidPin),
    ).toBe(false);
  });

  it("B07: 상품코드 4자리 미만 → V04 INVALID_PRODUCT_CODE WARNING", () => {
    const [b07] = findByLoanId("B07");
    expect(b07).toBeDefined();
    expect(b07!.productCode).toBe("25");
    expect(
      b07!.validationIssues.some(
        (i) =>
          i.code === ValidationIssueCode.InvalidProductCode &&
          i.severity === ValidationSeverity.Warning,
      ),
    ).toBe(true);
  });

  it("B08×2: 중복 계좌번호 → 양쪽 disabledDuplicate + DUPLICATE_LOAN_ID", () => {
    const dups = findByLoanId("B08");
    expect(dups).toHaveLength(2);
    expect(dups.every((d) => d.disabledDuplicate === true)).toBe(true);
    expect(
      dups.every((d) =>
        d.validationIssues.some(
          (i) =>
            i.code === ValidationIssueCode.DuplicateLoanId &&
            i.severity === ValidationSeverity.Error,
        ),
      ),
    ).toBe(true);
  });

  it("B10: 담보제공자 명칭만 없어도 검증 오류 없음(PIN 존재)", () => {
    const [b10] = findByLoanId("B10");
    expect(b10).toBeDefined();
    expect(b10!.collateralProviderPinRaw).not.toBeNull();
    expect(b10!.collateralProviderPinPrefix).not.toBeNull();
    expect(
      b10!.validationIssues.filter((i) => i.severity === ValidationSeverity.Error),
    ).toHaveLength(0);
  });

  it("B11: 만기일 < 최초실행일 → UNSUPPORTED_VALUE WARNING, 행 유지", () => {
    const [b11] = findByLoanId("B11");
    expect(b11).toBeDefined();
    expect(b11!.maturityDate).not.toBeNull();
    expect(b11!.firstExecutionDate).not.toBeNull();
    expect(
      b11!.validationIssues.some(
        (i) =>
          i.code === ValidationIssueCode.UnsupportedValue &&
          i.severity === ValidationSeverity.Warning,
      ),
    ).toBe(true);
  });
});
