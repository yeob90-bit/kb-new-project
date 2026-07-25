import type { AnalysisCapabilities } from "../../../types/capabilities";
import type { AnalysisRunResult } from "../../../models/index";
import { evaluateBusinessRules } from "./rules/index";
import { validateLoans } from "./validation/index";
import {
  assembleLoanAnalysisResult,
  buildAnalysisSummary,
} from "./assembleAnalysis";

export interface RunAnalysisOptions {
  hasPolicyFundColumn?: boolean;
  capabilities?: AnalysisCapabilities;
  sourceFileName?: string | null;
  runId?: string;
}

const DEFAULT_CAPABILITIES: AnalysisCapabilities = {
  canAnalyzePolicyFund: true,
  canAnalyzeCollateral: true,
  canAnalyzeRelationship: true,
  canAnalyzeAging: true,
};

/**
 * Validation → Business Rules → Schedule/Score/Band/Exception.
 * Reference Engine run_engine + summarize 대응.
 */
export function runAnalysis(
  rawRows: Record<string, unknown>[],
  referenceDate: Date,
  options: RunAnalysisOptions = {},
): AnalysisRunResult {
  const hasPolicyFundColumn = options.hasPolicyFundColumn ?? true;
  const capabilities =
    options.capabilities ??
    ({
      ...DEFAULT_CAPABILITIES,
      canAnalyzePolicyFund: hasPolicyFundColumn,
    } satisfies AnalysisCapabilities);

  const loans = validateLoans(rawRows, { hasPolicyFundColumn });
  const { remarksByLoanId } = evaluateBusinessRules(
    loans,
    referenceDate,
    capabilities,
  );

  const results = loans.map((loan) =>
    assembleLoanAnalysisResult(
      loan,
      remarksByLoanId.get(loan.loanId) ?? [],
      referenceDate,
    ),
  );

  return {
    runId: options.runId ?? `run-${referenceDate.toISOString().slice(0, 10)}`,
    analyzedAt: new Date(),
    referenceDate,
    sourceFileName: options.sourceFileName ?? null,
    results,
    summary: buildAnalysisSummary(results, rawRows.length),
    validationIssues: loans.flatMap((loan) => loan.validationIssues),
    capabilities,
  };
}
