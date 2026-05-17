import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Component Tests - Language Selector
 * ---------------------------------------------------------------------------
 * Covers the Node.js / Python / Java / .NET language-switcher dropdown in
 * the navbar. The dropdown is hoverable -- options are only visible after
 * hovering the trigger, and all select* helpers handle this automatically.
 */
test.beforeEach(async () => {
  await allure.epic('Playwright.dev');
  await allure.feature('Language Selector Component');
});

test.describe('Language Selector Component', () => {

  test.describe('Rendering', { tag: ['@component', '@smoke'] }, () => {
    test('should display the dropdown trigger in the navbar', async ({ pd_languageSelector }) => {
      await allure.story('Dropdown Trigger Visible');
      await allure.label('severity', 'critical');

      await allure.step('Assert the trigger is always visible (no hover required)', async () => {
        await pd_languageSelector.assertTriggerVisible();
      });
    });

    test('should reveal all four language options on hover', async ({ pd_languageSelector }) => {
      await allure.story('All Options on Hover');
      await allure.label('severity', 'critical');

      await allure.step('Hover the trigger and assert all four options appear', async () => {
        await pd_languageSelector.assertAllTabsVisible();
      });
    });

    test('should return at least four option labels when opened', async ({ pd_languageSelector }) => {
      await allure.story('Option Label Count');
      await allure.label('severity', 'normal');

      await allure.step('Open dropdown and get all labels', async () => {
        const labels = await pd_languageSelector.getTabLabels();
        expect(labels.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  test.describe('Tab Navigation', { tag: ['@component'] }, () => {
    test('should navigate to the Python docs when Python is selected', async ({ pd_languageSelector, page }) => {
      await allure.story('Python Selection');
      await allure.label('severity', 'critical');

      await allure.step('Hover dropdown and click Python', async () => {
        await pd_languageSelector.selectPython();
      });

      await allure.step('Assert URL contains /python/', async () => {
        await expect(page).toHaveURL(/\/python\//);
      });
    });

    test('should navigate to the Java docs when Java is selected', async ({ pd_languageSelector, page }) => {
      await allure.story('Java Selection');
      await allure.label('severity', 'normal');

      await allure.step('Hover dropdown and click Java', async () => {
        await pd_languageSelector.selectJava();
      });

      await allure.step('Assert URL contains /java/', async () => {
        await expect(page).toHaveURL(/\/java\//);
      });
    });

    test('should navigate to the .NET docs when .NET is selected', async ({ pd_languageSelector, page }) => {
      await allure.story('.NET Selection');
      await allure.label('severity', 'normal');

      await allure.step('Hover dropdown and click .NET', async () => {
        await pd_languageSelector.selectDotnet();
      });

      await allure.step('Assert URL contains /dotnet/', async () => {
        await expect(page).toHaveURL(/\/dotnet\//);
      });
    });
  });

  test.describe('Language Persistence', { tag: ['@component'] }, () => {
    test('should report Node.js as the default language on the home page', async ({ pd_languageSelector }) => {
      await allure.story('Default Language');
      await allure.label('severity', 'normal');

      await allure.step('Assert active language is Node.js (default, no URL prefix)', async () => {
        const active = await pd_languageSelector.getActiveLanguage();
        expect(active).toBe('Node.js');
      });
    });

    test('should remain on Python docs after navigating within that section', async ({ pd_languageSelector, page }) => {
      await allure.story('Language Persistence via Nav');
      await allure.label('severity', 'normal');

      await allure.step('Switch to Python docs', async () => {
        await pd_languageSelector.selectPython();
        await expect(page).toHaveURL(/\/python\//);
      });

      await allure.step('Navigate to another page within Python docs', async () => {
        await page.goto('https://playwright.dev/python/docs/locators');
        await page.waitForLoadState('domcontentloaded');
      });

      await allure.step('Assert still on a Python docs page', async () => {
        await expect(page).toHaveURL(/\/python\//);
      });
    });
  });
});
