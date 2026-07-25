import { useEffect, useId, useRef } from "react";
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
  MATURITY_BUCKET_LABEL,
} from "../../shared/lib/labels";
import { PRIORITY_SCORE_CAP } from "../../constants/index";

interface LoanDetailDrawerProps {
  result: LoanAnalysisResult | null;
  open: boolean;
  onClose: () => void;
  onNavigateLoan: (loanId: string) => void;
}

export function LoanDetailDrawer({
  result,
  open,
  onClose,
  onNavigateLoan,
}: LoanDetailDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
    }
  }, [open, result?.loan.loanId]);

  if (!open || !result) {
    return null;
  }

  const breakdown = result.scoreBreakdown;
  const relatedIds = [
    ...new Set(
      result.remarks.flatMap((remark) => remark.relatedLoanIds ?? []),
    ),
  ];

  return (
    <div className="drawer-root" data-testid="loan-drawer">
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="상세 닫기"
        onClick={onClose}
      />
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="drawer__header">
          <div>
            <p className="drawer__eyebrow">여신 상세</p>
            <h2 id={titleId}>
              {result.loan.borrowerName} · {result.loan.loanId}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            data-testid="drawer-close"
          >
            닫기
          </button>
        </header>

        <div className="drawer__body">
          <section>
            <h3>1. 기본정보</h3>
            <dl className="detail-grid">
              <div>
                <dt>계좌번호</dt>
                <dd>{result.loan.loanId}</dd>
              </div>
              <div>
                <dt>고객명</dt>
                <dd>{result.loan.borrowerName}</dd>
              </div>
              <div>
                <dt>상품코드</dt>
                <dd>{result.loan.productCode || "-"}</dd>
              </div>
              <div>
                <dt>대출목적</dt>
                <dd>{result.loan.loanPurpose ?? "-"}</dd>
              </div>
              <div>
                <dt>원본 행</dt>
                <dd>{result.loan.sourceRowNumber}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h3>2. 일정정보</h3>
            <dl className="detail-grid">
              <div>
                <dt>만기일</dt>
                <dd>{formatDate(result.loan.maturityDate)}</dd>
              </div>
              <div>
                <dt>D-Day</dt>
                <dd>{formatDDay(result.dDay)}</dd>
              </div>
              <div>
                <dt>Bucket</dt>
                <dd>{MATURITY_BUCKET_LABEL[result.maturityBucket]}</dd>
              </div>
              <div>
                <dt>일정상태</dt>
                <dd>
                  <ScheduleStatusBadge status={result.scheduleStatus} />
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h3>3. Priority Score 산정근거</h3>
            {breakdown ? (
              <ul className="score-bars" data-testid="score-breakdown">
                {(
                  [
                    ["일정", breakdown.scheduleScore, PRIORITY_SCORE_CAP.SCHEDULE],
                    ["담보·관계", breakdown.collateralScore, PRIORITY_SCORE_CAP.COLLATERAL],
                    ["정책자금", breakdown.policyScore, PRIORITY_SCORE_CAP.POLICY],
                    ["장기·품질", breakdown.agingScore, PRIORITY_SCORE_CAP.AGING],
                    ["일정추가", breakdown.scheduleExtraScore, PRIORITY_SCORE_CAP.SCHEDULE_EXTRA],
                  ] as const
                ).map(([label, value, cap]) => (
                  <li key={label}>
                    <div className="score-bars__meta">
                      <span>{label}</span>
                      <span>
                        {value}/{cap}
                      </span>
                    </div>
                    <div className="score-bars__track" aria-hidden="true">
                      <div
                        className="score-bars__fill"
                        style={{ width: `${(value / cap) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
                <li className="score-bars__total">
                  합계 {breakdown.total} / Band{" "}
                  <PriorityBandBadge band={result.priorityBand} /> · Exception{" "}
                  <ExceptionLevelBadge level={result.exceptionLevel} />
                </li>
              </ul>
            ) : (
              <p className="muted">
                Active Window 외 — Score/Band는 산정하지 않습니다. (
                {formatScore(result.priorityScore)})
              </p>
            )}
          </section>

          <section>
            <h3>4. Remark 상세</h3>
            {result.remarks.length === 0 ? (
              <p className="muted">특이사항 없음</p>
            ) : (
              <ul className="remark-list">
                {result.remarks.map((remark) => (
                  <li key={remark.remarkKey}>
                    <strong>
                      [{remark.ruleId}] {remark.title}
                    </strong>
                    <p>{remark.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>5. 관계 연결</h3>
            {relatedIds.length === 0 ? (
              <p className="muted">연결된 계좌 없음</p>
            ) : (
              <ul className="chip-list">
                {relatedIds.map((loanId) => (
                  <li key={loanId}>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => onNavigateLoan(loanId)}
                    >
                      {loanId}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>6. 권장 Action</h3>
            {result.recommendedActions.length === 0 ? (
              <p className="muted">권장 Action 없음</p>
            ) : (
              <ul className="remark-list" data-testid="drawer-actions">
                {result.recommendedActions.map((action) => (
                  <li key={action.actionId}>
                    <strong>{action.title}</strong>
                    <p className="muted">{action.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>7. Validation Warning</h3>
            {result.loan.validationIssues.length === 0 ? (
              <p className="muted">검증 이슈 없음</p>
            ) : (
              <ul className="remark-list">
                {result.loan.validationIssues.map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>
                    [{issue.severity}] {issue.field}: {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>8. Rule 기반 고지문</h3>
            <p className="notice">
              본 의견은 Rule 기반 업무지원 결과이며 최종 심사 및 고객관계 확인은
              담당자가 수행해야 합니다.
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}
