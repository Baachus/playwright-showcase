import { BrowserContext, Page } from '@playwright/test';
import { test, expect } from '../../../../src/fixtures/index.js';
import { SD_LoginPage } from '../../../../src/pages/saucedemo/SD_LoginPage.js';
import { SD_InventoryPage } from '../../../../src/pages/saucedemo/SD_InventoryPage.js';
import * as allure from 'allure-js-commons';


/**
 * UI Tests – Inventory Page
 */
test.beforeEach(async()=>{
    await allure.epic('Saucedemo');
    await allure.feature('Inventory');
});

let context: BrowserContext;
let page: Page;
let loginPage: SD_LoginPage;

test.describe('Inventory Page', { tag: ['@ui', '@inventory', '@problem_user'] }, () => {
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

    test('should display the inventory page invalid images', async ({ sd_inventoryPage }) => {
        await allure.allureId('UI-PUI-001');
        await allure.story('Problem User Images');
        await allure.label('severity', 'minor');

        // Wrap the problem_user page (logged in via beforeEach) in a POM so we
        // can call the same helper methods used by the standard_user fixture.
        const problemInventoryPage = new SD_InventoryPage(page);

        await allure.step('Collect image sources for both users', async () => {
            const problemSrcs  = await problemInventoryPage.getAllImageSrcs();
            const standardSrcs = await sd_inventoryPage.getAllImageSrcs();

            expect(problemSrcs,  'problem_user should have 6 inventory images').toHaveLength(6);
            expect(standardSrcs, 'standard_user should have 6 inventory images').toHaveLength(6);

            await allure.step('Verify all 6 items show the same dog image', async () => {
                const [firstSrc, ...rest] = problemSrcs;

                // Every item must resolve to the exact same dog-picture URL
                for (let i = 0; i < rest.length; i++) {
                    expect(
                        rest[i],
                        `Item ${i + 2} should show the dog image (same src as item 1)`
                    ).toBe(firstSrc);
                }
            });

            await allure.step('Verify each problem_user image differs from the standard_user image', async () => {
                for (let i = 0; i < 6; i++) {
                    expect(
                        problemSrcs[i],
                        `Item ${i + 1}: problem_user image should not match standard_user image`
                    ).not.toBe(standardSrcs[i]);
                }
            });
        });
    });

    test('should not be able to add all items to cart', async ({}) => {
        await allure.allureId('UI-PUI-002');
        await allure.story('Problem User Add to Cart');
        await allure.label('severity', 'trivial');

        // Wrap the problem_user page (logged in via beforeEach) in a POM so we
        // can call the same helper methods used by the standard_user fixture.
        const problemInventoryPage = new SD_InventoryPage(page);

        await allure.step('Collect image sources for both users', async () => {
            const items  = await problemInventoryPage.getAllItems();

            await allure.step('Try to Add all 6 items to Cart', async () => {
                // Every item must resolve to the exact same dog-picture URL
                for (let i = 0; i < items.length; i++) {
                    await problemInventoryPage.addItemToCart(items[i].name);
                }
            });

            await allure.step('Verify Cart Does not Have 6 items', async () => {
                await expect(await problemInventoryPage.getCartCount()).toBe(3)
            });
        });
    });
});