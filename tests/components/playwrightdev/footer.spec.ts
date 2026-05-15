import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Component Tests -- Footer
 * ---------------------------------------------------------------------------
 * Covers the site-wide Docusaurus footer on playwright.dev:
 * visibility, link columns, copyright text, and key link presence.
 */
test.beforeEach(async () => {
  await allure.epic('Playwright.dev');
  await allure.feature('Footer Component');
});

test.describe('Footer Component', () => {

  test.describe('Visibility & Structure', { tag: ['@component', '@smoke'] }, () => {
    test('should be present and visible after scrolling into view', async ({ pd_footer }) => {
      await allure.story('Footer Visibility');
      await allure.label('severity', 'critical');

      await allure.step('Scroll footer into view and assert it is visible', async () => {
        await pd_footer.assertVisible();
      });
    });

    test('should contain a meaningful number of links', async ({ pd_footer }) => {
      await allure.story('Link Count');
      await allure.label('severity', 'normal');

      await allure.step('Assert at least 5 links are present in the footer', async () => {
        await pd_footer.assertMinimumLinkCount(5);
      });
    });
  });

  test.describe('Copyright', { tag: ['@component'] }, () => {
    test('should display copyright information', async ({ pd_footer }) => {
      await allure.story('Copyright Text');
      await allure.label('severity', 'normal');

      await allure.step('Assert copyright element exists', async () => {
        await pd_footer.scrollIntoView();
        await expect(pd_footer.copyright).toBeVisible();
      });
    });

    test('should include "Microsoft" or "Playwright" in the copyright notice', async ({ pd_footer }) => {
      await allure.story('Copyright Attribution');
      await allure.label('severity', 'minor');

      await allure.step('Assert copyright text contains the project name', async () => {
        await pd_footer.assertCopyrightContains(/microsoft|playwright/i);
      });
    });
  });

  test.describe('Link Columns', { tag: ['@component'] }, () => {
    test('should render links in the Learn column', async ({ pd_footer }) => {
      await allure.story('Learn Column Links');
      await allure.label('severity', 'normal');

      await allure.step('Assert Learn column has links', async () => {
        await pd_footer.assertLearnLinksPresent();
      });
    });

    test('should render links in the Community column', async ({ pd_footer }) => {
      await allure.story('Community Column Links');
      await allure.label('severity', 'normal');

      await allure.step('Assert Community column has links', async () => {
        await pd_footer.assertCommunityLinksPresent();
      });
    });
  });

  test.describe('Key Links', { tag: ['@component'] }, () => {
    test('should have a link to the GitHub repository', async ({ pd_footer }) => {
      await allure.story('GitHub Link in Footer');
      await allure.label('severity', 'minor');

      await allure.step('Scroll footer into view', async () => {
        await pd_footer.scrollIntoView();
      });

      await allure.step('Assert a GitHub link is present in the footer', async () => {
        await expect(pd_footer.root.getByRole('link', { name: /github/i })).toBeVisible();
      });
    });

    test('should have all link texts as non-empty strings', async ({ pd_footer }) => {
      await allure.story('Non-Empty Link Labels');
      await allure.label('severity', 'minor');

      await allure.step('Get all footer link texts', async () => {
        const texts = await pd_footer.getAllLinkTexts();

        await allure.step('Assert every link has a non-empty label', async () => {
          for (const text of texts) {
            expect(text.trim().length).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  test.describe('Footer on Docs Pages', { tag: ['@component'] }, () => {
    test('should also be present on a docs page', async ({ page }) => {
      await allure.story('Footer on Docs');
      await allure.label('severity', 'normal');

      await allure.step('Navigate to a docs page', async () => {
        await page.goto('/docs/intro');
        await page.waitForLoadState('domcontentloaded');
      });

      await allure.step('Scroll to the bottom and assert footer is visible', async () => {
        const footer = page.locator('footer.footer');
        await footer.scrollIntoViewIfNeeded();
        await expect(footer).toBeVisible();
      });
    });
  });
});
