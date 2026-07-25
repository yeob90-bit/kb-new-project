import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REFERENCE_DATES } from "../../src/constants/index";
import { parseLocalDate } from "../../src/entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../src/entities/loan/lib/runAnalysis";
import { buildAnalysisWorkbook } from "../../src/features/excel-export/index";
import fixtureRuleValid33 from "../../src/shared/fixtures/fixture_rule_valid_33.json";

type RawRow = Record<string, unknown>;

function walkSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist") {
        continue;
      }
      files.push(...walkSourceFiles(full));
      continue;
    }
    if (/\.(ts|tsx|css|html)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

describe("Acceptance — QA Performance", () => {
  it("fixture 33건 분석이 500ms 이내에 완료된다", () => {
    const today = parseLocalDate(REFERENCE_DATES.RULE_VALID);
    const started = performance.now();
    const run = runAnalysis(fixtureRuleValid33 as RawRow[], today, {
      hasPolicyFundColumn: true,
    });
    const elapsed = performance.now() - started;

    expect(run.summary.activeWindowCount).toBe(27);
    expect(elapsed).toBeLessThan(500);
  });

  it("Export Workbook 생성이 800ms 이내에 완료된다", () => {
    const today = parseLocalDate(REFERENCE_DATES.RULE_VALID);
    const run = runAnalysis(fixtureRuleValid33 as RawRow[], today, {
      hasPolicyFundColumn: true,
      sourceFileName: "fixture_rule_valid_33.json",
    });
    const started = performance.now();
    const workbook = buildAnalysisWorkbook(run);
    const elapsed = performance.now() - started;

    expect(workbook.SheetNames).toHaveLength(7);
    expect(elapsed).toBeLessThan(800);
  });
});

describe("Acceptance — QA Privacy / Static", () => {
  it("localStorage/sessionStorage/IndexedDB 및 금지 로그 패턴이 없다", () => {
    const files = walkSourceFiles(path.resolve("src"));
    const joined = files.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(joined).not.toMatch(/\blocalStorage\b/);
    expect(joined).not.toMatch(/\bsessionStorage\b/);
    expect(joined).not.toMatch(/\bIndexedDB\b/);
    expect(joined).not.toMatch(/console\.log\(\s*rawRows\s*\)/);
    expect(joined).not.toMatch(/console\.log\(\s*workbook\s*\)/);
    expect(joined).not.toMatch(/console\.log\(\s*uploadedData\s*\)/);
    expect(joined).not.toMatch(/console\.log\(\s*loan\s*\)/);
  });

  it("prefers-reduced-motion 및 focus-visible 스타일이 존재한다", () => {
    const css = readFileSync(path.resolve("src/app/styles/global.css"), "utf8");
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(css).toMatch(/:focus-visible/);
    expect(css).toMatch(/queue-cards--mobile/);
    expect(css).toMatch(/@media \(max-width:\s*900px\)/);
    expect(css).toMatch(/@media \(max-width:\s*640px\)/);
  });

  it("Showcase는 lazy import 되고 sample-load를 쓰지 않는다", () => {
    const app = readFileSync(path.resolve("src/app/App.tsx"), "utf8");
    const showcase = readFileSync(
      path.resolve("src/pages/showcase/ShowcasePage.tsx"),
      "utf8",
    );
    expect(app).toMatch(/lazy\(/);
    expect(app).toMatch(/ShowcasePage/);
    expect(showcase).not.toMatch(/sample-load/);
  });
});
