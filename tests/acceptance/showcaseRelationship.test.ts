import { describe, expect, it } from "vitest";
import { REFERENCE_DATES } from "../../src/constants/index";
import {
  ActionUrgency,
  BusinessRuleId,
  ExceptionLevel,
  PriorityBand,
} from "../../src/enum/index";
import { parseLocalDate } from "../../src/entities/loan/lib/maturityBucket";
import { buildRelationshipGraph } from "../../src/entities/loan/lib/relationshipGraph";
import {
  buildRecommendedActions,
  buildRuleBasedOpinion,
} from "../../src/entities/loan/lib/recommendation";
import { runAnalysis } from "../../src/entities/loan/lib/runAnalysis";
import { loadShowcaseAnalysis } from "../../src/features/showcase-load/loadShowcaseAnalysis";
import { countRelationshipTargets } from "../../src/shared/lib/dashboardMetrics";
import fixtureShowcase from "../../src/shared/fixtures/fixture_showcase.json";

type RawRow = Record<string, unknown>;

describe("Acceptance — Showcase Data ≡ Reference §21.3", () => {
  const today = parseLocalDate(REFERENCE_DATES.RULE_VALID);

  it("fixture_showcase summary가 Reference와 동일하다", () => {
    const run = runAnalysis(fixtureShowcase as RawRow[], today, {
      hasPolicyFundColumn: true,
    });

    expect(run.summary.inputRowCount).toBe(8);
    expect(run.summary.activeWindowCount).toBe(8);
    expect(run.summary.outOfScopeCount).toBe(0);
    expect(run.summary.priorityBandCounts).toEqual({
      [PriorityBand.P1Immediate]: 1,
      [PriorityBand.P2Priority]: 5,
      [PriorityBand.P3Prepare]: 1,
      [PriorityBand.P4Routine]: 1,
    });
    expect(run.summary.exceptionLevelCounts).toEqual({
      [ExceptionLevel.High]: 4,
      [ExceptionLevel.Medium]: 3,
      [ExceptionLevel.None]: 1,
    });
    expect(run.summary.realRemarkCount).toBe(7);
    expect(run.summary.topScore).toBe(68);
  });

  it("계좌별 Band/Score/Exception이 Showcase 표와 일치한다", () => {
    const run = loadShowcaseAnalysis();
    const byId = Object.fromEntries(
      run.results.map((result) => [result.loan.loanId, result]),
    );

    expect(byId.S01?.loan.borrowerName).toBe("한빛정밀");
    expect(byId.S01?.dDay).toBe(5);
    expect(byId.S01?.priorityBand).toBe(PriorityBand.P1Immediate);
    expect(byId.S01?.exceptionLevel).toBe(ExceptionLevel.Medium);
    expect(byId.S01?.priorityScore).toBe(68);

    expect(byId.S06?.priorityBand).toBe(PriorityBand.P2Priority);
    expect(byId.S06?.priorityScore).toBe(50);
    expect(byId.S08?.priorityBand).toBe(PriorityBand.P4Routine);
    expect(byId.S08?.exceptionLevel).toBe(ExceptionLevel.None);
    expect(byId.S08?.priorityScore).toBe(5);
  });

  it("관계 그래프에 R03(세림↔청솔)·R04(다온↔모아) 엣지가 있다", () => {
    const run = loadShowcaseAnalysis();
    const graph = buildRelationshipGraph(run.results);

    expect(
      graph.edges.some(
        (edge) =>
          edge.ruleId === BusinessRuleId.R03 &&
          ((edge.source === "S02" && edge.target === "S03") ||
            (edge.source === "S03" && edge.target === "S02")),
      ),
    ).toBe(true);

    expect(
      graph.edges.some(
        (edge) =>
          edge.ruleId === BusinessRuleId.R04 &&
          ((edge.source === "S04" && edge.target === "S05") ||
            (edge.source === "S05" && edge.target === "S04")),
      ),
    ).toBe(true);

    expect(countRelationshipTargets(run.results)).toBe(4);
  });

  it("S01 Recommendation urgency는 TODAY이다", () => {
    const run = loadShowcaseAnalysis();
    const s01 = run.results.find((result) => result.loan.loanId === "S01")!;
    expect(s01.recommendedActions.length).toBeGreaterThan(0);
    expect(s01.recommendedActions[0]?.urgency).toBe(ActionUrgency.Today);
    expect(s01.recommendedActions.some((action) =>
      action.relatedRuleIds.includes(BusinessRuleId.R02),
    )).toBe(true);

    const rebuilt = buildRecommendedActions({
      loan: s01.loan,
      maturityBucket: s01.maturityBucket,
      isInActiveWindow: s01.isInActiveWindow,
      isActionable: s01.isActionable,
      dDay: s01.dDay,
      scheduleStatus: s01.scheduleStatus,
      priorityScore: s01.priorityScore,
      priorityBand: s01.priorityBand,
      exceptionLevel: s01.exceptionLevel,
      scoreBreakdown: s01.scoreBreakdown,
      remarks: s01.remarks,
    });
    expect(rebuilt.length).toBe(s01.recommendedActions.length);
  });

  it("종합의견 4단이 P1/P2/관계/P3로 채워진다", () => {
    const run = loadShowcaseAnalysis();
    const opinion = buildRuleBasedOpinion(run);
    expect(opinion).toHaveLength(4);
    expect(opinion[0]?.items.some((item) => item.loanId === "S01")).toBe(true);
    expect(opinion[1]?.items.length).toBe(5);
    expect(opinion[2]?.items.length).toBe(4);
    expect(opinion[3]?.items.some((item) => item.loanId === "S07")).toBe(true);
  });

  it("Showcase 로더는 upload/sample-load를 쓰지 않고 fixture_showcase만 사용한다", () => {
    const run = loadShowcaseAnalysis();
    expect(run.sourceFileName).toBe("fixture_showcase.json");
    expect(run.runId).toBe("showcase-fixture");
  });
});
