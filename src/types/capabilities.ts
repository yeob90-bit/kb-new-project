/** PRD §14.4 — 선택 컬럼 기반 분석 Capability */
export interface AnalysisCapabilities {
  canAnalyzePolicyFund: boolean;
  canAnalyzeCollateral: boolean;
  canAnalyzeRelationship: boolean;
  canAnalyzeAging: boolean;
}
