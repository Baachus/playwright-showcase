import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Component Tests - Search Modal
 * ---------------------------------------------------------------------------
 * Covers the Algolia DocSearch modal: opening, input, results, and closing.
 */
test.beforeEach(async () => {
  await allure.epic('Playwright.dev');
  await allure.feature('Search Component');
});

test.describe('Search Component', () => {

  test.describe('Opening the Modal', { tag: ['@component', '@smoke'] }, () => {
    test('should open the search modal when the trigger button is clicked', async ({ pd_search }) => {
      await allure.allureId('COMP-SR-001');
      await allure.story('Open via Button');
      await allure.label('severity', 'critical');

      await allure.step('Click the search trigger button', async () => {
        await pd_search.open();
      });

      await allure.step('Assert the search modal is visible', async () => {
        await pd_search.assertOpen();
      });
    });

    test('should open the search modal with the Ctrl+K keyboard shortcut', async ({ pd_search, page }) => {
      await allure.allureId('COMP-SR-002');
      await allure.story('Open via Keyboard Shortcut');
      await allure.label('severity', 'normal');

      await allure.step('Wait for page network idle so shortcut registers', async () => {
        await page.waitForLoadState('networkidle');
      });

      await allure.step('Press Ctrl+K to open search', async () => {
        await pd_search.openWithKeyboard();
      });

      await allure.step('Assert search input is visible', async () => {
        await expect(pd_search.searchInput).toBeVisible();
      });
    });
  });

  test.describe('Input & Query', { tag: ['@component'] }, () => {
    test('should accept typed text in the search input', async ({ pd_search }) => {
      await allure.allureId('COMP-SR-003');
      await allure.story('Accept Input');
      await allure.label('severity', 'critical');

      await allure.step('Open the search modal', async () => {
        await pd_search.open();
      });

      await allure.step('Type a query into the search input', async () => {
        await pd_search.typeQuery('assertions');
      });

      await allure.step('Assert the input value matches the typed query', async () => {
        await pd_search.assertInputValue('assertions');
      });
    });

    test('should show search results for a valid query', async ({ pd_search }) => {
      await allure.allureId('COMP-SR-004');
      await allure.story('Search Results');
      await allure.label('severity', 'critical');

      await allure.step('Open and search for "locator"', async () => {
        await pd_search.searchFor('locator');
      });

      await allure.step('Assert at least one result is displayed', async () => {
        await pd_search.assertResultsVisible();
      });
    });

    test('should return results for a common docs term', async ({ pd_search }) => {
      await allure.allureId('COMP-SR-005');
      await allure.story('Common Term Results');
      await allure.label('severity', 'normal');

      await allure.step('Search for "page"', async () => {
        await pd_search.searchFor('page');
      });

      await allure.step('Assert result count is greater than zero', async () => {
        const count = await pd_search.getResultCount();
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Closing the Modal', { tag: ['@component'] }, () => {
    test('should close the search modal when Escape is pressed', async ({ pd_search }) => {
      await allure.allureId('COMP-SR-006');
      await allure.story('Close via Escape');
      await allure.label('severity', 'critical');

      await allure.step('Open the search modal', async () => {
        await pd_search.open();
      });

      await allure.step('Press Escape to dismiss the modal', async () => {
        await pd_search.closeWithEscape();
      });

      await allure.step('Assert the modal is no longer visible', async () => {
        await pd_search.assertClosed();
      });
    });

    test('should preserve page state after closing the search modal', async ({ pd_search, page }) => {
      await allure.allureId('COMP-SR-007');
      await allure.story('Page State After Close');
      await allure.label('severity', 'normal');

      const urlBefore = page.url();

      await allure.step('Open and then close the search modal', async () => {
        await pd_search.open();
        await pd_search.closeWithEscape();
      });

      await allure.step('Assert the URL has not changed', async () => {
        expect(page.url()).toBe(urlBefore);
      });
    });
  });
});
