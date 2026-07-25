import { BusinessRuleId } from "../../../enum/index";
import type { LoanAnalysisResult } from "../../../models/index";

export interface RelationshipNode {
  id: string;
  loanId: string;
  label: string;
  band: string | null;
  x: number;
  y: number;
}

export interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  ruleId: string;
  title: string;
  highlight: boolean;
}

export interface RelationshipGraphModel {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

const RELATION_RULES = new Set<string>([
  BusinessRuleId.R01,
  BusinessRuleId.R03,
  BusinessRuleId.R04,
]);

/** 분석 결과 → 관계 그래프 모델 (중복 엣지 제거) */
export function buildRelationshipGraph(
  results: LoanAnalysisResult[],
): RelationshipGraphModel {
  const nodeMap = new Map<string, RelationshipNode>();
  const edgeMap = new Map<string, RelationshipEdge>();

  for (const result of results) {
    for (const remark of result.remarks) {
      if (!RELATION_RULES.has(remark.ruleId)) {
        continue;
      }
      const related = remark.relatedLoanIds ?? [];
      if (related.length === 0) {
        continue;
      }

      ensureNode(nodeMap, result);
      for (const relatedId of related) {
        const relatedResult = results.find((row) => row.loan.loanId === relatedId);
        if (relatedResult) {
          ensureNode(nodeMap, relatedResult);
        } else if (!nodeMap.has(relatedId)) {
          nodeMap.set(relatedId, {
            id: relatedId,
            loanId: relatedId,
            label: relatedId,
            band: null,
            x: 0,
            y: 0,
          });
        }

        const pair = [result.loan.loanId, relatedId].sort();
        const edgeId = `${remark.ruleId}:${pair[0]}-${pair[1]}`;
        if (!edgeMap.has(edgeId)) {
          edgeMap.set(edgeId, {
            id: edgeId,
            source: pair[0]!,
            target: pair[1]!,
            ruleId: remark.ruleId,
            title: remark.title,
            highlight:
              remark.ruleId === BusinessRuleId.R03 ||
              remark.ruleId === BusinessRuleId.R04,
          });
        }
      }
    }
  }

  const nodes = layoutNodes([...nodeMap.values()]);
  return { nodes, edges: [...edgeMap.values()] };
}

function ensureNode(
  nodeMap: Map<string, RelationshipNode>,
  result: LoanAnalysisResult,
): void {
  if (nodeMap.has(result.loan.loanId)) {
    return;
  }
  nodeMap.set(result.loan.loanId, {
    id: result.loan.loanId,
    loanId: result.loan.loanId,
    label: result.loan.borrowerName,
    band: result.priorityBand,
    x: 0,
    y: 0,
  });
}

/** 원형 레이아웃 — 외부 그래프 라이브러리 없이 SVG용 좌표 산출 */
function layoutNodes(nodes: RelationshipNode[]): RelationshipNode[] {
  if (nodes.length === 0) {
    return [];
  }
  const cx = 280;
  const cy = 180;
  const radius = Math.min(140, 40 + nodes.length * 12);

  return nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });
}
