import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Component Tests - Navbar
 * ---------------------------------------------------------------------------
 * Covers the top navigation bar on playwright.dev: structure, links,
 * theme toggle, and the hover-able language-switcher dropdown.
 */
test.beforeEach(async () => {
  await allure.epic('Playwright.dev');
  await allure.feature('Navbar Component');
});

test.describe('Navbar Component', () => {

  test.describe('Structure & Rendering', { tag: ['@component', '@smoke'] }, () => {
    test('should render all core navbar elements', async ({ pd_navbar }) => {
      await allure.allureId('COMP-NB-001');
      await allure.story('Core Rendering');
      await allure.label('severity', 'critical');

      await allure.step('Assert all primary nav elements are visible', async () => {
        await pd_navbar.assertFullyRendered();
      });
    });

    test('should display the brand logo with a valid href', async ({ pd_navbar }) => {
      await allure.allureId('COMP-NB-002');
      await allure.story('Brand Logo');
      await allure.label('severity', 'normal');

      await allure.step('Get and assert the brand logo href is root-relative', async () => {
        const href = await pd_navbar.getBrandHref();
        expect(href).toBeTruthy();
        expect(href).toMatch(/^\//);
      });
    });

    test('should display the GitHub link', async ({ pd_navbar }) => {
      await allure.allureId('COMP-NB-003');
      await allure.story('GitHub Link');
      await allure.label('severity', 'minor');

      await allure.step('Assert GitHub link is visible in the navbar', async () => {
        await expect(pd_navbar.githubLink).toBeVisible();
      });
    });

    test('should display the search trigger button', async ({ pd_navbar }) => {
      await allure.allureId('COMP-NB-004');
      await allure.story('Search Trigger');
      await allure.label('severity', 'normal');

      await allure.step('Assert search button is visible', async () => {
        await expect(pd_navbar.searchButton).toBeVisible();
      });
    });
  });

  test.describe('Theme Toggle', { tag: ['@component'] }, () => {
    test('should display the theme toggle button', async ({ pd_navbar }) => {
      await allure.allureId('COMP-NB-005');
      await allure.story('Theme Toggle Visible');
      await allure.label('severity', 'minor');

      await allure.step('Assert theme toggle is visible', async () => {
        await pd_navbar.assertThemeToggleVisible();
      });
    });

    test('should switch theme when the toggle is clicked', async ({ pd_navbar }) => {
      await allure.allureId('COMP-NB-006');
      await allure.story('Theme Toggle Interaction');
      await allure.label('severity', 'normal');

      const before = await pd_navbar.getThemeToggleLabel();
      expect(before).toBeTruthy();

      await allure.step('Click the theme toggle', async () => {
        await pd_navbar.clickThemeToggle();
      });

      await allure.step('Assert aria-label has changed after toggle', async () => {
        const after = await pd_navbar.getThemeToggleLabel();
        expect(after).not.toBe(before);
      });
    });
  });

  test.describe('Brand Navigation', { tag: ['@component'] }, () => {
    test('should return to home page when brand logo is clicked from docs', async ({ page }) => {
      await allure.allureId('COMP-NB-007');
      await allure.story('Brand Logo Click');
      await allure.label('severity', 'normal');

      await allure.step('Navigate to a docs page', async () => {
        await page.goto('/docs/intro');
        await page.waitForLoadState('domcontentloaded');
      });

      await allure.step('Click the brand logo', async () => {
        await page.locator('nav.navbar').locator('a.navbar__brand').click();
      });

      await allure.step('Assert URL is back at the home page', async () => {
        await expect(page).toHaveURL(/playwright\.dev\/?$/);
      });
    });
  });
});
