import {
  ValidationIssueCode,
  ValidationSeverity,
} from "../../../../enum/index";
import type { LoanRecord } from "../../../../models/index";
import { createValidationIssue } from "./createIssue";

/**
 * V05 — 중복 계좌번호 검증.
 * 중복된 모든 행에 DUPLICATE_LOAN_ID ERROR + disabledDuplicate=true.
 * 업로드는 중단하지 않는다 (Reference Engine Truth).
 */
export function validateV05DuplicateLoanId(loans: LoanRecord[]): Set<string> {
  const byId = new Map<string, LoanRecord[]>();
  for (const loan of loans) {
    const group = byId.get(loan.loanId);
    if (group) {
      group.push(loan);
    } else {
      byId.set(loan.loanId, [loan]);
    }
  }

  const disabledIds = new Set<string>();

  for (const [loanId, group] of byId) {
    if (group.length <= 1) {
      continue;
    }
    if (!loanId) {
      continue;
    }
    disabledIds.add(loanId);
    for (const loan of group) {
      loan.disabledDuplicate = true;
      loan.validationIssues.push(
        createValidationIssue({
          rowNumber: loan.sourceRowNumber,
          loanId: loan.loanId,
          field: "계좌번호",
          code: ValidationIssueCode.DuplicateLoanId,
          severity: ValidationSeverity.Error,
          message: `중복된 계좌번호(${loanId}) ${group.length}건 - Rule Engine에서 비활성화됨`,
        }),
      );
    }
  }

  return disabledIds;
}
