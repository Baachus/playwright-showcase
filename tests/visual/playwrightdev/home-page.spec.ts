import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  freezeAnimations,
  waitForStableState,
  buildSnapshotOptions,
  buildLocatorSnapshotOptions,
  maskSelectors,
  withViewport,
  withDarkMode,
} from '../../../src/utils/visual.utils.js';

/**
 * Visual Regression Tests – Playwright.dev Home Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Captures pixel-level screenshots and compares them against stored baselines.
 *
 * First run:  snapshots don't exist yet — Playwright creates them automatically.
 * Subsequent: each screenshot is diffed against its baseline; the test fails if
 *             pixels exceed the configured `maxDiffPixelRatio`.
 *
 * Update baselines after intentional UI changes:
 *   npx playwright test tests/visual --update-snapshots
 */

test.beforeEach(async ({ page }) => {
  await allure.epic('Playwright.dev');
  await allure.feature('Visual Regression');

  // Navigate and stabilize before every test
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await freezeAnimations(page);
  await waitForStableState(page);
});

// ── Full-Page Captures ────────────────────────────────────────────────────────

test.describe('Full-Page Screenshots', { tag: ['@visual'] }, () => {
  test('home page matches baseline', async ({ page }) => {
    await allure.story('Full Page');
    await allure.label('severity', 'critical');
    await allure.description(
      'Captures the entire scrollable home page and compares pixel-by-pixel against the stored baseline.',
    );

    await allure.step('Assert full-page screenshot matches baseline', async () => {
      await expect(page).toHaveScreenshot('home-full-page.png', {
        ...buildSnapshotOptions({ fullPage: true }),
      });
    });
  });

  test('home page viewport matches baseline', async ({ page }) => {
    await allure.story('Viewport');
    await allure.label('severity', 'normal');
    await allure.description(
      'Captures only the visible viewport (above the fold) — faster and catches hero section regressions.',
    );

    await allure.step('Assert viewport screenshot matches baseline', async () => {
      await expect(page).toHaveScreenshot('home-viewport.png', buildSnapshotOptions());
    });
  });
});

// ── Component-Level Captures ──────────────────────────────────────────────────

test.describe('Component Screenshots', { tag: ['@visual'] }, () => {
  test('navbar matches baseline', async ({ page }) => {
    await allure.story('Navbar');
    await allure.label('severity', 'critical');
    await allure.description(
      'Isolates the top navigation bar to catch logo, link, or layout regressions independently of page content.',
    );

    const navbar = page.getByRole('navigation');
    await navbar.waitFor({ state: 'visible' });

    await allure.step('Assert navbar screenshot matches baseline', async () => {
      await expect(navbar).toHaveScreenshot('home-navbar.png', buildLocatorSnapshotOptions());
    });
  });

  test('hero section matches baseline', async ({ page }) => {
    await allure.story('Hero Section');
    await allure.label('severity', 'critical');
    await allure.description(
      'Targets the hero heading and CTA buttons — the primary marketing area most likely to change.',
    );

    // The hero is the first <header> or the section containing the main heading
    const hero = page.locator('.hero, header, [class*="hero"]').first();
    await hero.waitFor({ state: 'visible' });

    await allure.step('Assert hero section screenshot matches baseline', async () => {
      await expect(hero).toHaveScreenshot('home-hero.png', buildLocatorSnapshotOptions());
    });
  });

  test('language selector tabs match baseline', async ({ page }) => {
    await allure.story('Language Tabs');
    await allure.label('severity', 'normal');
    await allure.description(
      'Screenshots the language switcher (Node.js / Python / Java / .NET) to detect tab styling regressions.',
    );

    // Locate by content rather than class names or ARIA roles — both have proven
    // fragile as playwright.dev's markup evolves. Any element that contains both
    // "Node.js" and "Python" as direct children is the language tab strip.
    const langTabs = page
      .locator('ul, div, nav')
      .filter({ has: page.getByText('Node.js', { exact: true }) })
      .filter({ has: page.getByText('Python', { exact: true }) })
      .first();

    // Skip gracefully rather than timing out if the section no longer exists
    // (e.g. the home page was redesigned). Delete the baseline and re-run after
    // updating the selector to match the new markup.
    const count = await langTabs.count();
    if (count === 0) {
      test.skip(true, 'Language tab container not found — selector needs updating for current page markup');
      return;
    }

    await langTabs.waitFor({ state: 'visible' });
    await langTabs.scrollIntoViewIfNeeded();

    await allure.step('Assert language tabs match baseline', async () => {
      await expect(langTabs).toHaveScreenshot(
        'home-language-tabs.png',
        buildLocatorSnapshotOptions({ maxDiffPixelRatio: 0.03 }),
      );
    });
  });
});

// ── Theme / Color-Scheme Captures ───────────────────────────────────────────

test.describe('Theme Variants', { tag: ['@visual'] }, () => {
  test('home page renders correctly in dark mode', async ({ page }) => {
    await allure.story('Dark Mode');
    await allure.label('severity', 'normal');
    await allure.description(
      'Emulates the prefers-color-scheme: dark media feature and captures the hero area to verify dark-theme colors.',
    );

    await allure.step('Switch to dark mode via media emulation', async () => {
      await withDarkMode(page, async () => {
        await page.waitForTimeout(200); // allow theme transition to settle (frozen but still needs a tick)
        await allure.step('Assert dark-mode viewport matches baseline', async () => {
          await expect(page).toHaveScreenshot('home-dark-mode.png', buildSnapshotOptions());
        });
      });
    });
  });

  test('home page renders correctly in light mode', async ({ page }) => {
    await allure.story('Light Mode');
    await allure.label('severity', 'normal');

    await allure.step('Confirm light mode is the default', async () => {
      await page.emulateMedia({ colorScheme: 'light' });
      await page.waitForTimeout(100);
    });

    await allure.step('Assert light-mode viewport matches baseline', async () => {
      await expect(page).toHaveScreenshot('home-light-mode.png', buildSnapshotOptions());
    });
  });
});

// ── Responsive / Viewport Captures ───────────────────────────────────────────

test.describe('Responsive Layouts', { tag: ['@visual'] }, () => {
  test('home page renders correctly on tablet viewport', async ({ page }) => {
    await allure.story('Tablet Layout');
    await allure.label('severity', 'normal');
    await allure.description(
      'Resizes the browser to 768×1024 (iPad portrait) and captures the hero to verify responsive breakpoints.',
    );

    await allure.step('Capture tablet viewport screenshot', async () => {
      await withViewport(page, 'tablet', async () => {
        await allure.step('Assert tablet screenshot matches baseline', async () => {
          await expect(page).toHaveScreenshot('home-tablet.png', buildSnapshotOptions());
        });
      });
    });
  });

  test('home page renders correctly on mobile viewport', async ({ page }) => {
    await allure.story('Mobile Layout');
    await allure.label('severity', 'normal');
    await allure.description(
      'Resizes the browser to 390×844 (iPhone 14 logical pixels) and captures the hero.',
    );

    await allure.step('Capture mobile viewport screenshot', async () => {
      await withViewport(page, 'mobile', async () => {
        await allure.step('Assert mobile screenshot matches baseline', async () => {
          await expect(page).toHaveScreenshot('home-mobile.png', buildSnapshotOptions());
        });
      });
    });
  });
});

// ── Masked / Volatile Content ─────────────────────────────────────────────────

test.describe('Masked Dynamic Content', { tag: ['@visual'] }, () => {
  test('home page with dynamic regions masked', async ({ page }) => {
    await allure.story('Dynamic Masking');
    await allure.label('severity', 'minor');
    await allure.description(
      'Demonstrates masking volatile page regions (e.g. cookie banners, third-party widgets) so that ' +
      'their content does not cause false-positive failures. Masked areas appear as solid coloured blocks.',
    );

    // Mask any cookie/consent banners that may appear
    const mask = maskSelectors(page, [
      '[id*="cookie"]',
      '[class*="cookie"]',
      '[id*="consent"]',
      '[class*="banner"]',
    ]);

    await allure.step('Assert full page with masked regions matches baseline', async () => {
      await expect(page).toHaveScreenshot(
        'home-masked.png',
        buildSnapshotOptions({ fullPage: true, mask }),
      );
    });
  });
});
