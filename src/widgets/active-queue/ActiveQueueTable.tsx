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
    <div className="table-wrap">
      <table className="data-table" data-testid="queue-table">
        <thead>
          <tr>
            <th>순번</th>
            <th>계좌번호</th>
            <th>고객명</th>
            <th>대출목적</th>
            <th>만기일</th>
            <th>D-Day</th>
            <th>일정상태</th>
            <th>Priority Band</th>
            <th>Score</th>
            <th>Exception</th>
            <th>핵심 Remark</th>
            <th>다음 Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const topRemarks = row.remarks.slice(0, 2);
            const nextAction =
              row.remarks[0]?.recommendedAction ??
              row.recommendedActions[0]?.title ??
              "-";
            return (
              <tr
                key={`${row.loan.loanId}-${row.loan.sourceRowNumber}`}
                className={
                  selectedLoanId === row.loan.loanId ? "is-selected" : undefined
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
                <td>{showScoreBand ? formatScore(row.priorityScore) : "-"}</td>
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
  );
}
