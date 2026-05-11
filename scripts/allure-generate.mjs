/**
 * allure-generate.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Cross-platform replacement for: allure generate allure-results --clean
 *
 * What it does:
 *   1. Copies history/ from the PREVIOUS report (allure-report/history)
 *      into allure-results/history so Allure picks it up for Trend charts
 *   2. Runs allure generate to build the fresh report
 *   3. The new report now contains an updated history/ ready for the next run
 *
 * Why a script instead of shell commands?
 *   Windows has no cp/mv — a .mjs script works identically on Win/Mac/Linux.
 *
 * Usage:  node scripts/allure-generate.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const RESULTS_DIR = path.join(ROOT, 'allure-results');
const REPORT_DIR = path.join(ROOT, 'allure-report');
const PREV_HISTORY_DIR = path.join(REPORT_DIR, 'history');
const NEXT_HISTORY_DIR = path.join(RESULTS_DIR, 'history');

// ── Step 1: Copy previous history into results so Allure sees it ─────────────
if (fs.existsSync(PREV_HISTORY_DIR)) {
  console.log('📋 Copying history from previous report into allure-results...');
  copyDirSync(PREV_HISTORY_DIR, NEXT_HISTORY_DIR);
  console.log('   ✅ History copied.');
} else {
  console.log('ℹ️  No previous history found — this will be run #1 on the Trend chart.');
}

// ── Step 2: Generate the Allure report ───────────────────────────────────────
console.log('\n🔨 Generating Allure report...');
try {
  execSync('npx allure generate allure-results --clean -o allure-report', {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch {
  console.error('❌ allure generate failed.');
  process.exit(1);
}

console.log('\n✅ Report ready at allure-report/');
console.log('   Run: npm run allure:open\n');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Recursively copy a directory (Node 16+ compatible, no external deps).
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
