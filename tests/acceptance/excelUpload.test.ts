/**
 * @vitest-environment node
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseLocalDate } from "../../src/entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../src/entities/loan/lib/runAnalysis";
import { parseExcelWorkbook } from "../../src/features/excel-upload/parseExcelWorkbook";

const fixtureDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/shared/fixtures",
);

describe("Acceptance — Excel Upload (연장데이터_예시수정)", () => {
  it("xlsx RAW원본을 파싱해 샘플과 동일한 KPI를 만든다", async () => {
    const bytes = readFileSync(join(fixtureDir, "연장데이터_예시수정.xlsx"));
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
    const parsed = await parseExcelWorkbook(buffer);

    expect(parsed.sheetName).toBe("RAW원본");
    expect(parsed.rows).toHaveLength(30);
    expect(parsed.hasPolicyFundColumn).toBe(true);
    expect(parsed.rows[0]?.["고객명"]).toBe("이상민");

    const run = runAnalysis(parsed.rows, parseLocalDate("2026-08-03"), {
      hasPolicyFundColumn: parsed.hasPolicyFundColumn,
      sourceFileName: "연장데이터_예시수정.xlsx",
    });

    expect(run.summary.inputRowCount).toBe(30);
    expect(run.summary.activeWindowCount).toBe(24);
    expect(run.summary.realRemarkCount).toBe(13);
    expect(run.summary.topScore).toBe(75);
    expect(run.summary.priorityBandCounts.P1_IMMEDIATE).toBe(2);
  });
});
