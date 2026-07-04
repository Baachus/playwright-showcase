import { Page, Locator, PageScreenshotOptions, LocatorScreenshotOptions } from '@playwright/test';

/**
 * Visual Regression Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Helpers for screenshot-based visual regression testing using Playwright's
 * built-in `toHaveScreenshot()` assertion. Key concerns:
 *
 *   • Masking   — hide volatile content (timestamps, ads, user avatars) so
 *                 unrelated changes don't break snapshots.
 *   • Animation — freeze CSS transitions/animations before capturing so the
 *                 pixel output is deterministic across runs.
 *   • Viewport  — standardize the browser size per capture to avoid diffs
 *                 caused by responsive layout shifts.
 *
 * Usage in tests:
 *   import { freezeAnimations, buildSnapshotOptions, maskDynamic } from '@utils/visual.utils.js';
 *
 *   await freezeAnimations(page);
 *   const opts = buildSnapshotOptions({ mask: maskDynamic(page, ['[data-testid="timestamp"]']) });
 *   await expect(page).toHaveScreenshot('home.png', opts);
 */

// ── Types ────────────────────────────────────────────────────────────────────
/** Options passed to `buildSnapshotOptions`. */
export interface SnapshotOptions {
  /** Locators to black-box (replaced with a solid rectangle). */
  mask?: Locator[];
  /**
   * Allowed pixel difference ratio (0–1).
   * Defaults: 0.05 (5%) for element/viewport shots, 0.10 (10%) for full-page
   * shots — full-page captures of a live site accumulate far more incidental
   * diff (content reflow, lazy images, sub-pixel text) so they need more slack.
   */
  maxDiffPixelRatio?: number;
  /**
   * Absolute floor on allowed differing pixels, applied alongside the ratio.
   * Whichever budget is larger wins, so small captures aren't tripped by a
   * handful of anti-aliased edge pixels. Defaults: 200 (element) / 1500 (full-page).
   */
  maxDiffPixels?: number;
  /**
   * Per-pixel colour sensitivity (0 = strict, 1 = lax). Higher values ignore
   * minor anti-aliasing/font-hinting differences between environments.
   * Default: 0.25.
   */
  threshold?: number;
  /** Capture the full scrollable page, not just the viewport. */
  fullPage?: boolean;
  /** Clip the screenshot to a bounding box. */
  clip?: { x: number; y: number; width: number; height: number };
  /** Background color for transparent areas. */
  omitBackground?: boolean;
}

/** Standardized viewport presets used in visual tests. */
export const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  laptop:  { width: 1024, height: 768 },
  tablet:  { width: 768,  height: 1024 },
  mobile:  { width: 390,  height: 844 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

// ── Animation Freezing ───────────────────────────────────────────────────────
/**
 * Inject a global `<style>` that sets all CSS animation and transition
 * durations to zero. Call this in `beforeEach` (or at the top of a test)
 * before taking any screenshots.
 *
 * @example
 *   test.beforeEach(async ({ page }) => {
 *     await freezeAnimations(page);
 *   });
 */
export async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration:        0s !important;
        animation-delay:           0s !important;
        transition-duration:       0s !important;
        transition-delay:          0s !important;
        scroll-behavior:           auto !important;
      }
    `,
  });
}

// ── Mask Builders ────────────────────────────────────────────────────────────
/**
 * Build a list of `Locator` masks from CSS selectors. The masked areas are
 * replaced with a solid pink rectangle in screenshots, hiding dynamic content.
 *
 * @param page     - The Playwright `Page` instance.
 * @param selectors - CSS selectors for elements to mask.
 * @returns Array of `Locator` objects suitable for `toHaveScreenshot({ mask })`.
 *
 * @example
 *   const mask = maskSelectors(page, ['[data-dynamic]', '.timestamp']);
 *   await expect(page).toHaveScreenshot('page.png', { mask });
 */
export function maskSelectors(page: Page, selectors: string[]): Locator[] {
  return selectors.map((sel) => page.locator(sel));
}

/**
 * Convenience wrapper: mask common volatile regions found on many sites
 * (cookie banners, analytics iframes, personalized user avatars, etc.).
 *
 * Extend `extraSelectors` for site-specific dynamic regions.
 */
export function maskVolatileRegions(page: Page, extraSelectors: string[] = []): Locator[] {
  const defaults = [
    // Generic cookie/consent banners
    '[id*="cookie"]',
    '[class*="cookie"]',
    '[id*="consent"]',
    '[class*="consent"]',
    // Chat widgets
    '[id*="chat-widget"]',
    // Personalized avatars / user content
    '[data-testid="avatar"]',
    '[aria-label="User avatar"]',
  ];
  return maskSelectors(page, [...defaults, ...extraSelectors]);
}

// ── Snapshot Option Factories ────────────────────────────────────────────────
/**
 * Build a typed options object for `expect(page).toHaveScreenshot()`.
 * Applies sensible defaults while allowing per-call overrides.
 *
 * @example
 *   await expect(page).toHaveScreenshot('hero.png', buildSnapshotOptions({
 *     mask: maskSelectors(page, ['.ad-banner']),
 *     maxDiffPixelRatio: 0.01,
 *   }));
 */
export function buildSnapshotOptions(opts: SnapshotOptions = {}): PageScreenshotOptions & {
  maxDiffPixelRatio?: number;
  maxDiffPixels?: number;
  threshold?: number;
  mask?: Locator[];
} {
  const fullPage = opts.fullPage ?? false;
  return {
    fullPage,
    mask:               opts.mask ?? [],
    // Full-page shots drift more (height reflow, lazy content) → looser budget.
    maxDiffPixelRatio:  opts.maxDiffPixelRatio ?? (fullPage ? 0.10 : 0.05),
    maxDiffPixels:      opts.maxDiffPixels ?? (fullPage ? 1500 : 200),
    threshold:          opts.threshold ?? 0.25,
    omitBackground:     opts.omitBackground ?? false,
    ...(opts.clip ? { clip: opts.clip } : {}),
  };
}

/**
 * Build a typed options object for `expect(locator).toHaveScreenshot()`.
 * Similar to `buildSnapshotOptions` but scoped to a single element.
 */
export function buildLocatorSnapshotOptions(opts: Omit<SnapshotOptions, 'fullPage' | 'clip'> = {}): LocatorScreenshotOptions & {
  maxDiffPixelRatio?: number;
  maxDiffPixels?: number;
  threshold?: number;
  mask?: Locator[];
} {
  return {
    mask:              opts.mask ?? [],
    maxDiffPixelRatio: opts.maxDiffPixelRatio ?? 0.05,
    maxDiffPixels:     opts.maxDiffPixels ?? 200,
    threshold:         opts.threshold ?? 0.25,
    omitBackground:    opts.omitBackground ?? false,
  };
}

// ── Viewport Helpers ─────────────────────────────────────────────────────────
/**
 * Set the page viewport to a named preset, wait for the layout to settle,
 * then restore to the original size after `action` completes.
 *
 * @example
 *   await withViewport(page, 'mobile', async () => {
 *     await expect(page).toHaveScreenshot('home-mobile.png');
 *   });
 */
export async function withViewport(
  page: Page,
  viewport: ViewportName,
  action: () => Promise<void>,
): Promise<void> {
  const original = page.viewportSize();
  await page.setViewportSize(VIEWPORTS[viewport]);
  // Wait for two animation frames so layout/reflow has actually happened,
  // rather than sleeping an arbitrary duration.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  try {
    await action();
  } finally {
    if (original) await page.setViewportSize(original);
  }
}

// ── Theme Helpers ─────────────────────────────────────────────────────────────
/**
 * Force the page into dark mode via the `prefers-color-scheme` media emulation,
 * execute `action`, then restore to light mode.
 *
 * @example
 *   await withDarkMode(page, async () => {
 *     await expect(page).toHaveScreenshot('home-dark.png');
 *   });
 */
export async function withDarkMode(page: Page, action: () => Promise<void>): Promise<void> {
  await page.emulateMedia({ colorScheme: 'dark' });
  try {
    await action();
  } finally {
    await page.emulateMedia({ colorScheme: 'light' });
  }
}

// ── Wait Helpers ─────────────────────────────────────────────────────────────
/**
 * Wait for all images on the page to finish loading before taking a
 * screenshot. Avoids capturing partially-loaded images that would cause
 * false-positive diffs.
 *
 * @example
 *   await waitForImages(page);
 *   await expect(page).toHaveScreenshot('page.png');
 */
export async function waitForImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
    await Promise.all(
      images
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise<void>((resolve) => {
              img.onload  = () => resolve();
              img.onerror = () => resolve(); // Don't block on broken images
            }),
        ),
    );
  });
}

/**
 * Wait for all web fonts to finish loading before capturing a screenshot.
 * Font swap can shift text rendering and cause spurious pixel diffs.
 */
export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

/**
 * Convenience function that waits for images and fonts before taking a
 * screenshot — use when maximum stability is needed.
 *
 * Note: deliberately uses 'load' rather than 'networkidle'. Sites with
 * long-polling/analytics never reach network-idle, which turns this helper
 * into a timeout flake. Images + fonts are what actually affect pixels.
 */
export async function waitForStableState(page: Page): Promise<void> {
  await page.waitForLoadState('load');
  await waitForImages(page);
  await waitForFonts(page);
}
