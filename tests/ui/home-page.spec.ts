import { test, expect } from '../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * UI Tests – Home Page
 */

test.describe('Home Page', () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'UI Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Home Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test.describe('Page Load & Core Elements', () => {
    test('should display the hero section with CTA',
      { annotation: [{ type: 'story', description: 'Page Load' }, { type: 'severity', description: 'critical' }] },
      async ({ homePage }) => {
        await allure.step('Assert all core elements are visible', async () => {
          await homePage.assertPageLoaded();
        });
      });

    test('should have correct page title',
      { annotation: [{ type: 'story', description: 'Page Load' }, { type: 'severity', description: 'normal' }] },
      async ({ homePage }) => {
        await allure.step('Assert page title contains "Playwright"', async () => {
          await homePage.assertTitle('Playwright');
        });
      });

    test('should display the navigation bar',
      { annotation: [{ type: 'story', description: 'Page Load' }, { type: 'severity', description: 'normal' }] },
      async ({ homePage }) => {
        await allure.step('Assert navbar is visible', async () => {
          await expect(homePage.navbar).toBeVisible();
        });
      });

    test('should display the GitHub link',
      { annotation: [{ type: 'story', description: 'Page Load' }, { type: 'severity', description: 'minor' }] },
      async ({ homePage }) => {
        await allure.step('Assert GitHub link is visible in nav', async () => {
          await expect(homePage.githubLink).toBeVisible();
        });
      });
  });

  test.describe('Navigation', () => {
    test('should navigate to Docs on "Get Started" click',
      { annotation: [{ type: 'story', description: 'Navigation' }, { type: 'severity', description: 'critical' }] },
      async ({ homePage, page }) => {
        await allure.step('Click the Get Started CTA button', async () => {
          await homePage.clickGetStarted();
        });
        await allure.step('Assert URL navigated to /docs/', async () => {
          await expect(page).toHaveURL(/\/docs\//);
        });
      });
  });

  test.describe('Search', () => {
    test('should open search modal and accept input',
      { annotation: [{ type: 'story', description: 'Search' }, { type: 'severity', description: 'critical' }] },
      async ({ homePage }) => {
        await allure.step('Click the search button', async () => {
          await homePage.searchFor('assertions');
        });
        await allure.step('Assert search input contains typed query', async () => {
          await expect(homePage.searchInput).toHaveValue('assertions');
        });
      });

    test('should open search with keyboard shortcut',
      { annotation: [{ type: 'story', description: 'Search' }, { type: 'severity', description: 'normal' }] },
      async ({ homePage, page }) => {
        await allure.step('Press Ctrl+K shortcut', async () => {
          await page.keyboard.press('Control+K');
        });
        await allure.step('Assert search input becomes visible', async () => {
          await expect(homePage.searchInput).toBeVisible();
        });
      });
  });

  test.describe('Responsive Layout', () => {
    test('should render correctly on mobile viewport',
      { annotation: [{ type: 'story', description: 'Responsive' }, { type: 'severity', description: 'normal' }] },
      async ({ page }) => {
        await allure.step('Set mobile viewport 375x812', async () => {
          await page.setViewportSize({ width: 375, height: 812 });
        });
        await allure.step('Navigate to home page', async () => {
          await page.goto('/');
        });
        await allure.step('Assert hero heading is visible on mobile', async () => {
          await expect(page.getByRole('heading', { name: /Playwright/ }).first()).toBeVisible();
        });
      });

    test('should render correctly on tablet viewport',
      { annotation: [{ type: 'story', description: 'Responsive' }, { type: 'severity', description: 'normal' }] },
      async ({ page }) => {
        await allure.step('Set tablet viewport 768x1024', async () => {
          await page.setViewportSize({ width: 768, height: 1024 });
        });
        await allure.step('Navigate to home page', async () => {
          await page.goto('/');
        });
        await allure.step('Assert hero heading is visible on tablet', async () => {
          await expect(page.getByRole('heading', { name: /Playwright/ }).first()).toBeVisible();
        });
      });
  });
});