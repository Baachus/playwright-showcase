import { test, expect } from '../../src/fixtures';

/**
 * UI Tests – Home Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers: rendering, navigation, search, theme toggle, and responsive layout.
 * Uses the homePage fixture which pre-navigates and waits for page load.
 */

test.describe('Home Page', () => {
  test.describe('Page Load & Core Elements', () => {
    test('should display the hero section with CTA', async ({ homePage }) => {
      await homePage.assertPageLoaded();
    });

    test('should have correct page title', async ({ homePage }) => {
      await homePage.assertTitle('Playwright');
    });

    test('should display the navigation bar', async ({ homePage }) => {
      await expect(homePage.navbar).toBeVisible();
    });

    test('should display the GitHub link', async ({ homePage }) => {
      await expect(homePage.githubLink).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to Docs on "Get Started" click', async ({ homePage, page }) => {
      await homePage.clickGetStarted();
      await expect(page).toHaveURL(/\/docs\//);
    });
  });

  test.describe('Search', () => {
    test('should open search modal and accept input', async ({ homePage }) => {
      await homePage.searchFor('assertions');
      await expect(homePage.searchInput).toHaveValue('assertions');
    });

    test('should open search with keyboard shortcut', async ({ homePage, page }) => {
      // Ctrl+K / Cmd+K shortcut
      await page.keyboard.press('Control+K');
      await expect(homePage.searchInput).toBeVisible();
    });
  });

  test.describe('Responsive Layout', () => {
    test('should render correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await expect(page.getByRole('heading', { name: /Playwright/ }).first()).toBeVisible();
    });

    test('should render correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await expect(page.getByRole('heading', { name: /Playwright/ }).first()).toBeVisible();
    });
  });
});