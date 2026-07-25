import { BusinessRuleId } from "../../enum/index";
import type { LoanAnalysisResult } from "../../models/index";

interface RelationshipPanelProps {
  results: LoanAnalysisResult[];
  onSelect: (loanId: string) => void;
}

export function RelationshipPanel({ results, onSelect }: RelationshipPanelProps) {
  const edges = results.flatMap((result) =>
    result.remarks
      .filter(
        (remark) =>
          remark.ruleId === BusinessRuleId.R03 ||
          remark.ruleId === BusinessRuleId.R04 ||
          remark.ruleId === BusinessRuleId.R01,
      )
      .flatMap((remark) =>
        (remark.relatedLoanIds ?? []).map((relatedId) => ({
          from: result.loan.loanId,
          to: relatedId,
          ruleId: remark.ruleId,
          title: remark.title,
        })),
      ),
  );

  const unique = new Map<string, (typeof edges)[number]>();
  for (const edge of edges) {
    const key = [edge.from, edge.to, edge.ruleId].sort().join("|");
    if (!unique.has(key)) {
      unique.set(key, edge);
    }
  }

  return (
    <section className="relationship-panel" data-testid="relationship-panel">
      <p className="notice">
        본 관계도는 데이터상 동일 식별정보의 연결을 시각화한 것으로, 실제 가족
        또는 특수관계 여부를 확정하지 않습니다.
      </p>
      {unique.size === 0 ? (
        <p className="empty-inline">관계 연결이 없습니다.</p>
      ) : (
        <ul className="edge-list">
          {[...unique.values()].map((edge) => (
            <li key={`${edge.from}-${edge.to}-${edge.ruleId}`}>
              <button type="button" onClick={() => onSelect(edge.from)}>
                {edge.from}
              </button>
              <span>↔</span>
              <button type="button" onClick={() => onSelect(edge.to)}>
                {edge.to}
              </button>
              <span className="muted">
                [{edge.ruleId}] {edge.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
