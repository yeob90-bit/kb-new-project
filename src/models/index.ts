import type {
  ActionUrgency,
  BusinessRuleId,
  ExceptionLevel,
  LoanPurpose,
  MaturityBucket,
  PriorityBand,
  PolicyFundType,
  RelationDirection,
  RemarkCategory,
  RemarkSeverity,
  ScheduleStatus,
  ValidationIssueCode,
  ValidationSeverity,
  BorrowerSegment,
} from "../enum/index";
import type { AnalysisCapabilities } from "../types/capabilities";

/** PRD Part 3 — RAW 행 */
export interface RawLoanRow {
  rowNumber: number;
  raw: Record<string, unknown>;
}

/** PRD Part 3 — 데이터 검증 이슈 */
export interface DataValidationIssue {
  rowNumber: number;
  loanId?: string;
  field: string;
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  message: string;
}

/** PRD Part 3 — 정규화 여신 (remarks 없음) */
export interface LoanRecord {
  sourceRowNumber: number;
  loanId: string;
  borrowerName: string;
  borrowerPinRaw: string;
  borrowerPinPrefix: string | null;
  productCode: string;
  productName: string;
  loanPurpose: LoanPurpose | null;
  firstExecutionDate: Date | null;
  maturityDate: Date | null;
  borrowerSegment: BorrowerSegment | null;
  businessStatus: string | null;
  collateralProviderPinRaw: string | null;
  collateralProviderPinPrefix: string | null;
  collateralProviderName: string | null;
  policyFundType: PolicyFundType | null;
  validationIssues: DataValidationIssue[];
  disabledDuplicate: boolean;
}

/** PRD Part 3 / §14.6 — Remark 결과 */
export interface RemarkResult {
  remarkKey: string;
  ruleId: string;
  category: RemarkCategory;
  severity: RemarkSeverity;
  title: string;
  message: string;
  score: number;
  recommendedAction: string;
  relationDirection?: RelationDirection;
  relatedLoanIds?: string[];
  relatedPinPrefixes?: string[];
  evidence?: Record<string, string | number | boolean | null>;
}

/** PRD Part 3 / §20 — 권장 Action */
export interface RecommendedAction {
  actionId: string;
  title: string;
  reason: string;
  urgency: ActionUrgency;
  recommendedDueDate: Date | null;
  prerequisite?: string;
  relatedRuleIds: string[];
}

/** PRD Part 3 — Priority Score 산정근거 */
export interface PriorityScoreBreakdown {
  scheduleScore: number;
  collateralScore: number;
  policyScore: number;
  agingScore: number;
  scheduleExtraScore: number;
  total: number;
}

/** PRD Part 3 — 여신 분석 결과 */
export interface LoanAnalysisResult {
  loan: LoanRecord;
  maturityBucket: MaturityBucket;
  isInActiveWindow: boolean;
  isActionable: boolean;
  dDay: number | null;
  scheduleStatus: ScheduleStatus;
  priorityScore: number | null;
  priorityBand: PriorityBand | null;
  exceptionLevel: ExceptionLevel;
  scoreBreakdown: PriorityScoreBreakdown | null;
  remarks: RemarkResult[];
  recommendedActions: RecommendedAction[];
}

/** PRD Part 3 — 분석 요약 */
export interface AnalysisSummary {
  inputRowCount: number;
  validLoanCount: number;
  activeWindowCount: number;
  outOfScopeCount: number;
  invalidDateCount: number;
  errorRowCount: number;
  maturityBucketCounts: Record<MaturityBucket, number>;
  scheduleStatusCounts: Partial<Record<ScheduleStatus, number>>;
  priorityBandCounts: Partial<Record<PriorityBand, number>>;
  exceptionLevelCounts: Partial<Record<ExceptionLevel, number>>;
  realRemarkCount: number;
  ruleHitCounts: Record<string, number>;
  topScore: number | null;
}

/** PRD Part 3 — 분석 실행 결과 */
export interface AnalysisRunResult {
  runId: string;
  analyzedAt: Date;
  referenceDate: Date;
  sourceFileName: string | null;
  results: LoanAnalysisResult[];
  summary: AnalysisSummary;
  validationIssues: DataValidationIssue[];
  capabilities: AnalysisCapabilities;
}

/** PRD Part 3 — Rule 평가 컨텍스트 */
export interface RuleContext {
  today: Date;
  allLoans: LoanRecord[];
  loansByBorrowerPin: Map<string, LoanRecord[]>;
  loansByCollateralPin: Map<string, LoanRecord[]>;
  capabilities: AnalysisCapabilities;
}

/** PRD Part 3 — Business Rule 계약 (구현체는 Sprint 이후) */
export interface LoanRule {
  id: BusinessRuleId;
  name: string;
  description: string;
  category: RemarkCategory;
  enabled: boolean;
  evaluate: (loan: LoanRecord, context: RuleContext) => RemarkResult[];
}
