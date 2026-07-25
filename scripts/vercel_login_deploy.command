#!/bin/zsh
cd "/Users/yeob/KB_이준엽_여신도우미/기한연장 도우미" || exit 1
echo "=== Vercel Login (GitHub OOB) + Deploy ==="
export VERCEL_TELEMETRY_DISABLED=1
npx --yes vercel@39.2.6 login --github --oob
status=$?
if [ $status -ne 0 ]; then
  echo "Login failed (exit $status)"
  read -k 1 "?Press any key to close…"
  exit $status
fi
npm run deploy:vercel
echo ""
read -k 1 "?Done. Press any key to close…"
