/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "../../src/pages/dashboard/DashboardPage";

describe("Acceptance — Dashboard Excel Export UI", () => {
  it("분석 후 Export 버튼이 활성화되고 다운로드를 트리거한다", async () => {
    const user = userEvent.setup();
    const clickSpy = vi.fn();
    const createObjectURL = vi.fn(() => "blob:mock-export");
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === "a") {
        element.click = clickSpy;
      }
      return element;
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("export-xlsx")).toBeDisabled();

    await user.click(screen.getByTestId("load-sample"));
    expect(screen.getByTestId("export-xlsx")).not.toBeDisabled();

    await user.click(screen.getByTestId("export-xlsx"));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-export");

    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
