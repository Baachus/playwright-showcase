import fs from 'fs';
import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  runLighthouse,
  printLighthouseResult,
  assertLighthouseScores,
  type LighthouseResult,
} from '../../src/utils/performance.utils.js';

/**
 * Performance Tests – Lighthouse Audits
 */

test.setTimeout(90_000);

const SCORE_THRESHOLDS = {
  performance: 0.8,
  accessibility: 0.9,
  bestPractices: 0.9,
  seo: 0.9,
} as const;

const VITALS_THRESHOLDS = {
  fcp: 1_800,
  lcp: 2_500,
  tbt: 200,
  cls: 0.1,
  ttfb: 800,
} as const;

/** Attach the Lighthouse HTML report and a scores JSON summary into Allure. */
async function attachLighthouseToAllure(result: LighthouseResult): Promise<void> {
  // Attach scores summary as JSON
  await allure.attachment('Lighthouse Scores', JSON.stringify({
    performance: result.scores.performance !== null ? `${Math.round(result.scores.performance * 100)}/100` : 'n/a',
    accessibility: result.scores.accessibility !== null ? `${Math.round(result.scores.accessibility * 100)}/100` : 'n/a',
    bestPractices: result.scores.bestPractices !== null ? `${Math.round(result.scores.bestPractices * 100)}/100` : 'n/a',
    seo: result.scores.seo !== null ? `${Math.round(result.scores.seo * 100)}/100` : 'n/a',
  }, null, 2), { contentType: 'application/json' });

  // Attach Web Vitals as JSON
  await allure.attachment('Web Vitals', JSON.stringify({
    'FCP (ms)': result.vitals.fcp,
    'LCP (ms)': result.vitals.lcp,
    'TBT (ms)': result.vitals.tbt,
    'CLS': result.vitals.cls,
    'Speed Index (ms)': result.vitals.speedIndex,
    'TTI (ms)': result.vitals.tti,
    'TTFB (ms)': result.vitals.ttfb,
  }, null, 2), { contentType: 'application/json' });

  // Attach the full interactive HTML report so it's viewable inside Allure
  if (result.htmlReportPath && fs.existsSync(result.htmlReportPath)) {
    const html = fs.readFileSync(result.htmlReportPath, 'utf-8');
    await allure.attachment('Lighthouse HTML Report', html, { contentType: 'text/html' });
  }
}

// ── Home Page Desktop ────────────────────────────────────────────────────────

test.describe('Lighthouse – Home Page (Desktop)', () => {
  let result: LighthouseResult;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'Performance Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Home Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test.beforeAll(async () => {
    result = await runLighthouse('https://playwright.dev/', {
      formFactor: 'desktop',
      reportSlug: 'home-desktop',
    });
    printLighthouseResult(result);
  });

  test('Performance score should meet threshold',
    { annotation: [{ type: 'story', description: 'Desktop Scores' }, { type: 'severity', description: 'critical' }] },
    async () => {
      await allure.step('Attach Lighthouse results', async () => {
        await attachLighthouseToAllure(result);
      });
      await allure.step(`Assert Performance >= ${SCORE_THRESHOLDS.performance * 100}`, async () => {
        assertLighthouseScores(result, { performance: SCORE_THRESHOLDS.performance });
      });
    });

  test('Accessibility score should meet threshold',
    { annotation: [{ type: 'story', description: 'Desktop Scores' }, { type: 'severity', description: 'critical' }] },
    async () => {
      await allure.step(`Assert Accessibility >= ${SCORE_THRESHOLDS.accessibility * 100}`, async () => {
        assertLighthouseScores(result, { accessibility: SCORE_THRESHOLDS.accessibility });
      });
    });

  test('Best Practices score should meet threshold',
    { annotation: [{ type: 'story', description: 'Desktop Scores' }, { type: 'severity', description: 'normal' }] },
    async () => {
      await allure.step(`Assert Best Practices >= ${SCORE_THRESHOLDS.bestPractices * 100}`, async () => {
        assertLighthouseScores(result, { bestPractices: SCORE_THRESHOLDS.bestPractices });
      });
    });

  test('SEO score should meet threshold',
    { annotation: [{ type: 'story', description: 'Desktop Scores' }, { type: 'severity', description: 'normal' }] },
    async () => {
      await allure.step(`Assert SEO >= ${SCORE_THRESHOLDS.seo * 100}`, async () => {
        assertLighthouseScores(result, { seo: SCORE_THRESHOLDS.seo });
      });
    });

  test('FCP should be within budget',
    { annotation: [{ type: 'story', description: 'Web Vitals' }, { type: 'severity', description: 'normal' }] },
    async () => {
      await allure.step(`Assert FCP < ${VITALS_THRESHOLDS.fcp}ms (actual: ${result.vitals.fcp}ms)`, async () => {
        if (result.vitals.fcp !== null) expect(result.vitals.fcp).toBeLessThan(VITALS_THRESHOLDS.fcp);
      });
    });

  test('LCP should be within budget',
    { annotation: [{ type: 'story', description: 'Web Vitals' }, { type: 'severity', description: 'critical' }] },
    async () => {
      await allure.step(`Assert LCP < ${VITALS_THRESHOLDS.lcp}ms (actual: ${result.vitals.lcp}ms)`, async () => {
        if (result.vitals.lcp !== null) expect(result.vitals.lcp).toBeLessThan(VITALS_THRESHOLDS.lcp);
      });
    });

  test('TBT should be within budget',
    { annotation: [{ type: 'story', description: 'Web Vitals' }, { type: 'severity', description: 'normal' }] },
    async () => {
      await allure.step(`Assert TBT < ${VITALS_THRESHOLDS.tbt}ms (actual: ${result.vitals.tbt}ms)`, async () => {
        if (result.vitals.tbt !== null) expect(result.vitals.tbt).toBeLessThan(VITALS_THRESHOLDS.tbt);
      });
    });

  test('CLS should be within budget',
    { annotation: [{ type: 'story', description: 'Web Vitals' }, { type: 'severity', description: 'critical' }] },
    async () => {
      await allure.step(`Assert CLS < ${VITALS_THRESHOLDS.cls} (actual: ${result.vitals.cls})`, async () => {
        if (result.vitals.cls !== null) expect(result.vitals.cls).toBeLessThan(VITALS_THRESHOLDS.cls);
      });
    });

  test('TTFB should be within budget',
    { annotation: [{ type: 'story', description: 'Web Vitals' }, { type: 'severity', description: 'normal' }] },
    async () => {
      await allure.step(`Assert TTFB < ${VITALS_THRESHOLDS.ttfb}ms (actual: ${result.vitals.ttfb}ms)`, async () => {
        if (result.vitals.ttfb !== null) expect(result.vitals.ttfb).toBeLessThan(VITALS_THRESHOLDS.ttfb);
      });
    });

  test('HTML report should have been saved to disk',
    { annotation: [{ type: 'story', description: 'Report Generation' }, { type: 'severity', description: 'minor' }] },
    async () => {
      await allure.step('Attach full Lighthouse HTML report', async () => {
        await attachLighthouseToAllure(result);
        expect(result.htmlReportPath).not.toBeNull();
        expect(fs.existsSync(result.htmlReportPath!)).toBe(true);
      });
    });
});

// ── Home Page Mobile ─────────────────────────────────────────────────────────

test.describe('Lighthouse – Home Page (Mobile)', () => {
  let result: LighthouseResult;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'Performance Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Home Page Mobile' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test.beforeAll(async () => {
    result = await runLighthouse('https://playwright.dev/', {
      formFactor: 'mobile',
      reportSlug: 'home-mobile',
    });
    printLighthouseResult(result);
  });

  test('Performance score should meet mobile threshold',
    { annotation: [{ type: 'story', description: 'Mobile Scores' }, { type: 'severity', description: 'critical' }] },
    async () => {
      await allure.step('Attach Lighthouse mobile results', async () => {
        await attachLighthouseToAllure(result);
      });
      await allure.step('Assert Performance >= 70 (mobile threshold)', async () => {
        assertLighthouseScores(result, { performance: 0.7 });
      });
    });

  test('Accessibility score should meet threshold on mobile',
    { annotation: [{ type: 'story', description: 'Mobile Scores' }, { type: 'severity', description: 'critical' }] },
    async () => {
      await allure.step(`Assert Accessibility >= ${SCORE_THRESHOLDS.accessibility * 100}`, async () => {
        assertLighthouseScores(result, { accessibility: SCORE_THRESHOLDS.accessibility });
      });
    });

  test('SEO score should meet threshold on mobile',
    { annotation: [{ type: 'story', description: 'Mobile Scores' }, { type: 'severity', description: 'normal' }] },
    async () => {
      await allure.step(`Assert SEO >= ${SCORE_THRESHOLDS.seo * 100}`, async () => {
        assertLighthouseScores(result, { seo: SCORE_THRESHOLDS.seo });
      });
    });
});

// ── Docs Page ────────────────────────────────────────────────────────────────

test.describe('Lighthouse – Docs Page (Desktop)', () => {
  let result: LighthouseResult;

  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'Performance Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Docs Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test.beforeAll(async () => {
    result = await runLighthouse('https://playwright.dev/docs/intro', {
      formFactor: 'desktop',
      reportSlug: 'docs-intro-desktop',
    });
    printLighthouseResult(result);
  });

  test('all category scores should meet thresholds',
    { annotation: [{ type: 'story', description: 'Desktop Scores' }, { type: 'severity', description: 'critical' }] },
    async () => {
      await allure.step('Attach Lighthouse docs page results', async () => {
        await attachLighthouseToAllure(result);
      });
      await allure.step('Assert all category scores meet thresholds', async () => {
        assertLighthouseScores(result, SCORE_THRESHOLDS);
      });
    });

  test('LCP should be within budget',
    { annotation: [{ type: 'story', description: 'Web Vitals' }, { type: 'severity', description: 'critical' }] },
    async () => {
      await allure.step(`Assert LCP < ${VITALS_THRESHOLDS.lcp}ms (actual: ${result.vitals.lcp}ms)`, async () => {
        if (result.vitals.lcp !== null) expect(result.vitals.lcp).toBeLessThan(VITALS_THRESHOLDS.lcp);
      });
    });

  test('CLS should be within budget',
    { annotation: [{ type: 'story', description: 'Web Vitals' }, { type: 'severity', description: 'normal' }] },
    async () => {
      await allure.step(`Assert CLS < ${VITALS_THRESHOLDS.cls} (actual: ${result.vitals.cls})`, async () => {
        if (result.vitals.cls !== null) expect(result.vitals.cls).toBeLessThan(VITALS_THRESHOLDS.cls);
      });
    });
});