import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * UI Tests – Basic Auth Testing
 */

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Basic Auth Testing');
});

test.describe('The Internet – Basic Authorization Testing', { tag: ['@ui', '@theinternethero', '@basicAuth'] }, () => {
  test('page loads with valid login', { tag: [] }, async ({ ti_basicAuthPage }) => {
    await allure.allureId('TI-BA-001');
    await allure.story('Valid Login');
    await allure.label('severity', 'normal');

    await allure.step('Navigate to the Auth and Enter Valid Login', async()=> {
      await ti_basicAuthPage.validLogin();
    });

    await allure.step('Validate Title and Text on Valid Login', async()=>{
        await expect(ti_basicAuthPage.title).toHaveText('Basic Auth');
        await expect(ti_basicAuthPage.text).toHaveText('Congratulations! You must have the proper credentials.');
    });
  });

  test('page shows not authorized on cancelled login', { tag: [] }, async ({ ti_basicAuthPage }, testInfo) => {
    testInfo.skip(
    testInfo.project.name === 'The Internet Chromium' || testInfo.project.name === 'The Internet Webkit',
    'URL credential injection not supported in Chromium or WebKit'
  );
    
    await allure.allureId('TI-BA-002');
    await allure.story('Invalid Login');
    await allure.label('severity', 'normal');

    await allure.step('Navigate to Basic Auth and Dismiss the Credential Dialog', async () => {
      await ti_basicAuthPage.invalidLogin();
    });

    await allure.step('Validate Not Authorized Text is Shown', async () => {
      await expect(ti_basicAuthPage.invalidTitle).toBeVisible();
    });
  });
});