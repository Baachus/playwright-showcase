import { test, expect } from '@playwright/test';
import {
  assertLighthouseScores,
  printLighthouseResult,
  type LighthouseResult,
  type LighthouseScores,
} from '../../src/utils/performance.utils.js';

/**
 * Unit tests for performance.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tests cover the pure-logic helpers (assertLighthouseScores, printLighthouseResult)
 * that do not require a browser or Chrome launcher. The runLighthouse() function
 * is exercised in the integration-level performance tests.
 */

// ── Test fixture factory ─────────────────────────────────────────────────────

function makeResult(overrides: Partial<LighthouseResult> = {}): LighthouseResult {
  return {
    url: 'https://example.com',
    scores: {
      performance:   0.95,
      accessibility: 0.90,
      bestPractices: 0.88,
      seo:           0.92,
    },
    vitals: {
      fcp:        1200,
      lcp:        2500,
      tbt:        80,
      cls:        0.05,
      speedIndex: 1800,
      tti:        3200,
      ttfb:       220,
    },
    htmlReportPath: null,
    jsonReportPath: null,
    timestamp:      new Date().toISOString(),
    ...overrides,
  };
}

function makeScores(overrides: Partial<LighthouseScores> = {}): LighthouseScores {
  return {
    performance:   0.95,
    accessibility: 0.90,
    bestPractices: 0.88,
    seo:           0.92,
    ...overrides,
  };
}

// ── assertLighthouseScores ───────────────────────────────────────────────────

test.describe('performance.utils › assertLighthouseScores', () => {

  test('does not throw when all scores meet their thresholds', () => {
    const result = makeResult();
    expect(() =>
      assertLighthouseScores(result, { performance: 0.9, accessibility: 0.85, seo: 0.9 })
    ).not.toThrow();
  });

  test('does not throw with an empty thresholds object', () => {
    const result = makeResult();
    expect(() => assertLighthouseScores(result, {})).not.toThrow();
  });

  test('does not throw when score exactly equals the threshold', () => {
    const result = makeResult({ scores: makeScores({ performance: 0.9 }) });
    expect(() => assertLighthouseScores(result, { performance: 0.9 })).not.toThrow();
  });

  test('throws when a single score is below its threshold', () => {
    const result = makeResult({ scores: makeScores({ performance: 0.75 }) });
    expect(() => assertLighthouseScores(result, { performance: 0.9 }))
      .toThrow(/performance.*75\/100.*required >= 90\/100/i);
  });

  test('error message includes rounded integer scores, not raw floats', () => {
    const result = makeResult({ scores: makeScores({ seo: 0.723 }) });
    let errorMsg = '';
    try {
      assertLighthouseScores(result, { seo: 0.9 });
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    // Scores should be shown as integers (72, 90), not raw floats (0.723, 0.9)
    expect(errorMsg).toContain('72/100');
    expect(errorMsg).toContain('90/100');
  });

  test('throws when a score is null (category was not audited)', () => {
    const result = makeResult({ scores: makeScores({ performance: null }) });
    expect(() => assertLighthouseScores(result, { performance: 0.8 }))
      .toThrow(/not available/i);
  });

  test('throws once for each failing category', () => {
    const result = makeResult({
      scores: makeScores({ performance: 0.5, accessibility: 0.5 }),
    });
    let errorMsg = '';
    try {
      assertLighthouseScores(result, { performance: 0.9, accessibility: 0.9 });
    } catch (e) {
      errorMsg = (e as Error).message;
    }
    expect(errorMsg).toContain('performance');
    expect(errorMsg).toContain('accessibility');
  });

  test('passes for the specific category even if another category fails', () => {
    // Only checking 'seo' — 'performance' being low should not matter
    const result = makeResult({ scores: makeScores({ performance: 0.1, seo: 0.95 }) });
    expect(() => assertLighthouseScores(result, { seo: 0.9 })).not.toThrow();
  });

  test('passes when score is null but that category is not in the thresholds', () => {
    const result = makeResult({ scores: makeScores({ bestPractices: null }) });
    // We're NOT asserting on bestPractices, so null score should be fine
    expect(() => assertLighthouseScores(result, { performance: 0.9 })).not.toThrow();
  });
});

// ── printLighthouseResult ────────────────────────────────────────────────────

test.describe('performance.utils › printLighthouseResult', () => {

  test('does not throw for a fully-populated result', () => {
    const result = makeResult();
    expect(() => printLighthouseResult(result)).not.toThrow();
  });

  test('does not throw when all scores are null', () => {
    const result = makeResult({
      scores: { performance: null, accessibility: null, bestPractices: null, seo: null },
    });
    expect(() => printLighthouseResult(result)).not.toThrow();
  });

  test('does not throw when all vitals are null', () => {
    const result = makeResult({
      vitals: { fcp: null, lcp: null, tbt: null, cls: null, speedIndex: null, tti: null, ttfb: null },
    });
    expect(() => printLighthouseResult(result)).not.toThrow();
  });

  test('does not throw when report paths are null', () => {
    const result = makeResult({ htmlReportPath: null, jsonReportPath: null });
    expect(() => printLighthouseResult(result)).not.toThrow();
  });

  test('does not throw when report paths are actual strings', () => {
    const result = makeResult({
      htmlReportPath: 'reports/lighthouse/example.html',
      jsonReportPath: 'reports/lighthouse/example.json',
    });
    expect(() => printLighthouseResult(result)).not.toThrow();
  });

  test('does not throw with a long URL (truncation path)', () => {
    const result = makeResult({
      url: 'https://example.com/very/long/path/that/exceeds/fifty/characters/easily',
    });
    expect(() => printLighthouseResult(result)).not.toThrow();
  });
});
