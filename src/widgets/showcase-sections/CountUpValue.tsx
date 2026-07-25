import { useEffect, useState } from "react";

/** 분석 결과 수치로 카운트업 — 하드코딩 금지 */
export function CountUpValue({
  value,
  active,
  testId,
}: {
  value: number;
  active: boolean;
  testId: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) {
      setDisplay(0);
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced || value === 0) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const frames = 18;
    const id = window.setInterval(() => {
      frame += 1;
      const next = Math.round((value * frame) / frames);
      setDisplay(frame >= frames ? value : next);
      if (frame >= frames) {
        window.clearInterval(id);
      }
    }, 30);

    return () => window.clearInterval(id);
  }, [active, value]);

  return (
    <span data-testid={testId} data-final-value={value}>
      {display}
    </span>
  );
}
