import { test, expect } from '../../../src/fixtures/index.js';
import { TI_FileDownloadPage } from '../../../src/pages/the-internet/TI_FileDownloadPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('File Download');
});

test.describe('The Internet – File Download', { tag: ['@ui', '@theinternethero', '@file-download'] }, () => {

  test('page loads with downloadable file links', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FD-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const fdPage = new TI_FileDownloadPage(page);
    await fdPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await fdPage.assertOnPage();
    });

    await allure.step('Assert download links are present', async () => {
      await fdPage.assertLinksExist();
    });
  });

  test('there are multiple downloadable files listed', async ({ page }) => {
    await allure.allureId('TI-FD-002');
    await allure.story('File List');
    await allure.label('severity', 'normal');

    const fdPage = new TI_FileDownloadPage(page);
    await fdPage.goto();

    await allure.step('Assert more than one file link exists', async () => {
      const count = await fdPage.getLinkCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('clicking the first download link triggers a file download', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FD-003');
    await allure.story('Download');
    await allure.label('severity', 'critical');

    const fdPage = new TI_FileDownloadPage(page);
    await fdPage.goto();

    await allure.step('Click first download link and capture file', async () => {
      const filename = await fdPage.downloadFirstFile();
      expect(filename.length).toBeGreaterThan(0);
    });
  });

  test('all file link texts are non-empty', async ({ page }) => {
    await allure.allureId('TI-FD-004');
    await allure.story('File List');
    await allure.label('severity', 'minor');

    const fdPage = new TI_FileDownloadPage(page);
    await fdPage.goto();

    await allure.step('All link texts should be non-empty', async () => {
      const texts = await fdPage.getAllLinkTexts();
      for (const t of texts) {
        expect(t.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
