# Visual regression baselines

Playwright stores a separate baseline screenshot per OS, distinguished by the
platform suffix in the filename:

```
docs-page.spec.ts-snapshots/
  docs-navbar-Visual-win32.png   <- generated on Windows
  docs-navbar-Visual-linux.png   <- needed by CI (ubuntu-latest)
```

Font and antialiasing differences between operating systems mean a Windows
screenshot will never byte-match a Linux one, so each platform needs its own
committed baseline. If CI fails the `Visual` project with "A snapshot doesn't
exist" / "writing actual", it's because the `*-linux.png` baselines are
missing.

## Regenerate the Linux baselines (and commit them)

This runs the `Visual` project inside the official Playwright Docker image
pinned to the exact version in `package-lock.json`, so the output matches CI
pixel-for-pixel. Your `*-win32.png` baselines and your local `node_modules`
are left untouched (an anonymous volume shadows `node_modules` so the
container's `npm ci` can't overwrite your Windows install).

```bash
# macOS / Linux / Git Bash
npm run visual:baselines:linux

# Windows PowerShell
npm run visual:baselines:linux:win
```

Then review and commit:

```bash
git add tests/visual/**/*-linux.png
git commit -m "test(visual): add Linux baselines for CI"
```

Requirements: Docker (Docker Desktop on Windows/macOS).

## Updating baselines after an intentional UI change

Same command — it overwrites the Linux baselines. To refresh the Windows ones
for local runs, use `npm run test:visual:update`.
