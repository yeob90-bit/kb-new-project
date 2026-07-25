import type { AnalysisCapabilities } from "../../../../types/capabilities";
import type { LoanRecord, RuleContext } from "../../../../models/index";

const DEFAULT_CAPABILITIES: AnalysisCapabilities = {
  canAnalyzePolicyFund: true,
  canAnalyzeCollateral: true,
  canAnalyzeRelationship: true,
  canAnalyzeAging: true,
};

/** disabledDuplicate 제외 후 RuleContext 구성 */
export function buildRuleContext(
  allLoans: LoanRecord[],
  today: Date,
  capabilities: AnalysisCapabilities = DEFAULT_CAPABILITIES,
): RuleContext {
  const validLoans = allLoans.filter((loan) => !loan.disabledDuplicate);

  const loansByBorrowerPin = new Map<string, LoanRecord[]>();
  const loansByCollateralPin = new Map<string, LoanRecord[]>();

  for (const loan of validLoans) {
    if (loan.borrowerPinPrefix) {
      const group = loansByBorrowerPin.get(loan.borrowerPinPrefix) ?? [];
      group.push(loan);
      loansByBorrowerPin.set(loan.borrowerPinPrefix, group);
    }
    if (loan.collateralProviderPinPrefix) {
      const group = loansByCollateralPin.get(loan.collateralProviderPinPrefix) ?? [];
      group.push(loan);
      loansByCollateralPin.set(loan.collateralProviderPinPrefix, group);
    }
  }

  return {
    today,
    allLoans: validLoans,
    loansByBorrowerPin,
    loansByCollateralPin,
    capabilities,
  };
}
