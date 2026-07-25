import { PriorityBand } from "../../enum/index";
import { PRIORITY_BAND_LABEL, PRIORITY_BAND_ORDER } from "../../shared/lib/labels";

export type DashboardTabId =
  | "active"
  | "outOfScope"
  | "errors"
  | "relationships";

interface DashboardFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  bandFilter: PriorityBand | "ALL";
  onBandFilterChange: (value: PriorityBand | "ALL") => void;
}

export function DashboardFilters({
  search,
  onSearchChange,
  bandFilter,
  onBandFilterChange,
}: DashboardFiltersProps) {
  return (
    <div className="filters" data-testid="dashboard-filters">
      <label className="filters__field">
        <span>검색</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="계좌번호 · 고객명"
          data-testid="filter-search"
        />
      </label>
      <label className="filters__field">
        <span>Priority Band</span>
        <select
          value={bandFilter}
          onChange={(event) =>
            onBandFilterChange(event.target.value as PriorityBand | "ALL")
          }
          data-testid="filter-band"
        >
          <option value="ALL">전체</option>
          {PRIORITY_BAND_ORDER.map((band) => (
            <option key={band} value={band}>
              {PRIORITY_BAND_LABEL[band]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
