import { test, expect } from '../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * UI Tests – Docs Page
 */

test.describe('Docs Page', () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'UI Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Docs Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test.describe('Page Structure', () => {
    test('should load the intro page correctly',
      { annotation: [{ type: 'story', description: 'Page Structure' }, { type: 'severity', description: 'critical' }] },
      async ({ docsPage }) => {
        await allure.step('Assert URL is under /docs/', async () => {
          await docsPage.assertOnDocsPage();
        });
      });

    test('should display the sidebar navigation',
      { annotation: [{ type: 'story', description: 'Page Structure' }, { type: 'severity', description: 'critical' }] },
      async ({ docsPage }) => {
        await allure.step('Assert sidebar nav is visible', async () => {
          await docsPage.assertSidebarVisible();
        });
      });

    test('should display the main content area',
      { annotation: [{ type: 'story', description: 'Page Structure' }, { type: 'severity', description: 'normal' }] },
      async ({ docsPage }) => {
        await allure.step('Assert article content area is visible', async () => {
          await expect(docsPage.mainContent).toBeVisible();
        });
      });

    test('should contain code examples on intro page',
      { annotation: [{ type: 'story', description: 'Page Structure' }, { type: 'severity', description: 'normal' }] },
      async ({ docsPage }) => {
        await allure.step('Assert at least one code block is present', async () => {
          await docsPage.assertCodeBlocksPresent();
        });
      });
  });

  test.describe('Sidebar Navigation', () => {
    test('should list navigation links in the sidebar',
      { annotation: [{ type: 'story', description: 'Sidebar Navigation' }, { type: 'severity', description: 'normal' }] },
      async ({ docsPage }) => {
        await allure.step('Get all sidebar links', async () => {
          const links = await docsPage.getSidebarLinks();
          expect(links.length).toBeGreaterThan(5);
        });
      });

    test('should navigate to the Installation page',
      { annotation: [{ type: 'story', description: 'Sidebar Navigation' }, { type: 'severity', description: 'critical' }] },
      async ({ docsPage, page }) => {
        await allure.step('Click Installation link in sidebar', async () => {
          await docsPage.clickSidebarLink('Installation');
        });
        await allure.step('Assert URL contains "installation"', async () => {
          await expect(page).toHaveURL(/intro/i);
        });
        await allure.step('Assert Installation heading is visible', async () => {
          await docsPage.assertHeadingVisible('Installation');
        });
      });

    test('should navigate to Writing Tests page',
      { annotation: [{ type: 'story', description: 'Sidebar Navigation' }, { type: 'severity', description: 'normal' }] },
      async ({ docsPage, page }) => {
        await allure.step('Click Writing tests link in sidebar', async () => {
          await docsPage.clickSidebarLink('Writing tests');
        });
        await allure.step('Assert URL contains "writing-tests"', async () => {
          await expect(page).toHaveURL(/writing-tests/i);
        });
      });
  });

  test.describe('Code Blocks', () => {
    test('should have multiple code blocks on the intro page',
      { annotation: [{ type: 'story', description: 'Code Blocks' }, { type: 'severity', description: 'minor' }] },
      async ({ docsPage }) => {
        await allure.step('Count code blocks on page', async () => {
          const count = await docsPage.getCodeBlockCount();
          expect(count).toBeGreaterThan(0);
        });
      });

    test('should render code block content',
      { annotation: [{ type: 'story', description: 'Code Blocks' }, { type: 'severity', description: 'minor' }] },
      async ({ docsPage }) => {
        await allure.step('Get content of first code block', async () => {
          const content = await docsPage.getCodeBlockContent(0);
          expect(content).not.toBeNull();
          expect(content!.length).toBeGreaterThan(0);
        });
      });
  });

  test.describe('Direct Page Navigation', () => {
    for (const [label, section] of [
      ['API Testing', 'api-testing'],
      ['Assertions', 'test-assertions'],
      ['Configuration', 'test-configuration'],
    ] as const) {
      test(`should load the ${label} page`,
        { annotation: [{ type: 'story', description: 'Direct Navigation' }, { type: 'severity', description: 'normal' }] },
        async ({ docsPage }) => {
          await allure.step(`Navigate to /docs/${section}`, async () => {
            await docsPage.gotoSection(section);
          });
          await allure.step('Assert page is a valid docs page', async () => {
            await docsPage.assertOnDocsPage();
          });
        });
    }
  });
});