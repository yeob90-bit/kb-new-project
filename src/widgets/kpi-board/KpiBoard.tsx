import { BusinessRuleId, PriorityBand } from "../../enum/index";
import type { AnalysisRunResult } from "../../models/index";
import {
  countRelationshipTargets,
  countRuleHitsOnActive,
} from "../../shared/lib/dashboardMetrics";
import { PRIORITY_BAND_LABEL } from "../../shared/lib/labels";

interface KpiBoardProps {
  run: AnalysisRunResult;
}

export function KpiBoard({ run }: KpiBoardProps) {
  const { summary, capabilities } = run;
  const relationshipCount = countRelationshipTargets(run.results);
  const p1 = summary.priorityBandCounts[PriorityBand.P1Immediate] ?? 0;
  const p2 = summary.priorityBandCounts[PriorityBand.P2Priority] ?? 0;
  const r02 = countRuleHitsOnActive(run, BusinessRuleId.R02);
  const r01 = countRuleHitsOnActive(run, BusinessRuleId.R01);
  const r05 = countRuleHitsOnActive(run, BusinessRuleId.R05);

  return (
    <section className="kpi-board" aria-label="핵심 KPI">
      <div className="kpi-grid">
        <article className="kpi-card">
          <p className="kpi-card__label">Active 만기대상</p>
          <p className="kpi-card__value" data-testid="kpi-active">
            {summary.activeWindowCount}
          </p>
        </article>
        <article className="kpi-card kpi-card--accent">
          <p className="kpi-card__label">{PRIORITY_BAND_LABEL[PriorityBand.P1Immediate]}</p>
          <p className="kpi-card__value" data-testid="kpi-p1">
            {p1}
          </p>
        </article>
        <article className="kpi-card">
          <p className="kpi-card__label">실질 Remark 대상</p>
          <p className="kpi-card__value" data-testid="kpi-remark">
            {summary.realRemarkCount}
          </p>
        </article>
        <article className="kpi-card">
          <p className="kpi-card__label">관계 연결 확인</p>
          <p className="kpi-card__value" data-testid="kpi-relationship">
            {relationshipCount}
          </p>
        </article>
      </div>

      <ul className="kpi-badges" aria-label="보조 KPI">
        <li>
          {PRIORITY_BAND_LABEL[PriorityBand.P2Priority]} {p2}건
        </li>
        <li data-testid="kpi-policy">
          {capabilities.canAnalyzePolicyFund
            ? `정책자금 ${r05}건`
            : "정책자금 분석 제외"}
        </li>
        <li>제3자 담보 {r02}건</li>
        <li>동일 차주 추가만기 {r01}건</li>
        <li>데이터 오류 {summary.errorRowCount}건</li>
        <li>분석범위 외 {summary.outOfScopeCount}건</li>
      </ul>
    </section>
  );
}
