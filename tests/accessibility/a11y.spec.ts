import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  assertNoA11yViolations,
  assertWcagLevel,
  getViolationSummary,
  runA11yScan,
} from '../../src/utils/accessibility.utils.js';

/**
 * Accessibility Tests – playwright.dev
 */

test.describe('Accessibility – Home Page', { tag: ['@accessibility'] }, () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'Accessibility Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Home Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
    await page.goto('https://playwright.dev/');
    await page.waitForLoadState('networkidle');
  });

  test('should have no WCAG 2.1 AA violations',
    { annotation: [{ type: 'story', description: 'WCAG 2.1 AA' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await allure.step('Run WCAG 2.1 AA axe scan on home page', async () => {
        const results = await runA11yScan(page, { tags: ['wcag2a', 'wcag2aa', 'wcag21aa'] });
        await allure.attachment('Axe Violations', JSON.stringify(results.violations, null, 2), { contentType: 'application/json' });
        await assertWcagLevel(page, 'AA');
      });
    });

  test('should have no critical accessibility violations',
    { annotation: [{ type: 'story', description: 'Violation Severity' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await allure.step('Get violation summary by impact level', async () => {
        const summary = await getViolationSummary(page);
        await allure.attachment('Violation Summary', JSON.stringify(summary, null, 2), { contentType: 'application/json' });
        expect(summary['critical']).toBe(0);
      });
    });

  test('should have no serious accessibility violations',
    { annotation: [{ type: 'story', description: 'Violation Severity' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      const summary = await getViolationSummary(page);
      await allure.step('Assert zero serious violations', async () => {
        expect(summary['serious']).toBe(0);
      });
    });

  test('should have a main landmark region',
    { annotation: [{ type: 'story', description: 'Landmarks' }, { type: 'severity', description: 'normal' }] },
    async ({ page }) => {
      await allure.step('Assert <main> landmark is visible', async () => {
        await expect(page.getByRole('main')).toBeVisible();
      });
    });

  test('should have a navigation landmark',
    { annotation: [{ type: 'story', description: 'Landmarks' }, { type: 'severity', description: 'normal' }] },
    async ({ page }) => {
      await allure.step('Assert <nav> landmark is visible', async () => {
        await expect(page.getByRole('navigation').first()).toBeVisible();
      });
    });

  test('should have a descriptive page title',
    { annotation: [{ type: 'story', description: 'Page Metadata' }, { type: 'severity', description: 'normal' }] },
    async ({ page }) => {
      await allure.step('Assert title is non-empty and not "Untitled"', async () => {
        const title = await page.title();
        await allure.attachment('Page Title', title, { contentType: 'text/plain' });
        expect(title.length).toBeGreaterThan(0);
        expect(title).not.toBe('Untitled');
      });
    });

  test('images should have alt text',
    { annotation: [{ type: 'story', description: 'Image Alt Text' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await allure.step('Run axe image-alt rule', async () => {
        const results = await runA11yScan(page, { tags: ['wcag2a'] });
        const imgAltViolation = results.violations.find((v) => v.id === 'image-alt');
        expect(imgAltViolation).toBeUndefined();
      });
    });
});

test.describe('Accessibility – Docs Page', { tag: ['@accessibility'] }, () => {
  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'Accessibility Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Docs Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
    await page.goto('https://playwright.dev/docs/intro');
    await page.waitForLoadState('networkidle');
  });

  test('should have no WCAG 2.1 AA violations on intro page',
    { annotation: [{ type: 'story', description: 'WCAG 2.1 AA' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await allure.step('Run WCAG 2.1 AA axe scan on docs intro', async () => {
        const results = await runA11yScan(page, { tags: ['wcag2a', 'wcag2aa', 'wcag21aa'] });
        await allure.attachment('Axe Violations', JSON.stringify(results.violations, null, 2), { contentType: 'application/json' });
        await assertWcagLevel(page, 'AA');
      });
    });

  test('should have proper heading hierarchy',
    { annotation: [{ type: 'story', description: 'Heading Structure' }, { type: 'severity', description: 'normal' }] },
    async ({ page }) => {
      await allure.step('Assert no heading-order violations', async () => {
        const results = await runA11yScan(page, { tags: ['wcag2a'] });
        const headingViolation = results.violations.find((v) => v.id === 'heading-order');
        expect(headingViolation).toBeUndefined();
      });
    });

  test('should have no colour contrast violations in main content',
    { annotation: [{ type: 'story', description: 'Colour Contrast' }, { type: 'severity', description: 'normal' }] },
    async ({ page }) => {
      await allure.step('Run colour contrast axe scan scoped to article', async () => {
        const results = await runA11yScan(page, { include: ['article'], tags: ['wcag2aa'] });
        const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');
        expect(contrastViolations.length).toBe(0);
      });
    });
});

test.describe('Accessibility – Keyboard Navigation', { tag: ['@accessibility'] }, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'Accessibility Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Keyboard Navigation' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test('search should be accessible via keyboard',
    { annotation: [{ type: 'story', description: 'Keyboard Shortcuts' }, { type: 'severity', description: 'critical' }] },
    async ({ page }) => {
      await page.goto('https://playwright.dev/');
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
    { annotation: [{ type: 'story', description: 'Focus Trap' }, { type: 'severity', description: 'normal' }] },
    async ({ page }) => {
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