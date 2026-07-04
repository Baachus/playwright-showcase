import { BrowserContext, Page } from '@playwright/test';
import { test, expect } from '../../../../src/fixtures/index.js';
import { SD_LoginPage } from '../../../../src/pages/saucedemo/SD_LoginPage.js';
import { SD_InventoryPage } from '../../../../src/pages/saucedemo/SD_InventoryPage.js';
import * as allure from 'allure-js-commons';
import { SD_CartPage } from '@pages/saucedemo/SD_CartPage.js';
import { SD_InfoPage } from '@pages/saucedemo/checkout/SD_InfoPage.js';
import { faker } from '@faker-js/faker';


/**
 * UI Tests – Checkout Page
 */
test.beforeEach(async()=>{
    await allure.epic('Saucedemo');
    await allure.feature('Shipping Information');
});

let context: BrowserContext;
let page: Page;
let loginPage: SD_LoginPage;

test.describe('Inventory Page', { tag: ['@ui', '@shippingInfo', '@problem_user'] }, () => {
    test.beforeEach('Login with the problem user', async({ browser, sd_inventoryPage })=>{
        context = await browser.newContext();
        page = await context.newPage();
        loginPage = new SD_LoginPage(page);

        await allure.step('Navigate to login page without utilizing stored authentication', async()=>{
            await loginPage.goto();
        });

        await allure.step('Login with bad user and password and verify error', async()=>{
            await loginPage.login('problem_user');
            await sd_inventoryPage.assertOnInventoryPage();
        });
    });

    test('should be unable to add last name', async ({ sd_inventoryPage }) => {
        await allure.allureId('UI-PUSI-001');
        await allure.story('Problem User Shipping');
        await allure.label('severity', 'minor');

        // Wrap the problem_user page (logged in via beforeEach) in a POM so we
        // can call the same helper methods used by the standard_user fixture.
        const problemInventoryPage = new SD_InventoryPage(page);
        const problemCartPage = new SD_CartPage(page);
        const problemInfoPage = new SD_InfoPage(page);

        await allure.step('Collect image sources for both users', async () => {
            const items  = await problemInventoryPage.getAllItems();

            await allure.step('Add Item to Cart and Navigate to Cart page', async () => {
                await problemInventoryPage.addItemToCart(items[0].name);
                await problemInventoryPage.cartBadge.click();
            });

            await allure.step('Continue to Information Page', async () => {
                await problemCartPage.checkoutBtn.click();
            });

            await allure.step('Continue to Information Page', async () => {
                const firstName = faker.person.firstName();
                const lastName = faker.person.lastName();
                const zipCode = faker.location.zipCode();

                await problemInfoPage.firstName.fill(firstName);
                await problemInfoPage.lastName.fill(lastName);
                await problemInfoPage.zipCode.fill(zipCode);

                await expect(problemInfoPage.firstName).toHaveText('');
                await expect(problemInfoPage.lastName).toBeEmpty();
                await expect(problemInfoPage.zipCode).toHaveText('');
            });
        });
    });
});