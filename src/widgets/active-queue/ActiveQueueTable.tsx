import type { LoanAnalysisResult } from "../../models/index";
import {
  ExceptionLevelBadge,
  PriorityBandBadge,
  ScheduleStatusBadge,
} from "../../entities/loan/ui/StatusBadges";
import {
  formatDate,
  formatDDay,
  formatScore,
} from "../../shared/lib/labels";

interface ActiveQueueTableProps {
  rows: LoanAnalysisResult[];
  selectedLoanId: string | null;
  onSelect: (loanId: string) => void;
  showScoreBand: boolean;
}

export function ActiveQueueTable({
  rows,
  selectedLoanId,
  onSelect,
  showScoreBand,
}: ActiveQueueTableProps) {
  if (rows.length === 0) {
    return <p className="empty-inline">표시할 여신이 없습니다.</p>;
  }

  return (
    <div className="queue-responsive" data-testid="queue-responsive">
      <div className="table-wrap table-wrap--desktop">
        <table className="data-table" data-testid="queue-table">
          <thead>
            <tr>
              <th scope="col">순번</th>
              <th scope="col">계좌번호</th>
              <th scope="col">고객명</th>
              <th scope="col">대출목적</th>
              <th scope="col">만기일</th>
              <th scope="col">D-Day</th>
              <th scope="col">일정상태</th>
              <th scope="col">Priority Band</th>
              <th scope="col">Score</th>
              <th scope="col">Exception</th>
              <th scope="col">핵심 Remark</th>
              <th scope="col">다음 Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const topRemarks = row.remarks.slice(0, 2);
              const nextAction =
                row.recommendedActions[0]?.title ??
                row.remarks[0]?.recommendedAction ??
                "-";
              return (
                <tr
                  key={`${row.loan.loanId}-${row.loan.sourceRowNumber}`}
                  className={
                    selectedLoanId === row.loan.loanId
                      ? "is-selected"
                      : undefined
                  }
                  onClick={() => onSelect(row.loan.loanId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(row.loan.loanId);
                    }
                  }}
                  tabIndex={0}
                  data-testid={`queue-row-${row.loan.loanId}`}
                >
                  <td>{index + 1}</td>
                  <td>{row.loan.loanId}</td>
                  <td>{row.loan.borrowerName}</td>
                  <td>{row.loan.loanPurpose ?? "-"}</td>
                  <td>{formatDate(row.loan.maturityDate)}</td>
                  <td>{formatDDay(row.dDay)}</td>
                  <td>
                    <ScheduleStatusBadge status={row.scheduleStatus} />
                  </td>
                  <td>
                    {showScoreBand ? (
                      <PriorityBandBadge band={row.priorityBand} />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {showScoreBand ? formatScore(row.priorityScore) : "-"}
                  </td>
                  <td>
                    <ExceptionLevelBadge level={row.exceptionLevel} />
                  </td>
                  <td>
                    {topRemarks.length === 0
                      ? "-"
                      : topRemarks.map((remark) => remark.title).join(" / ")}
                  </td>
                  <td className="action-cell">{nextAction}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="queue-cards queue-cards--mobile" data-testid="queue-cards">
        {rows.map((row, index) => {
          const nextAction =
            row.recommendedActions[0]?.title ??
            row.remarks[0]?.recommendedAction ??
            "-";
          return (
            <li key={`card-${row.loan.loanId}-${row.loan.sourceRowNumber}`}>
              <button
                type="button"
                className={
                  selectedLoanId === row.loan.loanId
                    ? "queue-card is-selected"
                    : "queue-card"
                }
                onClick={() => onSelect(row.loan.loanId)}
                data-testid={`queue-card-${row.loan.loanId}`}
              >
                <div className="queue-card__head">
                  <strong>
                    {index + 1}. {row.loan.borrowerName}
                  </strong>
                  <span>{row.loan.loanId}</span>
                </div>
                <div className="queue-card__meta">
                  <span>{formatDDay(row.dDay)}</span>
                  <ScheduleStatusBadge status={row.scheduleStatus} />
                  {showScoreBand ? (
                    <PriorityBandBadge band={row.priorityBand} />
                  ) : null}
                  <ExceptionLevelBadge level={row.exceptionLevel} />
                </div>
                <p className="muted">
                  {row.remarks[0]?.title ?? "특이사항 없음"} · {nextAction}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
