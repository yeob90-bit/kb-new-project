import type { ActionUrgency, PriorityBand } from "../enum/index";
import type { RequiredColumn, OptionalColumn } from "../constants/index";

export type { AnalysisCapabilities } from "./capabilities";

/** Priority Band → Action Urgency 매핑용 (PRD §20) */
export type PriorityBandToUrgencyMap = Record<PriorityBand, ActionUrgency>;

/** 업로드 헤더 검증용 컬럼 유니온 */
export type UploadColumn = RequiredColumn | OptionalColumn;

/** Remark evidence 값 */
export type RemarkEvidenceValue = string | number | boolean | null;

/** 기준일 문자열 (Fixture / Reference Engine 형식) */
export type ReferenceDateString = `${number}-${number}-${number}`;
