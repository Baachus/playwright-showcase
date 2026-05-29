import { test, expect } from '../../../src/fixtures/index.js';
import { TI_FileUploadPage } from '../../../src/pages/the-internet/TI_FileUploadPage.js';
import * as allure from 'allure-js-commons';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('File Upload');
});

test.describe('The Internet – File Upload', { tag: ['@ui', '@theinternethero', '@file-upload'] }, () => {

  test('page loads with file input and upload button', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FU-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const fuPage = new TI_FileUploadPage(page);
    await fuPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await fuPage.assertOnPage();
    });

    await allure.step('Assert upload form elements are visible', async () => {
      await fuPage.assertUploadPageVisible();
    });
  });

  test('uploading a file shows success and the filename', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FU-002');
    await allure.story('Upload');
    await allure.label('severity', 'critical');

    const fuPage = new TI_FileUploadPage(page);
    await fuPage.goto();

    // Create a temporary file to upload
    const tmpFile = path.join(os.tmpdir(), 'playwright-test-upload.txt');
    fs.writeFileSync(tmpFile, 'Playwright test upload content');

    await allure.step('Upload the temporary test file', async () => {
      await fuPage.uploadFile(tmpFile);
    });

    await allure.step('Assert upload success page shows the filename', async () => {
      await fuPage.assertUploadSuccessful('playwright-test-upload.txt');
    });

    fs.unlinkSync(tmpFile);
  });

  test('setting a file updates the input value', async ({ page }) => {
    await allure.allureId('TI-FU-003');
    await allure.story('Upload');
    await allure.label('severity', 'normal');

    const fuPage = new TI_FileUploadPage(page);
    await fuPage.goto();

    const tmpFile = path.join(os.tmpdir(), 'playwright-set-file.txt');
    fs.writeFileSync(tmpFile, 'test');

    await allure.step('Set the file without submitting', async () => {
      await fuPage.setFile(tmpFile);
      // The file input should now have a value
      const value = await fuPage.fileInput.inputValue();
      expect(value).toContain('playwright-set-file.txt');
    });

    fs.unlinkSync(tmpFile);
  });
});
