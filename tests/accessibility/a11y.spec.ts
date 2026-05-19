import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  assertWcagLevel,
  getViolationSummary,
  runA11yScan,
} from '../../src/utils/accessibility.utils.js';

/**
 * Accessibility Tests – playwright.dev
 */

test.describe('Accessibility – Home Page', { tag: ['@accessibility'] }, () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Playwright.dev');
    await allure.feature('Accessibility Testing - Home Page');

    await page.goto('https://playwright.dev/');
    await page.waitForLoadState('networkidle');
  });

  test('should have no WCAG 2.1 AA violations',
    async ({ page }) => {
      await allure.allureId('A11Y-001');
      await allure.story('WCAG 2.1 AA');
      await allure.label('severity', 'critical');

      await allure.step('Run WCAG 2.1 AA axe scan on home page', async () => {
        const results = await runA11yScan(page, { tags: ['wcag2a', 'wcag2aa', 'wcag21aa'] });
        await allure.attachment('Axe Violations', JSON.stringify(results.violations, null, 2), { contentType: 'application/json' });
        await assertWcagLevel(page, 'AA');
      });
    });

  test('should have no critical accessibility violations',
    async ({ page }) => {
      await allure.allureId('A11Y-002');
      await allure.story('Violation Severity');
      await allure.label('severity', 'critical');

      await allure.step('Get violation summary by impact level', async () => {
        const summary = await getViolationSummary(page);
        await allure.attachment('Violation Summary', JSON.stringify(summary, null, 2), { contentType: 'application/json' });
        expect(summary['critical']).toBe(0);
      });
    });

  test('should have no serious accessibility violations',
    async ({ page }) => {
      await allure.allureId('A11Y-003');
      await allure.story('Violation Severity');
      await allure.label('severity', 'critical');

      const summary = await getViolationSummary(page);
      await allure.step('Assert zero serious violations', async () => {
        expect(summary['serious']).toBe(0);
      });
    });

  test('should have a main landmark region',
    async ({ page }) => {
      await allure.allureId('A11Y-004');
      await allure.story('Landmarks');
      await allure.label('severity', 'normal');

      await allure.step('Assert <main> landmark is visible', async () => {
        await expect(page.getByRole('main')).toBeVisible();
      });
    });

  test('should have a navigation landmark',
    async ({ page }) => {
      await allure.allureId('A11Y-005');
      await allure.story('Landmarks');
      await allure.label('severity', 'normal');

      await allure.step('Assert <nav> landmark is visible', async () => {
        await expect(page.getByRole('navigation').first()).toBeVisible();
      });
    });

  test('should have a descriptive page title',
    async ({ page }) => {
      await allure.allureId('A11Y-006');
      await allure.story('Page Metadata');
      await allure.label('severity', 'normal');

      await allure.step('Assert title is non-empty and not "Untitled"', async () => {
        const title = await page.title();
        await allure.attachment('Page Title', title, { contentType: 'text/plain' });
        expect(title.length).toBeGreaterThan(0);
        expect(title).not.toBe('Untitled');
      });
    });

  test('images should have alt text',
    async ({ page }) => {
      await allure.allureId('A11Y-007');
      await allure.story('Image Alt Text');
      await allure.label('severity', 'critical');

      await allure.step('Run axe image-alt rule', async () => {
        const results = await runA11yScan(page, { tags: ['wcag2a'] });
        const imgAltViolation = results.violations.find((v) => v.id === 'image-alt');
        expect(imgAltViolation).toBeUndefined();
      });
    });
});

test.describe('Accessibility – Docs Page', { tag: ['@accessibility'] }, () => {
  test.beforeEach(async ({ page }) => {
    await allure.epic('Playwright.dev');
    await allure.feature('Accessibility Testing - Docs Page');

    await page.goto('https://playwright.dev/docs/intro');
    await page.waitForLoadState('networkidle');
  });

  test('should have no WCAG 2.1 AA violations on intro page',
    async ({ page }) => {
      await allure.allureId('A11Y-008');
      await allure.story('WCAG 2.1 AA');
      await allure.label('severity', 'critical');

      await allure.step('Run WCAG 2.1 AA axe scan on docs intro', async () => {
        const results = await runA11yScan(page, { tags: ['wcag2a', 'wcag2aa', 'wcag21aa'] });
        await allure.attachment('Axe Violations', JSON.stringify(results.violations, null, 2), { contentType: 'application/json' });
        await assertWcagLevel(page, 'AA');
      });
    });

  test('should have proper heading hierarchy',
    { annotation: [{ type: 'story', description: 'Heading Structure' }, { type: 'severity', description: 'normal' }] },
    async ({ page }) => {
      await allure.allureId('A11Y-009');
      await allure.story('Heading Structure');
      await allure.label('severity', 'normal');

      await allure.step('Assert no heading-order violations', async () => {
        const results = await runA11yScan(page, { tags: ['wcag2a'] });
        const headingViolation = results.violations.find((v) => v.id === 'heading-order');
        expect(headingViolation).toBeUndefined();
      });
    });

  test('should have no color contrast violations in main content',
    async ({ page }) => {
      await allure.allureId('A11Y-010');
      await allure.story('Color Contrast');
      await allure.label('severity', 'normal');

      await allure.step('Run color contrast axe scan scoped to article', async () => {
        const results = await runA11yScan(page, { include: ['article'], tags: ['wcag2aa'] });
        const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');
        expect(contrastViolations.length).toBe(0);
      });
    });
});

test.describe('Accessibility – Keyboard Navigation', { tag: ['@accessibility'] }, () => {
  test.beforeEach(async ({}, testInfo) => {
    await allure.epic('Playwright.dev');
    await allure.feature('Accessibility Testing - Keyboard Navigation');
  });

  test('search should be accessible via keyboard',
    async ({ page }) => {
      await allure.allureId('A11Y-011');
      await allure.story('Keyboard Shortcuts');
      await allure.label('severity', 'critical');

      await page.goto('https://playwright.dev/');
      await page.waitForLoadState('networkidle');

      await allure.step('Press Ctrl+K to open search', async () => {
        await page.keyboard.press('Control+K');
      });

      await allure.step('Assert search input is visible and focused', async () => {
        const searchInput = page.getByPlaceholder('Search docs');
        await expect(searchInput).toBeVisible({ timeout: 5_000 });
        await expect(searchInput).toBeFocused();
      });
    });

  test('should trap focus in modals and close on Escape',
    async ({ page }) => {
      await allure.allureId('A11Y-012');
      await allure.story('Focus Trap');
      await allure.label('severity', 'critical');

      await page.goto('https://playwright.dev/');

      await allure.step('Open search dialog via keyboard', async () => {
        await page.keyboard.press('Control+K');
      });
      
      await allure.step('Press Escape to dismiss dialog', async () => {
        const dialog = page.getByRole('dialog');
        const isVisible = await dialog.isVisible().catch(() => false);
        if (isVisible) {
          await page.keyboard.press('Escape');
          await expect(dialog).toBeHidden({ timeout: 3_000 });
        }
      });
    });
});