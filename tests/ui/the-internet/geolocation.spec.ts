import { test, expect } from '../../../src/fixtures/index.js';
import { TI_GeolocationPage } from '../../../src/pages/the-internet/TI_GeolocationPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Geolocation');
});

test.describe('The Internet – Geolocation', { tag: ['@ui', '@theinternethero', '@geolocation'] }, () => {

  test('page loads with Where Am I button', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-GEO-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const geoPage = new TI_GeolocationPage(page);
    await geoPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await geoPage.assertOnPage();
    });

    await allure.step('Assert button is visible', async () => {
      await expect(geoPage.whereAmIButton).toBeVisible();
    });
  });

  test('coordinates are returned when geolocation permission is granted', { tag: ['@smoke'] }, async ({ browser }) => {
    await allure.allureId('TI-GEO-002');
    await allure.story('Geolocation');
    await allure.label('severity', 'critical');

    // Create a context with geolocation permission and a mock location
    const context = await browser.newContext({
      geolocation: { latitude: 51.5074, longitude: -0.1278 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();
    const geoPage = new TI_GeolocationPage(page);
    await geoPage.goto();

    await allure.step('Click Where Am I and wait for coordinates', async () => {
      await geoPage.clickWhereAmI();
      await geoPage.waitForCoordinates();
    });

    await allure.step('Assert coordinates are populated', async () => {
      await geoPage.assertCoordinatesVisible();
      await geoPage.assertCoordinatesPopulated();
    });

    await allure.step('Assert coordinates match the mocked location', async () => {
      const lat = await geoPage.getLatitude();
      const lng = await geoPage.getLongitude();
      expect(parseFloat(lat)).toBeCloseTo(51.5074, 2);
      expect(parseFloat(lng)).toBeCloseTo(-0.1278, 2);
    });

    await context.close();
  });
});
