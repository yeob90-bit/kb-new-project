#!/usr/bin/env bash
# Vercel Production 배포 (사전: npx vercel login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

npm run build
npx --yes vercel@39.2.6 deploy --prod --yes
