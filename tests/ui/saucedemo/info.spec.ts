import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';
import { faker } from '@faker-js/faker';


/**
 * UI Tests – Shipping Information Page
 */
test.beforeEach(async()=>{
    await allure.epic('Saucedemo');
    await allure.feature('Checkout');
});

test.describe('Shipping Information Page', { tag: ['@ui', '@shippingInfo'] }, () => {
  test('should clear info when cancel is pressed', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage,
    sd_infoPage }) => {
        await allure.allureId('UI-SI-001');
        await allure.story('Clear Info with Cancel');
        await allure.label('severity', 'normal');

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const zipCode = faker.location.zipCode();

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
            await sd_infoPage.firstName.fill(firstName);
            await sd_infoPage.lastName.fill(lastName);
            await sd_infoPage.zipCode.fill(zipCode);
        });

        await allure.step('Click Cancel and Return to Shipping Information', async()=>{
            await sd_infoPage.cancelBtn.click();
            await sd_inventoryPage.cartBadge.click();
            await sd_cartPage.checkoutBtn.click();
        });

        await allure.step('Verify No Information in Fields', async()=>{
            await expect(await sd_infoPage.firstName).toBeEmpty();
            await expect(await sd_infoPage.lastName).toBeEmpty();
            await expect(await sd_infoPage.zipCode).toBeEmpty();
        });
    });

    test('should show correct title on shipping information', { tag: [] }, 
    async ({ 
    sd_infoPage }) => {
        await allure.allureId('UI-SI-002');
        await allure.story('Shipping Information Title');
        await allure.label('severity', 'trivial');

        await allure.step('Navigate to shipping Information and Verify Title', async()=>{
            await sd_infoPage.goto();
            expect(await sd_infoPage.checkoutTitle).toHaveText('Checkout: Your Information');
        });
    });


    test('should show error with missing information', { tag: [] }, 
    async ({ 
    sd_infoPage }) => {
        await allure.allureId('UI-SI-003');
        await allure.story('Shipping Information Missing Information');
        await allure.label('severity', 'critical');

        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const zipCode = faker.location.zipCode();

        await allure.step('Navigate to shipping Information and Enter Last Name and Postal', async()=>{
            await sd_infoPage.goto();
            await sd_infoPage.lastName.fill(lastName);
            await sd_infoPage.zipCode.fill(zipCode);
            await sd_infoPage.checkoutBtn.click();
        });

        await allure.step('Verify Missing First Name and Clear', async()=>{
            const errorIcon = await sd_infoPage.errorIcon;
            await expect(errorIcon).toHaveCount(4);
            await expect(sd_infoPage.errorAlert).toHaveText('Error: First Name is required');
            await sd_infoPage.firstName.fill('');
            await sd_infoPage.lastName.fill('');
            await sd_infoPage.zipCode.fill('');
        });
        
        await allure.step('Enter First Name and Postal', async()=>{
            await sd_infoPage.goto();
            await sd_infoPage.firstName.fill(firstName);
            await sd_infoPage.zipCode.fill(zipCode);
            await sd_infoPage.checkoutBtn.click();
        });

        await allure.step('Verify Missing Last Name and Clear', async()=>{
            const errorIcon = await sd_infoPage.errorIcon;
            await expect(errorIcon).toHaveCount(4);
            await expect(sd_infoPage.errorAlert).toHaveText('Error: Last Name is required');
            await sd_infoPage.firstName.fill('');
            await sd_infoPage.lastName.fill('');
            await sd_infoPage.zipCode.fill('');
        });
        
        await allure.step('Enter First Name and Last name', async()=>{
            await sd_infoPage.goto();
            await sd_infoPage.firstName.fill(firstName);
            await sd_infoPage.lastName.fill(lastName);
            await sd_infoPage.checkoutBtn.click();
        });

        await allure.step('Verify Missing Postal Code', async()=>{
            const errorIcon = await sd_infoPage.errorIcon;
            await expect(errorIcon).toHaveCount(4);
            await expect(sd_infoPage.errorAlert).toHaveText('Error: Postal Code is required');
        });
    });
});