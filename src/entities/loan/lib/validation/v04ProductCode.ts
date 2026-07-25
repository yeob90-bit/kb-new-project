import { PRODUCT_CODE_MIN_LENGTH } from "../../../../constants/index";
import {
  ValidationIssueCode,
  ValidationSeverity,
} from "../../../../enum/index";
import type { DataValidationIssue } from "../../../../models/index";
import { createValidationIssue } from "./createIssue";

/** V04 — 상품코드 4자리 미만 검증 */
export function validateV04ProductCode(input: {
  rowNumber: number;
  loanId: string;
  productCode: string;
}): DataValidationIssue[] {
  if (input.productCode && input.productCode.length < PRODUCT_CODE_MIN_LENGTH) {
    return [
      createValidationIssue({
        rowNumber: input.rowNumber,
        loanId: input.loanId,
        field: "상품코드",
        code: ValidationIssueCode.InvalidProductCode,
        severity: ValidationSeverity.Warning,
        message: `상품코드 길이 부족(4자리 미만) - 원본값: ${input.productCode}`,
      }),
    ];
  }
  return [];
}
