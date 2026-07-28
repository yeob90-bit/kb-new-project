# 공모전 제출 안내 — Renewal Navigator

| 항목 | 내용 |
|---|---|
| 작품명 | Renewal Navigator (기한연장 도우미) |
| 한 줄 | 기업여신 만기관리 의사결정 지원 AI Agent (브라우저 단독) |
| 버전 | 1.0.0 |
| 라이선스 | MIT (`LICENSE`) |
| 검증 | Reference Engine 전수 패리티 차이 0 · `npm run qa` PASS |
| GitHub | https://github.com/yeob90-bit/kb-new-project |
| Live Demo | **https://renewal-navigator.vercel.app** |

---

## 데모 URL (Vercel)

| 용도 | URL |
|---|---|
| Production | https://renewal-navigator.vercel.app |
| Dashboard | https://renewal-navigator.vercel.app/dashboard |
| Showcase (3분 시연) | https://renewal-navigator.vercel.app/showcase |

재배포:

```bash
bash scripts/run_vercel_deploy.sh
```

---

## 로컬 시연 (심사위원)

```bash
npm install
npm run build
npm run preview   # http://127.0.0.1:4173
```

| 경로 | 시연 |
|---|---|
| `/showcase` | **3분 공모전 스토리** — 「가상 만기리스트 분석 시작」 |
| `/dashboard` | 「샘플 데이터로 시작」 → KPI Active 27 / P1 2 / Remark 16 |

---

## 스크린샷

| 파일 | 화면 |
|---|---|
| `docs/screenshots/01-dashboard-kpi.png` | Dashboard KPI + Active Queue |
| `docs/screenshots/02-relationship-network.png` | 관계 네트워크 |
| `docs/screenshots/03-loan-drawer.png` | 계좌 Drawer (Score·Remark) |
| `docs/screenshots/04-showcase-demo.png` | Showcase Live Demo + Command Board |

---

## 제출물 체크리스트

- [x] 최종 Build (`dist/`)
- [x] README / LICENSE / Architecture / PRD / Reference Engine
- [x] ScreenShot 4종
- [x] Acceptance + Reference 패리티 (74 tests)
- [x] `vercel.json` (SPA rewrite)
- [x] Vercel Production URL — https://renewal-navigator.vercel.app
- [x] GitHub — https://github.com/yeob90-bit/kb-new-project

제출 zip: `npm run pack:submission` → `submission/RenewalNavigator_공모전제출본_YYYYMMDD.zip`
