import type { DashboardTabId } from "../dashboard-filters/DashboardFilters";

interface AnalysisTabsProps {
  activeTab: DashboardTabId;
  onChange: (tab: DashboardTabId) => void;
  counts: Record<DashboardTabId, number>;
}

const TAB_LABELS: Record<DashboardTabId, string> = {
  active: "Active Queue",
  outOfScope: "분석범위 외",
  errors: "데이터 오류",
  relationships: "관계 네트워크",
};

export function AnalysisTabs({ activeTab, onChange, counts }: AnalysisTabsProps) {
  return (
    <div className="tabs" role="tablist" aria-label="분석 결과 탭">
      {(Object.keys(TAB_LABELS) as DashboardTabId[]).map((tab) => (
        <button
          key={tab}
          type="button"
          id={`tab-btn-${tab}`}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`tab-panel-${tab}`}
          tabIndex={activeTab === tab ? 0 : -1}
          className={activeTab === tab ? "tab is-active" : "tab"}
          onClick={() => onChange(tab)}
          data-testid={`tab-${tab}`}
        >
          {TAB_LABELS[tab]}
          <span className="tab__count" aria-hidden="true">
            {counts[tab]}
          </span>
          <span className="sr-only">{counts[tab]}건</span>
        </button>
      ))}
    </div>
  );
}
