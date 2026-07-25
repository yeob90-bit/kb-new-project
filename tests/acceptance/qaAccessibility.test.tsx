/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { App } from "../../src/app/App";

describe("Acceptance — QA Accessibility / Responsive UI", () => {
  it("skip-link · main · topnav가 존재한다", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("skip-link")).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByTestId("main-content")).toBeInTheDocument();
    expect(screen.getByTestId("app-topnav")).toHaveTextContent("Showcase");
  });

  it("배지는 텍스트를 포함하고 Drawer는 Escape로 닫힌다", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("load-sample"));
    expect(screen.getByTestId("queue-cards")).toBeInTheDocument();
    expect(screen.getByTestId("queue-table")).toBeInTheDocument();

    await user.click(screen.getByTestId("queue-row-L0025"));
    expect(screen.getByTestId("loan-drawer")).toBeInTheDocument();
    expect(screen.getByTestId("loan-drawer")).toHaveTextContent("P1 즉시처리");
    expect(screen.getByTestId("loan-drawer")).toHaveTextContent("없음");

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("loan-drawer")).not.toBeInTheDocument();
  });

  it("탭은 aria-controls와 tabpanel을 연결한다", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <App />
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId("load-sample"));
    const activeTab = screen.getByTestId("tab-active");
    expect(activeTab).toHaveAttribute("aria-controls", "tab-panel-active");
    expect(screen.getByTestId("tab-panel-active")).toHaveAttribute(
      "role",
      "tabpanel",
    );
  });
});
