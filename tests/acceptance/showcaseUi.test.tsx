/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ShowcasePage } from "../../src/pages/showcase/ShowcasePage";
import { PriorityBand } from "../../src/enum/index";

describe("Acceptance — Showcase UI", () => {
  it("가상 분석 시작 후 KPI·Board·Graph·Opinion이 정상 렌더된다", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ShowcasePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("showcase-start"));

    expect(screen.getByTestId("showcase-kpi-active")).toHaveTextContent("8");
    expect(screen.getByTestId("showcase-kpi-p1")).toHaveTextContent("1");
    expect(screen.getByTestId("showcase-kpi-remark")).toHaveTextContent("7");
    expect(screen.getByTestId("showcase-kpi-relationship")).toHaveTextContent(
      "4",
    );
    expect(screen.getByTestId("showcase-top-score")).toHaveTextContent("68");

    expect(screen.getByTestId(`board-col-${PriorityBand.P1Immediate}`)).toHaveTextContent(
      "한빛정밀",
    );
    expect(screen.getByTestId(`board-col-${PriorityBand.P4Routine}`)).toHaveTextContent(
      "새봄바이오",
    );

    const graph = screen.getByTestId("relationship-graph");
    expect(within(graph).getByTestId("graph-node-S02")).toBeInTheDocument();
    expect(within(graph).getByTestId("graph-node-S03")).toBeInTheDocument();
    expect(within(graph).getByTestId("graph-node-S04")).toBeInTheDocument();
    expect(within(graph).getByTestId("graph-node-S05")).toBeInTheDocument();

    expect(screen.getByTestId("focus-action")).toHaveTextContent("한빛정밀");
    expect(screen.getByTestId("action-opinion")).toHaveTextContent(
      "본 의견은 Rule 기반 업무지원 결과이며",
    );
  });
});
