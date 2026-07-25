# PRD v2.1 Final — 기업여신 만기관리 의사결정 지원 AI Agent

| 항목 | 내용 |
|---|---|
| 프로젝트명 | 기업여신 만기관리 의사결정 지원 AI Agent (Renewal Navigator) |
| 문서 버전 | v2.1 Final — **Cursor 구현의 최종 기준 문서** |
| 이전 버전 | v2.0 (`PRD_v2.0_기업여신만기관리_AI_Agent.md`) |
| 검증 기준일 | 2026-08-03 (연도경계 검증만 2026-11-20 별도 사용) |
| 검증 산출물 | `fixture_rule_valid_33.json`(33건) · `fixture_boundary_invalid.json`(21건) · `fixture_showcase.json`(8건) · `rule_engine_v2_1_reference.py` |

> 본 문서는 모호한 표현("적절히 처리", "필요시 적용", "상황에 따라" 등)을 사용하지 않는다. 결정이 필요한 모든 지점은 기본안 하나로 확정했다. 기준 정의는 최초 1회만 서술하고, 이후 절에서는 해당 절을 참조한다(예: "§13 참조").

---

## Part 1. v2.0 최종 검토 요약

### 1.1 유지한 부분

KB-PIN 앞10자리 매칭, 상품코드 [2:4] 기반 시설/운전자금 및 정책자금 판별 원칙, R01~R08 8개 업무 Rule의 정의, 관계 Rule 양방향 판정, 원본 파일 미변경 원칙, Rule Registry 확장 구조, 브라우저 단독 처리 보안 원칙.

### 1.2 이번에 수정한 부분과 이유

| # | 수정 항목 | v2.0 상태 | 발견된 문제 | v2.1 조치 | 영향 범위 |
|---|---|---|---|---|---|
| 1 | OUT_OF_SCOPE 처리 | Bucket만 분리, Reference Engine은 여전히 전 건에 점수 부여 | 문서(정의)와 코드(구현)가 불일치 — "우선순위 제외"라고 써놓고 실제로는 점수가 나옴 | §2.1 정책 확정: Active Window(당월/+1개월/+2개월)만 점수·Band 산정, OUT_OF_SCOPE·INVALID_DATE는 `priorityScore=null` | Priority Score 분포, KPI 카드, Excel Export 탭 구조 |
| 2 | Risk Level 단일 지표 | 일정긴급도와 특이사항 복잡성이 하나의 점수로 뒤섞임 | D-2·Remark 0건 여신이 "MEDIUM"으로 표시되어 "긴급인데 왜 중간위험이냐"는 모순 발생 | Priority Band(업무 처리 시급도)와 Exception Level(특이사항 복잡도) 2축으로 분리. Risk Level 폐기 | Dashboard KPI, Priority Command Board, Showcase Section 5 |
| 3 | 장기경과 판정 | `(오늘−실행일).days / 365.25` 근사 | 경계일(정확히 3년/5년째 당일)에서 근사오차로 하루이틀 오판 가능 | `date-fns`식 정확한 기념일(anniversary) 비교로 전환 (§13.4) | R06/R07 경계 테스트 결과가 v2.0과 달라질 수 있음(§10 참조) |
| 4 | Remark 자료구조 | 문자열 제목만 존재, 동일 Rule이 같은 계좌에 중복 추가될 위험 | 관계 Rule에서 상대 계좌가 여러 건이면 Remark가 중복 생성될 수 있음 | `remarkKey`(ruleId+relationDirection+관련PIN조합) 도입, 동일 키는 관련계좌를 배열로 합침 (§14.6) | RemarkResult 타입, Excel Remark상세 시트 |
| 5 | 정책자금 컬럼 | 필수 컬럼처럼 취급 | 실제 RAW에는 원래 없던 컬럼(이번 대화에서 신규 추가한 것) — 필수로 강제하면 실 데이터 적용 시 전체 업로드가 막힐 위험 | 선택 컬럼으로 재분류, 컬럼 없으면 R05만 자동 비활성 + `AnalysisCapabilities` 플래그로 UI에 "분석 제외" 표시 (§9, §13.5) | 업로드 검증 로직, KPI 카드 문구 |
| 6 | 오류/누락 데이터 | "행을 삭제하지 않는다"고 서술했으나 Reference Engine은 만기일 없는 행을 목록에서 빠뜨릴 가능성이 있었음 | 정책과 구현의 불일치 | `INVALID_DATE` Bucket 신설, 검증 실패 행도 결과 목록에 유지하되 Active Queue에서만 제외 (§11) | 전체 데이터 모델, 오류 탭 UI |
| 7 | Rule/Engine 명칭 | R01~R09가 업무규칙과 일정로직에 혼재 | "9개 Rule"이라는 말이 실제로는 8개 업무규칙+1개 일정로직이라 숫자가 안 맞음 | 8개 Business Rule(R01~R08) / 1개 Schedule Engine(S01) / 5개 Validation Rule(V01~V05)로 3계층 분리 및 명칭 통일 (§13) | 전 문서, Showcase 문구 |
| 8 | 테스트 데이터 | 33건 하나로 Rule 검증·경계값 검증·Showcase 시연을 모두 겸함 | 실명 테스트 라벨("D2임박" 등)이 Showcase에 그대로 노출될 위험, 경계·오류 케이스가 정상 케이스와 섞여 관리 어려움 | Fixture 3분리: `fixture_rule_valid_33`(단위검증) / `fixture_boundary_invalid`(경계·오류 21건 — 일반 경계 20건+연도경계 B12 1건) / `fixture_showcase`(가상 기업명 8건) (§20) | 테스트 코드, Showcase 데이터 소스 |
| 9 | Showcase 구조 | 13개 Section | 한 번에 구현하기엔 범위가 넓어 완성도가 분산될 위험 | 8개 Section으로 통합 (§19) | Showcase 컴포넌트 구조 |
| 10 | 개인정보 | 원칙만 서술, 화면·로그 차원의 구체적 금지 목록 없음 | 전화번호 등 미사용 컬럼이 화면에 노출되거나 `console.log(rawRows)` 류의 코드가 남을 위험 | §7 개인정보 보호에 UI 비표시 컬럼 목록, 로그 금지 코드 패턴, 메모리 정리 절차를 명문화 | 업로드 파서, 오류 메시지, 초기화 로직 |

### 1.3 영향 범위 요약

이번 변경은 **데이터 모델(§14)과 점수/등급 체계(§17~19)에 걸친 구조적 변경**이므로, v2.0 Acceptance Criteria 수치는 그대로 유지하지 않는다. §21에서 `fixture_rule_valid_33.json`(v2.0과 동일한 33건)을 v2.1 로직으로 재실행한 실측값을 새로 제시한다.

---

## Part 2. PRD v2.1 Final 전문

### §1 제품 개요

기업여신 담당 RM이 만기 도래 명세 RAW 엑셀을 업로드하면, 8개 업무 Rule·1개 일정 엔진·5개 데이터 검증 규칙이 순차 실행되어 **Active Window(당월~+2개월) 내 여신에 한해** Priority Band(업무 처리 시급도)와 Exception Level(특이사항 복잡도)을 산정하고, Rule 기반 자연어 종합의견과 Action Recommendation을 제시하는 브라우저 단독 실행 웹 애플리케이션이다.

### §2 사용자

v2.0 §3.3과 동일 (RM / 종금센터 관리자 / 공모전 심사위원).

### §3 문제 정의

v2.0 §3.2와 동일. 추가: 오류·누락 데이터를 조용히 삭제하거나 왜곡 없이 그대로 보여줘야 담당자가 "이 리스트를 믿어도 되는지" 신뢰할 수 있다는 요건을 명시적으로 추가한다.

### §4 목표

Part 1의 최종 목표 10개 항목(v2.1 요청 원문 1장)을 그대로 채택한다.

### §5 MVP In Scope

- Excel 업로드(§10), 필수/선택 컬럼 분리(§9)
- 데이터 검증 V01~V05(§12) 및 오류 데이터 비삭제 정책(§11.3)
- 만기 Bucket 5종 및 Active Window(§11)
- Business Rule R01~R08(§13, Part 4 Rule Matrix)
- Schedule Engine S01(§13.9)
- Priority Score(§17) → Priority Band(§18) + Exception Level(§19)
- Action Recommendation(§20), Rule 기반 종합의견(§21)
- Dashboard 4탭 구조(§22), 상세 Drawer
- Relationship Network(§23)
- Showcase 8 Section(§24, Part 8)
- Excel Export — 신규 Workbook 방식(§25)
- 개인정보 보호 구체 정책(§7)

### §6 Out of Scope

v2.0 §3.6과 동일하게 유지: R09(신용등급 하락) 데이터 소스 미확보, 서버/DB, 자동 스케줄, 실제 고객데이터, 외부 생성형 AI, 로그인/권한.

### §7 개인정보 보호

**모든 데이터 처리는 브라우저 메모리 내에서만 이루어지며, 외부 전송·영속 저장을 하지 않는다** (v2.0과 동일한 대원칙). 아래는 v2.1에서 구체화한 실행 규칙이다.

#### 7.1 UI 비표시 컬럼 (고정 목록)

다음 컬럼은 어떤 화면에도 표시하지 않는다. RAW에 존재하더라도 파싱 단계에서 `LoanRecord`에 매핑하지 않는다.

```
자택전화번호, 직장전화번호, 휴대폰번호, 자동이체모계좌, 보증인 연락처류 전체
```

#### 7.2 로그 금지 패턴

아래 코드 패턴은 개발/운영 환경을 불문하고 저장소에 존재해서는 안 된다. Phase 4(§27) 완료조건에서 정적 검색으로 확인한다.

```
console.log(rawRows)
console.log(workbook)
console.log(uploadedData)
console.log(loan)          // LoanRecord 전체를 그대로 출력하는 패턴 포함
```

허용: 개별 필드 단위 로그(`console.log(loan.loanId)`), 에러 코드/필드명 로그.

#### 7.3 오류 메시지 구성 규칙

오류 메시지에는 **행 번호, 필드명, 오류 유형, 마스킹된 식별값**만 포함한다. 전체 Row나 전화번호를 그대로 노출하지 않는다. 마스킹 규칙: KB-PIN은 앞 6자리+`***`+뒤 3자리(예: `10001-0***-*01`), 계좌번호는 원본 그대로(개인식별정보 아님).

#### 7.4 메모리 정리

- "초기화" 클릭 시 `AnalysisRunResult`, 업로드된 Workbook 참조, 파싱 중간 산출물 전부 제거
- 신규 파일 업로드 시 이전 Workbook 객체 참조 해제
- `URL.createObjectURL` 사용 시 사용 직후 `revokeObjectURL` 호출
- 새로고침 시 전체 소멸 (React 상태만 사용, 영속 저장 계층 없음)
- `localStorage` / `sessionStorage` / `IndexedDB` 사용 금지 — 코드 검색으로 완료조건 검증(§27)

#### 7.5 Showcase 데이터 격리

Showcase(`/showcase`)는 실제 업로드 파이프라인에 접근하지 않고 `fixture_showcase.json`(§20.3)만 사용한다. Showcase 코드 경로에서 `uploadRawFile` 관련 모듈을 import하지 않는다.

### §8 입력 데이터 명세

RAW 컬럼 순서(40개)는 v2.0 §3.8과 동일. 세그먼트·KB-PIN 규칙(§13.1~§13.3에서 재정의)도 동일 원칙 승계.

### §9 필수·선택 컬럼

```typescript
export const REQUIRED_COLUMNS = [
  "계좌번호", "고객명", "KB-PIN", "상품코드", "신규년월일", "만기년월일",
] as const;

export const OPTIONAL_COLUMNS = [
  "익스포져현황", "휴폐업", "담보제공자KB-PIN", "담보제공자명", "정책자금구분",
] as const;
```

**필수 컬럼 누락**: 분석 진행을 차단하고, 누락된 컬럼명을 전부 나열한 에러 화면을 표시한다("정상 진행 가능한 최소 조건이 아니므로 분석 자체가 무의미"하기 때문). 템플릿 다운로드 버튼은 MVP 선택 기능(§28 v1.1)으로 둔다.

**선택 컬럼 누락**: 분석을 계속하되 해당 컬럼에 의존하는 기능만 비활성화한다. `AnalysisCapabilities`(§14.4)로 UI에 전달한다.

| 선택 컬럼 누락 | 비활성화되는 기능 | UI 표시 |
|---|---|---|
| `정책자금구분` | R05 | KPI "정책자금 분석 제외" 배너 + 종합의견에서 해당 문단 생략 |
| `담보제공자KB-PIN`/`담보제공자명` | R02, R03, R04 | "담보/관계 분석 제외" 배너 |
| `익스포져현황` | 세그먼트 표시(R06/R07 판정 자체에는 영향 없음, 상품코드 기준이므로) | 세그먼트 컬럼 "-" 표시 |
| `휴폐업` | 없음(현재 Rule에서 미사용, 정보 표시용) | 컬럼 숨김 |

**절대 표시하지 않는 것**: 위 배너에서 "정책자금 0건"처럼 실제로는 분석하지 않은 항목을 0건으로 표시하는 것을 금지한다. 반드시 "분석 제외"로 표시한다 — §14.4 `AnalysisCapabilities` 참조.

### §10 데이터 파싱 (Excel Upload)

**지원 날짜 형식**: Excel Date Serial, JavaScript Date 객체, `YYYYMMDD`, `YYYY-MM-DD`, `YYYY/MM/DD`. 이 외 형식은 추정하지 않고 `INVALID_DATE`로 처리한다(§11.3).

**문자열 보존 대상**: `계좌번호`, `KB-PIN`, `담보제공자KB-PIN`, `상품코드`, `정책자금구분`은 Excel이 숫자로 읽더라도 문자열로 강제 변환한다(SheetJS `raw: false` 또는 셀 서식 지정 후 재파싱). 앞자리 0이 이미 숫자형 저장으로 유실된 경우는 **복구 불가**임을 업로드 안내 문구에 명시한다.

**헤더 처리**: 앞뒤 공백·줄바꿈 제거 후 정식 헤더와 완전 일치하는 것만 인식한다. 유사도 기반 자동 매핑은 MVP에서 지원하지 않는다(오매핑 위험이 더 크기 때문 — 기본안 확정). 중복 헤더는 V01 오류로 처리한다. 첫 시트만 사용하며, 시트 선택 기능은 v1.1(§28).

### §11 데이터 검증 — Maturity Bucket / Active Window / 오류행 정책

#### 11.1 Maturity Bucket (기준 정의 — 이후 전 문서에서 본 절 참조)

```typescript
export type MaturityBucket =
  | "CURRENT_MONTH" | "NEXT_MONTH" | "TWO_MONTHS_LATER"
  | "OUT_OF_SCOPE" | "INVALID_DATE";
```

- `CURRENT_MONTH`/`NEXT_MONTH`/`TWO_MONTHS_LATER`: 기준일 기준 당월/+1개월/+2개월과 연·월이 일치 (연도 경계 포함 — 실측: 기준일 2026-11-20, 만기 2027-01-15 → `TWO_MONTHS_LATER` 정상 판정 확인)
- `OUT_OF_SCOPE`: 위 3개 구간에 속하지 않는 유효한 날짜
- `INVALID_DATE`: 만기일이 없거나 파싱 실패

#### 11.2 Active Window (기준 정의)

```text
Active Window = { CURRENT_MONTH, NEXT_MONTH, TWO_MONTHS_LATER }
```

`isInActiveWindow = maturityBucket ∈ Active Window && !disabledDuplicate`

**Active Window에 속한 여신만** Priority Score/Band, Dashboard 기본 KPI, Priority Command Board, 오늘의 Action List에 반영된다. `priorityScore`, `priorityBand`는 Active Window가 아니면 반드시 `null`이다.

**단, Business Remark(R02~R08)는 Bucket과 무관하게 전체 유효 데이터에 대해 판정한다.** 이는 "분석범위 외" 탭에서도 특이사항 존재 여부를 확인할 수 있어야 하기 때문이다(예: 만기가 4개월 남은 여신이라도 시설자금 3년 경과 사실 자체는 알 수 있어야 함). R01(동일 차주 추가만기)만 예외적으로 **양쪽 계좌 모두 Active Window 내에 있을 때만** 판정한다(§13.2 참조 — 실측 검증됨: `시설3년경과`(OUT_OF_SCOPE) 건도 Remark는 유지되고 `priorityScore`만 `null`).

#### 11.3 오류·누락 데이터 정책 (기준 정의)

```typescript
export type ValidationIssueCode =
  | "MISSING_REQUIRED_VALUE" | "INVALID_DATE" | "INVALID_PIN"
  | "INVALID_PRODUCT_CODE" | "DUPLICATE_LOAN_ID" | "INVALID_SEGMENT"
  | "UNSUPPORTED_VALUE";

export interface DataValidationIssue {
  rowNumber: number;
  loanId?: string;
  field: string;
  code: ValidationIssueCode;
  severity: "ERROR" | "WARNING";
  message: string;   // §7.3 마스킹 규칙 준수
}
```

**원칙: 오류 행은 절대 삭제하지 않는다.** 전체 업로드 건수(`inputRowCount`)에는 항상 포함되며, 조건에 따라 Active Queue에서만 제외된다.

| 상황 | Severity | 처리 |
|---|---|---|
| 만기일 누락/파싱 실패 | ERROR | `maturityBucket=INVALID_DATE`, `isInActiveWindow=false`, `priorityScore=null`, `scheduleStatus=INVALID`. 원본 행 번호와 함께 "데이터오류" 탭에 표시 |
| 최초실행일 누락/파싱 실패 | WARNING | 일정 분석은 정상 진행. R06/R07만 미실행(판정 근거 없음). DATA_QUALITY Validation Warning 부여, 다른 Rule은 정상 |
| KB-PIN 10자리 미만(prefix 생성 불가) | WARNING | 계좌 단위 일정 분석은 계속. R02~R04 관계 판정에서만 제외 |
| 상품코드 4자리 미만 | WARNING | R08(상품코드 미분류) Remark 부여, 원본 코드값 노출. 시설/운전으로 임의 추정하지 않음 |
| 만기일이 최초실행일보다 이전 | WARNING | `UNSUPPORTED_VALUE`로 기록, 분석은 계속(담당자 확인 유도) |
| 계좌번호 중복 | ERROR | 업로드 자체는 중단하지 않음. **중복된 모든 행을 Rule Engine에서 비활성화**(`disabledDuplicate=true`, `isInActiveWindow=false`)하고 "데이터오류" 탭에 원본 행 번호와 함께 표시. 사용자가 원본 파일을 수정하도록 안내 문구 제공(업로드 차단 방식은 채택하지 않음 — 기본안 확정) |

실측(`fixture_boundary_invalid.json`, §21.2): 위 6개 정책 전부 의도대로 동작 확인.

### §12 데이터 검증 — Validation Engine (V01~V05)

| ID | 이름 | 대상 | 오류조건 |
|---|---|---|---|
| V01 | 필수값 검증 | REQUIRED_COLUMNS 6개 | 값이 비어있음 |
| V02 | 날짜 검증 | 신규년월일, 만기년월일 | §10 지원 형식 외 |
| V03 | KB-PIN 검증 | KB-PIN, 담보제공자KB-PIN | 하이픈 제거 후 10자리 미만 |
| V04 | 상품코드 검증 | 상품코드 | 4자리 미만 |
| V05 | 중복 계좌번호 검증 | 계좌번호 | 동일 값 2건 이상 |

Rule Matrix는 Part 5에 통합 정리.

### §13 Business Rules R01~R08 (기준 정의)

세부 판정조건·Remark·Score·Action은 **Part 4 Rule Matrix가 유일한 기준**이며 본 절에서 반복 서술하지 않는다. 여기서는 전역 원칙만 정리한다.

#### 13.1 KB-PIN 매칭

하이픈 제거 후 앞 10자리 동일 = 동일 고객(뒤 5자리만 다르면 추가사업자). 법인 고객 KB-PIN은 `7` 또는 `8`로 시작.

#### 13.2 관계 Rule 판정 범위

- R02(제3자담보), R03(교차관계), R04(복수여신연결): **Bucket 무관, 전체 유효 데이터 대상**(§11.2 참조)
- R01(동일 차주 추가만기): **Active Window 내 계좌끼리만** 판정(§11.2, Part 4 참조)

#### 13.3 관계 Rule 양방향 원칙

R03은 담보제공자 측(A)과, 그 담보제공자가 실제로는 차주인 여신(B) **양쪽 모두**에 Remark를 부여한다. `relationDirection`으로 방향을 구분한다(§14.6).

#### 13.4 장기경과 정확한 기념일 계산

```typescript
import { addYears, isAfter, isEqual } from "date-fns";

export function hasReachedAnniversary(today: Date, startDate: Date, years: number): boolean {
  const threshold = addYears(startDate, years);
  return isAfter(today, threshold) || isEqual(today, threshold);
}
```

`365.25` 근사 방식은 폐기한다. 윤년 2/29 실행 건은 `date-fns`의 `addYears` 기본 동작(평년 대상 연도는 2/28로 귀속)을 그대로 따른다 — 별도 예외처리 코드를 추가하지 않는 것이 기본안이다(대안: 2/28을 2/29 다음날로 간주하는 로직도 가능하나, 라이브러리 기본 동작과의 불일치가 더 큰 혼란을 유발하므로 채택하지 않음).

기준: 시설자금 `today >= 최초실행일 + 3년`, 운전자금 `today >= 최초실행일 + 5년`. 실측 경계 테스트(§21.2): 정확히 3년/5년째 당일은 적용, 하루 전은 미적용 — 확인됨.

#### 13.5 정책자금(R05) 활성화 조건

`AnalysisCapabilities.canAnalyzePolicyFund`가 `true`일 때만 R05를 실행한다. 컬럼이 없는 업로드에서는 애초에 `LoanRecord.policyFundType`이 채워지지 않으므로 R05는 자연히 미실행된다(§9, §14.4). 실측(§21.3): 정책자금 컬럼 제거 시 관련 Remark 0건, `L0029` 점수 75→67점으로 정확히 8점 감소 확인.

#### 13.6~13.8 R02, R06/R07, R08

Part 4 Rule Matrix 참조.

#### 13.9 Schedule Engine S01 (기준 정의)

```text
D-Day = 만기일의 로컬 날짜 - 기준일의 로컬 날짜   (시간 요소 제거, 연·월·일만 비교)
```

| 상태 | 조건 | 일정점수 |
|---|---:|---:|
| OVERDUE | D-Day < 0 | 50 |
| URGENT | 0 ≤ D-Day ≤ 7 | 50 |
| WARNING | 8 ≤ D-Day ≤ 10 | 40 |
| CAUTION | 11 ≤ D-Day ≤ 14 | 30 |
| NORMAL(D-15~21) | 15~21 | 20 |
| NORMAL(D-22~30) | 22~30 | 10 |
| NORMAL(D-31+) | 31 이상 | 5 |
| COMPLETE | 진행단계 연동(v1.1) | 0 |
| INVALID | 만기일 없음/파싱 실패 | `null` (0점 아님 — §2.3 요구사항 반영) |

**D-0은 만기 당일이며 URGENT로 분류한다** (기본안 확정 — "오늘이 만기인데 아직 여유 있다"는 착시를 방지). Business Rule과 달리 S01은 Remark를 생성하지 않고 `scheduleStatus`/`scheduleScore` 필드로만 존재한다.

### §14 데이터 모델

전체 타입은 Part 3 참조. 여기서는 설계 원칙만 서술한다.

#### 14.1 RAW와 정규화 데이터 분리

`RawLoanRow`(원본 그대로) → `LoanRecord`(정규화, Remark 없음) → `LoanAnalysisResult`(Rule 실행 결과 포함)의 3단계로 분리한다. `LoanRecord`에 `remarks`를 직접 두지 않는 것이 v2.0 대비 변경점이다 — 원본 성격의 데이터와 분석 결과가 섞이면 재분석(기준일 변경 등) 시 상태 관리가 꼬이기 때문이다.

#### 14.2 Priority Band와 Exception Level 분리 (기준 정의)

##### A. Priority Band — "언제 처리해야 하는가" (업무 시급도)

```typescript
export type PriorityBand = "P1_IMMEDIATE" | "P2_PRIORITY" | "P3_PREPARE" | "P4_ROUTINE";
```

판정은 **우선순위 순서대로 첫 번째로 만족하는 조건**을 적용한다(P1→P2→P3→P4 순서로 평가, 하나라도 해당하면 그 Band로 확정하고 하위 조건은 평가하지 않음):

| 순위 | Band | 조건(하나 이상 만족) |
|---|---|---|
| 1 | P1_IMMEDIATE | `scheduleStatus ∈ {URGENT, OVERDUE}` **또는** `priorityScore ≥ 75` **또는** (`scheduleStatus = WARNING` 이고 HIGH Severity Remark 존재) |
| 2 | P2_PRIORITY | `scheduleStatus ∈ {WARNING, CAUTION}` **또는** `55 ≤ priorityScore < 75` **또는** HIGH Severity Remark 존재 |
| 3 | P3_PREPARE | Remark 1건 이상 존재(카테고리 무관) |
| 4 | P4_ROUTINE | 위 조건 전부 미해당 (Active Window 내이지만 특이사항 없음) |

**D-2, Remark 없음 → P1_IMMEDIATE** (실측 확인, §21.1 `L0025`). `scheduleStatus=URGENT` 조건이 최우선이므로 특이사항 유무와 무관하게 P1로 분류된다 — 이것이 "일정만 급해도 업무상으로는 최우선"이라는 실무 감각과 일치하는 지점이다. **Exception Level은 별도로 `NONE`으로 표시되어 "급하지만 확인할 특이사항은 없다"는 의미가 정확히 전달된다.**

Active Window 밖(`isInActiveWindow=false`)이면 `priorityBand = null`이다.

##### B. Exception Level — "확인할 특이사항이 얼마나 복잡한가"

```typescript
export type ExceptionLevel = "HIGH" | "MEDIUM" | "LOW" | "NONE";
```

Remark 중 최고 Severity를 기준으로 판정한다: `CRITICAL`/`HIGH` Remark 1건 이상 → `HIGH`, `MEDIUM` → `MEDIUM`, `LOW`/`INFO`만 존재 → `LOW`, Remark 없음 → `NONE`.

**Exception Level은 Bucket과 무관하게 계산한다**(§11.2) — OUT_OF_SCOPE 여신도 특이사항이 있으면 `HIGH`/`MEDIUM`으로 표시되어 "분석범위 외" 탭에서 확인 가능하다.

#### 14.3 Priority Score의 역할 재정의

```text
Priority Score = 정렬과 산정근거 설명을 위한 보조 지표 (Active Window 내에서만 산정)
Priority Band  = 실제 업무 처리 순서 (화면 1차 분류 기준)
Exception Level = 특이사항 복잡도 (별도 축, 업무 처리 순서에 직접 개입하지 않음)
```

화면 표시는 항상 3개를 함께 노출한다(§22.3 Drawer 명세).

```
업무 우선순위: P1 즉시처리
특이사항 수준: 없음
일정상태: 긴급 D-2
```

#### 14.4 AnalysisCapabilities (기준 정의)

```typescript
export interface AnalysisCapabilities {
  canAnalyzePolicyFund: boolean;      // "정책자금구분" 컬럼 존재 여부
  canAnalyzeCollateral: boolean;      // "담보제공자KB-PIN" 컬럼 존재 여부
  canAnalyzeRelationship: boolean;    // 위와 동일 컬럼에 의존
  canAnalyzeAging: boolean;           // "신규년월일" 컬럼 존재 여부(항상 true — 필수 컬럼)
}
```

KPI가 `0`을 표시할 때는 반드시 "실제로 0건"과 "분석 자체를 하지 않음"을 `AnalysisCapabilities`로 구분해서 렌더링한다(§9).

#### 14.5 오류 데이터의 스키마 표현

`LoanRecord.validationIssues: DataValidationIssue[]`로 표현하며, 이슈가 있어도 레코드 자체는 정상적으로 존재한다(§11.3).

#### 14.6 Remark 중복 방지 (기준 정의)

```typescript
export type RelationDirection =
  | "PROVIDER_TO_BORROWER" | "BORROWER_AS_PROVIDER"
  | "SHARED_PROVIDER" | "SAME_BORROWER_MULTI_MATURITY";

export interface RemarkResult {
  remarkKey: string;   // `${ruleId}:${relationDirection}:${관련PIN prefix 또는 loanId 조합}`
  ruleId: string;
  category: RemarkCategory;
  severity: RemarkSeverity;
  title: string;
  message: string;
  score: number;
  recommendedAction: string;
  relationDirection?: RelationDirection;
  relatedLoanIds?: string[];
  relatedPinPrefixes?: string[];
  evidence?: Record<string, string | number | boolean | null>;
}
```

동일 `remarkKey`가 재생성되면 새 Remark를 추가하지 않고 기존 Remark의 `relatedLoanIds`에 상대 계좌번호를 병합한다(예: 동일 담보제공자가 3건에 연결되면 각 계좌는 자신을 제외한 나머지 2건을 하나의 R04 Remark 안에 배열로 가진다 — Remark 2개로 쪼개지지 않음).

### §15 Remark 구조

Part 3, Part 4 참조.

### §16 (§13.9로 통합 — Schedule Engine)

### §17 Priority Score

```typescript
priorityScore = min(100,
    scheduleScore        // §13.9, 최대 50
  + collateralScore       // COLLATERAL + RELATIONSHIP 카테고리 합, 최대 25
  + policyScore            // POLICY_FUND 카테고리, 최대 10
  + agingScore              // AGING + DATA_QUALITY 카테고리 합, 최대 15
  + scheduleExtraScore       // SCHEDULE 카테고리(R01), 최대 10
)
```

Active Window 밖이면 전체가 `null`이다(§11.2).

### §18 Priority Band

§14.2 A 참조(기준 정의는 그곳 1곳).

### §19 Exception Level

§14.2 B 참조.

### §20 Action Recommendation

Rule별 Action 문구는 Part 4 Rule Matrix에 통합. 구조체:

```typescript
export interface RecommendedAction {
  actionId: string;
  title: string;
  reason: string;
  urgency: "TODAY" | "THIS_WEEK" | "NEXT_WEEK" | "ROUTINE";
  recommendedDueDate: Date | null;
  prerequisite?: string;
  relatedRuleIds: string[];
}
```

`urgency` 매핑: `priorityBand=P1_IMMEDIATE → TODAY`, `P2_PRIORITY → THIS_WEEK`, `P3_PREPARE → NEXT_WEEK`, `P4_ROUTINE → ROUTINE`.

### §21 AI 종합의견 (Rule 기반)

4단 구성(오늘 우선처리 / 이번 주 확인사항 / 관계인 연결 점검 / 사전준비 대상) 원칙은 v2.0과 동일하되, **분류 기준을 Priority Band로 교체**한다: 오늘 우선처리=P1 전체, 이번 주=P2 전체, 사전준비=P3 전체. 실측 예시는 Part 9에 포함. 하단 고지문은 v2.0과 동일하게 항상 표시:

```
본 의견은 Rule 기반 업무지원 결과이며 최종 심사 및 고객관계 확인은 담당자가 수행해야 합니다.
```

정책자금 컬럼이 없는 업로드에서는 종합의견에서 정책자금 관련 문단을 생략한다(§9).

### §22 Dashboard

#### 22.1 상단 KPI (핵심 4개)

1. Active 만기대상 (`activeWindowCount`)
2. P1 즉시처리 (`priorityBandCounts.P1_IMMEDIATE`)
3. 실질 Remark 대상 (`realRemarkCount`, Active Window 기준)
4. 관계 연결 확인 대상 (R03/R04 해당 건수, Active Window 기준)

보조 KPI(하단 배지 목록): P2 우선처리, 정책자금(Capability 없으면 "분석 제외"), 제3자 담보, 동일 차주 추가만기, 데이터 오류(`errorRowCount`), 분석범위 외(`outOfScopeCount`).

#### 22.2 기본 탭 (4개, 고정)

1. **Active Queue** — Priority Band 순 정렬, §22.3 컬럼
2. **분석범위 외** — `maturityBucket = OUT_OF_SCOPE`, Remark는 있으나 Score/Band는 표시하지 않고 "-" 처리
3. **데이터 오류** — `validationIssues` 1건 이상 또는 `disabledDuplicate=true`, 원본 행 번호 노출
4. **관계 네트워크** — §23

#### 22.3 Active Queue 테이블 컬럼

순번 / 계좌번호 / 고객명 / 대출목적 / 만기일 / D-Day / 일정상태 / **Priority Band** / Priority Score / **Exception Level** / 핵심 Remark(최대 2개) / 다음 Action

#### 22.4 상세 Drawer (8개 섹션, 고정)

1. 기본정보 2. 일정정보(D-Day, Bucket, scheduleStatus) 3. Priority Score 산정근거(구성요소별 막대) 4. Remark 상세(카테고리 아이콘) 5. 관계 연결(relatedLoanIds 바로가기) 6. 권장 Action 7. Validation Warning 8. Rule 기반 고지문

### §23 Relationship Network

노드/엣지, 확정 금지 표현 규칙은 v2.0과 동일(고지문 그대로 유지):

```
본 관계도는 데이터상 동일 식별정보의 연결을 시각화한 것으로,
실제 가족 또는 특수관계 여부를 확정하지 않습니다.
```

### §24 Showcase

Part 6, Part 7 참조(8 Section, `fixture_showcase.json` 전용 사용, §7.5).

### §25 Excel Export — 범위 확정

**MVP 최종 결정(기본안, 대안 없음)**: 분석 결과를 **신규 Workbook**으로 생성해 별도 파일로 다운로드한다. 원본 업로드 파일은 애초에 메모리에서 읽기만 하고 수정·재저장하지 않는다.

```
파일명: 기업여신_만기관리_분석결과_{기준일}.xlsx
신규 시트: 분석요약 / ActiveQueue / 분석범위외 / 데이터오류 / Remark상세 / ActionList / 관계인분석
각 시트에 원본 파일명과 원본 Row 번호를 참조 컬럼으로 기록 → 계좌번호로 원본과 대조 가능
```

**원본 무결성의 정의(재정의)**: "원본 업로드 파일은 변경·덮어쓰기·저장하지 않는다"는 의미로 한정한다. "셀 서식까지 완벽히 보존한 원본 복제본에 시트를 추가하는" 방식(v2.0에서 시도)은 **v1.1로 이관**한다 — SheetJS Community Edition의 서식 보존 한계가 검증되지 않은 상태에서 "완벽 보존"을 약속하면 실제 구현 시 조용히 깨질 위험이 크기 때문이다(기본안 확정 사유).

### §26 오류 처리

§11.3의 데이터 레벨 오류 외 화면 레벨 오류:

| 상황 | 메시지 |
|---|---|
| 필수 컬럼 누락 | "다음 컬럼이 없어 분석을 진행할 수 없습니다: {목록}" |
| 첫 시트 데이터 없음 | "엑셀에서 데이터를 찾지 못했습니다. 첫 번째 시트에 헤더+데이터가 있는지 확인해주세요." |
| 파싱 실패(.xlsx 아님 등) | "파일을 읽는 중 문제가 발생했습니다. .xlsx 형식이 맞는지 확인해주세요." |
| 업로드 전 | "파일을 업로드하거나 샘플 데이터로 먼저 확인해보세요." |

### §27 접근성

색상+텍스트+아이콘 3중 배지, 키보드 포커스, `prefers-reduced-motion` 존중, WCAG AA — v2.0과 동일.

### §28 테스트

Part 5(Rule Matrix), Part 9(Fixture)와 1:1 대응. Vitest 스니펫은 Part 10 §31.5.

### §29 Acceptance Criteria

Part 9(§21) 참조 — 실측값 기준.

### §30 향후 확장

v2.0 §3.27과 동일하게 유지: R09 신용등급, 원본 서식보존 Excel Export, 진행단계 추적, Rule 편집 UI, 담당자별 업무보드.

---

## Part 3. TypeScript 타입 최종본

```typescript
// ============================================================
// 기초 타입
// ============================================================
export type LoanPurpose = "시설자금" | "운전자금" | null;
export type BorrowerSegment = "기업" | "소매" | "법인" | null;
export type PolicyFundType = "C1" | "C2" | null;

export type MaturityBucket =
  | "CURRENT_MONTH" | "NEXT_MONTH" | "TWO_MONTHS_LATER"
  | "OUT_OF_SCOPE" | "INVALID_DATE";

export type ScheduleStatus =
  | "NORMAL" | "CAUTION" | "WARNING" | "URGENT" | "OVERDUE" | "COMPLETE" | "INVALID";

export type PriorityBand = "P1_IMMEDIATE" | "P2_PRIORITY" | "P3_PREPARE" | "P4_ROUTINE";
export type ExceptionLevel = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export type RemarkCategory =
  | "COLLATERAL" | "RELATIONSHIP" | "POLICY_FUND" | "AGING"
  | "DATA_QUALITY" | "CREDIT_RISK" | "SCHEDULE";

export type RemarkSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type RelationDirection =
  | "PROVIDER_TO_BORROWER" | "BORROWER_AS_PROVIDER"
  | "SHARED_PROVIDER" | "SAME_BORROWER_MULTI_MATURITY";

export type ValidationIssueCode =
  | "MISSING_REQUIRED_VALUE" | "INVALID_DATE" | "INVALID_PIN"
  | "INVALID_PRODUCT_CODE" | "DUPLICATE_LOAN_ID" | "INVALID_SEGMENT" | "UNSUPPORTED_VALUE";

// ============================================================
// RAW / 정규화 / 분석결과 3계층
// ============================================================
export interface RawLoanRow {
  rowNumber: number;
  raw: Record<string, unknown>;
}

export interface DataValidationIssue {
  rowNumber: number;
  loanId?: string;
  field: string;
  code: ValidationIssueCode;
  severity: "ERROR" | "WARNING";
  message: string;
}

export interface LoanRecord {
  sourceRowNumber: number;
  loanId: string;
  borrowerName: string;
  borrowerPinRaw: string;
  borrowerPinPrefix: string | null;
  productCode: string;
  productName: string;
  loanPurpose: LoanPurpose;
  firstExecutionDate: Date | null;
  maturityDate: Date | null;
  borrowerSegment: BorrowerSegment;
  businessStatus: string | null;
  collateralProviderPinRaw: string | null;
  collateralProviderPinPrefix: string | null;
  collateralProviderName: string | null;
  policyFundType: PolicyFundType;
  validationIssues: DataValidationIssue[];
  disabledDuplicate: boolean;
}

export interface RemarkResult {
  remarkKey: string;
  ruleId: string;
  category: RemarkCategory;
  severity: RemarkSeverity;
  title: string;
  message: string;
  score: number;
  recommendedAction: string;
  relationDirection?: RelationDirection;
  relatedLoanIds?: string[];
  relatedPinPrefixes?: string[];
  evidence?: Record<string, string | number | boolean | null>;
}

export interface RecommendedAction {
  actionId: string;
  title: string;
  reason: string;
  urgency: "TODAY" | "THIS_WEEK" | "NEXT_WEEK" | "ROUTINE";
  recommendedDueDate: Date | null;
  prerequisite?: string;
  relatedRuleIds: string[];
}

export interface PriorityScoreBreakdown {
  scheduleScore: number;
  collateralScore: number;
  policyScore: number;
  agingScore: number;
  scheduleExtraScore: number;
  total: number;
}

export interface LoanAnalysisResult {
  loan: LoanRecord;
  maturityBucket: MaturityBucket;
  isInActiveWindow: boolean;
  isActionable: boolean;               // isInActiveWindow와 동일 값(향후 진행단계 완료 시 분리 여지)
  dDay: number | null;
  scheduleStatus: ScheduleStatus;
  priorityScore: number | null;
  priorityBand: PriorityBand | null;
  exceptionLevel: ExceptionLevel;
  scoreBreakdown: PriorityScoreBreakdown | null;
  remarks: RemarkResult[];
  recommendedActions: RecommendedAction[];
}

export interface AnalysisCapabilities {
  canAnalyzePolicyFund: boolean;
  canAnalyzeCollateral: boolean;
  canAnalyzeRelationship: boolean;
  canAnalyzeAging: boolean;
}

export interface AnalysisSummary {
  inputRowCount: number;
  validLoanCount: number;
  activeWindowCount: number;
  outOfScopeCount: number;
  invalidDateCount: number;
  errorRowCount: number;
  maturityBucketCounts: Record<MaturityBucket, number>;
  scheduleStatusCounts: Partial<Record<ScheduleStatus, number>>;
  priorityBandCounts: Partial<Record<PriorityBand, number>>;
  exceptionLevelCounts: Partial<Record<ExceptionLevel, number>>;
  realRemarkCount: number;
  ruleHitCounts: Record<string, number>;
  topScore: number | null;
}

export interface AnalysisRunResult {
  runId: string;
  analyzedAt: Date;
  referenceDate: Date;
  sourceFileName: string | null;
  results: LoanAnalysisResult[];
  summary: AnalysisSummary;
  validationIssues: DataValidationIssue[];
  capabilities: AnalysisCapabilities;
}

// ============================================================
// Rule Engine
// ============================================================
export interface RuleContext {
  today: Date;
  allLoans: LoanRecord[];
  loansByBorrowerPin: Map<string, LoanRecord[]>;
  loansByCollateralPin: Map<string, LoanRecord[]>;
  capabilities: AnalysisCapabilities;
}

export interface LoanRule {
  id: string;              // "R01".."R08"
  name: string;
  description: string;
  category: RemarkCategory;
  enabled: boolean;
  evaluate(loan: LoanRecord, context: RuleContext): RemarkResult[];
}
```

---

## Part 4. Rule Matrix (R01~R08)

공통 규칙: Bucket 판정 범위는 §13.2, 양방향 원칙은 §13.3, 중복방지는 §14.6 참조.

| 필드 | R01 | R02 | R03 | R04 | R05 | R06 | R07 | R08 |
|---|---|---|---|---|---|---|---|---|
| 명칭 | 동일 차주 추가만기 | 제3자 담보 | 담보제공자-타차주 교차관계 | 동일 담보제공자 복수여신 | 정책자금 | 시설자금 장기경과 | 운전자금 장기경과 | 상품코드 미분류 |
| 구분(Category) | SCHEDULE | COLLATERAL | RELATIONSHIP | RELATIONSHIP | POLICY_FUND | AGING | AGING | DATA_QUALITY |
| 입력 필드 | borrowerPinPrefix, maturityBucket | collateralProviderPinPrefix, borrowerPinPrefix | 전체 borrowerPin 인덱스 | 전체 collateralProviderPin 인덱스 | policyFundType | loanPurpose, firstExecutionDate | loanPurpose, firstExecutionDate | productCode |
| 전제조건 | capabilities 무관, 양쪽 모두 Active Window | collateralProviderPinRaw 존재 | collateralProviderPinRaw 존재, capabilities.canAnalyzeRelationship | 상동 | capabilities.canAnalyzePolicyFund | firstExecutionDate 존재 | firstExecutionDate 존재 | productCode 존재 |
| 판정조건 | 동일 prefix, Active Window 내 2건 이상 | prefix(제공자) ≠ prefix(차주) | prefix(제공자) = 다른 loan의 prefix(차주) | prefix(제공자)가 2건 이상 loan에 등장 | policyFundType ∈ {C1,C2} | loanPurpose=시설자금, `hasReachedAnniversary(today, 실행일, 3)` | loanPurpose=운전자금, `hasReachedAnniversary(today, 실행일, 5)` | loanPurpose=null (코드 [2:4]가 목록에 없음) |
| 제외조건 | Bucket이 OUT_OF_SCOPE/INVALID_DATE인 상대는 관련계좌에서 제외 | pin prefix 생성 불가 시 미판정(V03 Warning으로 대체) | 상동 | 상동 | capabilities=false면 애초에 policyFundType이 null | firstExecutionDate 없으면 미판정(V02 Warning으로 대체, R06 자체는 미실행) | 상동 | productCode < 4자리면 V04 Warning과 함께 R08도 부여(loanPurpose가 애초에 null이므로) |
| Severity | MEDIUM | MEDIUM | HIGH | HIGH | MEDIUM | MEDIUM | MEDIUM | LOW |
| Score | 10 | 10 | 15(양쪽 각각) | 15(각 건) | 8 | 7 | 7 | 10 |
| Remark 제목 | "동일 차주 추가 만기계좌 존재" | "제3자 담보" | A측:"담보제공자가 다른 만기대상 차주와 동일" / B측:"본 차주가 다른 여신의 담보제공자로 연결됨" | "동일 담보제공자 복수여신 연결" | "정책자금 상품 (C1\|C2)" | "시설자금 3년 경과" | "운전자금 5년 경과" | "상품코드 미분류" |
| Action | 복수 계좌 동시 연장 가능여부 검토 / 전체 만기계좌 고객 안내 / 계좌별 필요서류 차이 확인 | 담보제공자 연장동의 확인 / 전자약정 가능일정 확인 / 필요서류 사전징구 | 차주·담보제공자 관계 및 약정 참여 가능일정 확인(A) / 복수 여신 연결관계와 담보제공 범위 확인(B) | 복수 여신 연결관계와 담보제공 범위 확인 | 정책자금 연장요건 확인 / 자금용도 재점검 | 재무상태 및 사업현황 점검 | 재무상태 및 사업현황 점검 | 상품코드 Master 확인 / 데이터 오류 여부 점검 |
| 관계방향 | SAME_BORROWER_MULTI_MATURITY | - | PROVIDER_TO_BORROWER / BORROWER_AS_PROVIDER | SHARED_PROVIDER | - | - | - | - |
| 관련계좌 저장 | relatedLoanIds(자기 제외 상대 전원) | - | relatedLoanIds(상대) | relatedLoanIds(자기 제외 상대 전원) | - | - | - | - |
| 테스트 케이스 | `L0031`↔`L0032`(§21.1), `S06`↔`S07`(§21.3) | `담보단독14/15/16` 등 9건(§21.1) | `L0017`↔`L0018`(§21.1), `S02`↔`S03`(§21.3) | `L0019`↔`L0020`(§21.1), `S04`↔`S05`(§21.3) | `L0003/L0007/L0023/L0026/L0029`(§21.1), 컬럼없음 시나리오(§21.3) | `B18`(정확3년,적용)/`B19`(3년-1일,미적용)(§21.2) | `B20`(정확5년,적용)/`B21`(5년-1일,미적용)(§21.2) | `L0033`(§21.1), `B07`(§21.2) |

---

## Part 5. Validation Matrix (V01~V05)

| ID | 검증필드 | 오류조건 | Severity | 분석 지속 여부 | 사용자 메시지 | 테스트 케이스 |
|---|---|---|---|---|---|---|
| V01 | 계좌번호/고객명/KB-PIN/상품코드 | 값 없음 | ERROR | 지속(해당 필드 관련 판정만 제외) | "{행번호}행: {필드명} 값이 비어있습니다" | 별도 미포함(필수컬럼 자체 누락은 §9 업로드 차단으로 처리, 행 단위 공란은 실 데이터 투입 후 자연 발생) |
| V02 | 신규년월일/만기년월일 | §10 지원 형식 외 또는 공란 | 만기=ERROR, 신규=WARNING | 만기오류는 Active Queue 제외, 신규오류는 R06/R07만 제외 | "{행번호}행: {필드명} 파싱 실패(원본값: {마스킹값})" | `B01`(만기누락), `B02`(신규누락), `B03`(잘못된날짜 20260230) |
| V03 | KB-PIN/담보제공자KB-PIN | 하이픈 제거 후 10자리 미만 | WARNING | 지속(관계 Rule만 제외) | "{행번호}행: KB-PIN 형식을 확인해주세요" | `B04`(10자리 미만), `B05`(하이픈 없음 - 정상 처리 확인용), `B06`(앞자리 0 - 정상 처리 확인용) |
| V04 | 상품코드 | 4자리 미만 | WARNING | 지속(R08 병행 부여) | "{행번호}행: 상품코드 형식을 확인해주세요(원본값: {코드})" | `B07` |
| V05 | 계좌번호 | 중복 | ERROR | 중복 행 전부 `disabledDuplicate=true`, Active Queue 제외. 업로드 자체는 차단하지 않음 | "계좌번호 {값}가 {N}건 중복되어 분석에서 제외되었습니다. 원본 파일을 확인해주세요" | `B08`×2 |

---

## Part 6. 점수 및 등급 Matrix

| 구성요소 | 카테고리 | 상한 | 근거 |
|---|---|---|---|
| Schedule Score | (S01 전용, Remark 아님) | 50 | §13.9 |
| Collateral Score | COLLATERAL + RELATIONSHIP | 25 | R02(10) + R03/R04(15×N) 합산 후 상한 |
| Policy Score | POLICY_FUND | 10 | R05(8) |
| Aging Score | AGING + DATA_QUALITY | 15 | R06/R07(7) + R08(10) 합산 후 상한 |
| Schedule Extra | SCHEDULE(R01) | 10 | R01(10×N) 합산 후 상한 |
| **Total** | `min(100, 합계)` | 100 | §17 |

**충돌 시 우선순위**: Priority Band 판정은 §14.2 A의 순서(P1→P2→P3→P4)를 그대로 따르며, 동시에 여러 조건을 만족해도 상위 Band 하나로 확정한다(중복 표시 없음).

---

## Part 7. 화면별 UX 명세

### `/dashboard`

| 항목 | 내용 |
|---|---|
| 목적 | RM의 실제 월간 업무 처리 |
| 컴포넌트 | 업로드 영역, 기준일 선택, KPI 카드(§22.1), 4탭(§22.2), Active Queue 테이블(§22.3), 상세 Drawer(§22.4) |
| 사용자 행동 | 업로드/샘플 로드 → 기준일 확인 → 탭 이동 → 행 클릭 |
| Loading | 파싱 중 스피너 |
| Empty | "파일을 업로드하거나 샘플 데이터로 먼저 확인해보세요." |
| Error | §26 |
| Responsive | 테이블 가로 스크롤, 모바일에서 카드형 전환 |
| Accessibility | §27 |

### `/showcase`

| 항목 | 내용 |
|---|---|
| 목적 | 3분 내 문제-해결-차별성 전달 |
| 컴포넌트 | Part 8 참조 |
| 사용자 행동 | 스크롤, "가상 데이터 분석 시작" 클릭 |
| Loading | Live Demo 8단계 진행(1~2초 간격) |
| Empty | 없음(내장 Fixture만 사용) |
| Error | 없음 |
| Responsive | 카드 세로 스택, 네트워크 그래프는 요약 통계로 대체 |
| Accessibility | §27 |

---

## Part 8. Showcase Storyboard (8 Section, 3분)

```
0:00~0:20  S1 Hero — "기업여신 만기관리, 리스트 확인에서 선제적 관리로"
           카드 자동분류 애니메이션(P1~P4 보드 이동), 5초 이내

0:20~0:45  S2 현행 문제 + Before/After 한 화면 비교
           Before(수작업 확인/개인메모) vs After(8Rule 자동판정/Action 제안)

0:45~1:00  S3 분석 Pipeline
           RAW→검증→KB-PIN정규화→8Rule→일정엔진→관계네트워크→Band→Action
           (fixture_showcase 8건 기준 실측 숫자 연결)

1:00~1:35  S4 Live Demo + KPI
           "가상 만기리스트 분석 시작" → 8단계 진행 → KPI 카운트업
           (Active 8 / P1 1 / 실질Remark 7 / 관계연결확인 4 — §21.3 실측)

1:35~2:05  S5 Priority Command Board
           P1~P4 4열 칸반, 카드=기업명/D-Day/Band/Score/ExceptionLevel/핵심Remark/Action
           분석완료 후 카드 이동 애니메이션

2:05~2:30  S6 Relationship Network
           세림에프앤비↔청솔산업(R03), 다온유통↔모아테크(R04) 강조
           "실제 가족 또는 특수관계 여부를 확정하지 않습니다" 고지 노출

2:30~2:50  S7 Today's Action + 종합의견
           P1 카드(한빛정밀 D-5·제3자담보·정책자금) "다음 행동" 문장 강조
           Rule 기반 4단 종합의견 + 하단 고지문

2:50~3:00  S8 기대효과 + 보안 + 확장
           정성적 효과 / 향후 측정 KPI 분리 표시, 브라우저 처리 흐름 다이어그램
```

---

## Part 9. 테스트 Fixture 및 예상 결과 (실측)

### §21.1 `fixture_rule_valid_33.json` (33건, 기준일 2026-08-03, 정책자금 컬럼 있음)

```json
{
  "inputRowCount": 33,
  "validLoanCount": 33,
  "activeWindowCount": 27,
  "outOfScopeCount": 6,
  "invalidDateCount": 0,
  "errorRowCount": 0,
  "maturityBucketCounts": { "CURRENT_MONTH": 9, "NEXT_MONTH": 4, "TWO_MONTHS_LATER": 14, "OUT_OF_SCOPE": 6 },
  "scheduleStatusCounts(Active만)": { "URGENT": 2, "WARNING": 2, "CAUTION": 1, "NORMAL": 22 },
  "priorityBandCounts(Active만)": { "P1_IMMEDIATE": 2, "P2_PRIORITY": 7, "P3_PREPARE": 9, "P4_ROUTINE": 9 },
  "exceptionLevelCounts(Active만)": { "HIGH": 4, "MEDIUM": 11, "LOW": 1, "NONE": 11 },
  "realRemarkCount(Active만)": 16,
  "topScore": 75
}
```

**Rule별 적중(Active Window 기준)**: R01=2 · R02=9 · R03=2(1쌍 양방향) · R04=2(1쌍) · R05=4(컬럼있음 기준, 분석범위외 1건 별도) · R06=4(분석범위외 1건 별도) · R07=1(분석범위외 1건 별도) · R08=1

**분석범위 외(OUT_OF_SCOPE)에서 확인되는 특이사항** (Active Queue KPI에는 미포함, "분석범위 외" 탭에서만 노출):

| 계좌 | Remark | Exception Level |
|---|---|---|
| `L0021`(시설3년경과) | 시설자금 3년 경과 | MEDIUM |
| `L0023`(운전5년경과) | 정책자금(C1) / 운전자금 5년 경과 | MEDIUM |

**최고점**: `L0029`(복합2) 75점, `P1_IMMEDIATE`, 제3자담보+정책자금(C1)+운전자금5년경과.

**P1_IMMEDIATE 대상 계좌**: `L0029`(75점), `L0025`(D2임박, 50점, Remark 없음 — Exception Level `NONE`).

**P2_PRIORITY 대상 계좌**: `L0026`, `L0001`, `L0031`, `L0020`, `L0017`, `L0019`, `L0018` (7건).

**R01 양방향 실측**: `L0031`↔`L0032` — 양쪽 모두 "동일 차주 추가 만기계좌 존재" 확인.
**R03 양방향 실측**: `L0017`("담보제공자가 다른 만기대상 차주와 동일") ↔ `L0018`("본 차주가 다른 여신의 담보제공자로 연결됨") 확인.
**R04 양방향 실측**: `L0019` ↔ `L0020` 상호 "동일 담보제공자 복수여신 연결" 확인.

> v2.0 대비 변경: Risk Level(CRITICAL/HIGH/MEDIUM/LOW) 분포는 v2.1에서 폐기되었으므로 더 이상 산출하지 않는다. 대신 Priority Band + Exception Level 조합으로 대체한다. `realRemarkCount`는 16건으로 v2.0(18건, OUT_OF_SCOPE 포함 기준)과 다르다 — v2.1은 Active Window 기준으로만 집계하기 때문이며, 이는 §11.2 정책 변경에 따른 의도된 차이다.

### §21.2 `fixture_boundary_invalid.json` (21건, 경계·오류 검증 전용)

파일 자체는 21건이지만 **기준일이 서로 다른 두 테스트 그룹으로 분리해서 실행**한다. 하나의 기준일로 21건을 한꺼번에 돌리면 B12의 만기(2027-01-15)가 2026-08-03 기준으로는 분석범위를 훨씬 벗어난 `OUT_OF_SCOPE`가 되어 연도 경계 검증의 의미가 사라지기 때문이다.

**그룹 A — 오류·일반 경계 테스트 (20건, 기준일 `2026-08-03`)**: B12를 제외한 나머지 전건.

| 계좌 | 시나리오 | 실측 결과 |
|---|---|---|
| `B01` | 만기일 누락 | `maturityBucket=INVALID_DATE`, `scheduleStatus=INVALID`, `priorityScore=null`, 행 유지 확인 |
| `B02` | 최초실행일 누락 | 정상 Active 분석, R06/R07만 미실행, WARNING 이슈 1건 |
| `B03` | 잘못된 날짜(20260230) | `B01`과 동일하게 `INVALID_DATE` 처리 확인 |
| `B04` | KB-PIN 10자리 미만 | 일정 분석 정상, 관계 Rule만 제외 |
| `B05` | 하이픈 없는 PIN | 정상 처리(하이픈 유무 무관 확인) |
| `B06` | 앞자리 0 PIN | 정상 처리 |
| `B07` | 상품코드 4자리 미만 | V04 WARNING + R08 Remark 동시 부여 확인 |
| `B08`×2 | 계좌번호 중복 | 양쪽 모두 `disabledDuplicate=true`, `DUPLICATE_LOAN_ID` ERROR, Active Queue 제외, 업로드 자체는 유지 |
| `B10` | 담보제공자 명칭만 없음 | 정상 처리(명칭은 로직에 미사용) |
| `B11` | 만기일 < 최초실행일 | `UNSUPPORTED_VALUE` WARNING, 분석은 계속 |
| `B13`~`B17` | D-14/D-10/D-7/D-0/D-(-1) | 각각 CAUTION(30점)/WARNING(40점)/URGENT(50점)/URGENT(50점)/OVERDUE(50점) 정확히 일치 |
| `B18`/`B19` | 시설자금 정확히 3년 / 3년-1일 | 각각 적용/미적용 확인(정확한 기념일 계산 검증) |
| `B20`/`B21` | 운전자금 정확히 5년 / 5년-1일 | 각각 적용/미적용 확인 |

**그룹 B — 연도 경계 테스트 (`B12` 1건, 기준일 `2026-11-20`)**: 나머지 20건과 통계를 섞지 않고 단독 실행한다(`test_b12_year_boundary.py` 참조, Part 10 §31.5).

| 검증 항목 | 기준일 | 입력 | 기대 결과 | 실측 |
|---|---|---|---|---|
| 만기 Bucket | 2026-11-20 | `B12`, 만기 2027-01-15 | `TWO_MONTHS_LATER` | ✅ 일치 |
| Active Window 포함 | 2026-11-20 | `B12` | `true` | ✅ 일치 |
| D-Day | 2026-11-20 | `B12` | 56 | ✅ 일치 |
| 일정상태 | 2026-11-20 | `B12` | `NORMAL` | ✅ 일치 |
| 우선순위 점수(=일정점수, Remark 없음) | 2026-11-20 | `B12` | 5 | ✅ 일치 |

이 결과는 **달력 월 단위 비교**(§11.1 — 연/월 튜플 비교, 일수 차감이 아님)로 11월 기준 +2개월이 익년 1월로 정상 연결됨을 실측으로 재확인한 것이다.

### §21.3 `fixture_showcase.json` (8건, 가상 기업명)

```json
{
  "inputRowCount": 8, "activeWindowCount": 8, "outOfScopeCount": 0,
  "priorityBandCounts": { "P1_IMMEDIATE": 1, "P2_PRIORITY": 5, "P3_PREPARE": 1, "P4_ROUTINE": 1 },
  "exceptionLevelCounts": { "HIGH": 4, "MEDIUM": 3, "NONE": 1 },
  "realRemarkCount": 7, "topScore": 68
}
```

| 계좌 | 기업명 | D-Day | Band | Exception | Score | 핵심 Remark |
|---|---|---:|---|---|---:|---|
| S01 | 한빛정밀 | 5 | P1_IMMEDIATE | MEDIUM | 68 | 제3자 담보 / 정책자금(C1) |
| S06 | 유진메디텍 | 9 | P2_PRIORITY | MEDIUM | 50 | 동일 차주 추가 만기계좌 존재 |
| S02 | 세림에프앤비 | 43 | P2_PRIORITY | HIGH | 37 | 제3자 담보 / 담보제공자가 다른 차주와 동일 / 시설 3년경과 |
| S05 | 모아테크 | 70 | P2_PRIORITY | HIGH | 37 | 제3자 담보 / 동일 담보제공자 복수여신 / 시설 3년경과 |
| S04 | 다온유통 | 63 | P2_PRIORITY | HIGH | 30 | 제3자 담보 / 동일 담보제공자 복수여신 |
| S07 | 미래로지스 | 53 | P3_PREPARE | MEDIUM | 22 | 시설 3년경과 / 동일 차주 추가 만기계좌 |
| S03 | 청솔산업 | 68 | P2_PRIORITY | HIGH | 20 | 본 차주가 다른 여신의 담보제공자로 연결됨 |
| S08 | 새봄바이오 | 78 | P4_ROUTINE | NONE | 5 | (없음) |

Showcase Section 5(Priority Command Board)는 이 8건으로 P1~P4 4개 열이 모두 채워지는 것을 실측으로 확인했다(빈 열 없음).

### §21.4 정책자금 컬럼 없음 시나리오 (`fixture_rule_valid_33.json`, `canAnalyzePolicyFund=false`)

| 지표 | 컬럼 있음 | 컬럼 없음 | 비고 |
|---|---:|---:|---|
| R05 적중 건수 | 4 | 0 | 자동 비활성 확인 |
| `L0029` 점수 | 75 | 67 | 정책자금 8점만 정확히 감소 |
| `realRemarkCount`(Active) | 16 | 13 | 정책자금이 유일 Remark였던 3건(`L0003`,`L0007`,`L0026`)이 Remark 0건으로 전환 |

---

## Part 10. Cursor 구현 우선순위

### Phase 0 — 준비

- 기존 프로젝트 구조 확인(비어있으면 FSD로 신규 생성)
- 본 PRD(`PRD_v2.1_Final_...md`)와 3개 Fixture, Reference Engine을 리포지토리에 저장
- Phase 1~4 구현계획을 이슈/체크리스트로 등록

### Phase 1 — 핵심 엔진 (서버/UI 없이 순수 로직)

- Part 3 타입 전체 구현
- Parser: RAW → `LoanRecord` (§10)
- Validation V01~V05 (Part 5)
- Business Rule R01~R08 (Part 4) — Rule Registry 배열로 등록, 개별 `enabled` 플래그
- Schedule Engine S01 (§13.9)
- Priority Score/Band/Exception Level (§17~19)
- **완료조건**: `fixture_rule_valid_33.json`을 기준일 `2026-08-03`으로 실행한 결과가 §21.1의 모든 수치와 정확히 일치. `fixture_boundary_invalid.json`의 그룹A(B12 제외 20건, 기준일 `2026-08-03`) 실행 결과가 §21.2 그룹A 표와 일치. 그룹B(`B12` 1건, 기준일 `2026-11-20`)를 별도 실행한 결과가 §21.2 그룹B 표와 일치(`test_b12_year_boundary.py` 참조).

### Phase 2 — 업로드 & Dashboard

- Excel Upload(§10), 필수/선택 컬럼 처리(§9)
- `/dashboard`: 4탭, KPI, Active Queue 테이블, 상세 Drawer(§22)
- **완료조건**: `fixture_rule_valid_33.json`을 실제 .xlsx로 변환해 업로드했을 때 Phase 1과 동일한 결과 재현

### Phase 3 — 관계 네트워크 & Showcase

- Relationship Network 그래프(§23)
- `/showcase` 8 Section(Part 8), `fixture_showcase.json` 전용 연결(§7.5)
- **완료조건**: Showcase KPI 카운트업 수치가 §21.3과 일치, 하드코딩된 숫자 없음(코드 검색으로 리터럴 숫자 KPI 부재 확인)

### Phase 4 — 마감

- Excel Export(§25, 신규 Workbook 방식)
- `fixture_boundary_invalid.json` 기반 자동 테스트 전체 통과 (그룹A 20건/기준일 `2026-08-03` + 그룹B `B12`/기준일 `2026-11-20`, 두 그룹을 하나의 통계로 합산하지 않음 — §21.2)
- 접근성(§27), 반응형 점검
- §7 개인정보 정적 검사(로그 패턴, localStorage 미사용) 통과
- 빌드 및 배포(Vercel 등)

### §31.5 테스트 스니펫 (Vitest)

```typescript
import { describe, it, expect } from "vitest";
import { runAnalysis } from "@/entities/loan/lib/runAnalysis";
import { fixtureRuleValid33 } from "@/shared/fixtures/fixtureRuleValid33";

describe("Rule Engine v2.1", () => {
  const run = runAnalysis(fixtureRuleValid33, new Date("2026-08-03"), { canAnalyzePolicyFund: true });

  it("Active Window 건수는 27건이다", () => {
    expect(run.summary.activeWindowCount).toBe(27);
  });

  it("OUT_OF_SCOPE는 Priority Score가 null이다", () => {
    const outOfScope = run.results.filter((r) => r.maturityBucket === "OUT_OF_SCOPE");
    expect(outOfScope.every((r) => r.priorityScore === null && r.priorityBand === null)).toBe(true);
  });

  it("OUT_OF_SCOPE도 Remark는 유지된다 (L0021, L0023)", () => {
    const l21 = run.results.find((r) => r.loan.loanId === "L0021")!;
    expect(l21.remarks.some((r) => r.ruleId === "R06")).toBe(true);
    expect(l21.priorityScore).toBeNull();
  });

  it("D-2, Remark 없음 여신은 P1_IMMEDIATE + Exception NONE 이다", () => {
    const d2 = run.results.find((r) => r.loan.loanId === "L0025")!;
    expect(d2.priorityBand).toBe("P1_IMMEDIATE");
    expect(d2.exceptionLevel).toBe("NONE");
  });

  it("R03 관계는 양방향으로 존재한다", () => {
    const l17 = run.results.find((r) => r.loan.loanId === "L0017")!;
    const l18 = run.results.find((r) => r.loan.loanId === "L0018")!;
    expect(l17.remarks.some((r) => r.ruleId === "R03")).toBe(true);
    expect(l18.remarks.some((r) => r.ruleId === "R03")).toBe(true);
  });

  it("최고 점수는 L0029, 75점이다", () => {
    expect(run.summary.topScore).toBe(75);
    const top = run.results.find((r) => r.priorityScore === 75)!;
    expect(top.loan.loanId).toBe("L0029");
  });
});

describe("Boundary/Invalid Fixture", () => {
  it("만기일 누락 행은 삭제되지 않고 INVALID_DATE로 표시된다", () => {
    const run = runAnalysis(fixtureBoundaryInvalid, new Date("2026-08-03"), { canAnalyzePolicyFund: true });
    const b01 = run.results.find((r) => r.loan.loanId === "B01")!;
    expect(b01).toBeDefined();
    expect(b01.maturityBucket).toBe("INVALID_DATE");
    expect(b01.priorityScore).toBeNull();
  });

  it("중복 계좌번호는 양쪽 모두 비활성화된다", () => {
    const run = runAnalysis(fixtureBoundaryInvalid, new Date("2026-08-03"), { canAnalyzePolicyFund: true });
    const dups = run.results.filter((r) => r.loan.loanId === "B08");
    expect(dups.every((d) => d.loan.disabledDuplicate === true)).toBe(true);
    expect(dups.every((d) => d.isInActiveWindow === false)).toBe(true);
  });

  // B12는 별도 기준일(2026-11-20)로 단독 실행한다 — 나머지 20건과 통계를 합산하지 않음 (§21.2 그룹B)
  it("B12: 11월 기준 +2개월이 익년 1월로 정상 연결된다 (연도 경계)", () => {
    const b12 = fixtureBoundaryInvalid.filter((r) => r["계좌번호"] === "B12");
    const run = runAnalysis(b12, new Date("2026-11-20"), { canAnalyzePolicyFund: true });
    expect(run.results).toHaveLength(1);
    const r = run.results[0];
    expect(r.loan.loanId).toBe("B12");
    expect(r.maturityBucket).toBe("TWO_MONTHS_LATER");
    expect(r.isInActiveWindow).toBe(true);
    expect(r.dDay).toBe(56);
    expect(r.scheduleStatus).toBe("NORMAL");
    expect(r.priorityScore).toBe(5);
  });

  it("시설자금 정확히 3년째는 적용, 하루 전은 미적용", () => {
    const run = runAnalysis(fixtureBoundaryInvalid, new Date("2026-08-03"), { canAnalyzePolicyFund: true });
    const exact = run.results.find((r) => r.loan.loanId === "B18")!;
    const before = run.results.find((r) => r.loan.loanId === "B19")!;
    expect(exact.remarks.some((r) => r.ruleId === "R06")).toBe(true);
    expect(before.remarks.some((r) => r.ruleId === "R06")).toBe(false);
  });
});

describe("정책자금 컬럼 없음", () => {
  it("R05가 비활성화되고 L0029 점수가 8점 감소한다", () => {
    const withCol = runAnalysis(fixtureRuleValid33, new Date("2026-08-03"), { canAnalyzePolicyFund: true });
    const withoutCol = runAnalysis(fixtureRuleValid33, new Date("2026-08-03"), { canAnalyzePolicyFund: false });
    const a = withCol.results.find((r) => r.loan.loanId === "L0029")!;
    const b = withoutCol.results.find((r) => r.loan.loanId === "L0029")!;
    expect(a.priorityScore! - b.priorityScore!).toBe(8);
  });
});
```

---

## 완료 기준 (Definition of Done) — 사용자 12개 조건 대응표

| # | 완료 기준(사용자 원문) | 검증 방법 |
|---|---|---|
| 1 | OUT_OF_SCOPE가 Active Queue를 오염시키지 않음 | §31.5 테스트 2번째 케이스, §21.1 실측 |
| 2 | 만기일 오류행이 삭제되지 않음 | §31.5 Boundary 테스트 1번째, §21.2 `B01` |
| 3 | Priority Band와 Exception Level이 분리됨 | §14.2, §31.5 3번째 테스트 |
| 4 | D-2 정상여신이 P1 즉시처리로 표시됨 | §21.1 `L0025`, §31.5 3번째 테스트 |
| 5 | 관계 Rule 양방향 판정 유지 | §21.1 R01/R03/R04 실측, §31.5 4번째 테스트 |
| 6 | 관계 Remark 중복 방지 기준 존재 | §14.6 `remarkKey` |
| 7 | 장기경과 경계일 판정이 달력 기준으로 정확함 | §13.4, §21.2 `B18~B21` |
| 8 | 정책자금 컬럼 누락 시 분석 전체가 실패하지 않음 | §21.4, §31.5 마지막 테스트 |
| 9 | Capability에 따라 KPI가 0건과 분석제외를 구분함 | §14.4, §9 |
| 10 | 테스트 Fixture와 Showcase Fixture가 분리됨 | Part 9 3개 파일 |
| 11 | 개인정보가 로그와 오류 메시지에 노출되지 않음 | §7 |
| 12 | 8개 업무 Rule과 1개 일정 엔진 명칭이 일관됨 | Part 4, §13.9, 본 문서 전체 |
| 13 | Showcase가 8개 Section으로 압축됨 | Part 8 |
| 14 | Excel Export의 원본 무결성 표현이 과장되지 않음 | §25 |
| 15 | Acceptance Criteria가 실제 Reference Engine과 일치함 | Part 9 전체(`rule_engine_v2_1_reference.py` 실행 결과 그대로 인용) |
| 16 | Cursor가 추가 질문 없이 Phase 1을 구현할 수 있음 | Part 3, 4, 5, 10, §31.5 |
