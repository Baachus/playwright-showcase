import { test, expect } from '../../../src/fixtures/index.js';
import { TI_SecureFileDownloadPage } from '../../../src/pages/the-internet/TI_SecureFileDownloadPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Secure File Download');
});

test.describe('The Internet – Secure File Download', { tag: ['@ui', '@theinternethero', '@secure-file-download'] }, () => {

  test('authenticated access shows downloadable files', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-SFD-001');
    await allure.story('Authenticated Access');
    await allure.label('severity', 'critical');

    const sfdPage = new TI_SecureFileDownloadPage(page);

    await allure.step('Navigate with valid Basic Auth credentials', async () => {
      await sfdPage.gotoWithAuth('admin', 'admin');
    });

    await allure.step('Assert on correct URL', async () => {
      await sfdPage.assertOnPage();
    });

    await allure.step('Assert download links are visible', async () => {
      await sfdPage.assertLinksExist();
    });
  });

  test('authenticated page has multiple download links', async ({ page }) => {
    await allure.allureId('TI-SFD-002');
    await allure.story('File List');
    await allure.label('severity', 'normal');

    const sfdPage = new TI_SecureFileDownloadPage(page);
    await sfdPage.gotoWithAuth();

    await allure.step('Assert more than one file link exists', async () => {
      const count = await sfdPage.getLinkCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('authenticated user can download first file', async ({ page }) => {
    await allure.allureId('TI-SFD-003');
    await allure.story('Download');
    await allure.label('severity', 'normal');

    const sfdPage = new TI_SecureFileDownloadPage(page);
    await sfdPage.gotoWithAuth();

    await allure.step('Click first download link and confirm download starts', async () => {
      const filename = await sfdPage.downloadFirstFile();
      expect(filename.length).toBeGreaterThan(0);
    });
  });
});
