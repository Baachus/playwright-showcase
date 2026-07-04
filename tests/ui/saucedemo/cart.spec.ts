import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';
import { InventoryItem } from '@pages/saucedemo/SD_InventoryPage.js';


/**
 * UI Tests – Cart Page
 */
test.beforeEach(async()=>{
    await allure.epic('Saucedemo');
    await allure.feature('Cart');
});

test.describe('Checkout Page', { tag: ['@ui', '@cart'] }, () => {
  test('should navigate back to inventory with continue shopping button on cart page', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage }) => {
        await allure.allureId('UI-CART-001');
        await allure.story('Continue Shopping on Cart');
        await allure.label('severity', 'minor');

        await allure.step('Add Item to Cart', async()=>{
            await sd_inventoryPage.goto();
            const [firstItem] = await sd_inventoryPage.getAllItems();
            await sd_inventoryPage.addItemToCart(firstItem.name);
        });

        await allure.step('Navigate to Cart and Click Continue Shopping and Verify on Inventory Page', async()=>{
            await sd_inventoryPage.cartIcon.click();
            await sd_cartPage.continueShoppingBtn.click();
            await sd_inventoryPage.assertOnInventoryPage();
        });
    });

    test('should display item details in the cart', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage }) => {
        await allure.allureId('UI-CART-002');
        await allure.story('Item Details in Shopping on Cart');
        await allure.label('severity', 'normal');

        await allure.step('Add Item to Cart', async()=>{
            await sd_inventoryPage.goto();
            const [firstItem] = await sd_inventoryPage.getAllItems();
            await sd_inventoryPage.addItemToCart(firstItem.name);
        });

        await allure.step('Navigate to Cart and Verify Item Details', async()=>{
            await sd_inventoryPage.cartIcon.click();
            const displayedItem = await sd_cartPage.getItemComponent(0);
            await expect(displayedItem.name).toHaveText('Sauce Labs Backpack');
            await expect(displayedItem.description).toHaveText('carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.');
            await expect(displayedItem.priceLabel).toHaveText('$29.99');
            expect(await displayedItem.getPrice()).toBe(29.99);
        });
    });

    test('should remove item in the cart', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage }) => {
        await allure.allureId('UI-CART-003');
        await allure.story('Remove Item in Cart');
        await allure.label('severity', 'minor');

        await allure.step('Add Item to Cart', async()=>{
            await sd_inventoryPage.goto();
            const [firstItem] = await sd_inventoryPage.getAllItems();
            await sd_inventoryPage.addItemToCart(firstItem.name);
        });

        await allure.step('Navigate to Cart and Remove Item', async()=>{
            await sd_inventoryPage.cartIcon.click();
            const displayedItem = await sd_cartPage.getItemComponent(0);
            await displayedItem.removeButton.click();
        });

        await allure.step('Verify Cart Does not Contain Item', async()=>{
            await expect(sd_inventoryPage.cartBadge).toBeHidden();
        });
    });

    test('should display multiple item details in the cart', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage }) => {
        await allure.allureId('UI-CART-004');
        await allure.story('Item Details for Multiple Items in Cart');
        await allure.label('severity', 'normal');

        let items: InventoryItem[];
        await allure.step('Get all Items', async()=>{
            await sd_inventoryPage.goto();
            items = await sd_inventoryPage.getAllItems();
        });

        for(let count=0; count< 6; count++) {
            await allure.step(`Add ${count+1} Item to Cart and Verify Badge`, async()=>{
                await sd_inventoryPage.addItemToCart(items[count].name);

                // Web-first: retries until the badge renders the new count.
                await expect(sd_inventoryPage.cartBadge).toHaveText(String(count + 1));
            });
        }

        await allure.step('Navigate to Cart and Verify First Item Details', async()=>{
            await sd_inventoryPage.cartIcon.click();
            const displayedItem = await sd_cartPage.getItemComponent(0);
            await expect(displayedItem.name).toHaveText('Sauce Labs Backpack');
            await expect(displayedItem.description).toHaveText('carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.');
            await expect(displayedItem.priceLabel).toHaveText('$29.99');
            expect(await displayedItem.getPrice()).toBe(29.99);
        });

        await allure.step('Verify Second Item Details', async()=>{
            await sd_inventoryPage.cartIcon.click();
            const displayedItem = await sd_cartPage.getItemComponent(1);
            await expect(displayedItem.name).toHaveText('Sauce Labs Bike Light');
            await expect(displayedItem.description).toHaveText("A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.");
            await expect(displayedItem.priceLabel).toHaveText('$9.99');
            expect(await displayedItem.getPrice()).toBe(9.99);
        });

        await allure.step('Verify Third Item Details', async()=>{
            await sd_inventoryPage.cartIcon.click();
            const displayedItem = await sd_cartPage.getItemComponent(2);
            await expect(displayedItem.name).toHaveText('Sauce Labs Bolt T-Shirt');
            await expect(displayedItem.description).toHaveText('Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.');
            await expect(displayedItem.priceLabel).toHaveText('$15.99');
            expect(await displayedItem.getPrice()).toBe(15.99);
        });

        await allure.step('Verify Fourth Item Details', async()=>{
            await sd_inventoryPage.cartIcon.click();
            const displayedItem = await sd_cartPage.getItemComponent(3);
            await expect(displayedItem.name).toHaveText('Sauce Labs Fleece Jacket');
            await expect(displayedItem.description).toHaveText("It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.");
            await expect(displayedItem.priceLabel).toHaveText('$49.99');
            expect(await displayedItem.getPrice()).toBe(49.99);
        });

        await allure.step('Verify Fifth Item Details', async()=>{
            await sd_inventoryPage.cartIcon.click();
            const displayedItem = await sd_cartPage.getItemComponent(4);
            await expect(displayedItem.name).toHaveText('Sauce Labs Onesie');
            await expect(displayedItem.description).toHaveText("Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.");
            await expect(displayedItem.priceLabel).toHaveText('$7.99');
            expect(await displayedItem.getPrice()).toBe(7.99);
        });

        await allure.step('Verify Sixth Item Details', async()=>{
            await sd_inventoryPage.cartIcon.click();
            const displayedItem = await sd_cartPage.getItemComponent(5);
            await expect(displayedItem.name).toHaveText('Test.allTheThings() T-Shirt (Red)');
            await expect(displayedItem.description).toHaveText('This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.');
            await expect(displayedItem.priceLabel).toHaveText('$15.99');
            expect(await displayedItem.getPrice()).toBe(15.99);
        });
    });
});