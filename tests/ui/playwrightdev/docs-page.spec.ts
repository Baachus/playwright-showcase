import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * UI Tests – Docs Page
 */
 test.beforeEach(async()=>{
     await allure.epic('Playwright.dev');
     await allure.feature('Documents Page');
 });

test.describe('Docs Page', () => {
  test.describe('Page Structure', { tag: ['@ui']}, () => {
    test('should load the intro page correctly', async ({ pd_docsPage }) => {
      await allure.allureId('UI-DP-001');
        await allure.story('Intro Page');
        await allure.label('severity', 'critical');

        await allure.step('Assert URL is under /docs/', async () => {
          await pd_docsPage.assertOnDocsPage();
        });
    });

    test('should display the sidebar navigation', async ({ pd_docsPage }) => {
      await allure.allureId('UI-DP-002');
        await allure.story('Sidebar Navigation');
        await allure.label('severity', 'critical');

        await allure.step('Assert sidebar nav is visible', async () => {
          await pd_docsPage.assertSidebarVisible();
        });
    });

    test('should display the main content area', async ({ pd_docsPage }) => {
      await allure.allureId('UI-DP-003');
        await allure.story('Main Content Area');
        await allure.label('severity', 'normal');

        await allure.step('Assert article content area is visible', async () => {
          await expect(pd_docsPage.mainContent).toBeVisible();
        });
    });

    test('should contain code examples on intro page', async ({ pd_docsPage }) => {
      await allure.allureId('UI-DP-004');
        await allure.story('Code Examples');
      await allure.label('severity', 'normal');
      
      await allure.step('Assert at least one code block is present', async () => {
        await pd_docsPage.assertCodeBlocksPresent();
      });
    });
  });

  test.describe('Sidebar Navigation', { tag: ['@ui'] }, () => {
    test('should list navigation links in the sidebar', async ({ pd_docsPage }) => {
      await allure.allureId('UI-DP-005');
      await allure.story('Navigation Links');
      await allure.label('severity', 'normal');

      await allure.step('Get all sidebar links', async () => {
        const links = await pd_docsPage.getSidebarLinks();
        expect(links.length).toBeGreaterThan(5);
      });
    });

    test('should navigate to the Installation page', async ({ pd_docsPage, page }) => {
      await allure.allureId('UI-DP-006');
      await allure.story('Installation Navigation');
      await allure.label('severity', 'critical');
      
      await allure.step('Click Installation link in sidebar', async () => {
        await pd_docsPage.clickSidebarLink('Installation');
      });

      await allure.step('Assert URL contains "installation"', async () => {
        await expect(page).toHaveURL(/intro/i);
      });

      await allure.step('Assert Installation heading is visible', async () => {
        await pd_docsPage.assertHeadingVisible('Installation');
      });
    });

    test('should navigate to Writing Tests page',async ({ pd_docsPage, page }) => {
      await allure.allureId('UI-DP-007');
      await allure.story('Writing Test Navigation');
      await allure.label('severity', 'normal');

      await allure.step('Click Writing tests link in sidebar', async () => {
        await pd_docsPage.clickSidebarLink('Writing tests');
      });

      await allure.step('Assert URL contains "writing-tests"', async () => {
        await expect(page).toHaveURL(/writing-tests/i);
      });
    });
  });

  test.describe('Code Blocks', { tag: ['@ui'] }, () => {
    test('should have multiple code blocks on the intro page', async ({ pd_docsPage }) => {
      await allure.allureId('UI-DP-008');
      await allure.story('Code Blocks');
      await allure.label('severity', 'minor');

      await allure.step('Count code blocks on page', async () => {
        const count = await pd_docsPage.getCodeBlockCount();
        expect(count).toBeGreaterThan(0);
      });
    });

    test('should render code block content', async ({ pd_docsPage }) => {
      await allure.allureId('UI-DP-009');
      await allure.story('Code Blocks Render');
      await allure.label('severity', 'minor');

      await allure.step('Get content of first code block', async () => {
        const content = await pd_docsPage.getCodeBlockContent(0);
        expect(content).not.toBeNull();
        expect(content!.length).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Direct Page Navigation', { tag: ['@ui'] }, () => {
    for (const [label, section] of [
      ['API Testing', 'api-testing'],
      ['Assertions', 'test-assertions'],
      ['Configuration', 'test-configuration'],
    ] as const) {
      test(`should load the ${label} page`, async ({ pd_docsPage }) => {
        await allure.allureId('UI-DP-010');
        await allure.story('Direct Page Navigation');
        await allure.label('severity', 'normal');
        await allure.step(`Navigate to /docs/${section}`, async () => {
          await pd_docsPage.gotoSection(section);
        });
        await allure.step('Assert page is a valid docs page', async () => {
          await pd_docsPage.assertOnDocsPage();
        });
      });
    }
  });
});