import {
  ValidationIssueCode,
  ValidationSeverity,
} from "../../../../enum/index";
import type { DataValidationIssue } from "../../../../models/index";
import { createValidationIssue } from "./createIssue";

/** V01 — 필수값 검증 (행 단위: 계좌번호/고객명/KB-PIN/상품코드) */
export function validateV01RequiredValues(input: {
  rowNumber: number;
  loanId: string;
  borrowerName: string;
  borrowerPinRaw: string;
  productCode: string;
}): DataValidationIssue[] {
  const issues: DataValidationIssue[] = [];
  const fields: Array<{ field: string; value: string }> = [
    { field: "계좌번호", value: input.loanId },
    { field: "고객명", value: input.borrowerName },
    { field: "KB-PIN", value: input.borrowerPinRaw },
    { field: "상품코드", value: input.productCode },
  ];

  for (const { field, value } of fields) {
    if (!value) {
      issues.push(
        createValidationIssue({
          rowNumber: input.rowNumber,
          loanId: input.loanId,
          field,
          code: ValidationIssueCode.MissingRequiredValue,
          severity: ValidationSeverity.Error,
          message: `${field} 값이 비어있음`,
        }),
      );
    }
  }

  return issues;
}
