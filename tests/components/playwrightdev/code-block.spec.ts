import { test, expect } from '../../../src/fixtures/index.js';
import { PD_CodeBlockComponent } from '../../../src/components/playwrightdev/PD_CodeBlockComponent.js';
import * as allure from 'allure-js-commons';

/**
 * Component Tests - Code Block
 * ---------------------------------------------------------------------------
 * Covers Prism-highlighted code blocks on the Playwright docs pages:
 * rendering, language detection, copy button, and content integrity.
 */
test.beforeEach(async () => {
  await allure.epic('Playwright.dev');
  await allure.feature('Code Block Component');
});

test.describe('Code Block Component', () => {

  test.describe('Rendering & Presence', { tag: ['@component', '@smoke'] }, () => {
    test('should display at least one code block on the intro docs page', async ({ pd_codeBlock, page }) => {
      await allure.allureId('COMP-CB-001');
      await allure.story('Code Block Presence');
      await allure.label('severity', 'critical');

      await allure.step('Assert the first code block is rendered', async () => {
        await pd_codeBlock.assertRendered();
      });

      await allure.step('Assert there is at least one code block on the page', async () => {
        await PD_CodeBlockComponent.assertAtLeastOne(page);
      });
    });

    test('should contain non-empty code text', async ({ pd_codeBlock }) => {
      await allure.allureId('COMP-CB-002');
      await allure.story('Non-Empty Code');
      await allure.label('severity', 'normal');

      await allure.step('Assert the first code block has content', async () => {
        const code = await pd_codeBlock.getCode();
        expect(code.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Language Detection', { tag: ['@component'] }, () => {
    test('should detect a language class on the first code block', async ({ pd_codeBlock }) => {
      await allure.allureId('COMP-CB-003');
      await allure.story('Language Class Detection');
      await allure.label('severity', 'normal');

      await allure.step('Assert the first code block has a detectable language', async () => {
        const lang = await pd_codeBlock.getLanguage();
        expect(lang).not.toBeNull();
        expect(lang!.length).toBeGreaterThan(0);
      });
    });

    test('should find a TypeScript or JavaScript code block on the writing tests page', async ({ page }) => {
      await allure.allureId('COMP-CB-004');
      await allure.story('TypeScript Code Block');
      await allure.label('severity', 'normal');

      await allure.step('Navigate to the writing-tests docs page', async () => {
        await page.goto('/docs/writing-tests');
        await page.waitForLoadState('domcontentloaded');
      });

      await allure.step('Scan all code blocks for a ts/js language', async () => {
        const blocks = await PD_CodeBlockComponent.all(page);
        const languages = await Promise.all(blocks.map(b => b.getLanguage()));
        const hasTsOrJs = languages.some(l => l === 'typescript' || l === 'javascript' || l === 'ts' || l === 'js');
        expect(hasTsOrJs).toBe(true);
      });
    });
  });

  test.describe('Copy Button', { tag: ['@component'] }, () => {
    test('should reveal the copy button on hover', async ({ pd_codeBlock }) => {
      await allure.allureId('COMP-CB-005');
      await allure.story('Copy Button on Hover');
      await allure.label('severity', 'normal');

      await allure.step('Hover over the code block and assert copy button appears', async () => {
        await pd_codeBlock.assertCopyButtonVisible();
      });
    });

    test('should be clickable without throwing an error', async ({ pd_codeBlock }) => {
      await allure.allureId('COMP-CB-006');
      await allure.story('Copy Button Clickable');
      await allure.label('severity', 'minor');

      await allure.step('Click the copy button on the first code block', async () => {
        await pd_codeBlock.clickCopy();
        // No error == copy was triggered; clipboard cannot be asserted in headless.
      });
    });
  });

  test.describe('Multi-block Pages', { tag: ['@component'] }, () => {
    test('should find multiple code blocks on a feature-rich docs page', async ({ page }) => {
      await allure.allureId('COMP-CB-007');
      await allure.story('Multiple Code Blocks');
      await allure.label('severity', 'normal');

      await allure.step('Navigate to the Locators docs page', async () => {
        await page.goto('/docs/locators');
        await page.waitForLoadState('domcontentloaded');
      });

      await allure.step('Assert more than one code block is present', async () => {
        const count = await page.locator('div.theme-code-block').count();
        expect(count).toBeGreaterThan(1);
      });
    });

    test('each code block should have a <pre> element', async ({ page }) => {
      await allure.allureId('COMP-CB-008');
      await allure.story('All Blocks Have Pre');
      await allure.label('severity', 'normal');

      await allure.step('Navigate to the Actions docs page', async () => {
        await page.goto('/docs/input');
        await page.waitForLoadState('domcontentloaded');
      });

      await allure.step('Assert every code block has a pre element', async () => {
        const blocks = await PD_CodeBlockComponent.all(page);
        for (const block of blocks) {
          await expect(block.pre).toBeVisible();
        }
      });
    });
  });
});
