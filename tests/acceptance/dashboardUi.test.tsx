/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "../../src/pages/dashboard/DashboardPage";
import { PriorityBand } from "../../src/enum/index";
import { PRIORITY_BAND_LABEL } from "../../src/shared/lib/labels";

const P1_A = "371101-04-123484";
const P1_B = "371101-04-123480";
const OOS = "371101-04-123467";

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("Acceptance — Dashboard UI", () => {
  it("빈 상태에서 안내 문구를 보여준다", () => {
    renderDashboard();
    expect(screen.getByTestId("empty-state")).toHaveTextContent(
      "엑셀을 업로드하거나 샘플 데이터로 먼저 확인해보세요.",
    );
  });

  it("샘플 분석 후 KPI가 연장데이터 예시 수치와 일치한다", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByTestId("load-sample"));

    expect(screen.getByTestId("kpi-active")).toHaveTextContent("24");
    expect(screen.getByTestId("kpi-p1")).toHaveTextContent("2");
    expect(screen.getByTestId("kpi-remark")).toHaveTextContent("13");
    expect(screen.getByTestId("kpi-relationship")).toHaveTextContent("4");
    expect(screen.getByTestId("kpi-policy")).toHaveTextContent("정책자금");
  });

  it("Active Queue 테이블과 Band 필터가 동작한다", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(screen.getByTestId("load-sample"));

    const table = screen.getByTestId("queue-table");
    expect(within(table).getByText(P1_A)).toBeInTheDocument();
    expect(within(table).getByText(P1_B)).toBeInTheDocument();

    await user.selectOptions(
      screen.getByTestId("filter-band"),
      PriorityBand.P1Immediate,
    );

    expect(within(table).getByText(P1_A)).toBeInTheDocument();
    expect(within(table).getByText(P1_B)).toBeInTheDocument();
    expect(within(table).queryByText("371101-04-123456")).not.toBeInTheDocument();
    expect(
      screen.getByDisplayValue(PRIORITY_BAND_LABEL[PriorityBand.P1Immediate]),
    ).toBeInTheDocument();
  });

  it("검색 필터로 계좌를 좁힌다", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(screen.getByTestId("load-sample"));

    await user.type(screen.getByTestId("filter-search"), P1_B);
    const table = screen.getByTestId("queue-table");
    expect(within(table).getByText(P1_B)).toBeInTheDocument();
    expect(within(table).queryByText(P1_A)).not.toBeInTheDocument();
  });

  it("행 클릭 시 Drawer가 열리고 닫힌다", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(screen.getByTestId("load-sample"));

    await user.click(screen.getByTestId(`queue-row-${P1_B}`));
    const drawer = screen.getByTestId("loan-drawer");
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveTextContent(P1_B);
    expect(drawer).toHaveTextContent("Priority Score 산정근거");
    expect(drawer).toHaveTextContent(
      "본 의견은 Rule 기반 업무지원 결과이며 최종 심사 및 고객관계 확인은 담당자가 수행해야 합니다.",
    );

    await user.click(screen.getByTestId("drawer-close"));
    expect(screen.queryByTestId("loan-drawer")).not.toBeInTheDocument();
  });

  it("탭 전환(분석범위 외 / 관계 네트워크)이 동작한다", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(screen.getByTestId("load-sample"));

    await user.click(screen.getByTestId("tab-outOfScope"));
    expect(screen.getByTestId("queue-table")).toHaveTextContent(OOS);

    await user.click(screen.getByTestId("tab-relationships"));
    expect(screen.getByTestId("relationship-graph")).toHaveTextContent(
      "실제 가족 또는 특수관계 여부를 확정하지 않습니다",
    );
  });
});
