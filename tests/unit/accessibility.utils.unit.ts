import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  assertNoA11yViolations,
  assertWcagLevel,
  getViolationSummary,
} from '../../src/utils/accessibility.utils.js';

/**
 * Unit tests for accessibility.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * These tests navigate real Playwright pages to minimal in-memory HTML (via
 * data: URIs) and run genuine axe-core scans — no ESM module patching needed.
 *
 * Two page fixtures are used throughout:
 *
 *   CLEAN_PAGE     — a fully-accessible HTML page that should produce zero
 *                    violations at WCAG 2.1 AA level.
 *
 *   VIOLATION_PAGE — an intentionally broken page containing a known set of
 *                    axe-core violations (missing lang, title, and img alt).
 *
 *   SCOPED_PAGE    — a page where only the <aside> has violations; <main> is
 *                    clean, used to verify the `include` / `exclude` options.
 *
 * Note: runA11yScan() is exercised implicitly through every call below.
 * Full end-to-end accessibility tests live in tests/accessibility/.
 */

// ── Shared HTML fixtures ──────────────────────────────────────────────────────
/** Minimal, fully-accessible page — zero WCAG 2.1 AA violations expected. */
const CLEAN_PAGE =
  'data:text/html,' +
  encodeURIComponent(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
      '<head><meta charset="utf-8"><title>Accessible test page</title></head>' +
      '<body><main><h1>All good here</h1></main></body>' +
    '</html>',
  );

/**
 * Intentionally broken page — reliably triggers three WCAG violations:
 *   • html-has-lang  (serious)  — <html> has no lang attribute
 *   • document-title (serious)  — no <title> element
 *   • image-alt      (critical) — <img> has no alt attribute
 */
const VIOLATION_PAGE =
  'data:text/html,' +
  encodeURIComponent(
    '<!DOCTYPE html>' +
    '<html>' +
      '<head><meta charset="utf-8"></head>' +
      '<body><img src="placeholder.png"></body>' +
    '</html>',
  );

/**
 * Page where the violation (<img> with no alt) is isolated inside <aside>.
 * The <main> region is clean, allowing include/exclude scoping tests.
 */
const SCOPED_PAGE =
  'data:text/html,' +
  encodeURIComponent(
    '<!DOCTYPE html>' +
    '<html lang="en">' +
      '<head><meta charset="utf-8"><title>Scoped test page</title></head>' +
      '<body>' +
        '<main id="main"><h1>Clean region</h1></main>' +
        '<aside><img src="broken.png"></aside>' +
      '</body>' +
    '</html>',
  );

// ── assertNoA11yViolations ────────────────────────────────────────────────────
test.describe('accessibility.utils › assertNoA11yViolations', () => {

  test('resolves on a clean, fully-accessible page', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-001');
    await page.goto(CLEAN_PAGE);
    await expect(assertNoA11yViolations(page)).resolves.toBeUndefined();
  });

  test('rejects on a page with accessibility violations', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-002');
    await page.goto(VIOLATION_PAGE);
    await expect(assertNoA11yViolations(page)).rejects.toThrow();
  });

  test('error message includes "violations found" with a count', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-003');
    await page.goto(VIOLATION_PAGE);
    await expect(assertNoA11yViolations(page)).rejects.toThrow(/violations found/i);
  });

  test('error message includes at least one known violation id', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-004');
    await page.goto(VIOLATION_PAGE);
    await expect(assertNoA11yViolations(page)).rejects.toThrow(
      /image-alt|html-has-lang|document-title/i,
    );
  });

  test('error message includes an impact level in uppercase', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-005');
    await page.goto(VIOLATION_PAGE);
    await expect(assertNoA11yViolations(page)).rejects.toThrow(/CRITICAL|SERIOUS|MODERATE|MINOR/);
  });

  test('error message includes a dequeuniversity.com helpUrl', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-006');
    await page.goto(VIOLATION_PAGE);
    await expect(assertNoA11yViolations(page)).rejects.toThrow(/dequeuniversity\.com/);
  });

  test('resolves when scanning only a clean sub-region via include option', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-007');
    await page.goto(SCOPED_PAGE);
    // #main is clean — the broken <img> is in <aside>, outside the scan scope
    await expect(
      assertNoA11yViolations(page, { include: ['#main'] }),
    ).resolves.toBeUndefined();
  });

  test('rejects when scanning only the broken sub-region via include option', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-008');
    await page.goto(SCOPED_PAGE);
    await expect(
      assertNoA11yViolations(page, { include: ['aside'] }),
    ).rejects.toThrow();
  });

  test('resolves after disabling the specific rules that would otherwise fail', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-009');
    await page.goto(VIOLATION_PAGE);
    await expect(
      assertNoA11yViolations(page, {
        disableRules: ['image-alt', 'html-has-lang', 'document-title'],
      }),
    ).resolves.toBeUndefined();
  });
});

// ── assertWcagLevel ───────────────────────────────────────────────────────────
test.describe('accessibility.utils › assertWcagLevel', () => {

  test('level A resolves on a clean page', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-010');
    await page.goto(CLEAN_PAGE);
    await expect(assertWcagLevel(page, 'A')).resolves.toBeUndefined();
  });

  test('level AA resolves on a clean page', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-011');
    await page.goto(CLEAN_PAGE);
    await expect(assertWcagLevel(page, 'AA')).resolves.toBeUndefined();
  });

  test('level AAA resolves on a clean page', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-012');
    await page.goto(CLEAN_PAGE);
    await expect(assertWcagLevel(page, 'AAA')).resolves.toBeUndefined();
  });

  test('level AA rejects on a page with AA violations', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-013');
    await page.goto(VIOLATION_PAGE);
    await expect(assertWcagLevel(page, 'AA')).rejects.toThrow();
  });

  test('level A rejects on a page with level-A violations', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-014');
    await page.goto(VIOLATION_PAGE);
    await expect(assertWcagLevel(page, 'A')).rejects.toThrow();
  });
});

// ── getViolationSummary ───────────────────────────────────────────────────────
test.describe('accessibility.utils › getViolationSummary', () => {

  test('returns all-zero counts on a clean page', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-015');
    await page.goto(CLEAN_PAGE);
    const summary = await getViolationSummary(page);
    expect(summary.critical).toBe(0);
    expect(summary.serious).toBe(0);
    expect(summary.moderate).toBe(0);
    expect(summary.minor).toBe(0);
  });

  test('returns non-zero counts on a page with violations', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-016');
    await page.goto(VIOLATION_PAGE);
    const summary = await getViolationSummary(page);
    const total = Object.values(summary).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });

  test('summary object has exactly the four standard impact keys', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-017');
    await page.goto(CLEAN_PAGE);
    const summary = await getViolationSummary(page);
    expect(Object.keys(summary).sort()).toEqual(['critical', 'minor', 'moderate', 'serious']);
  });

  test('all count values are non-negative integers', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-018');
    await page.goto(VIOLATION_PAGE);
    const summary = await getViolationSummary(page);
    for (const count of Object.values(summary)) {
      expect(count).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(count)).toBe(true);
    }
  });

  test('VIOLATION_PAGE triggers at least one critical or serious violation', async ({ page }) => {
    await allure.allureId('UNIT-A11Y-019');
    await page.goto(VIOLATION_PAGE);
    const summary = await getViolationSummary(page);
    expect(summary.critical + summary.serious).toBeGreaterThan(0);
  });
});
