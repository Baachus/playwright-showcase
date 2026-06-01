#!/usr/bin/env bash
#
# Generate Linux visual baselines inside the official Playwright Docker image.
# ---------------------------------------------------------------------------
# CI runs on ubuntu-latest, so it needs *-linux.png baselines.  Windows
# developers only have *-win32.png locally.  This script produces pixel-exact
# Linux baselines by running the Visual project inside the same container
# image CI effectively uses, then writes them back into the repo for you to
# commit.  The win32 baselines are left untouched (both platforms coexist).
#
# Requirements: Docker.
# Usage:        npm run visual:baselines:linux      (or: bash scripts/update-visual-baselines.sh)
#
set -euo pipefail
cd "$(dirname "$0")/.."

# Pin the image to the exact installed Playwright version so it matches CI.
VERSION="$(node -p "require('@playwright/test/package.json').version")"
IMAGE="mcr.microsoft.com/playwright:v${VERSION}-jammy"

echo "[visual-baselines] Playwright ${VERSION}"
echo "[visual-baselines] image: ${IMAGE}"
echo "[visual-baselines] generating *-linux.png baselines for the Visual project..."

# Notes:
#  -v "$PWD":/work            mount the repo so generated PNGs land on the host
#  -v /work/node_modules      anonymous volume shadows the host (Windows)
#                             node_modules so the container's `npm ci` does NOT
#                             overwrite it with Linux binaries
docker run --rm \
  -v "$PWD":/work \
  -v /work/node_modules \
  -w /work \
  -e CI=1 \
  "${IMAGE}" \
  bash -lc "npm ci --no-audit --no-fund && npx playwright test --project=Visual --update-snapshots"

echo
echo "[visual-baselines] done.  Review and commit the new baselines:"
echo "    git add tests/visual/**/*-linux.png"
echo "    git commit -m 'test(visual): add Linux baselines for CI'"
