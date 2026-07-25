import {
  ValidationIssueCode,
  ValidationSeverity,
} from "../../../../enum/index";
import type { DataValidationIssue } from "../../../../models/index";
import {
  hasDateRawValue,
  parseDateValue,
} from "../../../../shared/lib/parseDate";
import { createValidationIssue } from "./createIssue";

export interface V02DateValidationResult {
  maturityDate: Date | null;
  firstExecutionDate: Date | null;
  issues: DataValidationIssue[];
}

/** V02 — 날짜 검증 (+ 만기 < 신규 UNSUPPORTED_VALUE) */
export function validateV02Dates(input: {
  rowNumber: number;
  loanId: string;
  maturityDateRaw: unknown;
  firstExecutionDateRaw: unknown;
}): V02DateValidationResult {
  const issues: DataValidationIssue[] = [];

  const maturityDate = parseDateValue(input.maturityDateRaw);
  if (hasDateRawValue(input.maturityDateRaw) && maturityDate === null) {
    issues.push(
      createValidationIssue({
        rowNumber: input.rowNumber,
        loanId: input.loanId,
        field: "만기년월일",
        code: ValidationIssueCode.InvalidDate,
        severity: ValidationSeverity.Error,
        message: `만기년월일 파싱 실패 (원본값: ${String(input.maturityDateRaw)})`,
      }),
    );
  } else if (!hasDateRawValue(input.maturityDateRaw)) {
    issues.push(
      createValidationIssue({
        rowNumber: input.rowNumber,
        loanId: input.loanId,
        field: "만기년월일",
        code: ValidationIssueCode.InvalidDate,
        severity: ValidationSeverity.Error,
        message: "만기년월일 값이 비어있음",
      }),
    );
  }

  const firstExecutionDate = parseDateValue(input.firstExecutionDateRaw);
  if (
    hasDateRawValue(input.firstExecutionDateRaw) &&
    firstExecutionDate === null
  ) {
    issues.push(
      createValidationIssue({
        rowNumber: input.rowNumber,
        loanId: input.loanId,
        field: "신규년월일",
        code: ValidationIssueCode.InvalidDate,
        severity: ValidationSeverity.Warning,
        message: `신규년월일 파싱 실패 (원본값: ${String(input.firstExecutionDateRaw)})`,
      }),
    );
  } else if (!hasDateRawValue(input.firstExecutionDateRaw)) {
    issues.push(
      createValidationIssue({
        rowNumber: input.rowNumber,
        loanId: input.loanId,
        field: "신규년월일",
        code: ValidationIssueCode.InvalidDate,
        severity: ValidationSeverity.Warning,
        message: "신규년월일 값이 비어있음 - 장기경과 판정 제외",
      }),
    );
  }

  if (
    maturityDate !== null &&
    firstExecutionDate !== null &&
    maturityDate.getTime() < firstExecutionDate.getTime()
  ) {
    issues.push(
      createValidationIssue({
        rowNumber: input.rowNumber,
        loanId: input.loanId,
        field: "만기년월일",
        code: ValidationIssueCode.UnsupportedValue,
        severity: ValidationSeverity.Warning,
        message: "만기일이 최초실행일보다 이전",
      }),
    );
  }

  return { maturityDate, firstExecutionDate, issues };
}
