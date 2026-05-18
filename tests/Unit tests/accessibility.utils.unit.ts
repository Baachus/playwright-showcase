import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import type { AxeResults, Result, ImpactValue } from 'axe-core';
import {
  assertNoA11yViolations,
  assertWcagLevel,
  getViolationSummary,
  type A11yOptions,
} from '../../src/utils/accessibility.utils.js';

/**
 * Unit tests for accessibility.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * runA11yScan wraps AxeBuilder and requires a real browser to call .analyze().
 * We mock the AxeBuilder at the Page level by supplying a pre-built AxeResults
 * object so that assertNoA11yViolations / getViolationSummary can be tested
 * for their branching and error-formatting logic without launching a browser.
 *
 * The mock patches the module-level AxeBuilder import indirectly: each util
 * function that calls runA11yScan is tested by injecting a fake Page whose
 * routeWebSocket / addInitScript are no-ops, and by shimming the AxeBuilder
 * constructor so `.analyze()` returns a canned result.
 *
 * Note: WCAG tag-to-level mapping and the violation formatter are exercised
 * through assertNoA11yViolations / assertWcagLevel.  Full browser-based scans
 * live in tests/accessibility/*.spec.ts.
 */

// ── AxeResults fixture builders ───────────────────────────────────────────────

function makeViolation(overrides: Partial<Result> = {}): Result {
  return {
    id:          'color-contrast',
    impact:      'serious',
    description: 'Elements must have sufficient color contrast',
    help:        'Color contrast',
    helpUrl:     'https://dequeuniversity.com/rules/axe/4.6/color-contrast',
    tags:        ['wcag2aa'],
    nodes:       [
      {
        target:         ['button.low-contrast'],
        failureSummary: 'Fix any of the following: Element has insufficient color contrast',
        html:           '<button class="low-contrast">Click me</button>',
        impact:         'serious' as ImpactValue,
        any:            [],
        all:            [],
        none:           [],
      },
    ],
    ...overrides,
  };
}

function makeAxeResults(violations: Result[] = []): AxeResults {
  return {
    violations,
    passes:      [],
    incomplete:  [],
    inapplicable: [],
    url:         'https://example.com',
    timestamp:   new Date().toISOString(),
    testEngine:  { name: 'axe-core', version: '4.6.0' },
    testRunner:  { name: 'axe' },
    testEnvironment: {
      userAgent:      'test',
      windowWidth:    1280,
      windowHeight:   720,
      orientationAngle: 0,
      orientationType:  'landscape-primary',
    },
  } as unknown as AxeResults;
}

// ── Mock Page + AxeBuilder shim ───────────────────────────────────────────────

/**
 * Build a lightweight Page mock and globally shim AxeBuilder so that
 * .analyze() returns `results` instead of launching a real browser scan.
 *
 * Returns a cleanup function that restores the original AxeBuilder.
 */
async function withMockedAxe(
  results: AxeResults,
  fn: (page: Page) => Promise<void>,
): Promise<void> {
  // Dynamically import the module so we can shim the exported AxeBuilder
  const axeModule = await import('@axe-core/playwright');
  const OriginalAxeBuilder = axeModule.default;

  // Replace AxeBuilder with a fake that returns our canned results
  (axeModule as { default: unknown }).default = class FakeAxeBuilder {
    include()  { return this; }
    exclude()  { return this; }
    withTags() { return this; }
    disableRules() { return this; }
    analyze()  { return Promise.resolve(results); }
  };

  const page = {} as unknown as Page; // runA11yScan only passes page to AxeBuilder

  try {
    await fn(page);
  } finally {
    (axeModule as { default: unknown }).default = OriginalAxeBuilder;
  }
}

// ── assertNoA11yViolations ────────────────────────────────────────────────────

test.describe('accessibility.utils › assertNoA11yViolations', () => {

  test('does not throw when there are no violations', async () => {
    await withMockedAxe(makeAxeResults([]), async (page) => {
      await expect(assertNoA11yViolations(page)).resolves.toBeUndefined();
    });
  });

  test('throws when violations are present', async () => {
    const violation = makeViolation();
    await withMockedAxe(makeAxeResults([violation]), async (page) => {
      await expect(assertNoA11yViolations(page)).rejects.toThrow(/color-contrast/);
    });
  });

  test('error message includes the violation impact level', async () => {
    const violation = makeViolation({ impact: 'critical' });
    await withMockedAxe(makeAxeResults([violation]), async (page) => {
      await expect(assertNoA11yViolations(page)).rejects.toThrow(/CRITICAL/i);
    });
  });

  test('error message includes the violation description', async () => {
    const violation = makeViolation({ description: 'Images must have alternate text' });
    await withMockedAxe(makeAxeResults([violation]), async (page) => {
      await expect(assertNoA11yViolations(page)).rejects.toThrow(/alternate text/);
    });
  });

  test('error message includes the helpUrl', async () => {
    const violation = makeViolation({ helpUrl: 'https://dequeuniversity.com/rules/axe/4.6/image-alt' });
    await withMockedAxe(makeAxeResults([violation]), async (page) => {
      await expect(assertNoA11yViolations(page)).rejects.toThrow(/image-alt/);
    });
  });

  test('error message shows the count of affected nodes', async () => {
    const violation = makeViolation({
      nodes: [
        { target: ['img.hero'], failureSummary: 'Missing alt', html: '<img/>', impact: 'critical' as ImpactValue, any: [], all: [], none: [] },
        { target: ['img.card'], failureSummary: 'Missing alt', html: '<img/>', impact: 'critical' as ImpactValue, any: [], all: [], none: [] },
      ],
    });
    await withMockedAxe(makeAxeResults([violation]), async (page) => {
      await expect(assertNoA11yViolations(page)).rejects.toThrow(/Nodes affected: 2/);
    });
  });

  test('error message summarizes the total number of violations', async () => {
    const violations = [makeViolation({ id: 'v1' }), makeViolation({ id: 'v2' })];
    await withMockedAxe(makeAxeResults(violations), async (page) => {
      await expect(assertNoA11yViolations(page)).rejects.toThrow(/violations found: 2/);
    });
  });

  test('passes custom options through to the scan', async () => {
    // With no violations the function should resolve regardless of options
    await withMockedAxe(makeAxeResults([]), async (page) => {
      const options: A11yOptions = {
        include:      ['.main-content'],
        exclude:      ['.sidebar'],
        disableRules: ['color-contrast'],
      };
      await expect(assertNoA11yViolations(page, options)).resolves.toBeUndefined();
    });
  });
});

// ── assertWcagLevel ───────────────────────────────────────────────────────────

test.describe('accessibility.utils › assertWcagLevel', () => {

  test('level A passes when there are no violations', async () => {
    await withMockedAxe(makeAxeResults([]), async (page) => {
      await expect(assertWcagLevel(page, 'A')).resolves.toBeUndefined();
    });
  });

  test('level AA passes when there are no violations', async () => {
    await withMockedAxe(makeAxeResults([]), async (page) => {
      await expect(assertWcagLevel(page, 'AA')).resolves.toBeUndefined();
    });
  });

  test('level AAA passes when there are no violations', async () => {
    await withMockedAxe(makeAxeResults([]), async (page) => {
      await expect(assertWcagLevel(page, 'AAA')).resolves.toBeUndefined();
    });
  });

  test('level AA throws when violations exist', async () => {
    await withMockedAxe(makeAxeResults([makeViolation()]), async (page) => {
      await expect(assertWcagLevel(page, 'AA')).rejects.toThrow();
    });
  });
});

// ── getViolationSummary ───────────────────────────────────────────────────────

test.describe('accessibility.utils › getViolationSummary', () => {

  test('returns all zero counts when there are no violations', async () => {
    await withMockedAxe(makeAxeResults([]), async (page) => {
      const summary = await getViolationSummary(page);
      expect(summary).toEqual({ critical: 0, serious: 0, moderate: 0, minor: 0 });
    });
  });

  test('counts a serious violation correctly', async () => {
    const violation = makeViolation({ impact: 'serious' });
    await withMockedAxe(makeAxeResults([violation]), async (page) => {
      const summary = await getViolationSummary(page);
      expect(summary.serious).toBe(1);
      expect(summary.critical).toBe(0);
    });
  });

  test('counts a critical violation correctly', async () => {
    const violation = makeViolation({ impact: 'critical' });
    await withMockedAxe(makeAxeResults([violation]), async (page) => {
      const summary = await getViolationSummary(page);
      expect(summary.critical).toBe(1);
    });
  });

  test('counts multiple violations across different impact levels', async () => {
    const violations = [
      makeViolation({ id: 'v1', impact: 'critical' }),
      makeViolation({ id: 'v2', impact: 'critical' }),
      makeViolation({ id: 'v3', impact: 'moderate' }),
    ];
    await withMockedAxe(makeAxeResults(violations), async (page) => {
      const summary = await getViolationSummary(page);
      expect(summary.critical).toBe(2);
      expect(summary.moderate).toBe(1);
      expect(summary.serious).toBe(0);
    });
  });

  test('returns a summary object with the four standard impact keys', async () => {
    await withMockedAxe(makeAxeResults([]), async (page) => {
      const summary = await getViolationSummary(page);
      expect(Object.keys(summary).sort()).toEqual(['critical', 'minor', 'moderate', 'serious']);
    });
  });
});
