import type { LoanRecord } from "../../../../models/index";
import {
  cellToOptionalString,
  cellToString,
} from "../../../../shared/lib/cellValue";
import {
  classifyBorrowerSegment,
  classifyLoanPurpose,
  classifyPolicyFundType,
} from "../../../../shared/lib/classify";
import { validateV01RequiredValues } from "./v01Required";
import { validateV02Dates } from "./v02Dates";
import { validateV03Pin } from "./v03Pin";
import { validateV04ProductCode } from "./v04ProductCode";
import { validateV05DuplicateLoanId } from "./v05DuplicateLoanId";

export interface ValidateLoansOptions {
  hasPolicyFundColumn?: boolean;
}

type RawFixtureRow = Record<string, unknown>;

/**
 * RAW 행 배열에 V01~V05를 적용해 LoanRecord[]를 만든다.
 * Excel Parser는 포함하지 않는다 — Fixture/이미 추출된 row object용.
 */
export function validateLoans(
  rawRows: RawFixtureRow[],
  options: ValidateLoansOptions = {},
): LoanRecord[] {
  const hasPolicyFundColumn = options.hasPolicyFundColumn ?? true;

  const loans = rawRows.map((raw, index) =>
    validateSingleRawRow(index + 1, raw, hasPolicyFundColumn),
  );

  validateV05DuplicateLoanId(loans);
  return loans;
}

function validateSingleRawRow(
  rowNumber: number,
  raw: RawFixtureRow,
  hasPolicyFundColumn: boolean,
): LoanRecord {
  const loanId = cellToString(raw["계좌번호"]);
  const borrowerName = cellToString(raw["고객명"]);
  const borrowerPinRaw = cellToString(raw["KB-PIN"]);
  const productCode = cellToString(raw["상품코드"]);
  const productName = cellToString(raw["상품명"]);
  const collateralProviderPinRaw = cellToOptionalString(
    raw["담보제공자KB-PIN"],
  );
  const collateralProviderName = cellToOptionalString(raw["담보제공자명"]);
  const exposure = cellToOptionalString(raw["익스포져현황"]);
  const businessStatus = cellToOptionalString(raw["휴폐업"]);
  const policyRaw = hasPolicyFundColumn
    ? cellToOptionalString(raw["정책자금구분"])
    : null;

  const v01 = validateV01RequiredValues({
    rowNumber,
    loanId,
    borrowerName,
    borrowerPinRaw,
    productCode,
  });

  const v02 = validateV02Dates({
    rowNumber,
    loanId,
    maturityDateRaw: raw["만기년월일"],
    firstExecutionDateRaw: raw["신규년월일"],
  });

  const v03 = validateV03Pin({
    rowNumber,
    loanId,
    borrowerPinRaw,
    collateralProviderPinRaw,
  });

  const v04 = validateV04ProductCode({
    rowNumber,
    loanId,
    productCode,
  });

  return {
    sourceRowNumber: rowNumber,
    loanId,
    borrowerName,
    borrowerPinRaw,
    borrowerPinPrefix: v03.borrowerPinPrefix,
    productCode,
    productName,
    loanPurpose: classifyLoanPurpose(productCode),
    firstExecutionDate: v02.firstExecutionDate,
    maturityDate: v02.maturityDate,
    borrowerSegment: classifyBorrowerSegment(exposure),
    businessStatus,
    collateralProviderPinRaw,
    collateralProviderPinPrefix: v03.collateralProviderPinPrefix,
    collateralProviderName,
    policyFundType: classifyPolicyFundType(policyRaw),
    validationIssues: [...v01, ...v02.issues, ...v03.issues, ...v04],
    disabledDuplicate: false,
  };
}
