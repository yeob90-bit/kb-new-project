/** PRD Part 3 — 기초 Enum (string enum, Reference Engine 값과 동일) */

export enum LoanPurpose {
  Facility = "시설자금",
  Working = "운전자금",
}

export enum BorrowerSegment {
  Corporate = "기업",
  Retail = "소매",
  LegalEntity = "법인",
}

export enum PolicyFundType {
  C1 = "C1",
  C2 = "C2",
}

export enum MaturityBucket {
  CurrentMonth = "CURRENT_MONTH",
  NextMonth = "NEXT_MONTH",
  TwoMonthsLater = "TWO_MONTHS_LATER",
  OutOfScope = "OUT_OF_SCOPE",
  InvalidDate = "INVALID_DATE",
}

export enum ScheduleStatus {
  Normal = "NORMAL",
  Caution = "CAUTION",
  Warning = "WARNING",
  Urgent = "URGENT",
  Overdue = "OVERDUE",
  Complete = "COMPLETE",
  Invalid = "INVALID",
}

export enum PriorityBand {
  P1Immediate = "P1_IMMEDIATE",
  P2Priority = "P2_PRIORITY",
  P3Prepare = "P3_PREPARE",
  P4Routine = "P4_ROUTINE",
}

export enum ExceptionLevel {
  High = "HIGH",
  Medium = "MEDIUM",
  Low = "LOW",
  None = "NONE",
}

export enum RemarkCategory {
  Collateral = "COLLATERAL",
  Relationship = "RELATIONSHIP",
  PolicyFund = "POLICY_FUND",
  Aging = "AGING",
  DataQuality = "DATA_QUALITY",
  CreditRisk = "CREDIT_RISK",
  Schedule = "SCHEDULE",
}

export enum RemarkSeverity {
  Critical = "CRITICAL",
  High = "HIGH",
  Medium = "MEDIUM",
  Low = "LOW",
  Info = "INFO",
}

export enum RelationDirection {
  ProviderToBorrower = "PROVIDER_TO_BORROWER",
  BorrowerAsProvider = "BORROWER_AS_PROVIDER",
  SharedProvider = "SHARED_PROVIDER",
  SameBorrowerMultiMaturity = "SAME_BORROWER_MULTI_MATURITY",
}

export enum ValidationIssueCode {
  MissingRequiredValue = "MISSING_REQUIRED_VALUE",
  InvalidDate = "INVALID_DATE",
  InvalidPin = "INVALID_PIN",
  InvalidProductCode = "INVALID_PRODUCT_CODE",
  DuplicateLoanId = "DUPLICATE_LOAN_ID",
  InvalidSegment = "INVALID_SEGMENT",
  UnsupportedValue = "UNSUPPORTED_VALUE",
}

export enum ValidationSeverity {
  Error = "ERROR",
  Warning = "WARNING",
}

export enum ActionUrgency {
  Today = "TODAY",
  ThisWeek = "THIS_WEEK",
  NextWeek = "NEXT_WEEK",
  Routine = "ROUTINE",
}

export enum BusinessRuleId {
  R01 = "R01",
  R02 = "R02",
  R03 = "R03",
  R04 = "R04",
  R05 = "R05",
  R06 = "R06",
  R07 = "R07",
  R08 = "R08",
}

export enum ValidationRuleId {
  V01 = "V01",
  V02 = "V02",
  V03 = "V03",
  V04 = "V04",
  V05 = "V05",
}

export enum ScheduleEngineId {
  S01 = "S01",
}

export enum DashboardTab {
  ActiveQueue = "ACTIVE_QUEUE",
  OutOfScope = "OUT_OF_SCOPE",
  DataError = "DATA_ERROR",
  RelationshipNetwork = "RELATIONSHIP_NETWORK",
}
