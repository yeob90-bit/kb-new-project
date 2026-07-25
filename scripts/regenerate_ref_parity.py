#!/usr/bin/env python3
"""Reference Engine → tests/golden/ref_parity.json 재생성.

Usage (repo root):
  python3 scripts/regenerate_ref_parity.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "docs" / "reference"))

from rule_engine_v2_1_reference import run_engine, summarize  # noqa: E402

CASES = [
    (
        "fixture_rule_valid_33",
        ROOT / "src/shared/fixtures/fixture_rule_valid_33.json",
        "2026-08-03",
        None,
    ),
    (
        "fixture_boundary_invalid_A",
        ROOT / "src/shared/fixtures/fixture_boundary_invalid.json",
        "2026-08-03",
        None,
    ),
    (
        "fixture_boundary_B12",
        ROOT / "src/shared/fixtures/fixture_boundary_invalid.json",
        "2026-11-20",
        ["B12"],
    ),
    (
        "fixture_showcase",
        ROOT / "src/shared/fixtures/fixture_showcase.json",
        "2026-08-03",
        None,
    ),
]


def compact_results(results):
    rows = []
    for r in results:
        rows.append(
            {
                "loanId": r["loanId"],
                "borrowerName": r["borrowerName"],
                "maturityDate": r["maturityDate"],
                "maturityBucket": r["maturityBucket"],
                "isInActiveWindow": r["isInActiveWindow"],
                "dDay": r["dDay"],
                "scheduleStatus": r["scheduleStatus"],
                "priorityScore": r["priorityScore"],
                "priorityBand": r["priorityBand"],
                "exceptionLevel": r["exceptionLevel"],
                "remarkCount": r["remarkCount"],
                "remarks": sorted(r["remarks"]),
                "disabledDuplicate": r["disabledDuplicate"],
                "validationIssueCodes": sorted(
                    {i["code"] for i in r["validationIssues"]}
                ),
            }
        )
    rows.sort(key=lambda x: x["loanId"])
    return rows


def main() -> None:
    out = {}
    for name, path, today, only_ids in CASES:
        rows = json.loads(path.read_text(encoding="utf-8"))
        if only_ids:
            rows = [r for r in rows if r["계좌번호"] in only_ids]
        results = run_engine(rows, today, has_policy_fund_column=True)
        summary = summarize(results, len(rows))
        out[name] = {
            "today": today,
            "summary": summary,
            "results": compact_results(results),
        }
        print(
            f"{name}: active={summary['activeWindowCount']} "
            f"top={summary['topScore']} realRemark={summary['realRemarkCount']}"
        )

    target = ROOT / "tests/golden/ref_parity.json"
    target.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {target}")


if __name__ == "__main__":
    main()
