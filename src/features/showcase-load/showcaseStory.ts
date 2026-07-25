export const SHOWCASE_PIPELINE_STEPS = [
  { id: "raw", label: "RAW 적재" },
  { id: "validate", label: "검증 V01~V05" },
  { id: "pin", label: "KB-PIN 정규화" },
  { id: "rules", label: "8 Rule 판정" },
  { id: "schedule", label: "일정 엔진 S01" },
  { id: "network", label: "관계 네트워크" },
  { id: "band", label: "Priority Band" },
  { id: "action", label: "Action 제안" },
] as const;

export type ShowcasePipelineStepId =
  (typeof SHOWCASE_PIPELINE_STEPS)[number]["id"];

/** 시연용 단계 간격(ms). reduced-motion이면 0. */
export function getShowcaseStepIntervalMs(): number {
  if (typeof window === "undefined") {
    return 0;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return 0;
  }
  return 450;
}

export const SHOWCASE_STORY_SECTIONS = [
  { id: "s1", title: "Hero", seconds: "0:00–0:20" },
  { id: "s2", title: "Before/After", seconds: "0:20–0:45" },
  { id: "s3", title: "Pipeline", seconds: "0:45–1:00" },
  { id: "s4", title: "Live Demo", seconds: "1:00–1:35" },
  { id: "s5", title: "Command Board", seconds: "1:35–2:05" },
  { id: "s6", title: "Relationship", seconds: "2:05–2:30" },
  { id: "s7", title: "Action", seconds: "2:30–2:50" },
  { id: "s8", title: "Security", seconds: "2:50–3:00" },
] as const;
