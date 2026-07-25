import {
  buildRuleBasedOpinion,
  RULE_OPINION_DISCLAIMER,
} from "../../entities/loan/lib/recommendation";
import type { AnalysisRunResult, LoanAnalysisResult } from "../../models/index";
import { ActionUrgency, PriorityBand } from "../../enum/index";
import { formatDDay } from "../../shared/lib/labels";

interface ActionOpinionProps {
  run: AnalysisRunResult;
  focusLoanId?: string | null;
  onSelect?: (loanId: string) => void;
}

const URGENCY_LABEL: Record<ActionUrgency, string> = {
  [ActionUrgency.Today]: "오늘",
  [ActionUrgency.ThisWeek]: "이번 주",
  [ActionUrgency.NextWeek]: "다음 주",
  [ActionUrgency.Routine]: "일상",
};

export function ActionOpinion({
  run,
  focusLoanId,
  onSelect,
}: ActionOpinionProps) {
  const opinion = buildRuleBasedOpinion(run);
  const focus =
    run.results.find((result) => result.loan.loanId === focusLoanId) ??
    run.results.find(
      (result) => result.priorityBand === PriorityBand.P1Immediate,
    ) ??
    null;

  return (
    <section className="action-opinion" data-testid="action-opinion">
      {focus ? <FocusActionCard result={focus} /> : null}

      <div className="opinion-grid">
        {opinion.map((section) => (
          <article key={section.id} data-testid={`opinion-${section.id}`}>
            <h3>{section.title}</h3>
            {section.items.length === 0 ? (
              <p className="muted">해당 없음</p>
            ) : (
              <ul>
                {section.items.map((item) => (
                  <li key={`${section.id}-${item.loanId}`}>
                    {onSelect ? (
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => onSelect(item.loanId)}
                      >
                        {item.borrowerName} ({item.loanId})
                      </button>
                    ) : (
                      <strong>
                        {item.borrowerName} ({item.loanId})
                      </strong>
                    )}
                    <span className="muted"> — {item.summary}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <p className="notice">{RULE_OPINION_DISCLAIMER}</p>
    </section>
  );
}

function FocusActionCard({ result }: { result: LoanAnalysisResult }) {
  const action = result.recommendedActions[0];
  return (
    <article className="focus-action" data-testid="focus-action">
      <p className="eyebrow">Today&apos;s Action</p>
      <h3>
        {result.loan.borrowerName} · {formatDDay(result.dDay)}
      </h3>
      <p>
        {action
          ? action.title
          : "특이사항 없이 일정 우선 확인이 필요합니다."}
      </p>
      {action ? (
        <p className="muted">
          긴급도 {URGENCY_LABEL[action.urgency]} · {action.reason}
        </p>
      ) : null}
    </article>
  );
}
