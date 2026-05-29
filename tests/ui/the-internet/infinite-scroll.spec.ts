import { test, expect } from '../../../src/fixtures/index.js';
import { TI_InfiniteScrollPage } from '../../../src/pages/the-internet/TI_InfiniteScrollPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Infinite Scroll');
});

test.describe('The Internet – Infinite Scroll', { tag: ['@ui', '@theinternethero', '@infinite-scroll'] }, () => {

  test('page loads with initial paragraphs', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-IS-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const isPage = new TI_InfiniteScrollPage(page);
    await isPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await isPage.assertOnPage();
    });

    await allure.step('Assert initial paragraphs are visible', async () => {
      await isPage.assertParagraphsExist();
    });
  });

  test('scrolling down adds more paragraphs', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-IS-002');
    await allure.story('Scroll Loading');
    await allure.label('severity', 'critical');

    const isPage = new TI_InfiniteScrollPage(page);
    await isPage.goto();

    await allure.step('Count initial paragraphs', async () => {
      const initialCount = await isPage.getParagraphCount();
      expect(initialCount).toBeGreaterThan(0);

      await allure.step('Scroll down once to trigger load', async () => {
        await isPage.scrollToBottom();
      });

      await allure.step('Assert more paragraphs have been appended', async () => {
        await isPage.assertMoreParagraphsAfterScroll(initialCount);
      });
    });
  });

  test('multiple scrolls continue to add paragraphs', async ({ page }) => {
    await allure.allureId('TI-IS-003');
    await allure.story('Scroll Loading');
    await allure.label('severity', 'normal');

    const isPage = new TI_InfiniteScrollPage(page);
    await isPage.goto();

    await allure.step('Record paragraph count after each scroll', async () => {
      const counts: number[] = [];
      counts.push(await isPage.getParagraphCount());

      for (let i = 0; i < 2; i++) {
        await isPage.scrollToBottom();
        counts.push(await isPage.getParagraphCount());
      }

      // Each subsequent count should be greater than the previous
      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]).toBeGreaterThan(counts[i - 1]);
      }
    });
  });
});
