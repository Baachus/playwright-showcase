import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';
import { faker } from '@faker-js/faker';


/**
 * UI Tests – Checkout Page
 */

test.describe('Checkout Page', { tag: ['@ui'] }, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'UI Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Checkout Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test('should add a single item to the cart and checkout', { 
    annotation: [{ type: 'story', description: 'Purchase' }, 
    { type: 'severity', description: 'critical' }], 
    tag: ['@smoke'] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage,
    sd_infoPage,
    sd_verificationPage,
    sd_confirmationPage }) => {
        await allure.label('severity', 'critical');
        await allure.step('Add Item to Cart and Verify Badge', async()=>{
            await sd_inventoryPage.goto();
            const [firstItem] = await sd_inventoryPage.getAllItems();
            await sd_inventoryPage.addItemToCart(firstItem.name);

            const count = await sd_inventoryPage.getCartCount();
            expect(count).toBe(1);
        });

        await allure.step('Click the Cart and Navigate to the Cart Information Page', async()=>{
            await sd_inventoryPage.cartBadge.click();
        });

        await allure.step('Fill in Shipping Information', async()=>{
            await sd_cartPage.checkoutBtn.click();
            await sd_infoPage.firstName.fill(faker.person.firstName());
            await sd_infoPage.lastName.fill(faker.person.lastName());
            await sd_infoPage.zipCode.fill(faker.location.zipCode());
            await sd_infoPage.checkoutBtn.click();
        });

        await allure.step('Verify Shipping Information and Confirm', async()=>{
            await sd_verificationPage.finishBtn.click();
        });

        await allure.step('Verify Purchase Completed and Navigate back to Inventory', async()=>{
            await expect(await sd_confirmationPage.thankYouLabel).toHaveText('Thank you for your order!');
            await sd_confirmationPage.backHomeBtn.click();
            await sd_inventoryPage.assertOnInventoryPage();
        });
  });
});