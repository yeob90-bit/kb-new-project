#!/usr/bin/env bash
# 공모전 제출본 zip 생성
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT_DIR="$ROOT/submission"
STAMP="$(date +%Y%m%d)"
NAME="RenewalNavigator_공모전제출본_${STAMP}"
STAGE="$OUT_DIR/$NAME"

rm -rf "$STAGE"
mkdir -p "$STAGE"

npm run qa

mkdir -p "$STAGE/docs/screenshots" "$STAGE/dist" "$STAGE/src" "$STAGE/tests" "$STAGE/scripts"

# 핵심 문서
cp README.md LICENSE Architecture.md vercel.json package.json package-lock.json \
  index.html tsconfig.json vite.config.ts "$STAGE/"
cp -R docs/PRD_v2.1_Final_*.md docs/reference docs/screenshots "$STAGE/docs/" 2>/dev/null || true
cp docs/screenshots/*.png "$STAGE/docs/screenshots/" 2>/dev/null || true
cp -R dist/* "$STAGE/dist/"
cp -R src "$STAGE/"
cp -R tests "$STAGE/"
cp -R scripts "$STAGE/"
cp docs/SUBMISSION.md "$STAGE/" 2>/dev/null || true

# node_modules / .git 제외 zip
(
  cd "$OUT_DIR"
  rm -f "${NAME}.zip"
  zip -r "${NAME}.zip" "$NAME" \
    -x "*/node_modules/*" "*/.git/*" "*/.DS_Store"
)

echo "Created: $OUT_DIR/${NAME}.zip"
du -h "$OUT_DIR/${NAME}.zip"
