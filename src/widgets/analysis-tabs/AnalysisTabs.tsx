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
          role="tab"
          aria-selected={activeTab === tab}
          className={activeTab === tab ? "tab is-active" : "tab"}
          onClick={() => onChange(tab)}
          data-testid={`tab-${tab}`}
        >
          {TAB_LABELS[tab]}
          <span className="tab__count">{counts[tab]}</span>
        </button>
      ))}
    </div>
  );
}
