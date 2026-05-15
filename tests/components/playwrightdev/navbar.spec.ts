import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Component Tests -- Navbar
 * ---------------------------------------------------------------------------
 * Covers the top navigation bar on playwright.dev: structure, links,
 * theme toggle, and the hoverable language-switcher dropdown.
 */
test.beforeEach(async () => {
  await allure.epic('Playwright.dev');
  await allure.feature('Navbar Component');
});

test.describe('Navbar Component', () => {

  test.describe('Structure & Rendering', { tag: ['@component', '@smoke'] }, () => {
    test('should render all core navbar elements', async ({ pd_navbar }) => {
      await allure.story('Core Rendering');
      await allure.label('severity', 'critical');

      await allure.step('Assert all primary nav elements are visible', async () => {
        await pd_navbar.assertFullyRendered();
      });
    });

    test('should display the brand logo with a valid href', async ({ pd_navbar }) => {
      await allure.story('Brand Logo');
      await allure.label('severity', 'normal');

      await allure.step('Get and assert the brand logo href is root-relative', async () => {
        const href = await pd_navbar.getBrandHref();
        expect(href).toBeTruthy();
        expect(href).toMatch(/^\//);
      });
    });

    test('should display the GitHub link', async ({ pd_navbar }) => {
      await allure.story('GitHub Link');
      await allure.label('severity', 'minor');

      await allure.step('Assert GitHub link is visible in the navbar', async () => {
        await expect(pd_navbar.githubLink).toBeVisible();
      });
    });

    test('should display the search trigger button', async ({ pd_navbar }) => {
      await allure.story('Search Trigger');
      await allure.label('severity', 'normal');

      await allure.step('Assert search button is visible', async () => {
        await expect(pd_navbar.searchButton).toBeVisible();
      });
    });
  });

  test.describe('Language Switcher Dropdown', { tag: ['@component'] }, () => {
    test('should show the language dropdown trigger in the navbar', async ({ pd_navbar }) => {
      await allure.story('Dropdown Trigger Visible');
      await allure.label('severity', 'critical');

      await allure.step('Assert the dropdown trigger is visible without hovering', async () => {
        await expect(pd_navbar.languageDropdownTrigger).toBeVisible();
      });
    });

    test('should reveal all four language options on hover', async ({ pd_navbar }) => {
      await allure.story('All Language Options on Hover');
      await allure.label('severity', 'critical');

      await allure.step('Hover trigger and assert all four options appear', async () => {
        await pd_navbar.assertLanguageLinksVisible();
      });
    });

    test('should navigate to Python docs when Python option is clicked', async ({ pd_navbar, page }) => {
      await allure.story('Python Option Navigation');
      await allure.label('severity', 'normal');

      await allure.step('Hover dropdown and click Python', async () => {
        await pd_navbar.switchLanguage('Python');
      });

      await allure.step('Assert URL contains /python/', async () => {
        await expect(page).toHaveURL(/\/python\//);
      });
    });

    test('should navigate to Java docs when Java option is clicked', async ({ pd_navbar, page }) => {
      await allure.story('Java Option Navigation');
      await allure.label('severity', 'normal');

      await allure.step('Hover dropdown and click Java', async () => {
        await pd_navbar.switchLanguage('Java');
      });

      await allure.step('Assert URL contains /java/', async () => {
        await expect(page).toHaveURL(/\/java\//);
      });
    });

    test('should navigate to .NET docs when .NET option is clicked', async ({ pd_navbar, page }) => {
      await allure.story('.NET Option Navigation');
      await allure.label('severity', 'normal');

      await allure.step('Hover dropdown and click .NET', async () => {
        await pd_navbar.switchLanguage('.NET');
      });

      await allure.step('Assert URL contains /dotnet/', async () => {
        await expect(page).toHaveURL(/\/dotnet\//);
      });
    });
  });

  test.describe('Theme Toggle', { tag: ['@component'] }, () => {
    test('should display the theme toggle button', async ({ pd_navbar }) => {
      await allure.story('Theme Toggle Visible');
      await allure.label('severity', 'minor');

      await allure.step('Assert theme toggle is visible', async () => {
        await pd_navbar.assertThemeToggleVisible();
      });
    });

    test('should switch theme when the toggle is clicked', async ({ pd_navbar }) => {
      await allure.story('Theme Toggle Interaction');
      await allure.label('severity', 'normal');

      await allure.step('Record aria-label before toggling', async () => {
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
  });

  test.describe('Brand Navigation', { tag: ['@component'] }, () => {
    test('should return to home page when brand logo is clicked from docs', async ({ page }) => {
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
