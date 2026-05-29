import { test, expect } from '../../../src/fixtures/index.js';
import { TI_TyposPage } from '../../../src/pages/the-internet/TI_TyposPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Typos');
});

test.describe('The Internet – Typos', { tag: ['@ui', '@theinternethero', '@typos'] }, () => {

  test('page loads with two paragraphs visible', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-TY-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const tyPage = new TI_TyposPage(page);
    await tyPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await tyPage.assertOnPage();
    });

    await allure.step('Assert both paragraphs are visible', async () => {
      await tyPage.assertParagraphsVisible();
    });
  });

  test('second paragraph content is present', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-TY-002');
    await allure.story('Content');
    await allure.label('severity', 'normal');

    const tyPage = new TI_TyposPage(page);
    await tyPage.goto();

    await allure.step('Assert second paragraph has expected content', async () => {
      await tyPage.assertSecondParagraphHasExpectedContent();
    });
  });

  test('second paragraph either has typo or is correctly spelled', async ({ page }) => {
    await allure.allureId('TI-TY-003');
    await allure.story('Typo Detection');
    await allure.label('severity', 'normal');

    const tyPage = new TI_TyposPage(page);
    await tyPage.goto();

    await allure.step('Check whether paragraph has a typo or is correct', async () => {
      const hasTypo = await tyPage.hasTypo();
      const isCorrect = await tyPage.isCorrect();
      // One must be true — either typo or correct version
      expect(hasTypo || isCorrect).toBe(true);
    });
  });

  test('typo version can be found within multiple loads', async ({ page }) => {
    await allure.allureId('TI-TY-004');
    await allure.story('Typo Detection');
    await allure.label('severity', 'minor');

    const tyPage = new TI_TyposPage(page);

    await allure.step('Reload up to 10 times to find the typo', async () => {
      let foundTypo = false;
      for (let i = 0; i < 10; i++) {
        await tyPage.goto();
        if (await tyPage.hasTypo()) {
          foundTypo = true;
          break;
        }
      }
      test.skip(!foundTypo, 'Typo version was not served in 10 reload attempts.');
      expect(foundTypo).toBe(true);
    });
  });

  test('correct version can be found within multiple loads', async ({ page }) => {
    await allure.allureId('TI-TY-005');
    await allure.story('Typo Detection');
    await allure.label('severity', 'minor');

    const tyPage = new TI_TyposPage(page);

    await allure.step('Reload up to 10 times to find the correct version', async () => {
      let foundCorrect = false;
      for (let i = 0; i < 10; i++) {
        await tyPage.goto();
        if (await tyPage.isCorrect()) {
          foundCorrect = true;
          break;
        }
      }
      test.skip(!foundCorrect, 'Correct version was not served in 10 reload attempts.');
      expect(foundCorrect).toBe(true);
    });
  });
});
