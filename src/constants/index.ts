import {
  ActionUrgency,
  LoanPurpose,
  MaturityBucket,
  PriorityBand,
} from "../enum/index";

/** PRD §9 — 필수·선택 컬럼 */
export const REQUIRED_COLUMNS = [
  "계좌번호",
  "고객명",
  "KB-PIN",
  "상품코드",
  "신규년월일",
  "만기년월일",
] as const;

export const OPTIONAL_COLUMNS = [
  "익스포져현황",
  "휴폐업",
  "담보제공자KB-PIN",
  "담보제공자명",
  "정책자금구분",
] as const;

export type RequiredColumn = (typeof REQUIRED_COLUMNS)[number];
export type OptionalColumn = (typeof OPTIONAL_COLUMNS)[number];

/** PRD §7.1 — UI 비표시·LoanRecord 미매핑 컬럼 */
export const UI_HIDDEN_COLUMNS = [
  "자택전화번호",
  "직장전화번호",
  "휴대폰번호",
  "자동이체모계좌",
] as const;

/** Reference Engine — 상품코드 [2:4] 시설/운전 판별 */
export const FACILITY_FUND_CODES = [
  "34",
  "35",
  "37",
  "38",
  "42",
  "49",
  "56",
  "58",
] as const;

export const WORKING_CAPITAL_CODES = [
  "32",
  "33",
  "36",
  "41",
  "48",
  "51",
  "55",
] as const;

/** PRD §13.1 — KB-PIN 앞자리 길이 */
export const PIN_PREFIX_LENGTH = 10;

/** PRD §13.1 / V04 — 상품코드 최소 길이·목적 세그먼트 슬라이스 */
export const PRODUCT_CODE_MIN_LENGTH = 4;
export const PRODUCT_PURPOSE_SEGMENT_START = 2;
export const PRODUCT_PURPOSE_SEGMENT_END = 4;

/** PRD §13.4 — 장기경과 기념일 연수 */
export const AGING_YEARS = {
  [LoanPurpose.Facility]: 3,
  [LoanPurpose.Working]: 5,
} as const satisfies Record<LoanPurpose, number>;

/** PRD §11.1 — Active Window 월 오프셋 (당월=0 ~ +2개월) */
export const ACTIVE_WINDOW_MAX_MONTH_OFFSET = 2;

/** PRD §11.2 — Active Window에 속하는 Bucket */
export const ACTIVE_MATURITY_BUCKETS = [
  MaturityBucket.CurrentMonth,
  MaturityBucket.NextMonth,
  MaturityBucket.TwoMonthsLater,
] as const;

/** PRD §13.9 — D-Day 구간 경계 */
export const SCHEDULE_DDAY = {
  URGENT_MAX: 7,
  WARNING_MIN: 8,
  WARNING_MAX: 10,
  CAUTION_MIN: 11,
  CAUTION_MAX: 14,
  NORMAL_NEAR_MIN: 15,
  NORMAL_NEAR_MAX: 21,
  NORMAL_MID_MIN: 22,
  NORMAL_MID_MAX: 30,
} as const;

/** PRD §13.9 — 일정점수 (S01) */
export const SCHEDULE_SCORE = {
  OVERDUE: 50,
  URGENT: 50,
  WARNING: 40,
  CAUTION: 30,
  NORMAL_NEAR: 20,
  NORMAL_MID: 10,
  NORMAL_FAR: 5,
} as const;

/** PRD §17 / Part 6 — Priority Score 구성요소 상한 */
export const PRIORITY_SCORE_CAP = {
  TOTAL: 100,
  SCHEDULE: 50,
  COLLATERAL: 25,
  POLICY: 10,
  AGING: 15,
  SCHEDULE_EXTRA: 10,
} as const;

/** PRD §14.2 A — Priority Band 점수 임계값 */
export const PRIORITY_BAND_SCORE = {
  P1_MIN: 75,
  P2_MIN: 55,
} as const;

/** Part 4 Rule Matrix — Remark Score (규칙별) */
export const RULE_SCORE = {
  R01: 10,
  R02: 10,
  R03: 15,
  R04: 15,
  R05: 8,
  R06: 7,
  R07: 7,
  R08: 10,
} as const;

/** PRD §7.3 — KB-PIN 마스킹 (앞 6 + *** + 뒤 3) */
export const PIN_MASK = {
  VISIBLE_PREFIX: 6,
  VISIBLE_SUFFIX: 3,
  MASK_TOKEN: "***",
} as const;

/** 법인 KB-PIN 앞자리 (PRD §13.1) */
export const CORPORATE_PIN_PREFIX_CHARS = ["7", "8"] as const;

/** PRD §20 — Priority Band → Action Urgency */
export const PRIORITY_BAND_TO_URGENCY = {
  [PriorityBand.P1Immediate]: ActionUrgency.Today,
  [PriorityBand.P2Priority]: ActionUrgency.ThisWeek,
  [PriorityBand.P3Prepare]: ActionUrgency.NextWeek,
  [PriorityBand.P4Routine]: ActionUrgency.Routine,
} as const satisfies Record<PriorityBand, ActionUrgency>;

/** Fixture / Reference Engine 검증 기준일 (PRD Part 9) */
export const REFERENCE_DATES = {
  RULE_VALID: "2026-08-03",
  YEAR_BOUNDARY_B12: "2026-11-20",
} as const;
