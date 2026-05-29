import { test, expect } from '../../../src/fixtures/index.js';
import { TI_DigestAuthPage } from '../../../src/pages/the-internet/TI_DigestAuthPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Digest Auth');
});

test.describe('The Internet – Digest Auth', { tag: ['@ui', '@theinternethero', '@digest-auth'] }, () => {

  test('valid credentials grant access to protected page', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
    testInfo.skip(
      testInfo.project.name === 'The Internet Chromium' || testInfo.project.name === 'The Internet Webkit',
      'URL credential injection not supported in Chromium or WebKit'
    );

    await allure.allureId('TI-DA-001');
    await allure.story('Valid Login');
    await allure.label('severity', 'critical');

    const daPage = new TI_DigestAuthPage(page);

    await allure.step('Navigate with valid credentials', async () => {
      await daPage.validLogin('admin', 'admin');
    });

    await allure.step('Assert success message is visible', async () => {
      await daPage.assertLoginSuccess();
    });

    await allure.step('Assert on correct URL', async () => {
      await daPage.assertOnPage();
    });
  });

  test('page title confirms it is the Digest Auth page', async ({ page }, testInfo) => {
    testInfo.skip(
      testInfo.project.name === 'The Internet Chromium' || testInfo.project.name === 'The Internet Webkit',
      'URL credential injection not supported in Chromium or WebKit'
    );

    await allure.allureId('TI-DA-002');
    await allure.story('Valid Login');
    await allure.label('severity', 'normal');

    const daPage = new TI_DigestAuthPage(page);

    await allure.step('Navigate with valid credentials', async () => {
      await daPage.validLogin();
    });

    await allure.step('Assert page heading is Digest Auth', async () => {
      await expect(daPage.title).toBeVisible();
    });
  });
});
