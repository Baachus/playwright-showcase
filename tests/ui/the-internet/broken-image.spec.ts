import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * UI Tests – Broken Images Testing
 */

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Broken Images Testing');
});

test.describe('The Internet – Broken Images Testing', { tag: ['@ui', '@theinternethero', '@brokenImage'] }, () => {
  test('page loads with and three broken images shown', { tag: [] }, async ({ ti_brokenImagePage }) => {
    await allure.allureId('TI-BI-001');
    await allure.story('Valid Login');
    await allure.label('severity', 'normal');

    await allure.step('Navigate to the Broken Images page', async()=> {
      await ti_brokenImagePage.goto();
    });

    await allure.step('Validate Broken Images', async()=>{
        await expect(ti_brokenImagePage.title).toHaveText('Broken Images');
        await expect(await ti_brokenImagePage.getNthImage(0)).toHaveAttribute('src', 'asdf.jpg');
        await expect(await ti_brokenImagePage.getNthImage(1)).toHaveAttribute('src', 'hjkl.jpg');
        await expect(await ti_brokenImagePage.getNthImage(2)).toHaveAttribute('src', 'img/avatar-blank.jpg');

    });
  });
});