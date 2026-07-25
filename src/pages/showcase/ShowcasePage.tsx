import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PriorityBand } from "../../enum/index";
import { loadShowcaseAnalysis } from "../../features/showcase-load/loadShowcaseAnalysis";
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
import type { AnalysisRunResult } from "../../models/index";

export function ShowcasePage() {
  const [run, setRun] = useState<AnalysisRunResult | null>(null);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);

  const board = useMemo(() => {
    if (!run) {
      return null;
    }
    const columns = PRIORITY_BAND_ORDER.map((band) => ({
      band,
      items: run.results.filter((result) => result.priorityBand === band),
    }));
    return columns;
  }, [run]);

  const handleStart = () => {
    const next = loadShowcaseAnalysis();
    setRun(next);
    setSelectedLoanId(
      next.results.find((result) => result.priorityBand === PriorityBand.P1Immediate)
        ?.loan.loanId ?? null,
    );
  };

  return (
    <div className="page showcase-page" data-testid="showcase-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Showcase</p>
          <h1>기업여신 만기관리, 리스트 확인에서 선제적 관리로</h1>
          <p className="lede">
            가상 만기리스트 8건으로 Rule 판정 · Priority Band · 관계 네트워크를
            시연합니다.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleStart}
            data-testid="showcase-start"
          >
            가상 데이터 분석 시작
          </button>
          <Link className="btn btn--ghost" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </header>

      <section className="showcase-section" data-testid="showcase-s2">
        <h2>현행 문제 → After</h2>
        <div className="compare-grid">
          <article>
            <h3>Before</h3>
            <p>수작업 확인 · 개인메모 · 만기일만 정렬</p>
          </article>
          <article>
            <h3>After</h3>
            <p>8 Rule 자동판정 · Action 제안 · Band/Exception 2축</p>
          </article>
        </div>
      </section>

      <section className="showcase-section" data-testid="showcase-s3">
        <h2>분석 Pipeline</h2>
        <ol className="pipeline">
          <li>RAW</li>
          <li>검증</li>
          <li>KB-PIN</li>
          <li>8 Rule</li>
          <li>일정엔진</li>
          <li>관계네트워크</li>
          <li>Band</li>
          <li>Action</li>
        </ol>
      </section>

      {!run ? (
        <div className="empty-state" data-testid="showcase-empty">
          <p>가상 만기리스트 분석을 시작해 KPI와 Command Board를 확인하세요.</p>
        </div>
      ) : (
        <>
          <section className="showcase-section" data-testid="showcase-s4">
            <h2>Live Demo KPI</h2>
            <div className="kpi-grid">
              <article className="kpi-card">
                <p className="kpi-card__label">Active</p>
                <p className="kpi-card__value" data-testid="showcase-kpi-active">
                  {run.summary.activeWindowCount}
                </p>
              </article>
              <article className="kpi-card kpi-card--accent">
                <p className="kpi-card__label">P1</p>
                <p className="kpi-card__value" data-testid="showcase-kpi-p1">
                  {run.summary.priorityBandCounts[PriorityBand.P1Immediate] ?? 0}
                </p>
              </article>
              <article className="kpi-card">
                <p className="kpi-card__label">실질 Remark</p>
                <p className="kpi-card__value" data-testid="showcase-kpi-remark">
                  {run.summary.realRemarkCount}
                </p>
              </article>
              <article className="kpi-card">
                <p className="kpi-card__label">관계 연결</p>
                <p
                  className="kpi-card__value"
                  data-testid="showcase-kpi-relationship"
                >
                  {countRelationshipTargets(run.results)}
                </p>
              </article>
            </div>
            <p className="muted" data-testid="showcase-top-score">
              topScore {run.summary.topScore}
            </p>
          </section>

          <section className="showcase-section" data-testid="showcase-s5">
            <h2>Priority Command Board</h2>
            <div className="command-board" data-testid="command-board">
              {board?.map((column) => (
                <div key={column.band} data-testid={`board-col-${column.band}`}>
                  <h3>
                    {PRIORITY_BAND_LABEL[column.band]}
                    <span className="tab__count">{column.items.length}</span>
                  </h3>
                  <ul>
                    {column.items.map((item) => (
                      <li key={item.loan.loanId}>
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
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="showcase-section" data-testid="showcase-s6">
            <h2>Relationship Network</h2>
            <RelationshipGraph
              results={run.results}
              onSelect={setSelectedLoanId}
              emphasisLabels={["세림에프앤비", "청솔산업", "다온유통", "모아테크"]}
            />
          </section>

          <section className="showcase-section" data-testid="showcase-s7">
            <h2>Today&apos;s Action + 종합의견</h2>
            <ActionOpinion
              run={run}
              focusLoanId={selectedLoanId}
              onSelect={setSelectedLoanId}
            />
          </section>

          <section className="showcase-section" data-testid="showcase-s8">
            <h2>기대효과 · 보안 · 확장</h2>
            <ul className="pipeline">
              <li>브라우저 단독 처리</li>
              <li>원본 파일 미변경</li>
              <li>영속 저장 없음</li>
              <li>Rule Registry 확장</li>
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
