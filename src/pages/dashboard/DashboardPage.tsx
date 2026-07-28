import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MaturityBucket, PriorityBand } from "../../enum/index";
import type { AnalysisRunResult, LoanAnalysisResult } from "../../models/index";
import { loadSampleAnalysis } from "../../features/sample-load/loadSampleAnalysis";
import {
  ExcelParseError,
  loadAnalysisFromExcelFile,
} from "../../features/excel-upload/index";
import { downloadAnalysisXlsx } from "../../features/excel-export/index";
import { sortActiveQueue } from "../../shared/lib/dashboardMetrics";
import { formatDate } from "../../shared/lib/labels";
import { KpiBoard } from "../../widgets/kpi-board/KpiBoard";
import {
  DashboardFilters,
  type DashboardTabId,
} from "../../widgets/dashboard-filters/DashboardFilters";
import { AnalysisTabs } from "../../widgets/analysis-tabs/AnalysisTabs";
import { ActiveQueueTable } from "../../widgets/active-queue/ActiveQueueTable";
import { RelationshipGraph } from "../../widgets/relationship-network/RelationshipGraph";
import { ActionOpinion } from "../../widgets/action-opinion/ActionOpinion";
import { LoanDetailDrawer } from "../../widgets/loan-detail-drawer/LoanDetailDrawer";

function matchesSearch(result: LoanAnalysisResult, search: string): boolean {
  if (!search.trim()) {
    return true;
  }
  const q = search.trim().toLowerCase();
  return (
    result.loan.loanId.toLowerCase().includes(q) ||
    result.loan.borrowerName.toLowerCase().includes(q)
  );
}

export function DashboardPage() {
  const [run, setRun] = useState<AnalysisRunResult | null>(null);
  const [tab, setTab] = useState<DashboardTabId>("active");
  const [search, setSearch] = useState("");
  const [bandFilter, setBandFilter] = useState<PriorityBand | "ALL">("ALL");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedResult = useMemo(() => {
    if (!run || !selectedLoanId) {
      return null;
    }
    return (
      run.results.find((result) => result.loan.loanId === selectedLoanId) ?? null
    );
  }, [run, selectedLoanId]);

  const tabCounts = useMemo(() => {
    if (!run) {
      return { active: 0, outOfScope: 0, errors: 0, relationships: 0 };
    }
    const active = run.results.filter((r) => r.isInActiveWindow).length;
    const outOfScope = run.results.filter(
      (r) => r.maturityBucket === MaturityBucket.OutOfScope,
    ).length;
    const errors = run.results.filter(
      (r) => r.loan.validationIssues.length > 0 || r.loan.disabledDuplicate,
    ).length;
    const relationships = run.results.filter((r) =>
      r.remarks.some((remark) => remark.relatedLoanIds?.length),
    ).length;
    return { active, outOfScope, errors, relationships };
  }, [run]);

  const visibleRows = useMemo(() => {
    if (!run) {
      return [];
    }

    let rows: LoanAnalysisResult[] = [];
    if (tab === "active") {
      rows = sortActiveQueue(run.results);
      if (bandFilter !== "ALL") {
        rows = rows.filter((row) => row.priorityBand === bandFilter);
      }
    } else if (tab === "outOfScope") {
      rows = run.results.filter(
        (row) => row.maturityBucket === MaturityBucket.OutOfScope,
      );
    } else if (tab === "errors") {
      rows = run.results.filter(
        (row) =>
          row.loan.validationIssues.length > 0 || row.loan.disabledDuplicate,
      );
    }

    return rows.filter((row) => matchesSearch(row, search));
  }, [run, tab, bandFilter, search]);

  const applyRun = (next: AnalysisRunResult) => {
    setRun(next);
    setTab("active");
    setSearch("");
    setBandFilter("ALL");
    setSelectedLoanId(null);
    setDrawerOpen(false);
    setUploadError(null);
  };

  const handleSelect = (loanId: string) => {
    setSelectedLoanId(loanId);
    setDrawerOpen(true);
  };

  const handleLoadSample = () => {
    applyRun(loadSampleAnalysis());
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      const next = await loadAnalysisFromExcelFile(file);
      applyRun(next);
    } catch (error) {
      const message =
        error instanceof ExcelParseError
          ? error.message
          : "엑셀 파일을 읽지 못했습니다. 형식을 확인해 주세요.";
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleExport = () => {
    if (!run) {
      return;
    }
    void downloadAnalysisXlsx(run);
  };

  const handleReset = () => {
    setRun(null);
    setSelectedLoanId(null);
    setDrawerOpen(false);
    setSearch("");
    setBandFilter("ALL");
    setUploadError(null);
  };

  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Renewal Navigator</p>
          <h1>기업여신 만기관리 Dashboard</h1>
          <p className="lede">
            Active Window 기준으로 Priority Band와 Exception Level을 확인합니다.
          </p>
        </div>
        <div className="header-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="visually-hidden"
            data-testid="upload-xlsx-input"
            onChange={(event) => {
              void handleFileChange(event);
            }}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={handlePickFile}
            disabled={uploading}
            data-testid="upload-xlsx"
          >
            {uploading ? "분석 중…" : "엑셀 업로드"}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleLoadSample}
            data-testid="load-sample"
          >
            샘플 데이터 분석
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleExport}
            disabled={!run}
            data-testid="export-xlsx"
          >
            Excel Export
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleReset}
            data-testid="reset-analysis"
          >
            초기화
          </button>
          <Link className="btn btn--ghost" to="/showcase">
            Showcase
          </Link>
        </div>
      </header>

      {uploadError ? (
        <p className="upload-error" role="alert" data-testid="upload-error">
          {uploadError}
        </p>
      ) : null}

      {!run ? (
        <div className="empty-state" data-testid="empty-state">
          <p>엑셀을 업로드하거나 샘플 데이터로 먼저 확인해보세요.</p>
          <div className="empty-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handlePickFile}
              disabled={uploading}
              data-testid="upload-xlsx-empty"
            >
              엑셀 업로드
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleLoadSample}
              data-testid="load-sample-empty"
            >
              샘플 데이터로 시작
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="meta-bar">
            <span>원본: {run.sourceFileName ?? "-"}</span>
            <span>기준일: {formatDate(run.referenceDate)}</span>
            <span>입력 {run.summary.inputRowCount}건</span>
          </div>

          <KpiBoard run={run} />

          <AnalysisTabs activeTab={tab} onChange={setTab} counts={tabCounts} />

          {tab !== "relationships" && (
            <DashboardFilters
              search={search}
              onSearchChange={setSearch}
              bandFilter={bandFilter}
              onBandFilterChange={setBandFilter}
            />
          )}

          <div
            id={`tab-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`tab-btn-${tab}`}
            data-testid={`tab-panel-${tab}`}
          >
            {tab === "relationships" ? (
              <>
                <RelationshipGraph
                  results={run.results}
                  onSelect={handleSelect}
                />
                <div className="showcase-section">
                  <h2>권장 Action · 종합의견</h2>
                  <ActionOpinion
                    run={run}
                    focusLoanId={selectedLoanId}
                    onSelect={handleSelect}
                  />
                </div>
              </>
            ) : (
              <ActiveQueueTable
                rows={visibleRows}
                selectedLoanId={selectedLoanId}
                onSelect={handleSelect}
                showScoreBand={tab === "active"}
              />
            )}
          </div>
        </>
      )}

      <LoanDetailDrawer
        result={selectedResult}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigateLoan={handleSelect}
      />
    </div>
  );
}
