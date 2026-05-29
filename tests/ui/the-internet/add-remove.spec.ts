import { faker } from '@faker-js/faker';
import { test, expect } from '../../../src/fixtures/index.js';
import { TI_AddRemovePage } from '../../../src/pages/the-internet/TI_AddRemovePage.js';
import * as allure from 'allure-js-commons';

/**
 * UI Tests – A/B Testing Page
 *
 * The /abtest endpoint on the-internet.herokuapp.com randomly serves one of
 * two variants per page load:
 *   • "A/B Test Control"     – the baseline experience
 *   • "A/B Test Variation 1" – an alternate experience
 *
 * Because the variant is non-deterministic, tests are written to accept
 * either variant unless they are specifically testing a single variant in
 * isolation (achieved by reloading until the desired variant appears).
 */

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('A/B Testing');
});

test.describe('The Internet – Add Remove Element Testing', { tag: ['@ui', '@theinternethero', '@addRemove'] }, () => {

  test('page loads and displays a valid variant heading', { tag: [] }, async ({ ti_addRemovePage }) => {
    await allure.allureId('TI-AR-001');
    await allure.story('Add Element');
    await allure.label('severity', 'normal');

    await allure.step('Add an Element and Verify Its Visible', async () => {
      await ti_addRemovePage.addElement.click();
      await expect(ti_addRemovePage.deleteElement).toBeVisible();
    });
  });

  test('should add multiple delete buttons and remove them all', async({ ti_addRemovePage })=>{
    await allure.allureId('TI-AR-002');
    await allure.story('Remove Random Delete Elements');
    await allure.label('severity', 'normal');

    const numberOfDeletes = faker.number.int({max: 20});

    await allure.step(`Add ${numberOfDeletes} Elements`, async()=>{
      for(let i = 0; i < numberOfDeletes; i++) {
        await ti_addRemovePage.addElement.click();
      }
      await expect(await ti_addRemovePage.deleteElement).toHaveCount(numberOfDeletes);
    });

    await allure.step('Remove all Delete Buttons', async()=>{
      for(let i = 0; i < numberOfDeletes; i++) {
        await (await ti_addRemovePage.getNthDeleteButton(0)).click();
      }
      await expect(await ti_addRemovePage.deleteElement).toBeHidden();
    });
  });
});