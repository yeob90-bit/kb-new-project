#!/bin/zsh
# 로컬 터미널에서 실행: Vercel Production 배포
set -euo pipefail
cd "/Users/yeob/KB_이준엽_여신도우미/기한연장 도우미"
export VERCEL_TELEMETRY_DISABLED=1
unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy

PROJECT_NAME="${VERCEL_PROJECT_NAME:-renewal-navigator}"
SCOPE="${VERCEL_ORG_ID:-kbbanker}"

echo "=== Vercel whoami ==="
npx --yes vercel@latest whoami

echo ""
echo "=== 깨진 .vercel 링크 제거 ==="
rm -rf .vercel

echo ""
echo "=== 프로젝트 링크 (team=$SCOPE, name=$PROJECT_NAME) ==="
npx --yes vercel@latest link --yes --scope "$SCOPE" --project "$PROJECT_NAME"

echo ""
echo "=== Production deploy ==="
npx --yes vercel@latest deploy --prod --yes --scope "$SCOPE"

echo ""
echo "Done. Production URL은 위 로그의 https://….vercel.app 입니다."
