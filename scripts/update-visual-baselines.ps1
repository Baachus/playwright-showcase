<#
.SYNOPSIS
  Generate Linux visual baselines inside the official Playwright Docker image.

.DESCRIPTION
  CI runs on ubuntu-latest and needs *-linux.png baselines.  On Windows you
  only have *-win32.png locally.  This script produces pixel-exact Linux
  baselines by running the Visual project inside the matching Playwright
  container, writing them back into the repo for you to commit.  Your win32
  baselines and your Windows node_modules are left untouched.

  Requirements: Docker Desktop.
  Usage:        npm run visual:baselines:linux:win
                  (or)  powershell -ExecutionPolicy Bypass -File scripts/update-visual-baselines.ps1
#>
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# Pin the image to the exact installed Playwright version so it matches CI.
$version = (node -p "require('@playwright/test/package.json').version").Trim()
$image   = "mcr.microsoft.com/playwright:v$version-jammy"

Write-Host "[visual-baselines] Playwright $version"
Write-Host "[visual-baselines] image: $image"
Write-Host "[visual-baselines] generating *-linux.png baselines for the Visual project..."

# -v ${PWD}:/work        mount repo so generated PNGs land on the host
# -v /work/node_modules  anonymous volume shadows host node_modules so the
#                        container's `npm ci` does not overwrite your Windows
#                        install with Linux binaries
docker run --rm `
  -v "${PWD}:/work" `
  -v /work/node_modules `
  -w /work `
  -e CI=1 `
  $image `
  bash -lc "npm ci --no-audit --no-fund && npx playwright test --project=Visual --update-snapshots"

Write-Host ""
Write-Host "[visual-baselines] done.  Review and commit the new baselines:"
Write-Host "    git add tests/visual/**/*-linux.png"
Write-Host "    git commit -m 'test(visual): add Linux baselines for CI'"
