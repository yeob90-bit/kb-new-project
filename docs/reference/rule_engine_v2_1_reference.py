"""
PRD v2.1 Final 검증용 Reference Engine
- OUT_OF_SCOPE/INVALID_DATE는 Active Queue, Score, Band 산정에서 완전히 제외
- Priority Band(P1~P4)와 Exception Level(HIGH/MEDIUM/LOW/NONE)을 분리
- 장기경과는 정확한 기념일(anniversary) 방식으로 판정 (365.25 근사 사용 안 함)
- Remark 중복 방지를 위한 remarkKey 및 관계방향(relationDirection) 부여
- 정책자금 컬럼 부재 시 R05 자동 비활성화 (capabilities 플래그)
- V01~V05 데이터 검증 규칙 분리
"""
import json
from dataclasses import dataclass, field
from datetime import date, datetime
from typing import Optional

FACILITY_FUND_CODES = {"34", "35", "37", "38", "42", "49", "56", "58"}
WORKING_CAPITAL_CODES = {"32", "33", "36", "41", "48", "51", "55"}
AGING_YEARS = {"시설자금": 3, "운전자금": 5}

REQUIRED_COLUMNS = ["계좌번호", "고객명", "KB-PIN", "상품코드", "신규년월일", "만기년월일"]
OPTIONAL_COLUMNS = ["익스포져현황", "휴폐업", "담보제공자KB-PIN", "담보제공자명", "정책자금구분"]


# ---------------------------------------------------------
# 기본 유틸
# ---------------------------------------------------------
def pin_prefix(pin):
    """앞 10자리 추출. 10자리 미만이면 None (관계 Rule 판정 불가로 처리)."""
    if not pin:
        return None
    d = str(pin).replace("-", "").strip()
    return d[:10] if len(d) >= 10 else None


def parse_date_strict(v):
    """YYYYMMDD만 지원(레퍼런스 검증용). 실패 시 None -> INVALID_DATE 처리."""
    if v is None or v == "":
        return None
    s = str(v).strip()
    if len(s) != 8 or not s.isdigit():
        return None
    try:
        return datetime.strptime(s, "%Y%m%d").date()
    except ValueError:
        return None


def classify_purpose(code):
    if not code or len(code) < 4:
        return None
    seg = code[2:4]
    if seg in FACILITY_FUND_CODES:
        return "시설자금"
    if seg in WORKING_CAPITAL_CODES:
        return "운전자금"
    return None


def add_months(d, months):
    idx = d.month - 1 + months
    year = d.year + idx // 12
    month = idx % 12 + 1
    return date(year, month, 1)


def maturity_bucket(mat_date, today, max_offset=2):
    if mat_date is None:
        return "INVALID_DATE"
    for offset in range(0, max_offset + 1):
        t = add_months(today, offset)
        if (mat_date.year, mat_date.month) == (t.year, t.month):
            return ["CURRENT_MONTH", "NEXT_MONTH", "TWO_MONTHS_LATER"][offset]
    return "OUT_OF_SCOPE"


ACTIVE_BUCKETS = {"CURRENT_MONTH", "NEXT_MONTH", "TWO_MONTHS_LATER"}


def schedule_status(d_day):
    if d_day is None:
        return "INVALID"
    if d_day < 0:
        return "OVERDUE"
    if d_day <= 7:
        return "URGENT"
    if d_day <= 10:
        return "WARNING"
    if d_day <= 14:
        return "CAUTION"
    return "NORMAL"


def schedule_score(d_day):
    if d_day is None:
        return None
    if d_day < 0:
        return 50
    if d_day <= 7:
        return 50
    if d_day <= 10:
        return 40
    if d_day <= 14:
        return 30
    if d_day <= 21:
        return 20
    if d_day <= 30:
        return 10
    return 5


def has_reached_anniversary(today, start_date, years):
    """정확한 기념일 계산. 2/29 시작일은 비윤년에는 2/28을 기념일로 취급."""
    try:
        threshold = start_date.replace(year=start_date.year + years)
    except ValueError:
        # start_date가 2/29인데 대상 연도가 평년인 경우
        threshold = start_date.replace(year=start_date.year + years, day=28)
    return today >= threshold


# ---------------------------------------------------------
# 데이터 모델
# ---------------------------------------------------------
@dataclass
class Loan:
    row_number: int
    loan_id: str
    borrower_name: str
    borrower_pin_raw: str
    product_code: str
    first_execution_date_raw: Optional[str]
    maturity_date_raw: Optional[str]
    exposure: Optional[str]
    collateral_provider_pin_raw: Optional[str]
    policy_fund_type: Optional[str]
    validation_issues: list = field(default_factory=list)

    borrower_pin_prefix: Optional[str] = None
    first_execution_date: Optional[date] = None
    maturity_date: Optional[date] = None
    collateral_provider_pin_prefix: Optional[str] = None
    loan_purpose: Optional[str] = None


def add_issue(loan, field_name, code, severity, message):
    loan.validation_issues.append({
        "rowNumber": loan.row_number, "loanId": loan.loan_id, "field": field_name,
        "code": code, "severity": severity, "message": message,
    })


def map_row(row_number, r, has_policy_fund_column):
    loan_id = str(r.get("계좌번호") or "").strip()
    borrower_pin_raw = str(r.get("KB-PIN") or "").strip()
    product_code = str(r.get("상품코드") or "").strip()

    loan = Loan(
        row_number=row_number, loan_id=loan_id, borrower_name=r.get("고객명", ""),
        borrower_pin_raw=borrower_pin_raw, product_code=product_code,
        first_execution_date_raw=r.get("신규년월일"), maturity_date_raw=r.get("만기년월일"),
        exposure=r.get("익스포져현황"),
        collateral_provider_pin_raw=r.get("담보제공자KB-PIN") or None,
        policy_fund_type=(r.get("정책자금구분") or None) if has_policy_fund_column else None,
    )

    # V01 필수값 검증
    for col, val in (("계좌번호", loan_id), ("고객명", loan.borrower_name),
                     ("KB-PIN", borrower_pin_raw), ("상품코드", product_code)):
        if not val:
            add_issue(loan, col, "MISSING_REQUIRED_VALUE", "ERROR", f"{col} 값이 비어있음")

    # V02 날짜 검증
    loan.maturity_date = parse_date_strict(loan.maturity_date_raw)
    if loan.maturity_date_raw and loan.maturity_date is None:
        add_issue(loan, "만기년월일", "INVALID_DATE", "ERROR",
                   f"만기년월일 파싱 실패 (원본값: {loan.maturity_date_raw})")
    elif not loan.maturity_date_raw:
        add_issue(loan, "만기년월일", "INVALID_DATE", "ERROR", "만기년월일 값이 비어있음")

    loan.first_execution_date = parse_date_strict(loan.first_execution_date_raw)
    if loan.first_execution_date_raw and loan.first_execution_date is None:
        add_issue(loan, "신규년월일", "INVALID_DATE", "WARNING",
                   f"신규년월일 파싱 실패 (원본값: {loan.first_execution_date_raw})")
    elif not loan.first_execution_date_raw:
        add_issue(loan, "신규년월일", "INVALID_DATE", "WARNING", "신규년월일 값이 비어있음 - 장기경과 판정 제외")

    if loan.maturity_date and loan.first_execution_date and loan.maturity_date < loan.first_execution_date:
        add_issue(loan, "만기년월일", "UNSUPPORTED_VALUE", "WARNING", "만기일이 최초실행일보다 이전")

    # V03 KB-PIN 검증
    loan.borrower_pin_prefix = pin_prefix(borrower_pin_raw)
    if borrower_pin_raw and loan.borrower_pin_prefix is None:
        add_issue(loan, "KB-PIN", "INVALID_PIN", "WARNING",
                   "KB-PIN 앞10자리 생성 불가 - 관계 Rule 판정 제외")

    if loan.collateral_provider_pin_raw:
        loan.collateral_provider_pin_prefix = pin_prefix(loan.collateral_provider_pin_raw)
        if loan.collateral_provider_pin_prefix is None:
            add_issue(loan, "담보제공자KB-PIN", "INVALID_PIN", "WARNING",
                       "담보제공자 KB-PIN 앞10자리 생성 불가 - 관계 Rule 판정 제외")

    # V04 상품코드 검증
    if product_code and len(product_code) < 4:
        add_issue(loan, "상품코드", "INVALID_PRODUCT_CODE", "WARNING",
                   f"상품코드 길이 부족(4자리 미만) - 원본값: {product_code}")
    loan.loan_purpose = classify_purpose(product_code)

    return loan


def run_validation_v05_duplicate_loan_id(loans):
    """V05 중복 계좌번호 검증 - 중복 loan_id를 가진 모든 행을 Rule Engine에서 비활성화."""
    seen = {}
    for l in loans:
        seen.setdefault(l.loan_id, []).append(l)
    disabled_ids = set()
    for loan_id, group in seen.items():
        if len(group) > 1:
            disabled_ids.add(loan_id)
            for l in group:
                add_issue(l, "계좌번호", "DUPLICATE_LOAN_ID", "ERROR",
                           f"중복된 계좌번호({loan_id}) {len(group)}건 - Rule Engine에서 비활성화됨")
    return disabled_ids


def remark(rule_id, category, severity, title, message, score, action,
           relation_direction=None, related=None):
    related = related or []
    key = f"{rule_id}:{relation_direction or '-'}:{','.join(sorted(related)) or '-'}"
    return {
        "remarkKey": key, "ruleId": rule_id, "category": category, "severity": severity,
        "title": title, "message": message, "score": score, "recommendedAction": action,
        "relationDirection": relation_direction, "relatedLoanIds": related,
    }


def exception_level(remarks):
    sev_rank = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1, "INFO": 0}
    if not remarks:
        return "NONE"
    top = max(remarks, key=lambda r: sev_rank.get(r["severity"], 0))
    top_sev = top["severity"]
    if top_sev in ("CRITICAL", "HIGH"):
        return "HIGH"
    if top_sev == "MEDIUM":
        return "MEDIUM"
    return "LOW"


def priority_band(schedule_stat, priority_score, remarks):
    has_high = any(r["severity"] == "HIGH" for r in remarks)
    if schedule_stat in ("URGENT", "OVERDUE"):
        return "P1_IMMEDIATE"
    if priority_score is not None and priority_score >= 75:
        return "P1_IMMEDIATE"
    if schedule_stat == "WARNING" and has_high:
        return "P1_IMMEDIATE"
    if schedule_stat == "WARNING":
        return "P2_PRIORITY"
    if schedule_stat == "CAUTION":
        return "P2_PRIORITY"
    if priority_score is not None and 55 <= priority_score < 75:
        return "P2_PRIORITY"
    if has_high:
        return "P2_PRIORITY"
    if remarks:  # 실질 remark 1건 이상(정책자금/장기경과/R01 등)
        return "P3_PREPARE"
    return "P4_ROUTINE"


# ---------------------------------------------------------
# 메인 엔진
# ---------------------------------------------------------
def run_engine(raw_rows, today_str, has_policy_fund_column=True):
    today = datetime.strptime(today_str, "%Y-%m-%d").date()
    loans = [map_row(i + 1, r, has_policy_fund_column) for i, r in enumerate(raw_rows)]
    disabled_ids = run_validation_v05_duplicate_loan_id(loans)

    # 인덱스 (Active Window 내에서만 관계 Rule 판정용으로 구성하되,
    #        判定 대상 자체는 Active/OutOfScope 여부와 무관하게 전체에서 borrower/provider 인덱스를 만든다
    #        -> 단, 결과 반영은 Active Window 항목에만 이루어진다는 정책은 아래에서 처리)
    valid_loans = [l for l in loans if l.loan_id not in disabled_ids]

    borrower_index = {}
    provider_index = {}
    for l in valid_loans:
        if l.borrower_pin_prefix:
            borrower_index.setdefault(l.borrower_pin_prefix, []).append(l)
        if l.collateral_provider_pin_prefix:
            provider_index.setdefault(l.collateral_provider_pin_prefix, []).append(l)

    loans_by_id = {l.loan_id: l for l in valid_loans}
    remarks_by_id = {l.loan_id: [] for l in valid_loans}

    def bucket_of(l):
        return maturity_bucket(l.maturity_date, today)

    # Remark(R02~R08)는 만기 Bucket과 무관하게 전체 유효 데이터에 대해 판정한다.
    # (OUT_OF_SCOPE/INVALID_DATE는 Priority Score/Band/Active Queue 집계에서만 제외되며,
    #  "특이사항 존재 자체"는 분석범위 외 탭에서도 확인 가능해야 하기 때문 - PRD 2.1절 정책)
    for l in valid_loans:
        bp = l.borrower_pin_prefix
        pp = l.collateral_provider_pin_prefix

        # R02 제3자담보
        if pp and pp != bp:
            remarks_by_id[l.loan_id].append(remark(
                "R02", "COLLATERAL", "MEDIUM", "제3자 담보",
                "담보제공자가 차주 본인이 아닌 제3자로 확인됨", 10,
                "담보제공자의 연장 동의 및 전자약정 가능 일정 확인"))

        # R03 담보제공자 = 타 차주 (양방향, Bucket 무관하게 전체에서 판정)
        if pp and pp != bp and pp in borrower_index:
            others = [o for o in borrower_index[pp] if o.loan_id != l.loan_id]
            if others:
                other_ids = [o.loan_id for o in others]
                remarks_by_id[l.loan_id].append(remark(
                    "R03", "RELATIONSHIP", "HIGH", "담보제공자가 다른 만기대상 차주와 동일",
                    "동일 식별정보 연결 발견 - 차주·담보제공자 관계 확인 필요", 15,
                    "차주·담보제공자 관계 및 약정 참여 가능 일정 확인",
                    relation_direction="PROVIDER_TO_BORROWER", related=other_ids))
                for o in others:
                    remarks_by_id[o.loan_id].append(remark(
                        "R03", "RELATIONSHIP", "HIGH", "본 차주가 다른 여신의 담보제공자로 연결됨",
                        "동일 식별정보 연결 발견 - 복수 여신 연결관계 확인 필요", 15,
                        "복수 여신 연결관계와 담보제공 범위 확인",
                        relation_direction="BORROWER_AS_PROVIDER", related=[l.loan_id]))

        # R04 동일 담보제공자 복수여신 (Bucket 무관)
        if pp and len(provider_index.get(pp, [])) > 1:
            others = [o for o in provider_index[pp] if o.loan_id != l.loan_id]
            if others:
                other_ids = [o.loan_id for o in others]
                remarks_by_id[l.loan_id].append(remark(
                    "R04", "RELATIONSHIP", "HIGH", "동일 담보제공자 복수여신 연결",
                    "동일 담보제공자가 여러 여신에 연결됨 - 특수관계 가능성 확인 필요", 15,
                    "복수 여신 연결관계와 담보제공 범위 확인",
                    relation_direction="SHARED_PROVIDER", related=other_ids))

        # R05 정책자금 (컬럼 없으면 Loan.policy_fund_type이 애초에 None으로 매핑되어 자동 비활성)
        if l.policy_fund_type in ("C1", "C2"):
            remarks_by_id[l.loan_id].append(remark(
                "R05", "POLICY_FUND", "MEDIUM", f"정책자금 상품 ({l.policy_fund_type})",
                "정책자금 사용 조건 재확인 필요", 8, "정책자금 연장요건 및 자금용도 재점검"))

        # R06/R07 장기경과 (정확한 기념일 계산, 최초실행일 없으면 판정 제외)
        threshold_years = AGING_YEARS.get(l.loan_purpose)
        if threshold_years is not None and l.first_execution_date is not None:
            if has_reached_anniversary(today, l.first_execution_date, threshold_years):
                rid = "R06" if l.loan_purpose == "시설자금" else "R07"
                remarks_by_id[l.loan_id].append(remark(
                    rid, "AGING", "MEDIUM", f"{l.loan_purpose} {threshold_years}년 경과",
                    f"최초실행 후 {threshold_years}년 이상 경과 - 재무상태 재점검 권장", 7,
                    "최근 재무상태 및 사업현황 점검"))
        elif threshold_years is None and l.product_code:
            remarks_by_id[l.loan_id].append(remark(
                "R08", "DATA_QUALITY", "LOW", "상품코드 미분류",
                f"상품코드({l.product_code})가 시설/운전자금 목록에 없음 - 확인 필요", 10,
                "상품코드 Master 확인 및 데이터 오류 여부 점검"))

    # R01 동일 차주 추가만기 (Active Window 내에서만 판정, 2건 이상)
    window_group = {}
    for l in valid_loans:
        if bucket_of(l) in ACTIVE_BUCKETS and l.borrower_pin_prefix:
            window_group.setdefault(l.borrower_pin_prefix, []).append(l)
    for bp, group in window_group.items():
        if len(group) > 1:
            ids = [g.loan_id for g in group]
            for l in group:
                others = [i for i in ids if i != l.loan_id]
                remarks_by_id[l.loan_id].append(remark(
                    "R01", "SCHEDULE", "MEDIUM", "동일 차주 추가 만기계좌 존재",
                    f"동일 차주 기준 Active Window 내 추가 만기계좌 {len(others)}건 존재", 10,
                    "고객 접촉 시 복수 계좌의 동시 연장 가능 여부 검토",
                    relation_direction="SAME_BORROWER_MULTI_MATURITY", related=others))

    # 결과 조립
    results = []
    for l in loans:
        my_remarks = remarks_by_id.get(l.loan_id, [])
        bucket = bucket_of(l)  # 날짜 파싱 결과만 Bucket에 반영 (중복계좌 여부는 별도 플래그로 구분)
        is_active = bucket in ACTIVE_BUCKETS and l.loan_id not in disabled_ids
        d_day = (l.maturity_date - today).days if (l.maturity_date and is_active) else None
        sched_stat = schedule_status(d_day) if is_active else ("INVALID" if l.maturity_date is None else "NORMAL")

        if not is_active:
            score = None
            band = None
        else:
            sched_score = schedule_score(d_day) or 0
            collateral_score = min(25, sum(r["score"] for r in my_remarks if r["category"] in ("COLLATERAL", "RELATIONSHIP")))
            policy_score = min(10, sum(r["score"] for r in my_remarks if r["category"] == "POLICY_FUND"))
            aging_score = min(15, sum(r["score"] for r in my_remarks if r["category"] in ("AGING", "DATA_QUALITY")))
            sched_extra = min(10, sum(r["score"] for r in my_remarks if r["category"] == "SCHEDULE"))
            score = min(100, sched_score + collateral_score + policy_score + aging_score + sched_extra)
            band = priority_band(sched_stat, score, my_remarks)

        # Exception Level은 Remark 존재 여부로 판정 (Bucket 무관) - Score/Band만 Active 전용
        exc_level = exception_level(my_remarks)

        results.append({
            "loanId": l.loan_id, "borrowerName": l.borrower_name,
            "maturityDateRaw": l.maturity_date_raw,
            "maturityDate": l.maturity_date.isoformat() if l.maturity_date else None,
            "maturityBucket": bucket, "isInActiveWindow": is_active,
            "dDay": d_day, "scheduleStatus": sched_stat,
            "priorityScore": score, "priorityBand": band, "exceptionLevel": exc_level,
            "remarkCount": len(my_remarks),
            "remarks": [r["title"] for r in my_remarks],
            "validationIssues": l.validation_issues,
            "disabledDuplicate": l.loan_id in disabled_ids,
        })

    return results


def summarize(results, raw_rows_count):
    active = [r for r in results if r["isInActiveWindow"]]
    out_of_scope = [r for r in results if r["maturityBucket"] == "OUT_OF_SCOPE"]
    invalid = [r for r in results if r["maturityBucket"] == "INVALID_DATE"]
    error_rows = [r for r in results if r["validationIssues"]]

    bucket_counts = {}
    for r in results:
        bucket_counts[r["maturityBucket"]] = bucket_counts.get(r["maturityBucket"], 0) + 1

    status_counts = {}
    for r in active:
        status_counts[r["scheduleStatus"]] = status_counts.get(r["scheduleStatus"], 0) + 1

    band_counts = {}
    for r in active:
        band_counts[r["priorityBand"]] = band_counts.get(r["priorityBand"], 0) + 1

    exc_counts = {}
    for r in active:
        exc_counts[r["exceptionLevel"]] = exc_counts.get(r["exceptionLevel"], 0) + 1

    real_remark = [r for r in active if r["remarkCount"] > 0]

    rule_counts = {}
    for r in active:
        for title in r["remarks"]:
            rule_counts[title] = rule_counts.get(title, 0) + 1

    return {
        "inputRowCount": raw_rows_count,
        "validLoanCount": len(results) - len(invalid),
        "activeWindowCount": len(active),
        "outOfScopeCount": len(out_of_scope),
        "invalidDateCount": len(invalid),
        "errorRowCount": len(error_rows),
        "maturityBucketCounts": bucket_counts,
        "scheduleStatusCounts": status_counts,
        "priorityBandCounts": band_counts,
        "exceptionLevelCounts": exc_counts,
        "realRemarkCount": len(real_remark),
        "ruleHitTitleCounts": rule_counts,
        "topScore": max((r["priorityScore"] for r in active if r["priorityScore"] is not None), default=None),
    }


if __name__ == "__main__":
    with open("fixture_rule_valid_33.json", encoding="utf-8") as f:
        raw_rows = json.load(f)
    results = run_engine(raw_rows, "2026-08-03", has_policy_fund_column=True)
    summary = summarize(results, len(raw_rows))

    results_sorted = sorted(
        results, key=lambda r: (r["priorityScore"] is None, -(r["priorityScore"] or -1))
    )
    print(f"{'#':3} {'계좌':7} {'고객명':16} {'Bucket':16} {'D-day':6} {'상태':8} {'Band':14} {'Exc':6} {'점수':5}")
    print("-" * 120)
    for i, r in enumerate(results_sorted, 1):
        print(f"{i:3} {r['loanId']:7} {r['borrowerName']:16} {r['maturityBucket']:16} "
              f"{str(r['dDay']):^6} {r['scheduleStatus']:8} {str(r['priorityBand']):14} "
              f"{r['exceptionLevel']:6} {str(r['priorityScore']):5}  {' / '.join(r['remarks'])}")

    print("-" * 120)
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    with open("v2_1_results.json", "w", encoding="utf-8") as f:
        json.dump({"results": results, "summary": summary}, f, ensure_ascii=False, indent=2)
