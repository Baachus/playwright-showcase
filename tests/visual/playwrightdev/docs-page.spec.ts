import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  freezeAnimations,
  waitForStableState,
  buildSnapshotOptions,
  buildLocatorSnapshotOptions,
  withViewport,
  withDarkMode,
} from '../../../src/utils/visual.utils.js';

/**
 * Visual Regression Tests – Playwright.dev Docs Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Focuses on the documentation layout: the sidebar, article content, code
 * blocks, and "On this page" navigation. Any unintended change to typography,
 * spacing, or component rendering will fail these tests.
 *
 * Update baselines after intentional UI changes:
 *   npx playwright test tests/visual --update-snapshots
 */

test.beforeEach(async ({ page }) => {
  await allure.epic('Playwright.dev');
  await allure.feature('Visual Regression – Docs');

  await page.goto('/docs/intro');
  await page.waitForLoadState('domcontentloaded');
  await freezeAnimations(page);
  await waitForStableState(page);
});

// ── Full-Page Captures ────────────────────────────────────────────────────────
test.describe('Full-Page Screenshots', { tag: ['@visual'] }, () => {
  test('docs intro page matches baseline', async ({ page }) => {
    await allure.allureId('VIS-DP-001');
    await allure.story('Full Page');
    await allure.label('severity', 'critical');
    await allure.description(
      'Full scrollable capture of the /docs/intro page. Catches global layout regressions including ' +
      'sidebar, content area, and header simultaneously.',
    );

    await allure.step('Assert full-page screenshot matches baseline', async () => {
      await expect(page).toHaveScreenshot('docs-full-page.png', buildSnapshotOptions({ fullPage: true }));
    });
  });
});

// ── Component-Level Captures ──────────────────────────────────────────────────
test.describe('Component Screenshots', { tag: ['@visual'] }, () => {
  test('sidebar navigation matches baseline', async ({ page }) => {
    await allure.allureId('VIS-DP-002');
    await allure.story('Sidebar');
    await allure.label('severity', 'critical');
    await allure.description(
      'Isolates the left-hand sidebar to catch link ordering, active-item highlighting, or ' +
      'structural changes to the navigation tree independently of article content.',
    );

    // Use the ARIA label selector — consistent with PD_DocsPage.assertSidebarVisible()
    // and immune to class-name churn. The substring match [class*="sidebar"] was
    // timing out because .first() could resolve to a hidden mobile overlay element
    // before the visible desktop nav had painted.
    const sidebar = page.getByRole('navigation', { name: 'Docs sidebar' });
    await sidebar.waitFor({ state: 'visible' });

    await allure.step('Assert sidebar screenshot matches baseline', async () => {
      await expect(sidebar).toHaveScreenshot(
        'docs-sidebar.png',
        buildLocatorSnapshotOptions({ maxDiffPixelRatio: 0.05 }),
      );
    });
  });

  test('article content area matches baseline', async ({ page }) => {
    await allure.allureId('VIS-DP-003');
    await allure.story('Article Content');
    await allure.label('severity', 'critical');
    await allure.description(
      'Captures the main article element to verify that typography, heading hierarchy, and ' +
      'prose styling are consistent across builds.',
    );

    const article = page.locator('article, main, [class*="docPage"], [class*="container"]').first();
    await article.waitFor({ state: 'visible' });

    await allure.step('Assert article content screenshot matches baseline', async () => {
      await expect(article).toHaveScreenshot('docs-article.png', buildLocatorSnapshotOptions());
    });
  });

  test('first code block matches baseline', async ({ page }) => {
    await allure.allureId('VIS-DP-004');
    await allure.story('Code Blocks');
    await allure.label('severity', 'normal');
    await allure.description(
      'Targets the first syntax-highlighted code block to detect regressions in font rendering, ' +
      'color tokens, or line-height for code content.',
    );

    const codeBlock = page.locator('pre, [class*="codeBlock"]').first();
    await codeBlock.waitFor({ state: 'visible' });
    await codeBlock.scrollIntoViewIfNeeded();

    await allure.step('Assert first code block screenshot matches baseline', async () => {
      await expect(codeBlock).toHaveScreenshot('docs-code-block.png', buildLocatorSnapshotOptions());
    });
  });

  test('page navbar matches baseline', async ({ page }) => {
    await allure.allureId('VIS-DP-005');
    await allure.story('Navbar');
    await allure.label('severity', 'normal');

    const navbar = page.getByRole('navigation').first();
    await navbar.waitFor({ state: 'visible' });

    await allure.step('Assert navbar screenshot matches baseline', async () => {
      await expect(navbar).toHaveScreenshot('docs-navbar.png', buildLocatorSnapshotOptions());
    });
  });
});

// ── Section Navigation Captures ───────────────────────────────────────────────
test.describe('Section Page Screenshots', { tag: ['@visual'] }, () => {
  for (const [label, section, snapshotName] of [
    ['Writing Tests page', 'writing-tests',      'docs-writing-tests.png'],
    ['Assertions page',    'test-assertions',     'docs-assertions.png'],
    ['API Testing page',   'api-testing',         'docs-api-testing.png'],
  ] as [string, string, string][]) {
    test(`${label} matches baseline`, async ({ page }) => {
      await allure.allureId('VIS-DP-006');
      await allure.story('Section Navigation');
      await allure.label('severity', 'normal');
      await allure.description(
        `Navigates to /docs/${section} and captures a viewport screenshot to verify that ` +
        `the ${label} layout hasn't regressed.`,
      );

      await allure.step(`Navigate to /docs/${section}`, async () => {
        await page.goto(`/docs/${section}`);
        await page.waitForLoadState('domcontentloaded');
        await freezeAnimations(page);
        await waitForStableState(page);
      });

      await allure.step(`Assert ${label} screenshot matches baseline`, async () => {
        await expect(page).toHaveScreenshot(snapshotName, buildSnapshotOptions());
      });
    });
  }
});

// ── Theme Variants ────────────────────────────────────────────────────────────
test.describe('Theme Variants', { tag: ['@visual'] }, () => {
  test('docs page renders correctly in dark mode', async ({ page }) => {
    await allure.allureId('VIS-DP-007');
    await allure.story('Dark Mode');
    await allure.label('severity', 'normal');

    await allure.step('Emulate dark color scheme', async () => {
      await withDarkMode(page, async () => {
        await page.waitForTimeout(100);
        await allure.step('Assert dark-mode docs viewport matches baseline', async () => {
          await expect(page).toHaveScreenshot('docs-dark-mode.png', buildSnapshotOptions());
        });
      });
    });
  });
});

// ── Responsive Layouts ────────────────────────────────────────────────────────
test.describe('Responsive Layouts', { tag: ['@visual'] }, () => {
  test('docs page sidebar collapses on mobile', async ({ page }) => {
    await allure.allureId('VIS-DP-008');
    await allure.story('Mobile Layout');
    await allure.label('severity', 'normal');
    await allure.description(
      'Resizes to mobile (390×844) to verify the sidebar collapses into a hamburger menu and ' +
      'the content reflows to a single column.',
    );

    await allure.step('Capture mobile viewport screenshot', async () => {
      await withViewport(page, 'mobile', async () => {
        await allure.step('Assert mobile docs screenshot matches baseline', async () => {
          await expect(page).toHaveScreenshot('docs-mobile.png', buildSnapshotOptions());
        });
      });
    });
  });

  test('docs page renders correctly on tablet', async ({ page }) => {
    await allure.allureId('VIS-DP-009');
    await allure.story('Tablet Layout');
    await allure.label('severity', 'normal');

    await allure.step('Capture tablet viewport screenshot', async () => {
      await withViewport(page, 'tablet', async () => {
        await allure.step('Assert tablet docs screenshot matches baseline', async () => {
          await expect(page).toHaveScreenshot('docs-tablet.png', buildSnapshotOptions());
        });
      });
    });
  });
});
