import fs from 'fs';
import { test, expect } from '@playwright/test';
import {
  runLighthouse,
  printLighthouseResult,
  assertLighthouseScores,
  type LighthouseResult,
} from '../../src/utils/performance.utils.js';

/**
 * Performance Tests – Lighthouse Audits
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses the Lighthouse Node API to run full audits against playwright.dev.
 * Each test run saves a full interactive HTML report to:
 *   reports/lighthouse/<url-slug>-<timestamp>.html
 *
 * Score thresholds (0–1 scale, e.g. 0.9 = 90/100):
 *
 *   Performance   ≥ 0.8   (80)  – realistic for a public CDN-served docs site
 *   Accessibility ≥ 0.9   (90)  – high bar; the site is well-maintained
 *   Best Practices≥ 0.9   (90)
 *   SEO           ≥ 0.9   (90)
 *
 * Lighthouse runs its own headless Chrome instance separately from Playwright.
 * Tests in this file are scoped to the 'chromium' project only (see config).
 *
 * Because each audit takes 15–30s, these tests have an extended timeout.
 */

// Extend timeout — Lighthouse audits are slow by design
test.setTimeout(90_000);

// Score thresholds – adjust these to match your own application's targets
const SCORE_THRESHOLDS = {
  performance: 0.8,
  accessibility: 0.9,
  bestPractices: 0.9,
  seo: 0.9,
} as const;

// Web Vital thresholds (Google "Good" targets)
const VITALS_THRESHOLDS = {
  fcp: 1_800,     // First Contentful Paint ≤ 1.8s
  lcp: 2_500,     // Largest Contentful Paint ≤ 2.5s
  tbt: 200,       // Total Blocking Time ≤ 200ms
  cls: 0.1,       // Cumulative Layout Shift ≤ 0.1
  ttfb: 800,      // Time to First Byte ≤ 800ms
} as const;

// ── Home Page ────────────────────────────────────────────────────────────────

test.describe('Lighthouse – Home Page (Desktop)', () => {
  let result: LighthouseResult;

  test.beforeAll(async () => {
    result = await runLighthouse('https://playwright.dev/', {
      formFactor: 'desktop',
      reportSlug: 'home-desktop',
    });
    printLighthouseResult(result);
  });

  test('Performance score should meet threshold', () => {
    assertLighthouseScores(result, { performance: SCORE_THRESHOLDS.performance });
  });

  test('Accessibility score should meet threshold', () => {
    assertLighthouseScores(result, { accessibility: SCORE_THRESHOLDS.accessibility });
  });

  test('Best Practices score should meet threshold', () => {
    assertLighthouseScores(result, { bestPractices: SCORE_THRESHOLDS.bestPractices });
  });

  test('SEO score should meet threshold', () => {
    assertLighthouseScores(result, { seo: SCORE_THRESHOLDS.seo });
  });

  test('all category scores should meet thresholds in one assertion', () => {
    assertLighthouseScores(result, SCORE_THRESHOLDS);
  });

  test('FCP should be within budget', () => {
    if (result.vitals.fcp !== null) {
      expect(result.vitals.fcp).toBeLessThan(VITALS_THRESHOLDS.fcp);
    }
  });

  test('LCP should be within budget', () => {
    if (result.vitals.lcp !== null) {
      expect(result.vitals.lcp).toBeLessThan(VITALS_THRESHOLDS.lcp);
    }
  });

  test('TBT should be within budget', () => {
    if (result.vitals.tbt !== null) {
      expect(result.vitals.tbt).toBeLessThan(VITALS_THRESHOLDS.tbt);
    }
  });

  test('CLS should be within budget', () => {
    if (result.vitals.cls !== null) {
      expect(result.vitals.cls).toBeLessThan(VITALS_THRESHOLDS.cls);
    }
  });

  test('TTFB should be within budget', () => {
    if (result.vitals.ttfb !== null) {
      expect(result.vitals.ttfb).toBeLessThan(VITALS_THRESHOLDS.ttfb);
    }
  });

  test('HTML report should have been saved', () => {
    expect(result.htmlReportPath).not.toBeNull();
    expect(fs.existsSync(result.htmlReportPath!)).toBe(true);
  });
});

// ── Home Page Mobile ─────────────────────────────────────────────────────────

test.describe('Lighthouse – Home Page (Mobile)', () => {
  let result: LighthouseResult;

  test.beforeAll(async () => {
    result = await runLighthouse('https://playwright.dev/', {
      formFactor: 'mobile',
      reportSlug: 'home-mobile',
    });
    printLighthouseResult(result);
  });

  test('Performance score should meet mobile threshold', () => {
    // Mobile scores are typically 10–20 points lower due to throttling simulation
    assertLighthouseScores(result, { performance: 0.7 });
  });

  test('Accessibility score should meet threshold on mobile', () => {
    assertLighthouseScores(result, { accessibility: SCORE_THRESHOLDS.accessibility });
  });

  test('SEO score should meet threshold on mobile', () => {
    assertLighthouseScores(result, { seo: SCORE_THRESHOLDS.seo });
  });

  test('HTML report should have been saved', () => {
    expect(result.htmlReportPath).not.toBeNull();
    expect(fs.existsSync(result.htmlReportPath!)).toBe(true);
  });
});

// ── Docs Page ────────────────────────────────────────────────────────────────

test.describe('Lighthouse – Docs Page (Desktop)', () => {
  let result: LighthouseResult;

  test.beforeAll(async () => {
    result = await runLighthouse('https://playwright.dev/docs/intro', {
      formFactor: 'desktop',
      reportSlug: 'docs-intro-desktop',
    });
    printLighthouseResult(result);
  });

  test('all category scores should meet thresholds', () => {
    assertLighthouseScores(result, SCORE_THRESHOLDS);
  });

  test('LCP should be within budget', () => {
    if (result.vitals.lcp !== null) {
      expect(result.vitals.lcp).toBeLessThan(VITALS_THRESHOLDS.lcp);
    }
  });

  test('CLS should be within budget', () => {
    if (result.vitals.cls !== null) {
      expect(result.vitals.cls).toBeLessThan(VITALS_THRESHOLDS.cls);
    }
  });

  test('HTML report should have been saved', () => {
    expect(result.htmlReportPath).not.toBeNull();
    expect(fs.existsSync(result.htmlReportPath!)).toBe(true);
  });
});