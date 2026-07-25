import {
  ValidationIssueCode,
  ValidationSeverity,
} from "../../../../enum/index";
import type { DataValidationIssue } from "../../../../models/index";
import { pinPrefix } from "../../../../shared/lib/pin";
import { createValidationIssue } from "./createIssue";

export interface V03PinValidationResult {
  borrowerPinPrefix: string | null;
  collateralProviderPinPrefix: string | null;
  issues: DataValidationIssue[];
}

/** V03 — KB-PIN / 담보제공자KB-PIN 앞10자리 검증 */
export function validateV03Pin(input: {
  rowNumber: number;
  loanId: string;
  borrowerPinRaw: string;
  collateralProviderPinRaw: string | null;
}): V03PinValidationResult {
  const issues: DataValidationIssue[] = [];

  const borrowerPinPrefix = pinPrefix(input.borrowerPinRaw);
  if (input.borrowerPinRaw && borrowerPinPrefix === null) {
    issues.push(
      createValidationIssue({
        rowNumber: input.rowNumber,
        loanId: input.loanId,
        field: "KB-PIN",
        code: ValidationIssueCode.InvalidPin,
        severity: ValidationSeverity.Warning,
        message: "KB-PIN 앞10자리 생성 불가 - 관계 Rule 판정 제외",
      }),
    );
  }

  let collateralProviderPinPrefix: string | null = null;
  if (input.collateralProviderPinRaw) {
    collateralProviderPinPrefix = pinPrefix(input.collateralProviderPinRaw);
    if (collateralProviderPinPrefix === null) {
      issues.push(
        createValidationIssue({
          rowNumber: input.rowNumber,
          loanId: input.loanId,
          field: "담보제공자KB-PIN",
          code: ValidationIssueCode.InvalidPin,
          severity: ValidationSeverity.Warning,
          message:
            "담보제공자 KB-PIN 앞10자리 생성 불가 - 관계 Rule 판정 제외",
        }),
      );
    }
  }

  return { borrowerPinPrefix, collateralProviderPinPrefix, issues };
}
