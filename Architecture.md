# Architecture.md — Renewal Navigator (기업여신 만기관리 AI Agent)

| 항목 | 내용 |
|---|---|
| 문서 역할 | Sprint 00 산출물 — 구현 전 아키텍처·순서·폴더 구조 확정 |
| 기준 문서 | `PRD_v2.1_Final_기업여신만기관리_AI_Agent.md` |
| Truth | `rule_engine_v2_1_reference.py` (수치·판정 불일치 시 Reference Engine 우선) |
| 검증 Fixture | `fixture_rule_valid_33.json` · `fixture_boundary_invalid.json` · `fixture_showcase.json` |
| 작성 범위 | 분석 / 구현 순서 / 폴더 구조 / 아키텍처 — **코드 구현 없음** |

---

## 1. 프로젝트 구조 분석

### 1.1 현재 상태

| 경로 | 상태 |
|---|---|
| 워크스페이스 (`기한연장 도우미`) | `.git`만 존재. 앱 코드·의존성·폴더 **없음** |
| 외부 산출물 (`/Users/yeob/4차/`) | PRD · Reference Engine · Fixture 3종 · B12 테스트 스크립트 존재 |

→ PRD Part 10 **Phase 0** 적용: 빈 저장소이므로 **FSD(Feature-Sliced Design)로 신규 생성**한다.

### 1.2 Truth / 문서 역할 분리

| 산출물 | 역할 | 수정 권한(Sprint 00) |
|---|---|---|
| PRD v2.1 Final | 화면·정책·타입·완료조건의 기준 문서 | **수정 금지** |
| `rule_engine_v2_1_reference.py` | 판정·점수·Band·Bucket의 유일한 Truth | **수정 금지** |
| Fixture 3종 | Acceptance 수치의 입력 원본 | **수정 금지** |
| `test_b12_year_boundary.py` | 연도경계(B12) 단독 검증 절차 참조 | **수정 금지** |
| 본 `Architecture.md` | FE 구현 지도 | Sprint 00에서 작성 |

### 1.3 제품 한 줄 정의 (PRD §1)

브라우저 단독 웹앱. RAW 엑셀 업로드 → V01~V05 검증 → R01~R08 + S01 실행 → Active Window(당월~+2개월)에 한해 Priority Band / Exception Level / Action / 종합의견 제시. 서버·DB·로그인 없음.

---

## 2. PRD 분석 (구현에 필요한 확정 사항만)

### 2.1 3계층 Rule / Engine

| 계층 | ID | 역할 |
|---|---|---|
| Validation | V01~V05 | 필수값·날짜·PIN·상품코드·중복계좌 |
| Business Rule | R01~R08 | Remark 생성 (Rule Registry, `enabled` 플래그) |
| Schedule Engine | S01 | `scheduleStatus` / `scheduleScore`만 (Remark 미생성) |

Risk Level은 **폐기**. 화면 1차 축은 **Priority Band**, 특이사항 축은 **Exception Level**.

### 2.2 Active Window vs Remark 범위 (핵심 정책)

```
Active Window = CURRENT_MONTH | NEXT_MONTH | TWO_MONTHS_LATER
isInActiveWindow = bucket ∈ Active Window && !disabledDuplicate
```

| 대상 | Active Window 밖 | Active Window 안 |
|---|---|---|
| `priorityScore` / `priorityBand` | **반드시 `null`** | 산정 |
| KPI / Command Board / Action List | 미포함 | 포함 |
| Remark R02~R08 | **전체 유효 데이터에서 판정 유지** | 동일 |
| Remark R01 | Active Window 내 계좌끼리만 | — |
| Exception Level | Bucket 무관 계산 | 동일 |

### 2.3 데이터 파이프라인 (3단계 분리)

```
RawLoanRow  →  LoanRecord  →  LoanAnalysisResult
(원본)         (정규화, remarks 없음)   (Rule 결과 포함)
```

재분석(기준일 변경) 시 `LoanRecord`를 재사용하고 분석 결과만 다시 만든다.

### 2.4 점수 / Band (Reference Engine과 동일해야 함)

```
priorityScore = min(100,
  scheduleScore(≤50) + collateralScore(≤25) + policyScore(≤10)
  + agingScore(≤15) + scheduleExtraScore(≤10)
)
```

Priority Band: P1 → P2 → P3 → P4 **첫 만족 조건으로 확정** (PRD §14.2 A).

### 2.5 개인정보·보안 (브라우저 단독)

- 전화·자동이체모계좌·보증인 연락처류: `LoanRecord`에 **매핑하지 않음**
- `localStorage` / `sessionStorage` / `IndexedDB` **금지**
- Showcase는 `fixture_showcase.json`만 사용, upload 모듈 **import 금지**
- Excel Export: **신규 Workbook**만 (원본 파일 미수정)

### 2.6 라우트·화면

| 경로 | 목적 |
|---|---|
| `/dashboard` | RM 실무: 업로드 · KPI · 4탭 · Drawer |
| `/showcase` | 3분 스토리보드 8 Section (가상 Fixture 전용) |

### 2.7 Acceptance 앵커 (Phase 1 완료의 숫자 Truth)

| Fixture | 기준일 | 핵심 기대 |
|---|---|---|
| `fixture_rule_valid_33` | 2026-08-03 | Active 27 · P1=2 · realRemark=16 · topScore=75 |
| `fixture_boundary_invalid` 그룹A (B12 제외) | 2026-08-03 | B01 INVALID_DATE 유지, B08 양쪽 disable, B18/B19 기념일 경계 등 |
| `fixture_boundary_invalid` 그룹B (B12만) | 2026-11-20 | TWO_MONTHS_LATER · dDay=56 · score=5 |
| `fixture_showcase` | (Showcase 기준일) | Active 8 · P1=1 · realRemark=7 · topScore=68 |

그룹A와 그룹B **통계를 합산하지 않는다**.

---

## 3. 구현 순서

PRD Part 10 Phase를 그대로 따른다. Sprint 00은 Phase 0만 문서화 완료.

### Phase 0 — 준비 (본 Sprint)

1. 빈 저장소 확인 → FSD 폴더 구조 확정 (본 문서 §4)
2. PRD · Fixture 3종 · Reference Engine · B12 테스트를 `docs/` / `shared/fixtures/` / `docs/reference/`에 **복사 보관** (원본 수정 없음)
3. Phase 1~4 체크리스트를 이슈/본 문서 §3에 고정

### Phase 1 — 핵심 엔진 (UI 없음, 순수 로직)

순서 고정:

1. Part 3 타입 (`shared/types` 또는 `entities/loan/model`)
2. Parser: RAW → `LoanRecord` (§10, 문자열 강제·날짜 형식)
3. Validation V01~V05
4. Rule Registry + R01~R08 (`evaluate` 시그니처는 PRD `LoanRule`)
5. Schedule Engine S01
6. Maturity Bucket / Active Window
7. Priority Score → Band → Exception Level
8. `runAnalysis` 오케스트레이션 + `AnalysisSummary` / `AnalysisCapabilities`
9. Vitest: PRD §31.5 스니펫 전부 — **Reference Engine 수치와 1:1**

완료조건: §21.1 · §21.2 그룹A/B · §21.4(정책자금 컬럼 없음) 전부 일치.

### Phase 2 — 업로드 & Dashboard

1. Excel Upload (SheetJS, 첫 시트만, 필수컬럼 누락 시 차단)
2. 기준일 선택 → 재분석
3. `/dashboard`: KPI 4+보조 · 4탭 · Active Queue 컬럼 · Drawer 8섹션
4. Capability 배너 ("0건" vs "분석 제외" 구분)
5. 초기화 시 메모리 참조 해제 (§7.4)

완료조건: 33건 xlsx 업로드 결과가 Phase 1과 동일.

### Phase 3 — 관계 네트워크 & Showcase

1. Relationship Network (§23, 확정 금지 고지문)
2. `/showcase` 8 Section — Fixture만, upload import 없음
3. Live Demo 진행·KPI 카운트업은 **분석 결과 수치만** (하드코딩 KPI 리터럴 금지)

완료조건: §21.3 수치 일치.

### Phase 4 — 마감

1. Excel Export 신규 Workbook 7시트 (§25)
2. Boundary 자동테스트 전체 + 개인정보 정적 검사
3. 접근성·반응형
4. 빌드·배포

---

## 4. 폴더 구조 (FSD)

PRD §31.5 import 경로(`@/entities/loan/...`, `@/shared/fixtures/...`)와 정합.

```text
/
├── Architecture.md                 # 본 문서
├── docs/
│   ├── PRD_v2.1_Final_기업여신만기관리_AI_Agent.md
│   └── reference/
│       ├── rule_engine_v2_1_reference.py   # Truth (읽기 전용)
│       └── test_b12_year_boundary.py
├── public/
├── src/
│   ├── app/                        # 라우팅·프로바이더·글로벌 스타일
│   │   ├── providers/
│   │   ├── styles/
│   │   └── router.tsx              # /dashboard, /showcase
│   │
│   ├── pages/
│   │   ├── dashboard/              # /dashboard 페이지 조립
│   │   └── showcase/               # /showcase 페이지 조립
│   │
│   ├── widgets/
│   │   ├── kpi-board/              # 상단 KPI + Capability 배너
│   │   ├── active-queue/           # Active Queue 테이블
│   │   ├── analysis-tabs/          # 4탭 셸
│   │   ├── loan-detail-drawer/     # Drawer 8섹션
│   │   ├── relationship-network/   # 관계 그래프
│   │   ├── action-opinion/         # 종합의견 + Action List
│   │   └── showcase-sections/      # S1~S8
│   │
│   ├── features/
│   │   ├── excel-upload/           # 파싱 오케스트레이션·업로드 UI
│   │   ├── analysis-run/           # 기준일·runId·초기화·재분석
│   │   ├── excel-export/           # 신규 Workbook 생성·다운로드
│   │   └── sample-load/            # 샘플/fixture 로드 (dashboard용)
│   │
│   ├── entities/
│   │   └── loan/
│   │       ├── model/              # Part 3 타입, AnalysisRunResult
│   │       ├── lib/
│   │       │   ├── parseRaw.ts
│   │       │   ├── validation/     # V01~V05
│   │       │   ├── rules/          # R01~R08 + registry
│   │       │   ├── schedule.ts     # S01
│   │       │   ├── scoring.ts      # Score / Band / Exception
│   │       │   ├── anniversary.ts  # hasReachedAnniversary (date-fns)
│   │       │   ├── summary.ts
│   │       │   └── runAnalysis.ts  # 단일 진입점
│   │       └── ui/                 # Band/Exception/Remark 배지 등 엔티티 UI
│   │
│   └── shared/
│       ├── ui/                     # 버튼, 탭, 테이블 프리미티브
│       ├── lib/                    # date, mask(PIN), revokeObjectURL
│       ├── config/                 # REQUIRED/OPTIONAL_COLUMNS, 상품코드 맵
│       ├── fixtures/               # fixture_*.json (+ TS re-export)
│       └── types/                  # 공통 유틸 타입(필요 시)
│
├── tests/                          # 또는 entities 옆 *.test.ts (Vitest)
├── package.json
├── vite.config.ts                  # @ alias → src
├── tsconfig.json
└── index.html
```

### 4.1 의존 방향 (위반 금지)

```
app → pages → widgets → features → entities → shared
```

- Showcase 위젯/페이지는 `features/excel-upload`를 **import하지 않는다**.
- Rule 로직은 `entities/loan/lib`에만 둔다. UI가 점수를 재계산하지 않는다.

### 4.2 권장 스택 (PRD 암시)

| 영역 | 선택 |
|---|---|
| 빌드 | Vite + React + TypeScript |
| 날짜 | `date-fns` (`addYears`, `isAfter`, `isEqual`) |
| Excel | SheetJS (Community) — 읽기 / 신규 Workbook 쓰기 |
| 테스트 | Vitest |
| 상태 | React state만 (영속 계층 없음) |
| 라우팅 | React Router (`/dashboard`, `/showcase`) |

---

## 5. 아키텍처

### 5.1 시스템 컨텍스트

```text
┌─────────────────────────────────────────────────────────┐
│  Browser (유일한 런타임)                                  │
│                                                         │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐ │
│  │ Upload   │→  │ Rule Engine  │→  │ Dashboard /     │ │
│  │ Parser   │   │ (TS port of  │   │ Showcase /      │ │
│  │          │   │  Reference)  │   │ Export          │ │
│  └──────────┘   └──────────────┘   └─────────────────┘ │
│        │                │                               │
│        └──── 메모리만 ────┘  외부 전송·영속 저장 없음      │
└─────────────────────────────────────────────────────────┘
         ▲
         │ 개발·검증 시에만 참조 (런타임 미포함)
   rule_engine_v2_1_reference.py + Fixtures
```

### 5.2 분석 파이프라인 (단방향)

```text
File / Fixture JSON
        │
        ▼
  detectCapabilities  →  AnalysisCapabilities
        │
        ▼
  parseRawRows        →  RawLoanRow[] → LoanRecord[]
        │                    (비표시 컬럼 드롭, 문자열 강제)
        ▼
  V01~V05             →  validationIssues, disabledDuplicate
        │
        ▼
  buildRuleContext    →  pin 인덱스, today, capabilities
        │
        ▼
  R02~R08 (전 유효건) + R01 (Active Window만)
        │              remarkKey 병합
        ▼
  S01 + Bucket + Active Window
        │
        ▼
  Score / Band (Active만) + Exception (전체)
        │
        ▼
  RecommendedAction + 종합의견 입력용 summary
        │
        ▼
  AnalysisRunResult  ──► UI / Export / Tests
```

### 5.3 Rule Registry

```text
LoanRule[] = [R01, R02, R03, R04, R05, R06, R07, R08]
  - R05: capabilities.canAnalyzePolicyFund === false 이면 enabled=false 또는 스킵
  - R02~R04: collateral pin 없으면 자연 스킵
  - 동일 remarkKey → relatedLoanIds 병합 (신규 Remark 추가 금지)
```

구현 시 Reference Engine의 판정 분기·점수·Severity를 **포팅**한다.  
PRD Rule Matrix와 Engine이 표현만 다를 경우 **Engine 동작을 Truth로 맞춘다**.

### 5.4 UI 상태 모델

```text
AnalysisSession (React state)
  - referenceDate: Date
  - run: AnalysisRunResult | null
  - sourceFileName: string | null
  - status: idle | parsing | ready | error
  - errorMessage?: string   // §26 고정 문구
```

- 초기화: `run`·workbook·파싱 중간값 전부 제거
- 기준일 변경: 동일 `LoanRecord[]`로 `runAnalysis` 재실행
- Showcase 세션: 별도 트리, dashboard 세션과 상태 공유 금지

### 5.5 Dashboard 정보 구조

```text
/dashboard
  Upload + ReferenceDate
  KPI (4 core + capability-aware badges)
  Tabs:
    1. Active Queue     ← isInActiveWindow, Band 정렬
    2. 분석범위 외       ← OUT_OF_SCOPE (Score/Band = "-")
    3. 데이터 오류       ← validationIssues | disabledDuplicate
    4. 관계 네트워크     ← relatedLoanIds / pin 연결
  Drawer (행 클릭):
    기본 · 일정 · Score breakdown · Remark · 관계 · Action · Warning · 고지문
```

### 5.6 Showcase 격리

```text
/showcase
  → shared/fixtures/fixture_showcase.json 만 로드
  → entities/loan/lib/runAnalysis 실행
  → widgets/showcase-sections S1~S8
  ✗ features/excel-upload 미참조
```

### 5.7 테스트 아키텍처

| 스위트 | 입력 | 기준일 | 대조 |
|---|---|---|---|
| Rule Engine v2.1 | fixture_rule_valid_33 | 2026-08-03 | §21.1 |
| Boundary A | boundary (B12 제외) | 2026-08-03 | §21.2 A |
| Boundary B | B12 only | 2026-11-20 | §21.2 B · test_b12 |
| Policy off | rule_valid_33 | 2026-08-03 · canAnalyzePolicyFund=false | §21.4 |
| Showcase | fixture_showcase | Showcase용 | §21.3 |

개발 중 수치 의 시: TS 결과 vs `rule_engine_v2_1_reference.py` 실행 결과 diff.

### 5.8 비기능

| 항목 | 결정 |
|---|---|
| 보안 | 브라우저 메모리 only, §7 정적 검사 Phase 4 |
| 접근성 | 색+텍스트+아이콘, reduced-motion, WCAG AA |
| 반응형 | 테이블 가로 스크롤 / 모바일 카드 |
| 원본 무결성 | 업로드 파일 읽기만; Export는 신규 파일 |

---

## 6. Sprint 00 완료 체크

| # | 항목 | 상태 |
|---|---|---|
| 1 | 프로젝트 구조 분석 (빈 저장소 → FSD 신규) | 완료 |
| 2 | PRD 분석 (정책·파이프라인·AC 앵커) | 완료 |
| 3 | 구현 순서 (Phase 0~4) | 완료 |
| 4 | 폴더 구조 (FSD) | 완료 |
| 5 | Architecture.md 작성 | 완료 |
| — | 코드 구현 | **하지 않음** |
| — | PRD / Rule / Fixture 수정 | **하지 않음** |

---

## 7. 다음 Sprint 진입 조건

Phase 1 시작 시 첫 작업:

1. Vite+React+TS 스캐폴드 + 본 문서 §4 폴더 생성
2. `docs/` · `shared/fixtures/` · `docs/reference/`에 산출물 복사
3. Part 3 타입 → `runAnalysis` 골격 → §31.5 테스트 red 상태부터 구현

**구현자가 임의로 정책을 해석하지 않는다. 불명확하면 PRD 절 번호 + Reference Engine 실행 결과로 확정한다.**
