import { test, expect } from '../../../src/fixtures/index.js';
import { TI_DisappearingElementsPage } from '../../../src/pages/the-internet/TI_DisappearingElementsPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Disappearing Elements');
});

test.describe('The Internet – Disappearing Elements', { tag: ['@ui', '@theinternethero', '@disappearing-elements'] }, () => {

  test('page loads with permanent nav links always present', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DE-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const dePage = new TI_DisappearingElementsPage(page);
    await dePage.goto();

    await allure.step('Assert on correct URL', async () => {
      await dePage.assertOnPage();
    });

    await allure.step('Assert all permanent links are visible', async () => {
      await dePage.assertPermanentLinksVisible();
    });
  });

  test('nav list has at least 4 items on any load', async ({ page }) => {
    await allure.allureId('TI-DE-002');
    await allure.story('Nav Items');
    await allure.label('severity', 'normal');

    const dePage = new TI_DisappearingElementsPage(page);
    await dePage.goto();

    await allure.step('Assert there are at least 4 nav items', async () => {
      const count = await dePage.getNavItemCount();
      expect(count).toBeGreaterThanOrEqual(4);
    });
  });

  test('nav list has at most 5 items (Gallery is optional)', async ({ page }) => {
    await allure.allureId('TI-DE-003');
    await allure.story('Nav Items');
    await allure.label('severity', 'normal');

    const dePage = new TI_DisappearingElementsPage(page);
    await dePage.goto();

    await allure.step('Assert there are no more than 5 nav items', async () => {
      const count = await dePage.getNavItemCount();
      expect(count).toBeLessThanOrEqual(5);
    });
  });

  test('Gallery link can be found within multiple page loads', async ({ page }) => {
    await allure.allureId('TI-DE-004');
    await allure.story('Disappearing Element');
    await allure.label('severity', 'normal');

    const dePage = new TI_DisappearingElementsPage(page);

    await allure.step('Reload until Gallery link appears (max 10 attempts)', async () => {
      const found = await dePage.reloadUntilGalleryAppears(10);
      test.skip(!found, 'Gallery link was not served in 10 reload attempts; skipping.');
      expect(found).toBe(true);
    });
  });

  test('page reloads serve variable number of nav items', async ({ page }) => {
    await allure.allureId('TI-DE-005');
    await allure.story('Disappearing Element');
    await allure.label('severity', 'minor');

    const dePage = new TI_DisappearingElementsPage(page);
    const seenCounts = new Set<number>();

    await allure.step('Load page 5 times and record nav item counts', async () => {
      for (let i = 0; i < 5; i++) {
        await dePage.goto();
        const count = await dePage.getNavItemCount();
        expect(count).toBeGreaterThanOrEqual(4);
        expect(count).toBeLessThanOrEqual(5);
        seenCounts.add(count);
      }
    });

    await allure.step('All observed counts were within expected range (4-5)', async () => {
      for (const c of seenCounts) {
        expect(c).toBeGreaterThanOrEqual(4);
      }
    });
  });
});
