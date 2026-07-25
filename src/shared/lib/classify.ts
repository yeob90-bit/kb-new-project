import {
  FACILITY_FUND_CODES,
  PRODUCT_CODE_MIN_LENGTH,
  PRODUCT_PURPOSE_SEGMENT_END,
  PRODUCT_PURPOSE_SEGMENT_START,
  WORKING_CAPITAL_CODES,
} from "../../constants/index";
import { BorrowerSegment, LoanPurpose, PolicyFundType } from "../../enum/index";

const FACILITY_SET = new Set<string>(FACILITY_FUND_CODES);
const WORKING_SET = new Set<string>(WORKING_CAPITAL_CODES);

/** Reference Engine classify_purpose — 상품코드 [2:4] */
export function classifyLoanPurpose(productCode: string): LoanPurpose | null {
  if (!productCode || productCode.length < PRODUCT_CODE_MIN_LENGTH) {
    return null;
  }
  const seg = productCode.slice(
    PRODUCT_PURPOSE_SEGMENT_START,
    PRODUCT_PURPOSE_SEGMENT_END,
  );
  if (FACILITY_SET.has(seg)) {
    return LoanPurpose.Facility;
  }
  if (WORKING_SET.has(seg)) {
    return LoanPurpose.Working;
  }
  return null;
}

export function classifyBorrowerSegment(
  value: string | null,
): BorrowerSegment | null {
  if (value === BorrowerSegment.Corporate) {
    return BorrowerSegment.Corporate;
  }
  if (value === BorrowerSegment.Retail) {
    return BorrowerSegment.Retail;
  }
  if (value === BorrowerSegment.LegalEntity) {
    return BorrowerSegment.LegalEntity;
  }
  return null;
}

export function classifyPolicyFundType(
  value: string | null,
): PolicyFundType | null {
  if (value === PolicyFundType.C1) {
    return PolicyFundType.C1;
  }
  if (value === PolicyFundType.C2) {
    return PolicyFundType.C2;
  }
  return null;
}
