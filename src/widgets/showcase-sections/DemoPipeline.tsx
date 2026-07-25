import { SHOWCASE_PIPELINE_STEPS } from "../../features/showcase-load/showcaseStory";

interface DemoPipelineProps {
  activeIndex: number;
  done: boolean;
  inputCount: number | null;
}

export function DemoPipeline({
  activeIndex,
  done,
  inputCount,
}: DemoPipelineProps) {
  return (
    <ol className="demo-pipeline" data-testid="demo-pipeline">
      {SHOWCASE_PIPELINE_STEPS.map((step, index) => {
        const state =
          done || index < activeIndex
            ? "done"
            : index === activeIndex
              ? "active"
              : "pending";
        return (
          <li
            key={step.id}
            className={`demo-pipeline__step is-${state}`}
            data-testid={`pipeline-step-${step.id}`}
          >
            <span className="demo-pipeline__index">{index + 1}</span>
            <span>{step.label}</span>
          </li>
        );
      })}
      {inputCount !== null ? (
        <li className="demo-pipeline__meta muted" data-testid="pipeline-input-count">
          입력 {inputCount}건 · fixture_showcase
        </li>
      ) : null}
    </ol>
  );
}
