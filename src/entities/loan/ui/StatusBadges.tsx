import type {
  ExceptionLevel,
  PriorityBand,
  ScheduleStatus,
} from "../../../enum/index";
import {
  EXCEPTION_LEVEL_LABEL,
  PRIORITY_BAND_LABEL,
  SCHEDULE_STATUS_LABEL,
} from "../../../shared/lib/labels";

type BadgeTone =
  | "p1"
  | "p2"
  | "p3"
  | "p4"
  | "high"
  | "medium"
  | "low"
  | "none"
  | "urgent"
  | "warning"
  | "caution"
  | "normal"
  | "muted";

interface BadgeProps {
  label: string;
  tone: BadgeTone;
}

function Badge({ label, tone }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`} title={label}>
      <span className="badge__icon" aria-hidden="true" />
      <span className="badge__text">{label}</span>
    </span>
  );
}

const BAND_TONE: Record<PriorityBand, BadgeTone> = {
  P1_IMMEDIATE: "p1",
  P2_PRIORITY: "p2",
  P3_PREPARE: "p3",
  P4_ROUTINE: "p4",
};

const EXCEPTION_TONE: Record<ExceptionLevel, BadgeTone> = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  NONE: "none",
};

const SCHEDULE_TONE: Record<ScheduleStatus, BadgeTone> = {
  OVERDUE: "urgent",
  URGENT: "urgent",
  WARNING: "warning",
  CAUTION: "caution",
  NORMAL: "normal",
  COMPLETE: "muted",
  INVALID: "muted",
};

export function PriorityBandBadge({ band }: { band: PriorityBand | null }) {
  if (!band) {
    return <span className="muted">-</span>;
  }
  return <Badge label={PRIORITY_BAND_LABEL[band]} tone={BAND_TONE[band]} />;
}

export function ExceptionLevelBadge({ level }: { level: ExceptionLevel }) {
  return (
    <Badge label={EXCEPTION_LEVEL_LABEL[level]} tone={EXCEPTION_TONE[level]} />
  );
}

export function ScheduleStatusBadge({ status }: { status: ScheduleStatus }) {
  return (
    <Badge label={SCHEDULE_STATUS_LABEL[status]} tone={SCHEDULE_TONE[status]} />
  );
}
