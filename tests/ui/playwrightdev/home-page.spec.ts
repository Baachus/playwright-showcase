import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * UI Tests – Home Page on Playwright.dev
 */
 test.beforeEach(async()=>{
     await allure.epic('Playwright.dev');
     await allure.feature('Home Page');
 });

test.describe('Home Page', () => {

  test.describe('Page Load & Core Elements', { tag: ['@ui', '@smoke']}, () => {
    test('should display the hero section with CTA', async ({ pd_homePage }) => {
      await allure.story('Hero Section with CTA');
      await allure.label('severity', 'critical');

      await allure.step('Assert all core elements are visible', async () => {
        await pd_homePage.assertPageLoaded();
      });
    });

    test('should have correct page title', async ({ pd_homePage }) => {
      await allure.story('Page Title');
      await allure.label('severity', 'normal');

      await allure.step('Assert page title contains "Playwright"', async () => {
        await pd_homePage.assertTitle('Playwright');
      });
    });

    test('should display the navigation bar', async ({ pd_homePage }) => {
      await allure.story('Navigation Bar');
      await allure.label('severity', 'normal');

      await allure.step('Assert navbar is visible', async () => {
        await expect(pd_homePage.navbar).toBeVisible();
      });
    });

    test('should display the GitHub link', async ({ pd_homePage }) => {
      await allure.story('Github Link');
      await allure.label('severity', 'minor');

      await allure.step('Assert GitHub link is visible in nav', async () => {
        await expect(pd_homePage.githubLink).toBeVisible();
      });
    });
  });

  test.describe('Navigation', { tag: ['@ui']}, () => {
    test('should navigate to Docs on "Get Started" click', async ({ pd_homePage, page }) => {
      await allure.story('Get Started');
      await allure.label('severity', 'critical');

      await allure.step('Click the Get Started CTA button', async () => {
        await pd_homePage.clickGetStarted();
      });

      await allure.step('Assert URL navigated to /docs/', async () => {
        await expect(page).toHaveURL(/\/docs\//);
      });
    });
  });

  test.describe('Search', { tag: ['@ui'] }, () => {
    test('should open search modal and accept input', async ({ pd_homePage }) => {
      await allure.story('Search Modal');
      await allure.label('severity', 'critical');
    
      await allure.step('Click the search button', async () => {
        await pd_homePage.searchFor('assertions');
      });

      await allure.step('Assert search input contains typed query', async () => {
        await expect(pd_homePage.searchInput).toHaveValue('assertions');
      });
    });

    test('should open search with keyboard shortcut', async ({ pd_homePage, page }) => {
      await allure.story('Search Modal with Keyboard');
      await allure.label('severity', 'normal');

      await allure.step('Press Ctrl+K shortcut', async () => {
        await page.waitForLoadState('networkidle');
        await page.keyboard.press('Control+K');
      });

      await allure.step('Assert search input becomes visible', async () => {
        await expect(pd_homePage.searchInput).toBeVisible();
      });
    });
  });

  test.describe('Responsive Layout', { tag: ['@ui'] }, () => {
    test('should render correctly on mobile viewport', async ({ page }) => {
      await allure.story('Render Mobile Viewport');
      await allure.label('severity', 'normal');
    
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

    test('should render correctly on tablet viewport', async ({ page }) => {
      await allure.story('Render Tablet Viewport');
      await allure.label('severity', 'normal');

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