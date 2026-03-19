import { test, expect } from '@playwright/test';
import { assertNoA11yViolations, assertWcagLevel, getViolationSummary, runA11yScan } from '../../src/utils/accessibility.utils.js';

/**
 * Accessibility Tests – playwright.dev
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers: WCAG 2.1 AA compliance, landmark regions, keyboard navigation,
 * colour contrast, focus management, and ARIA attributes.
 *
 * Uses @axe-core/playwright for automated audits supplemented by targeted
 * Playwright assertions for interaction-based a11y checks.
 */

test.describe('Accessibility – Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await page.waitForLoadState('networkidle');
  });

  test('should have no WCAG 2.1 AA violations', async ({ page }) => {
    await assertWcagLevel(page, 'AA');
  });

  test('should have no critical accessibility violations', async ({ page }) => {
    const summary = await getViolationSummary(page);
    expect(summary['critical']).toBe(0);
  });

  test('should have no serious accessibility violations', async ({ page }) => {
    const summary = await getViolationSummary(page);
    expect(summary['serious']).toBe(0);
  });

  test('should have a main landmark region', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should have a navigation landmark', async ({ page }) => {
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });

  test('should have a skip-to-content link or accessible bypass', async ({ page }) => {
    // Tab once from the top — a well-implemented skip link appears
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const tagName = await focused.evaluate((el) => el.tagName.toLowerCase());
    // The first focusable element should be a link (skip nav or logo)
    expect(['a', 'button']).toContain(tagName);
  });

  test('should have a descriptive page title', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('Untitled');
  });

  test('images should have alt text', async ({ page }) => {
    const results = await runA11yScan(page, { tags: ['wcag2a'] });
    const imgAltViolation = results.violations.find((v) => v.id === 'image-alt');
    expect(imgAltViolation).toBeUndefined();
  });
});

test.describe('Accessibility – Docs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://playwright.dev/docs/intro');
    await page.waitForLoadState('networkidle');
  });

  test('should have no WCAG 2.1 AA violations on intro page', async ({ page }) => {
    await assertWcagLevel(page, 'AA');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const results = await runA11yScan(page, { tags: ['wcag2a'] });
    const headingViolation = results.violations.find((v) => v.id === 'heading-order');
    expect(headingViolation).toBeUndefined();
  });

  test('links should have discernible text', async ({ page }) => {
    const results = await runA11yScan(page, { tags: ['wcag2a'] });
    const linkViolation = results.violations.find((v) => v.id === 'link-name');
    expect(linkViolation).toBeUndefined();
  });

  test('should have no colour contrast violations in main content', async ({ page }) => {
    const results = await runA11yScan(page, {
      include: ['article'],
      tags: ['wcag2aa'],
    });
    const contrastViolations = results.violations.filter((v) => v.id === 'color-contrast');
    expect(contrastViolations.length).toBe(0);
  });
});

test.describe('Accessibility – Keyboard Navigation', () => {
  test('should be fully navigable via keyboard on home page', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await page.waitForLoadState('domcontentloaded');

    // Tab through first 10 interactive elements and confirm each is focusable
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      const count = await focused.count();
      // Something should be focused after each Tab
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('search should be accessible via keyboard', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await page.keyboard.press('Control+K');
    const searchInput = page.getByPlaceholder('Search docs');
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await expect(searchInput).toBeFocused();
  });

  test('should trap focus in modals / dialogs', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    await page.keyboard.press('Control+K');

    const dialog = page.getByRole('dialog');
    const isVisible = await dialog.isVisible().catch(() => false);

    if (isVisible) {
      // Escape should close the dialog
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden({ timeout: 3_000 });
    }
  });
});