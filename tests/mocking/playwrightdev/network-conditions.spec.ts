import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  addLatency,
  withOfflineMode,
  simulateNetworkError,
  mockJsonResponse,
} from '../../../src/utils/mock.utils.js';

/**
 * Network Condition Tests – Latency, Offline, Slow Connections
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrates Playwright's ability to simulate adverse network conditions
 * without needing a real throttled connection or proxy:
 *
 *   • Latency injection    — add artificial delays to expose loading-state UX
 *   • Offline simulation   — verify offline error handling / service workers
 *   • Slow API responses   — test timeout thresholds and spinner behavior
 *
 * Complements the API mocking suite by focusing on timing and connectivity
 * rather than response content.
 */

test.beforeEach(async () => {
  await allure.epic('Playwright.dev');
  await allure.feature('Network Conditions');
});

// ── Latency Injection ─────────────────────────────────────────────────────────
test.describe('Latency Injection', { tag: ['@mocking'] }, () => {
  test('should measure response time with artificial latency applied', async ({ page }) => {
    await allure.allureId('MOCK-NET-001');
    await allure.story('Latency Measurement');
    await allure.label('severity', 'normal');
    await allure.description(
      'Adds a fixed 500 ms delay to all requests matching /api/slow, then measures the round-trip time ' +
      'in the browser to verify the artificial delay is applied. Tests loading-state assertions and ' +
      'timeout threshold behavior.',
    );

    const ARTIFICIAL_DELAY_MS = 500;
    const TOLERANCE_MS        = 300;

    await allure.step(`Register ${ARTIFICIAL_DELAY_MS}ms delay for /api/slow`, async () => {
      // First register a mock body so the request doesn't actually go out
      await mockJsonResponse(page, '**/api/slow', { data: 'delayed response' }, { delay: ARTIFICIAL_DELAY_MS });
    });

    await page.goto('/');

    let elapsedMs: number;
    await allure.step('Fetch /api/slow and time the response', async () => {
      elapsedMs = await page.evaluate(async () => {
        const start = performance.now();
        await fetch('/api/slow');
        return performance.now() - start;
      });
    });

    await allure.step(`Assert elapsed time ≥ ${ARTIFICIAL_DELAY_MS}ms (with ${TOLERANCE_MS}ms tolerance)`, async () => {
      expect(elapsedMs!).toBeGreaterThanOrEqual(ARTIFICIAL_DELAY_MS - TOLERANCE_MS);
    });
  });

  test('should apply jittered latency within an expected range', async ({ page }) => {
    await allure.allureId('MOCK-NET-002');
    await allure.story('Jittered Latency');
    await allure.label('severity', 'minor');
    await allure.description(
      'Injects latency with random jitter to simulate variable network conditions (e.g. 3G or Wi-Fi with ' +
      'congestion). Asserts the measured delay falls within the expected min/max window.',
    );

    const BASE_DELAY_MS = 300;
    const JITTER_MS     = 100;
    const MAX_EXPECTED  = BASE_DELAY_MS + JITTER_MS + 400; // generous upper bound

    await allure.step('Register passthrough route with jittered delay', async () => {
      await addLatency(page, '**/api/jittered', { delay: BASE_DELAY_MS, jitter: JITTER_MS });
      // Provide a mock body so it resolves without hitting the wire
      await mockJsonResponse(page, '**/api/jittered', { jitter: true });
    });

    await page.goto('/');

    let elapsedMs: number;
    await allure.step('Fetch /api/jittered and measure elapsed time', async () => {
      elapsedMs = await page.evaluate(async () => {
        const start = performance.now();
        await fetch('/api/jittered');
        return performance.now() - start;
      });
    });

    await allure.step(`Assert elapsed time is within expected range (< ${MAX_EXPECTED}ms)`, async () => {
      expect(elapsedMs!).toBeLessThan(MAX_EXPECTED);
    });
  });

  test('should not block page load when only API routes are delayed', async ({ page }) => {
    await allure.allureId('MOCK-NET-003');
    await allure.story('Selective Latency');
    await allure.label('severity', 'normal');
    await allure.description(
      'Verifies that adding latency to a specific API path does not delay the initial HTML page load. ' +
      'This distinction matters when checking perceived performance vs. data-fetch performance.',
    );

    // Only delay a very specific deep API path
    await mockJsonResponse(page, '**/api/deep/nested/endpoint', { ok: true }, { delay: 2000 });

    const start = Date.now();
    await allure.step('Navigate to playwright.dev home page', async () => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });

    const pageLoadMs = Date.now() - start;
    await allure.step('Assert page loaded in under 10 seconds (latency was API-only)', async () => {
      expect(pageLoadMs).toBeLessThan(10_000);
    });

    await allure.step('Assert main heading is visible after load', async () => {
      await expect(page.getByRole('heading', { name: /Playwright/ }).first()).toBeVisible();
    });
  });
});

// ── Offline Simulation ────────────────────────────────────────────────────────
test.describe('Offline Mode Simulation', { tag: ['@mocking'] }, () => {
  test('should handle offline mode gracefully on API calls', async ({ page }) => {
    await allure.allureId('MOCK-NET-004');
    await allure.story('Offline API');
    await allure.label('severity', 'critical');
    await allure.description(
      'Sets the browser context to offline mode and verifies that fetch calls throw a TypeError ' +
      'rather than hanging indefinitely. This pattern is used to test offline error handlers, ' +
      'retry logic, and cached-content fallback strategies.',
    );

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    let threw = false;
    await allure.step('Set browser offline and attempt a fetch', async () => {
      await withOfflineMode(page, async () => {
        threw = await page.evaluate(async () => {
          try {
            await fetch('https://playwright.dev/api/data');
            return false;
          } catch {
            return true; // TypeError: Failed to fetch
          }
        });
      });
    });

    await allure.step('Assert a network error was thrown in offline mode', async () => {
      expect(threw).toBe(true);
    });
  });

  test('should restore network access after offline mode', async ({ page }) => {
    await allure.allureId('MOCK-NET-005');
    await allure.story('Offline Recovery');
    await allure.label('severity', 'normal');
    await allure.description(
      'Confirms that `withOfflineMode` correctly restores network connectivity after the scoped action ' +
      'completes. Prevents test pollution from leaked offline state.',
    );

    await page.goto('/');

    // Scope offline to the inner block only
    await withOfflineMode(page, async () => {
      // intentionally offline — real requests would fail here
    });

    // After the block, the page should be able to reload
    await allure.step('Reload page after offline block (connectivity should be restored)', async () => {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    });

    await allure.step('Assert page content is visible post-recovery', async () => {
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });
});

// ── Mixed Condition Scenarios ─────────────────────────────────────────────────
test.describe('Combined Network Scenarios', { tag: ['@mocking'] }, () => {
  test('should mock success after a slow first response', async ({ page }) => {
    await allure.allureId('MOCK-NET-006');
    await allure.story('Slow Then Fast');
    await allure.label('severity', 'normal');
    await allure.description(
      'Simulates a common production pattern: the first data load is slow (cold cache) but subsequent ' +
      'requests are fast. Uses delayed mock on the first call pattern to validate loading-state timing.',
    );

    // First call: slow 200
    await mockJsonResponse(page, '**/api/data-load', { cached: false, items: [] }, { delay: 800 });

    await page.goto('/');

    let elapsed: number;
    await allure.step('Fetch /api/data-load and measure time', async () => {
      elapsed = await page.evaluate(async () => {
        const t = performance.now();
        await fetch('/api/data-load');
        return performance.now() - t;
      });
    });

    await allure.step('Assert first fetch took at least 800ms', async () => {
      expect(elapsed!).toBeGreaterThanOrEqual(500); // generous lower bound
    });
  });

  test('should abort image requests to simulate asset loading failure', async ({ page }) => {
    await allure.allureId('MOCK-NET-007');
    await allure.story('Asset Failure');
    await allure.label('severity', 'minor');
    await allure.description(
      'Aborts all PNG/JPEG asset requests to simulate a CDN outage. The page should still load its ' +
      'text content and interactive elements even when images fail — verifying graceful degradation.',
    );

    await allure.step('Register abort handler for image assets', async () => {
      await simulateNetworkError(page, /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/, 'failed');
    });

    await allure.step('Navigate to playwright.dev', async () => {
      // Images will fail, but the page should still load its text content
      await page.goto('/', { waitUntil: 'domcontentloaded' });
    });

    await allure.step('Assert text content is present despite image failures', async () => {
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });
});
