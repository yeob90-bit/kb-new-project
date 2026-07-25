import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { REFERENCE_DATES } from "../../src/constants/index";
import { parseLocalDate } from "../../src/entities/loan/lib/maturityBucket";
import { runAnalysis } from "../../src/entities/loan/lib/runAnalysis";
import {
  buildAnalysisWorkbook,
  buildExportFileName,
  EXPORT_SHEET_NAMES,
} from "../../src/features/excel-export/index";
import fixtureRuleValid33 from "../../src/shared/fixtures/fixture_rule_valid_33.json";
import fixtureBoundaryInvalid from "../../src/shared/fixtures/fixture_boundary_invalid.json";

type RawRow = Record<string, unknown>;

describe("Acceptance — Excel Export", () => {
  const today = parseLocalDate(REFERENCE_DATES.RULE_VALID);

  it("파일명 규칙이 PRD §25와 일치한다", () => {
    expect(buildExportFileName(today)).toBe(
      "기업여신_만기관리_분석결과_2026-08-03.xlsx",
    );
  });

  it("신규 Workbook에 7개 시트가 존재한다", () => {
    const run = runAnalysis(fixtureRuleValid33 as RawRow[], today, {
      hasPolicyFundColumn: true,
      sourceFileName: "fixture_rule_valid_33.json",
    });
    const workbook = buildAnalysisWorkbook(run);

    expect(workbook.SheetNames).toEqual([...EXPORT_SHEET_NAMES]);
  });

  it("분석요약 시트가 Summary 수치를 포함한다", () => {
    const run = runAnalysis(fixtureRuleValid33 as RawRow[], today, {
      hasPolicyFundColumn: true,
      sourceFileName: "fixture_rule_valid_33.json",
    });
    const workbook = buildAnalysisWorkbook(run);
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      workbook.Sheets["분석요약"]!,
    );
    const byItem = Object.fromEntries(rows.map((row) => [row["항목"], row["값"]]));

    expect(byItem["입력건수"]).toBe(33);
    expect(byItem["Active만기대상"]).toBe(27);
    expect(byItem["실질Remark"]).toBe(16);
    expect(byItem["최고점"]).toBe(75);
    expect(byItem["P1즉시처리"]).toBe(2);
    expect(byItem["원본파일명"]).toBe("fixture_rule_valid_33.json");
  });

  it("ActiveQueue / Remark상세에 원본행번호·계좌가 기록된다", () => {
    const run = runAnalysis(fixtureRuleValid33 as RawRow[], today, {
      hasPolicyFundColumn: true,
      sourceFileName: "fixture_rule_valid_33.json",
    });
    const workbook = buildAnalysisWorkbook(run);

    const active = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      workbook.Sheets.ActiveQueue!,
    );
    expect(active.length).toBe(27);
    expect(active[0]).toHaveProperty("원본파일명", "fixture_rule_valid_33.json");
    expect(active[0]).toHaveProperty("원본행번호");
    expect(active.some((row) => row["계좌번호"] === "L0029")).toBe(true);

    const remarks = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      workbook.Sheets["Remark상세"]!,
    );
    expect(remarks.length).toBeGreaterThan(0);
    expect(remarks[0]).toHaveProperty("RuleId");
    expect(remarks[0]).toHaveProperty("제목");
    expect(remarks[0]).toHaveProperty("원본행번호");
    expect(remarks.some((row) => row["계좌번호"] === "L0029")).toBe(true);
  });

  it("분석범위외·데이터오류 시트가 분리된다", () => {
    const run = runAnalysis(fixtureRuleValid33 as RawRow[], today, {
      hasPolicyFundColumn: true,
      sourceFileName: "fixture_rule_valid_33.json",
    });
    const workbook = buildAnalysisWorkbook(run);

    const outOfScope = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      workbook.Sheets["분석범위외"]!,
    );
    expect(outOfScope.length).toBe(6);
    expect(outOfScope.every((row) => row["PriorityScore"] === "-")).toBe(true);
    expect(outOfScope.some((row) => row["계좌번호"] === "L0021")).toBe(true);

    const boundaryRun = runAnalysis(fixtureBoundaryInvalid as RawRow[], today, {
      hasPolicyFundColumn: true,
      sourceFileName: "fixture_boundary_invalid.json",
    });
    const boundaryBook = buildAnalysisWorkbook(boundaryRun);
    const errors = XLSX.utils.sheet_to_json<Record<string, string | number>>(
      boundaryBook.Sheets["데이터오류"]!,
    );
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((row) => String(row["계좌번호"]) === "B01")).toBe(true);
  });

  it("xlsx 바이너리로 round-trip 해도 시트가 유지된다", () => {
    const run = runAnalysis(fixtureRuleValid33 as RawRow[], today, {
      hasPolicyFundColumn: true,
      sourceFileName: "fixture_rule_valid_33.json",
    });
    const workbook = buildAnalysisWorkbook(run);
    const buffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    }) as ArrayBuffer;
    const parsed = XLSX.read(buffer, { type: "array" });

    expect(parsed.SheetNames).toEqual([...EXPORT_SHEET_NAMES]);
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
