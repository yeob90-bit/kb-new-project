import {
  SHOWCASE_PIPELINE_STEPS,
  SHOWCASE_STORY_SECTIONS,
} from "../../features/showcase-load/showcaseStory";

interface StoryRailProps {
  activeSectionId: string;
  demoStepIndex: number;
  demoRunning: boolean;
  demoDone: boolean;
  onJump: (sectionId: string) => void;
}

export function StoryRail({
  activeSectionId,
  demoStepIndex,
  demoRunning,
  demoDone,
  onJump,
}: StoryRailProps) {
  return (
    <aside className="story-rail" data-testid="story-rail" aria-label="3분 스토리보드">
      <p className="story-rail__title">3분 Demo Story</p>
      <ol>
        {SHOWCASE_STORY_SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              className={
                activeSectionId === section.id
                  ? "story-rail__item is-active"
                  : "story-rail__item"
              }
              onClick={() => onJump(section.id)}
              data-testid={`story-jump-${section.id}`}
            >
              <span>{section.seconds}</span>
              <strong>{section.title}</strong>
            </button>
          </li>
        ))}
      </ol>
      <div className="story-rail__demo" data-testid="demo-progress">
        <p>
          {demoRunning
            ? `분석 중 ${demoStepIndex + 1}/${SHOWCASE_PIPELINE_STEPS.length}`
            : demoDone
              ? "분석 완료 — 시연 가능"
              : "대기 중"}
        </p>
        <div className="score-bars__track" aria-hidden="true">
          <div
            className="score-bars__fill"
            style={{
              width: `${
                demoDone
                  ? 100
                  : demoRunning
                    ? ((demoStepIndex + 1) / SHOWCASE_PIPELINE_STEPS.length) *
                      100
                    : 0
              }%`,
            }}
          />
        </div>
      </div>
    </aside>
  );
}
