import { buildRelationshipGraph } from "../../entities/loan/lib/relationshipGraph";
import type { LoanAnalysisResult } from "../../models/index";

interface RelationshipGraphProps {
  results: LoanAnalysisResult[];
  onSelect: (loanId: string) => void;
  emphasisLabels?: string[];
}

export function RelationshipGraph({
  results,
  onSelect,
  emphasisLabels = [],
}: RelationshipGraphProps) {
  const graph = buildRelationshipGraph(results);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  return (
    <section className="relationship-panel" data-testid="relationship-graph">
      <p className="notice">
        본 관계도는 데이터상 동일 식별정보의 연결을 시각화한 것으로, 실제 가족
        또는 특수관계 여부를 확정하지 않습니다.
      </p>

      {graph.nodes.length === 0 ? (
        <p className="empty-inline">관계 연결이 없습니다.</p>
      ) : (
        <>
          <svg
            viewBox="0 0 560 360"
            className="relationship-svg"
            role="img"
            aria-label="관계 네트워크 그래프"
          >
            {graph.edges.map((edge) => {
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
              if (!source || !target) {
                return null;
              }
              return (
                <g key={edge.id}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    className={
                      edge.highlight
                        ? "relationship-edge is-highlight"
                        : "relationship-edge"
                    }
                  />
                  <text
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2 - 6}
                    className="relationship-edge-label"
                  >
                    {edge.ruleId}
                  </text>
                </g>
              );
            })}
            {graph.nodes.map((node) => {
              const emphasized = emphasisLabels.some((label) =>
                node.label.includes(label),
              );
              return (
                <g
                  key={node.id}
                  className={
                    emphasized
                      ? "relationship-node is-emphasis"
                      : "relationship-node"
                  }
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => onSelect(node.loanId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(node.loanId);
                    }
                  }}
                  data-testid={`graph-node-${node.loanId}`}
                >
                  <circle r={28} />
                  <text textAnchor="middle" dy="-2" className="node-name">
                    {node.label.length > 6
                      ? `${node.label.slice(0, 6)}…`
                      : node.label}
                  </text>
                  <text textAnchor="middle" dy="12" className="node-id">
                    {node.loanId}
                  </text>
                </g>
              );
            })}
          </svg>

          <ul className="edge-list" data-testid="relationship-edge-list">
            {graph.edges.map((edge) => (
              <li key={edge.id}>
                <button type="button" onClick={() => onSelect(edge.source)}>
                  {nodeById.get(edge.source)?.label ?? edge.source}
                </button>
                <span>↔</span>
                <button type="button" onClick={() => onSelect(edge.target)}>
                  {nodeById.get(edge.target)?.label ?? edge.target}
                </button>
                <span className="muted">
                  [{edge.ruleId}] {edge.title}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
