/**
 * @vitest-environment jsdom
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ShowcasePage } from "../../src/pages/showcase/ShowcasePage";
import { PriorityBand } from "../../src/enum/index";
import { SHOWCASE_STORY_SECTIONS } from "../../src/features/showcase-load/showcaseStory";

describe("Acceptance — Showcase Demo Story (공모전 시연)", () => {
  it("S1~S8 스토리 섹션과 Story Rail이 존재한다", () => {
    render(
      <MemoryRouter>
        <ShowcasePage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("story-rail")).toBeInTheDocument();
    for (const section of SHOWCASE_STORY_SECTIONS) {
      expect(screen.getByTestId(`story-jump-${section.id}`)).toBeInTheDocument();
      if (section.id === "s1" || section.id === "s2" || section.id === "s3") {
        expect(screen.getByTestId(`showcase-${section.id}`)).toBeInTheDocument();
      }
    }
  });

  it("Demo 시작 후 KPI·Board·Graph·Action까지 시연 가능 상태가 된다", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ShowcasePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("showcase-start"));

    expect(screen.getByTestId("demo-progress")).toHaveTextContent(
      "분석 완료 — 시연 가능",
    );
    expect(screen.getByTestId("demo-status")).toHaveTextContent(
      "공모전 시연 가능",
    );

    expect(screen.getByTestId("showcase-kpi-active")).toHaveAttribute(
      "data-final-value",
      "8",
    );
    expect(screen.getByTestId("showcase-kpi-p1")).toHaveAttribute(
      "data-final-value",
      "1",
    );
    expect(screen.getByTestId("showcase-kpi-remark")).toHaveAttribute(
      "data-final-value",
      "7",
    );
    expect(screen.getByTestId("showcase-kpi-relationship")).toHaveAttribute(
      "data-final-value",
      "4",
    );
    expect(screen.getByTestId("showcase-top-score")).toHaveTextContent("68");

    for (const band of Object.values(PriorityBand)) {
      expect(screen.getByTestId(`board-col-${band}`)).toBeInTheDocument();
    }
    expect(
      screen.getByTestId(`board-col-${PriorityBand.P1Immediate}`),
    ).toHaveTextContent("한빛정밀");
    expect(
      screen.getByTestId(`board-col-${PriorityBand.P4Routine}`),
    ).toHaveTextContent("새봄바이오");

    const graph = screen.getByTestId("relationship-graph");
    expect(within(graph).getByTestId("graph-node-S02")).toBeInTheDocument();
    expect(within(graph).getByTestId("graph-node-S03")).toBeInTheDocument();

    expect(screen.getByTestId("p1-spotlight")).toHaveTextContent("한빛정밀");
    expect(screen.getByTestId("focus-action")).toHaveTextContent("한빛정밀");
    expect(screen.getByTestId("action-opinion")).toHaveTextContent(
      "본 의견은 Rule 기반 업무지원 결과이며",
    );
    expect(screen.getByTestId("security-flow")).toHaveTextContent(
      "브라우저 메모리 분석",
    );
  });

  it("Showcase 페이지 소스는 sample-load/upload를 import하지 않는다", () => {
    const source = readFileSync(
      path.resolve("src/pages/showcase/ShowcasePage.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/sample-load/);
    expect(source).not.toMatch(/excel-upload/);
    expect(source).not.toMatch(/uploadRawFile/);
    expect(source).toMatch(/loadShowcaseAnalysis/);
  });

  it("KPI 표시에 하드코딩 리터럴 8/1/7/4를 쓰지 않는다", () => {
    const source = readFileSync(
      path.resolve("src/pages/showcase/ShowcasePage.tsx"),
      "utf8",
    );
    expect(source).not.toMatch(/kpi-card__value">\s*8\s*</);
    expect(source).toMatch(/activeWindowCount/);
    expect(source).toMatch(/realRemarkCount/);
    expect(source).toMatch(/countRelationshipTargets/);
  });
});
