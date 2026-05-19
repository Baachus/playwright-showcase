import { test as setup, expect } from '@playwright/test';
import { SD_PASSWORD, getSaucedemoAuthFile } from '@utils/authentication.utils.js';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.saucedemo.com';

/**
 * Users whose auth state we pre-save for multi-context tests.
 */
const USERS_TO_SETUP = [
  'standard_user',
  'problem_user',
  'performance_glitch_user',
] as const;

/**
 * Multi-user setup
 * ---------------------------------------------------------------------------
 * Saves independent Playwright storageState files for each Saucedemo test user
 * so that multi-window tests can load fully-authenticated contexts without
 * re-running the login flow inside every test.
 *
 * Auth files are written to:
 *   .auth/sd_standard_user.json
 *   .auth/sd_problem_user.json
 *   .auth/sd_performance_glitch_user.json
 */
for (const username of USERS_TO_SETUP) {
  setup(`saucedemo multi-user setup -- ${username}`, async ({ page }) => {
    const authFile = getSaucedemoAuthFile(username);
    fs.mkdirSync(path.dirname(authFile), { recursive: true });

    await page.goto(BASE_URL);
    await page.locator('[data-test="username"]').fill(username);
    await page.locator('[data-test="password"]').fill(SD_PASSWORD);
    await page.locator('[data-test="login-button"]').click();

    await expect(page).toHaveURL(/inventory/);

    await page.context().storageState({ path: authFile });
    console.warn(`[multi-user setup] Auth saved: ${authFile}`);
  });
}
