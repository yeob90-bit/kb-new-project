import * as XLSX from "xlsx";
import { MaturityBucket, PriorityBand } from "../../enum/index";
import { buildRelationshipGraph } from "../../entities/loan/lib/relationshipGraph";
import type { AnalysisRunResult, LoanAnalysisResult } from "../../models/index";
import {
  EXCEPTION_LEVEL_LABEL,
  formatDate,
  formatDDay,
  formatScore,
  MATURITY_BUCKET_LABEL,
  PRIORITY_BAND_LABEL,
  SCHEDULE_STATUS_LABEL,
} from "../../shared/lib/labels";
import { EXPORT_SHEET_NAMES } from "./exportConstants";

function sourceMeta(run: AnalysisRunResult, result: LoanAnalysisResult) {
  return {
    원본파일명: run.sourceFileName ?? "",
    원본행번호: result.loan.sourceRowNumber,
  };
}

function baseLoanCols(result: LoanAnalysisResult) {
  return {
    계좌번호: result.loan.loanId,
    고객명: result.loan.borrowerName,
    대출목적: result.loan.loanPurpose ?? "",
    만기일: formatDate(result.loan.maturityDate),
    Bucket: MATURITY_BUCKET_LABEL[result.maturityBucket],
    "D-Day": formatDDay(result.dDay),
    일정상태: SCHEDULE_STATUS_LABEL[result.scheduleStatus],
    PriorityBand: result.priorityBand
      ? PRIORITY_BAND_LABEL[result.priorityBand]
      : "-",
    PriorityScore: formatScore(result.priorityScore),
    ExceptionLevel: EXCEPTION_LEVEL_LABEL[result.exceptionLevel],
  };
}

function buildSummarySheet(run: AnalysisRunResult): Record<string, string | number>[] {
  const { summary, capabilities } = run;
  return [
    { 항목: "원본파일명", 값: run.sourceFileName ?? "" },
    { 항목: "기준일", 값: formatDate(run.referenceDate) },
    { 항목: "입력건수", 값: summary.inputRowCount },
    { 항목: "유효건수", 값: summary.validLoanCount },
    { 항목: "Active만기대상", 값: summary.activeWindowCount },
    { 항목: "분석범위외", 값: summary.outOfScopeCount },
    { 항목: "날짜오류", 값: summary.invalidDateCount },
    { 항목: "데이터오류행", 값: summary.errorRowCount },
    { 항목: "실질Remark", 값: summary.realRemarkCount },
    { 항목: "최고점", 값: summary.topScore ?? "" },
    {
      항목: "P1즉시처리",
      값: summary.priorityBandCounts[PriorityBand.P1Immediate] ?? 0,
    },
    {
      항목: "P2우선처리",
      값: summary.priorityBandCounts[PriorityBand.P2Priority] ?? 0,
    },
    {
      항목: "P3사전준비",
      값: summary.priorityBandCounts[PriorityBand.P3Prepare] ?? 0,
    },
    {
      항목: "P4일상",
      값: summary.priorityBandCounts[PriorityBand.P4Routine] ?? 0,
    },
    {
      항목: "정책자금분석",
      값: capabilities.canAnalyzePolicyFund ? "가능" : "분석 제외",
    },
  ];
}

function buildActiveQueueSheet(run: AnalysisRunResult) {
  return run.results
    .filter((result) => result.isInActiveWindow)
    .map((result) => ({
      ...sourceMeta(run, result),
      ...baseLoanCols(result),
      핵심Remark: result.remarks
        .slice(0, 2)
        .map((remark) => remark.title)
        .join(" / "),
      다음Action: result.recommendedActions[0]?.title ?? "",
    }));
}

function buildOutOfScopeSheet(run: AnalysisRunResult) {
  return run.results
    .filter((result) => result.maturityBucket === MaturityBucket.OutOfScope)
    .map((result) => ({
      ...sourceMeta(run, result),
      계좌번호: result.loan.loanId,
      고객명: result.loan.borrowerName,
      만기일: formatDate(result.loan.maturityDate),
      PriorityBand: "-",
      PriorityScore: "-",
      ExceptionLevel: EXCEPTION_LEVEL_LABEL[result.exceptionLevel],
      Remark: result.remarks.map((remark) => remark.title).join(" / "),
    }));
}

function buildErrorSheet(run: AnalysisRunResult) {
  return run.results
    .filter(
      (result) =>
        result.loan.validationIssues.length > 0 || result.loan.disabledDuplicate,
    )
    .flatMap((result) => {
      if (result.loan.validationIssues.length === 0) {
        return [
          {
            ...sourceMeta(run, result),
            계좌번호: result.loan.loanId,
            필드: "계좌번호",
            코드: "DUPLICATE_LOAN_ID",
            심각도: "ERROR",
            메시지: "중복 계좌로 비활성화",
          },
        ];
      }
      return result.loan.validationIssues.map((issue) => ({
        ...sourceMeta(run, result),
        계좌번호: result.loan.loanId,
        필드: issue.field,
        코드: issue.code,
        심각도: issue.severity,
        메시지: issue.message,
      }));
    });
}

function buildRemarkSheet(run: AnalysisRunResult) {
  return run.results.flatMap((result) =>
    result.remarks.map((remark) => ({
      ...sourceMeta(run, result),
      계좌번호: result.loan.loanId,
      고객명: result.loan.borrowerName,
      RuleId: remark.ruleId,
      카테고리: remark.category,
      Severity: remark.severity,
      제목: remark.title,
      메시지: remark.message,
      Score: remark.score,
      관계방향: remark.relationDirection ?? "",
      관련계좌: (remark.relatedLoanIds ?? []).join(", "),
      권장Action: remark.recommendedAction,
    })),
  );
}

function buildActionSheet(run: AnalysisRunResult) {
  return run.results.flatMap((result) =>
    result.recommendedActions.map((action) => ({
      ...sourceMeta(run, result),
      계좌번호: result.loan.loanId,
      고객명: result.loan.borrowerName,
      ActionId: action.actionId,
      제목: action.title,
      사유: action.reason,
      긴급도: action.urgency,
      관련Rule: action.relatedRuleIds.join(", "),
    })),
  );
}

function buildRelationshipSheet(run: AnalysisRunResult) {
  const graph = buildRelationshipGraph(run.results);
  const nameById = new Map(
    run.results.map((result) => [result.loan.loanId, result.loan.borrowerName]),
  );

  return graph.edges.map((edge) => ({
    원본파일명: run.sourceFileName ?? "",
    출발계좌: edge.source,
    출발고객: nameById.get(edge.source) ?? "",
    도착계좌: edge.target,
    도착고객: nameById.get(edge.target) ?? "",
    RuleId: edge.ruleId,
    관계명: edge.title,
  }));
}

function sheetFromRows(
  rows: Array<Record<string, string | number>>,
): XLSX.WorkSheet {
  if (rows.length === 0) {
    return XLSX.utils.aoa_to_sheet([["(데이터 없음)"]]);
  }
  return XLSX.utils.json_to_sheet(rows);
}

/** PRD §25 — 분석 결과 신규 Workbook 생성 (원본 파일 미수정) */
export function buildAnalysisWorkbook(run: AnalysisRunResult): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const sheets: Array<[string, XLSX.WorkSheet]> = [
    [EXPORT_SHEET_NAMES[0], sheetFromRows(buildSummarySheet(run))],
    [EXPORT_SHEET_NAMES[1], sheetFromRows(buildActiveQueueSheet(run))],
    [EXPORT_SHEET_NAMES[2], sheetFromRows(buildOutOfScopeSheet(run))],
    [EXPORT_SHEET_NAMES[3], sheetFromRows(buildErrorSheet(run))],
    [EXPORT_SHEET_NAMES[4], sheetFromRows(buildRemarkSheet(run))],
    [EXPORT_SHEET_NAMES[5], sheetFromRows(buildActionSheet(run))],
    [EXPORT_SHEET_NAMES[6], sheetFromRows(buildRelationshipSheet(run))],
  ];

  for (const [name, sheet] of sheets) {
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }

  return workbook;
}

export function buildExportFileName(referenceDate: Date): string {
  return `기업여신_만기관리_분석결과_${formatDate(referenceDate)}.xlsx`;
}
