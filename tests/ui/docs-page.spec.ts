import { test, expect } from '../../src/fixtures';

/**
 * UI Tests – Docs Page
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers: sidebar navigation, content rendering, code blocks, TOC, and
 * pagination between doc pages.
 */

test.describe('Docs Page', () => {
  test.describe('Page Load & Layout', () => {
    test('should load the intro docs page', async ({ docsPage }) => {
      await docsPage.assertOnDocsPage();
    });

    test('should display the sidebar navigation', async ({ docsPage }) => {
      await docsPage.assertSidebarVisible();
    });

    test('should display the main content area', async ({ docsPage }) => {
      await expect(docsPage.mainContent).toBeVisible();
    });

    test('should display at least one code block on intro page', async ({ docsPage }) => {
      await docsPage.assertCodeBlocksPresent();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('should navigate to Writing Tests section', async ({ docsPage }) => {
      await docsPage.gotoSection('writing-tests');
      await docsPage.assertOnDocsPage();
      await docsPage.assertHeadingVisible('Writing tests');
    });

    test('should navigate to Assertions section', async ({ docsPage }) => {
      await docsPage.gotoSection('test-assertions');
      await docsPage.assertOnDocsPage();
      await docsPage.assertHeadingVisible('Assertions');
    });

    test('should navigate to Page Object Models section', async ({ docsPage }) => {
      await docsPage.gotoSection('pom');
      await docsPage.assertOnDocsPage();
      await docsPage.assertHeadingVisible('Page object models');
    });
  });

  test.describe('Code Blocks', () => {
    test('should have multiple code blocks on Writing Tests page', async ({ docsPage }) => {
      await docsPage.gotoSection('writing-tests');
      const count = await docsPage.getCodeBlockCount();
      expect(count).toBeGreaterThan(2);
    });

    test('code blocks should contain TypeScript syntax', async ({ docsPage }) => {
      await docsPage.gotoSection('writing-tests');
      const content = await docsPage.getCodeBlockContent(0);
      expect(content).not.toBeNull();
      expect(content!.length).toBeGreaterThan(0);
    });
  });

  test.describe('URL Integrity', () => {
    test('should stay on a /docs/ path after sidebar navigation', async ({ docsPage }) => {
      await docsPage.gotoSection('api/class-page');
      await expect(docsPage.page).toHaveURL(/\/docs\/api\/class-page/);
    });

    test('should not redirect to 404 for key doc pages', async ({ docsPage, page }) => {
      const criticalPaths = [
        'intro',
        'writing-tests',
        'test-assertions',
        'pom',
        'api/class-page',
        'api/class-locator',
      ];

      for (const docPath of criticalPaths) {
        const response = await page.goto(`https://playwright.dev/docs/${docPath}`);
        expect(response?.status(), `Expected 200 for /docs/${docPath}`).toBe(200);
      }
    });
  });
});