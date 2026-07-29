import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PriorityBand } from "../../enum/index";
import {
  PRIORITY_BAND_SCORE,
  PRIORITY_SCORE_CAP,
} from "../../constants/index";
import { loadShowcaseAnalysis } from "../../features/showcase-load/loadShowcaseAnalysis";
import {
  getShowcaseStepIntervalMs,
  SHOWCASE_PIPELINE_STEPS,
} from "../../features/showcase-load/showcaseStory";
import { countRelationshipTargets } from "../../shared/lib/dashboardMetrics";
import {
  formatDDay,
  formatScore,
  PRIORITY_BAND_LABEL,
  PRIORITY_BAND_ORDER,
} from "../../shared/lib/labels";
import {
  ExceptionLevelBadge,
  PriorityBandBadge,
} from "../../entities/loan/ui/StatusBadges";
import { RelationshipGraph } from "../../widgets/relationship-network/RelationshipGraph";
import { ActionOpinion } from "../../widgets/action-opinion/ActionOpinion";
import { CountUpValue } from "../../widgets/showcase-sections/CountUpValue";
import { DemoPipeline } from "../../widgets/showcase-sections/DemoPipeline";
import { StoryRail } from "../../widgets/showcase-sections/StoryRail";
import type { AnalysisRunResult } from "../../models/index";

type DemoPhase = "idle" | "running" | "done";

export function ShowcasePage() {
  const [run, setRun] = useState<AnalysisRunResult | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [phase, setPhase] = useState<DemoPhase>("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const [activeSectionId, setActiveSectionId] = useState("s1");
  const [boardReveal, setBoardReveal] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const relationshipCount = useMemo(
    () => (run ? countRelationshipTargets(run.results) : 0),
    [run],
  );

  const board = useMemo(() => {
    if (!run) {
      return null;
    }
    return PRIORITY_BAND_ORDER.map((band) => ({
      band,
      items: run.results.filter((result) => result.priorityBand === band),
    }));
  }, [run]);

  const p1Loan = useMemo(
    () =>
      run?.results.find(
        (result) => result.priorityBand === PriorityBand.P1Immediate,
      ) ?? null,
    [run],
  );

  useEffect(() => {
    if (phase !== "running" || !run) {
      return;
    }

    const interval = getShowcaseStepIntervalMs();
    if (interval === 0) {
      setStepIndex(SHOWCASE_PIPELINE_STEPS.length - 1);
      setPhase("done");
      setBoardReveal(true);
      return;
    }

    if (stepIndex < 0) {
      setStepIndex(0);
      return;
    }

    if (stepIndex >= SHOWCASE_PIPELINE_STEPS.length - 1) {
      const doneTimer = window.setTimeout(() => {
        setPhase("done");
        setBoardReveal(true);
      }, interval);
      return () => window.clearTimeout(doneTimer);
    }

    const timer = window.setTimeout(() => {
      setStepIndex((current) => current + 1);
    }, interval);
    return () => window.clearTimeout(timer);
  }, [phase, run, stepIndex]);

  const handleStart = () => {
    const next = loadShowcaseAnalysis();
    setRun(next);
    setSelectedLoanId(
      next.results.find(
        (result) => result.priorityBand === PriorityBand.P1Immediate,
      )?.loan.loanId ?? null,
    );
    setPhase("running");
    setStepIndex(-1);
    setBoardReveal(false);
    setActiveSectionId("s4");
    jumpToSection("s4");
  };

  const jumpToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    const node = sectionRefs.current[sectionId];
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const setSectionRef = (id: string) => (node: HTMLElement | null) => {
    sectionRefs.current[id] = node;
  };

  const demoDone = phase === "done";
  const showResults = run !== null && (phase === "done" || phase === "running");

  return (
    <div className="showcase-layout" data-testid="showcase-page">
      <StoryRail
        activeSectionId={activeSectionId}
        demoStepIndex={Math.max(stepIndex, 0)}
        demoRunning={phase === "running"}
        demoDone={demoDone}
        onJump={jumpToSection}
      />

      <div className="page showcase-page">
        <section
          className="showcase-hero"
          data-testid="showcase-s1"
          ref={setSectionRef("s1")}
        >
          <p className="eyebrow">KB 기업여신 · Renewal Navigator</p>
          <h1>기업여신 만기관리, 리스트 확인에서 선제적 관리로</h1>
          <p className="lede">
            3분 스토리보드로 문제 → Rule 판정 → Band/Exception → Action까지
            시연합니다. 수치는 모두 fixture_showcase 분석 결과입니다.
          </p>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleStart}
              data-testid="showcase-start"
            >
              가상 만기리스트 분석 시작
            </button>
            <Link className="btn btn--ghost" to="/dashboard">
              Dashboard
            </Link>
          </div>
          <div className="hero-preview" aria-hidden="true">
            {PRIORITY_BAND_ORDER.map((band) => (
              <div key={band} className="hero-preview__col">
                <span>{PRIORITY_BAND_LABEL[band]}</span>
                <div className="hero-preview__card is-float" />
              </div>
            ))}
          </div>
        </section>

        <section
          className="showcase-section"
          data-testid="showcase-s2"
          ref={setSectionRef("s2")}
        >
          <h2>현행 문제 + Before / After</h2>
          <div className="compare-grid">
            <article className="compare-card compare-card--before">
              <h3>Before</h3>
              <ul>
                <li>수작업으로 만기 리스트 확인</li>
                <li>개인 메모에 특이사항 분산</li>
                <li>관계·정책자금·장기경과를 놓치기 쉬움</li>
              </ul>
            </article>
            <article className="compare-card compare-card--after">
              <h3>After</h3>
              <ul>
                <li>8 Rule 자동 판정</li>
                <li>Priority Band + Exception Level 2축</li>
                <li>관계 네트워크와 다음 Action 제시</li>
              </ul>
            </article>
          </div>
        </section>

        <section
          className="showcase-section"
          data-testid="showcase-s3"
          ref={setSectionRef("s3")}
        >
          <h2>분석 Pipeline</h2>
          <DemoPipeline
            activeIndex={phase === "idle" ? -1 : stepIndex}
            done={demoDone}
            inputCount={run?.summary.inputRowCount ?? null}
          />
        </section>

        <section
          className="showcase-section"
          data-testid="showcase-s4"
          ref={setSectionRef("s4")}
        >
          <h2>Live Demo</h2>
          {!showResults ? (
            <div className="empty-state" data-testid="showcase-empty">
              <p>
                &quot;가상 만기리스트 분석 시작&quot;을 누르면 8단계 Pipeline과
                KPI 카운트업이 진행됩니다.
              </p>
            </div>
          ) : (
            <>
              <p className="muted" data-testid="demo-status">
                {phase === "running"
                  ? `단계 진행 중: ${SHOWCASE_PIPELINE_STEPS[Math.max(stepIndex, 0)]?.label}`
                  : "분석 완료 — 쇼케이스 시연 가능"}
              </p>
              <div className="kpi-grid">
                <article className="kpi-card">
                  <p className="kpi-card__label">Active</p>
                  <p className="kpi-card__value">
                    <CountUpValue
                      value={run.summary.activeWindowCount}
                      active={demoDone || stepIndex >= 3}
                      testId="showcase-kpi-active"
                    />
                  </p>
                </article>
                <article className="kpi-card kpi-card--accent">
                  <p className="kpi-card__label">우선순위 최상</p>
                  <p className="kpi-card__value">
                    <CountUpValue
                      value={
                        run.summary.priorityBandCounts[
                          PriorityBand.P1Immediate
                        ] ?? 0
                      }
                      active={demoDone || stepIndex >= 6}
                      testId="showcase-kpi-p1"
                    />
                  </p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-card__label">실질 Remark</p>
                  <p className="kpi-card__value">
                    <CountUpValue
                      value={run.summary.realRemarkCount}
                      active={demoDone || stepIndex >= 3}
                      testId="showcase-kpi-remark"
                    />
                  </p>
                </article>
                <article className="kpi-card">
                  <p className="kpi-card__label">관계 연결</p>
                  <p className="kpi-card__value">
                    <CountUpValue
                      value={relationshipCount}
                      active={demoDone || stepIndex >= 5}
                      testId="showcase-kpi-relationship"
                    />
                  </p>
                </article>
              </div>
              <p className="muted" data-testid="showcase-top-score">
                topScore {run.summary.topScore}
              </p>
            </>
          )}
        </section>

        {run && demoDone ? (
          <>
            <section
              className="showcase-section"
              data-testid="showcase-s5"
              ref={setSectionRef("s5")}
            >
              <h2>Priority Command Board</h2>
              <div
                className={
                  boardReveal
                    ? "command-board is-revealed"
                    : "command-board"
                }
                data-testid="command-board"
              >
                {board?.map((column) => (
                  <div
                    key={column.band}
                    data-testid={`board-col-${column.band}`}
                  >
                    <h3>
                      {PRIORITY_BAND_LABEL[column.band]}
                      <span className="tab__count">{column.items.length}건</span>
                    </h3>
                    <ul>
                      {column.items.map((item, index) => (
                        <li
                          key={item.loan.loanId}
                          style={{ animationDelay: `${index * 80}ms` }}
                          className="board-card-wrap"
                        >
                          <button
                            type="button"
                            className="board-card"
                            onClick={() => setSelectedLoanId(item.loan.loanId)}
                          >
                            <strong>{item.loan.borrowerName}</strong>
                            <span>
                              {formatDDay(item.dDay)} · Score{" "}
                              {formatScore(item.priorityScore)}
                            </span>
                            <PriorityBandBadge band={item.priorityBand} />
                            <ExceptionLevelBadge level={item.exceptionLevel} />
                            <span className="muted">
                              {item.remarks[0]?.title ?? "특이사항 없음"}
                            </span>
                            <span className="action-cell">
                              {item.recommendedActions[0]?.title ??
                                "일정 확인"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section
              className="showcase-section"
              data-testid="showcase-s6"
              ref={setSectionRef("s6")}
            >
              <h2>Relationship Network</h2>
              <p className="lede">
                세림에프앤비 ↔ 청솔산업(R03), 다온유통 ↔ 모아테크(R04)
              </p>
              <RelationshipGraph
                results={run.results}
                onSelect={setSelectedLoanId}
                emphasisLabels={[
                  "세림에프앤비",
                  "청솔산업",
                  "다온유통",
                  "모아테크",
                ]}
              />
            </section>

            <section
              className="showcase-section"
              data-testid="showcase-s7"
              ref={setSectionRef("s7")}
            >
              <div className="showcase-section__head">
                <h2>Today&apos;s Action + 종합의견</h2>
                <p
                  className="score-legend"
                  data-testid="score-legend"
                >
                  Score 0~{PRIORITY_SCORE_CAP.TOTAL}점
                  <span aria-hidden="true"> · </span>
                  {PRIORITY_BAND_SCORE.P1_MIN}점 이상 긴급검토
                </p>
              </div>
              {p1Loan ? (
                <p className="muted" data-testid="p1-spotlight">
                  우선순위 최상 포커스: {p1Loan.loan.borrowerName} ·{" "}
                  {formatDDay(p1Loan.dDay)} ·{" "}
                  {p1Loan.remarks.map((remark) => remark.title).join(" / ")}
                </p>
              ) : null}
              <ActionOpinion
                run={run}
                focusLoanId={selectedLoanId}
                onSelect={setSelectedLoanId}
              />
            </section>

            <section
              className="showcase-section"
              data-testid="showcase-s8"
              ref={setSectionRef("s8")}
            >
              <h2>기대효과 · 보안 · 확장</h2>
              <div className="compare-grid">
                <article>
                  <h3>정성 효과</h3>
                  <ul className="pipeline">
                    <li>만기 누락 감소</li>
                    <li>관계 확인 누락 방지</li>
                    <li>우선처리 기준 통일</li>
                  </ul>
                </article>
                <article>
                  <h3>보안 · 확장</h3>
                  <ol className="security-flow" data-testid="security-flow">
                    <li>엑셀 업로드</li>
                    <li>브라우저 메모리 분석</li>
                    <li>결과 화면 / Export</li>
                    <li>새로고침 시 소멸</li>
                  </ol>
                  <p className="notice">
                    서버·DB·영속 저장 없이 동작하며, Rule Registry로 R09 등
                    확장이 가능합니다.
                  </p>
                </article>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
