import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import {
  VIEWPORTS,
  buildSnapshotOptions,
  buildLocatorSnapshotOptions,
  maskSelectors,
  maskVolatileRegions,
  type ViewportName,
  type SnapshotOptions,
} from '../../src/utils/visual.utils.js';

/**
 * Unit tests for visual.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure-logic helpers (buildSnapshotOptions, buildLocatorSnapshotOptions,
 * VIEWPORTS constant) are tested with no browser. Mask builders use a
 * lightweight Page mock that captures locator() calls.
 */

// ── Minimal Page mock ─────────────────────────────────────────────────────────

function createPageMock(): Page {
  return {
    locator: (selector: string) => ({ selector } as unknown as Locator),
  } as unknown as Page;
}

// ── VIEWPORTS constant ────────────────────────────────────────────────────────

test.describe('visual.utils › VIEWPORTS', () => {

  test('has entries for desktop, laptop, tablet, and mobile', () => {
    const names: ViewportName[] = ['desktop', 'laptop', 'tablet', 'mobile'];
    for (const name of names) {
      expect(VIEWPORTS).toHaveProperty(name);
    }
  });

  test('desktop is wider than laptop', () => {
    expect(VIEWPORTS.desktop.width).toBeGreaterThan(VIEWPORTS.laptop.width);
  });

  test('laptop is wider than tablet', () => {
    expect(VIEWPORTS.laptop.width).toBeGreaterThan(VIEWPORTS.tablet.width);
  });

  test('tablet is wider than mobile', () => {
    expect(VIEWPORTS.tablet.width).toBeGreaterThan(VIEWPORTS.mobile.width);
  });

  test('every viewport has positive width and height', () => {
    for (const [, vp] of Object.entries(VIEWPORTS)) {
      expect(vp.width).toBeGreaterThan(0);
      expect(vp.height).toBeGreaterThan(0);
    }
  });

  test('desktop viewport is 1280 × 720', () => {
    expect(VIEWPORTS.desktop).toEqual({ width: 1280, height: 720 });
  });

  test('mobile viewport is 390 × 844', () => {
    expect(VIEWPORTS.mobile).toEqual({ width: 390, height: 844 });
  });
});

// ── buildSnapshotOptions ──────────────────────────────────────────────────────

test.describe('visual.utils › buildSnapshotOptions', () => {

  test('returns sensible defaults when called with no arguments', () => {
    const opts = buildSnapshotOptions();
    expect(opts.fullPage).toBe(false);
    expect(opts.mask).toEqual([]);
    expect(opts.maxDiffPixelRatio).toBe(0.02);
    expect(opts.omitBackground).toBe(false);
  });

  test('overrides fullPage when provided', () => {
    const opts = buildSnapshotOptions({ fullPage: true });
    expect(opts.fullPage).toBe(true);
  });

  test('overrides maxDiffPixelRatio when provided', () => {
    const opts = buildSnapshotOptions({ maxDiffPixelRatio: 0.05 });
    expect(opts.maxDiffPixelRatio).toBe(0.05);
  });

  test('overrides omitBackground when provided', () => {
    const opts = buildSnapshotOptions({ omitBackground: true });
    expect(opts.omitBackground).toBe(true);
  });

  test('passes through a mask array unchanged', () => {
    const page = createPageMock();
    const mask = [page.locator('.ad'), page.locator('.avatar')];
    const opts = buildSnapshotOptions({ mask });
    expect(opts.mask).toBe(mask);
    expect(opts.mask!.length).toBe(2);
  });

  test('includes clip when provided', () => {
    const clip = { x: 10, y: 20, width: 300, height: 150 };
    const opts = buildSnapshotOptions({ clip });
    expect(opts.clip).toEqual(clip);
  });

  test('does not include clip key when not provided', () => {
    const opts = buildSnapshotOptions();
    expect(opts).not.toHaveProperty('clip');
  });

  test('maxDiffPixelRatio of 0 is valid (zero tolerance)', () => {
    const opts = buildSnapshotOptions({ maxDiffPixelRatio: 0 });
    expect(opts.maxDiffPixelRatio).toBe(0);
  });

  test('accepts all options simultaneously', () => {
    const opts: SnapshotOptions = {
      fullPage:           true,
      maxDiffPixelRatio:  0.01,
      omitBackground:     true,
      clip:               { x: 0, y: 0, width: 100, height: 100 },
    };
    const result = buildSnapshotOptions(opts);
    expect(result.fullPage).toBe(true);
    expect(result.maxDiffPixelRatio).toBe(0.01);
    expect(result.omitBackground).toBe(true);
    expect(result.clip).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });
});

// ── buildLocatorSnapshotOptions ───────────────────────────────────────────────

test.describe('visual.utils › buildLocatorSnapshotOptions', () => {

  test('returns sensible defaults when called with no arguments', () => {
    const opts = buildLocatorSnapshotOptions();
    expect(opts.mask).toEqual([]);
    expect(opts.maxDiffPixelRatio).toBe(0.02);
    expect(opts.omitBackground).toBe(false);
  });

  test('overrides maxDiffPixelRatio when provided', () => {
    const opts = buildLocatorSnapshotOptions({ maxDiffPixelRatio: 0.01 });
    expect(opts.maxDiffPixelRatio).toBe(0.01);
  });

  test('overrides omitBackground when provided', () => {
    const opts = buildLocatorSnapshotOptions({ omitBackground: true });
    expect(opts.omitBackground).toBe(true);
  });

  test('passes through a mask array unchanged', () => {
    const page = createPageMock();
    const mask = [page.locator('.dynamic')];
    const opts = buildLocatorSnapshotOptions({ mask });
    expect(opts.mask).toBe(mask);
  });

  test('does not have fullPage property (element snapshots cannot be full-page)', () => {
    const opts = buildLocatorSnapshotOptions();
    expect(opts).not.toHaveProperty('fullPage');
  });
});

// ── maskSelectors ─────────────────────────────────────────────────────────────

test.describe('visual.utils › maskSelectors', () => {

  test('returns an array with the same length as selectors input', () => {
    const page = createPageMock();
    const result = maskSelectors(page, ['.a', '.b', '.c']);
    expect(result).toHaveLength(3);
  });

  test('returns an empty array for an empty selectors list', () => {
    const page = createPageMock();
    expect(maskSelectors(page, [])).toEqual([]);
  });

  test('each returned item is a Locator (duck-type check via selector property)', () => {
    const page = createPageMock();
    const result = maskSelectors(page, ['.foo']);
    // Our mock returns objects with a `selector` field set by page.locator()
    expect((result[0] as unknown as { selector: string }).selector).toBe('.foo');
  });

  test('preserves selector order', () => {
    const page = createPageMock();
    const selectors = ['[data-testid="avatar"]', '.timestamp', '#cookie-banner'];
    const result = maskSelectors(page, selectors);
    for (let i = 0; i < selectors.length; i++) {
      expect((result[i] as unknown as { selector: string }).selector).toBe(selectors[i]);
    }
  });
});

// ── maskVolatileRegions ───────────────────────────────────────────────────────

test.describe('visual.utils › maskVolatileRegions', () => {

  test('returns a non-empty array of locators by default', () => {
    const page = createPageMock();
    const result = maskVolatileRegions(page);
    expect(result.length).toBeGreaterThan(0);
  });

  test('returned count increases when extra selectors are provided', () => {
    const page = createPageMock();
    const base   = maskVolatileRegions(page).length;
    const extra  = maskVolatileRegions(page, ['.extra-1', '.extra-2']).length;
    expect(extra).toBe(base + 2);
  });

  test('includes cookie-related selectors in the defaults', () => {
    const page = createPageMock();
    const selectors = maskVolatileRegions(page).map(
      (l) => (l as unknown as { selector: string }).selector
    );
    // At least one default should target cookie/consent banners
    const hasCookieSelector = selectors.some(
      (s) => s.includes('cookie') || s.includes('consent')
    );
    expect(hasCookieSelector).toBe(true);
  });

  test('appends extra selectors after the defaults', () => {
    const page = createPageMock();
    const extra = ['.my-custom-dynamic'];
    const result = maskVolatileRegions(page, extra);
    const last = (result[result.length - 1] as unknown as { selector: string }).selector;
    expect(last).toBe('.my-custom-dynamic');
  });
});
