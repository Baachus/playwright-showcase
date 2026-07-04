import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';
import { faker } from '@faker-js/faker';
import { InventoryItem } from '@pages/saucedemo/SD_InventoryPage.js';


/**
 * UI Tests – Checkout Page
 */
test.beforeEach(async()=>{
    await allure.epic('Saucedemo');
    await allure.feature('Checkout');
});

test.describe('Checkout Page', { tag: ['@ui', '@checkout'] }, () => {
  test('should add a single item to the cart and checkout', { tag: ['@smoke'] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage,
    sd_infoPage,
    sd_verificationPage,
    sd_confirmationPage }) => {
    await allure.allureId('UI-CK-001');
    await allure.story('Checkout With One Item');
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
    
    await allure.step('Verify Information and Confirm', async()=>{
        await expect(sd_verificationPage.paymentInformation).toHaveText('SauceCard #31337');
        await expect(sd_verificationPage.shippingInformation).toHaveText('Free Pony Express Delivery!');
        await expect(sd_verificationPage.itemTotal).toHaveText('Item total: $29.99');
        await expect(sd_verificationPage.tax).toHaveText('Tax: $2.40');
        await expect(sd_verificationPage.total).toHaveText('Total: $32.39');
        await sd_verificationPage.finishBtn.click();
    });

    await allure.step('Verify Purchase Completed and Navigate back to Inventory', async()=>{
        await expect(sd_confirmationPage.thankYouLabel).toHaveText('Thank you for your order!');
        await sd_confirmationPage.backHomeBtn.click();
        await sd_inventoryPage.assertOnInventoryPage();
    });
  });

  test('should add multiple items to the cart and checkout', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage,
    sd_infoPage,
    sd_verificationPage,
    sd_confirmationPage }) => {
    await allure.allureId('UI-CK-002');
    await allure.story('Checkout With Multiple Items');
    await allure.label('severity', 'normal');

    let items: InventoryItem[];
    await allure.step('Add Item to Cart and Verify Badge', async()=>{
        await sd_inventoryPage.goto();
        items = await sd_inventoryPage.getAllItems();
        await sd_inventoryPage.addItemToCart(items[0].name);

        const count = await sd_inventoryPage.getCartCount();
        expect(count).toBe(1);
    });
    
    await allure.step('Add Item to Cart and Verify Badge', async()=>{
        await sd_inventoryPage.addItemToCart(items[1].name);

        const count = await sd_inventoryPage.getCartCount();
        expect(count).toBe(2);
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
    
    await allure.step('Verify Information and Confirm', async()=>{
        await expect(sd_verificationPage.paymentInformation).toHaveText('SauceCard #31337');
        await expect(sd_verificationPage.shippingInformation).toHaveText('Free Pony Express Delivery!');
        await expect(sd_verificationPage.itemTotal).toHaveText('Item total: $39.98');
        await expect(sd_verificationPage.tax).toHaveText('Tax: $3.20');
        await expect(sd_verificationPage.total).toHaveText('Total: $43.18');
        await sd_verificationPage.finishBtn.click();
    });

    await allure.step('Verify Purchase Completed and Navigate back to Inventory', async()=>{
        await expect(sd_confirmationPage.thankYouLabel).toHaveText('Thank you for your order!');
        await sd_confirmationPage.backHomeBtn.click();
        await sd_inventoryPage.assertOnInventoryPage();
    });
  });
  
  test('should add all 6 items to the cart and checkout', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage,
    sd_infoPage,
    sd_verificationPage,
    sd_confirmationPage }) => {
    await allure.allureId('UI-CK-003');
    await allure.story('Checkout With All Items');
    await allure.label('severity', 'normal');

    let items: InventoryItem[];
    await allure.step('Get all Items', async()=>{
        await sd_inventoryPage.goto();
        items = await sd_inventoryPage.getAllItems();
    });

    for(let count=0; count< 6; count++) {
        await allure.step(`Add ${count+1} Item to Cart and Verify Badge`, async()=>{
            await sd_inventoryPage.addItemToCart(items[count].name);

            const cartCount = await sd_inventoryPage.getCartCount();
            expect(cartCount).toBe(count+1);
        });
    }

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

    await allure.step('Verify Information and Confirm', async()=>{
        await expect(sd_verificationPage.paymentInformation).toHaveText('SauceCard #31337');
        await expect(sd_verificationPage.shippingInformation).toHaveText('Free Pony Express Delivery!');
        await expect(sd_verificationPage.itemTotal).toHaveText('Item total: $129.94');
        await expect(sd_verificationPage.tax).toHaveText('Tax: $10.40');
        await expect(sd_verificationPage.total).toHaveText('Total: $140.34');
        await sd_verificationPage.finishBtn.click();
    });

    await allure.step('Verify Purchase Completed and Navigate back to Inventory', async()=>{
        await expect(sd_confirmationPage.thankYouLabel).toHaveText('Thank you for your order!');
        await sd_confirmationPage.backHomeBtn.click();
        await sd_inventoryPage.assertOnInventoryPage();
    });
  });
  
  test('should show no items added and checkout', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage,
    sd_infoPage,
    sd_verificationPage,
    sd_confirmationPage }) => {
    await allure.allureId('UI-CK-004');
    await allure.story('Checkout With No Items');
    await allure.label('severity', 'trivial');

    await allure.step('Navigate to Inventory Page', async()=>{
        await sd_inventoryPage.goto();
    });

    await allure.step('Click the Cart and Navigate to the Cart Information Page', async()=>{
        await sd_inventoryPage.cartIcon.click();
    });

    await allure.step('Fill in Shipping Information', async()=>{
        await sd_cartPage.checkoutBtn.click();
        await sd_infoPage.firstName.fill(faker.person.firstName());
        await sd_infoPage.lastName.fill(faker.person.lastName());
        await sd_infoPage.zipCode.fill(faker.location.zipCode());
        await sd_infoPage.checkoutBtn.click();
    });
    
    await allure.step('Verify Information and Confirm', async()=>{
        await expect(sd_verificationPage.paymentInformation).toHaveText('SauceCard #31337');
        await expect(sd_verificationPage.shippingInformation).toHaveText('Free Pony Express Delivery!');
        await expect(sd_verificationPage.itemTotal).toHaveText('Item total: $0');
        await expect(sd_verificationPage.tax).toHaveText('Tax: $0.00');
        await expect(sd_verificationPage.total).toHaveText('Total: $0.00');
        await sd_verificationPage.finishBtn.click();
    });

    await allure.step('Verify Purchase Completed and Navigate back to Inventory', async()=>{
        await expect(sd_confirmationPage.thankYouLabel).toHaveText('Thank you for your order!');
        await sd_confirmationPage.backHomeBtn.click();
        await sd_inventoryPage.assertOnInventoryPage();
    });
  });
  
  test('should return to inventory when cancel clicked', { tag: [] }, 
    async ({ 
    sd_inventoryPage,
    sd_cartPage,
    sd_infoPage,
    sd_verificationPage }) => {
    await allure.allureId('UI-CK-005');
    await allure.story('Cancel On Confirmation Page');
    await allure.label('severity', 'trivial');

    await allure.step('Add Item to Cart', async()=>{
        await sd_inventoryPage.goto();
        const [firstItem] = await sd_inventoryPage.getAllItems();
        await sd_inventoryPage.addItemToCart(firstItem.name);
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
    
    await allure.step('Cancel Confirmation and Verify on Inventory Page with Cart Still Filled', async()=>{
        await sd_verificationPage.cancelBtn.click();
        await sd_inventoryPage.assertOnInventoryPage();
        
        const count = await sd_inventoryPage.getCartCount();
        expect(count).toBe(1);
    });
  });
});