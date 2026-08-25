import { test, expect } from '../../src/fixtures/index.js';
import { SD_LoginPage } from '@pages/saucedemo/SD_LoginPage.js';
import * as allure from 'allure-js-commons';
import { Scenario, Background, Given, When, Then, And } from '@utils/bdd.utils.js';

/**
 * BDD-style example -- Saucedemo Login
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrates writing scenarios with Given/When/Then/And instead of raw
 * allure.step() calls. No Cucumber, no .feature files: the keywords are just
 * thin wrappers (see src/utils/bdd.utils.ts) that prefix the Allure step
 * title, so the report renders the same nested Given/When/Then tree under a
 * "Scenario:" heading that a cucumber-js run would produce.
 */

test.beforeEach(async () => {
  await allure.epic('Saucedemo');
  await allure.feature('Authentication');
});

test.describe('Saucedemo – Authentication (BDD)', { tag: ['@ui', '@login', '@bdd'] }, () => {
  test('logs in successfully with a valid user', { tag: ['@smoke'] }, async ({ browser }) => {
    await allure.allureId('UI-LG-BDD-001');
    await allure.label('severity', 'critical');

    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await Scenario('Standard user logs in with valid credentials', async () => {
      await Background(async () => {
        await Given('the user is on the login page', async () => {
          await loginPage.goto();
        });
      });

      await When('the user submits valid credentials', async () => {
        await loginPage.login('standard_user');
      });

      await Then('the user is redirected to the inventory page', async () => {
        await expect(page).toHaveURL(/inventory/);
      });

      await And('the inventory list is visible', async () => {
        await expect(page.locator('.inventory_list')).toBeVisible();
      });
    });

    await context.close();
  });

  test('shows an error for invalid credentials', async ({ browser }) => {
    await allure.allureId('UI-LG-BDD-002');
    await allure.label('severity', 'critical');

    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await Scenario('Login is rejected for an unknown user', async () => {
      await Given('the user is on the login page', async () => {
        await loginPage.goto();
      });

      await When('the user submits a username and password that do not match', async () => {
        await loginPage.login('bad_user', 'bad_pass');
      });

      await Then('an error message is displayed', async () => {
        await loginPage.assertErrorVisible('Username and password do not match');
      });

      await And('the error can be dismissed', async () => {
        await loginPage.closeError();
        await loginPage.assertErrorHidden();
      });
    });

    await context.close();
  });

  test('shows an error for a locked out user', async ({ browser }) => {
    await allure.allureId('UI-LG-BDD-003');
    await allure.label('severity', 'critical');

    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await Scenario('Login is rejected for a locked out user', async () => {
      await Given('the user is on the login page', async () => {
        await loginPage.goto();
      });

      await When('the user submits credentials for a locked out account', async () => {
        await loginPage.login('locked_out_user');
      });

      await Then('a locked-out error message is displayed', async () => {
        await loginPage.assertErrorVisible('Epic sadface: Sorry, this user has been locked out.');
      });
    });

    await context.close();
  });
});
