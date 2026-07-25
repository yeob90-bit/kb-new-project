"""
B12 연도 경계(기준일 11월 -> 익년 1월 만기) 전용 테스트
- fixture_boundary_invalid.json 전체(21건) 중 B12만 별도 기준일(2026-11-20)로 검증한다.
- 나머지 20건은 기준일 2026-08-03으로 별도 실행해야 하므로 이 스크립트와 통계를 섞지 않는다.
"""
import json
from rule_engine_v2_1_reference import run_engine


def load_b12():
    with open("fixture_boundary_invalid.json", encoding="utf-8") as f:
        rows = json.load(f)
    matches = [r for r in rows if r["계좌번호"] == "B12"]
    assert len(matches) == 1, f"B12는 정확히 1건이어야 함 (실제 {len(matches)}건)"
    return matches


def test_b12_year_boundary():
    b12_fixture = load_b12()
    results = run_engine(b12_fixture, "2026-11-20", has_policy_fund_column=True)

    assert len(results) == 1
    r = results[0]

    assert r["loanId"] == "B12"
    assert r["maturityDate"] == "2027-01-15"
    assert r["maturityBucket"] == "TWO_MONTHS_LATER", f"실제: {r['maturityBucket']}"
    assert r["isInActiveWindow"] is True
    assert r["dDay"] == 56, f"실제: {r['dDay']}"
    assert r["scheduleStatus"] == "NORMAL", f"실제: {r['scheduleStatus']}"
    assert r["priorityScore"] == 5, f"실제: {r['priorityScore']}"  # remark 없음 -> scheduleScore(5)만

    print("PASS: B12 연도 경계 테스트 (기준일 2026-11-20, 만기 2027-01-15)")
    print(f"  maturityBucket={r['maturityBucket']}  isInActiveWindow={r['isInActiveWindow']}  "
          f"dDay={r['dDay']}  scheduleStatus={r['scheduleStatus']}  priorityScore={r['priorityScore']}")


if __name__ == "__main__":
    test_b12_year_boundary()
