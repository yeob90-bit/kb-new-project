import type {
  ValidationIssueCode,
  ValidationSeverity,
} from "../../../../enum/index";
import type { DataValidationIssue } from "../../../../models/index";

export function createValidationIssue(params: {
  rowNumber: number;
  loanId: string;
  field: string;
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  message: string;
}): DataValidationIssue {
  const issue: DataValidationIssue = {
    rowNumber: params.rowNumber,
    field: params.field,
    code: params.code,
    severity: params.severity,
    message: params.message,
  };
  if (params.loanId !== "") {
    issue.loanId = params.loanId;
  }
  return issue;
}
