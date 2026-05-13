import { test as setup, expect } from '@playwright/test';
import { resolveCredentials } from '@utils/authentication.utils.js';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.resolve('.auth/saucedemo.json');

setup('saucedemo – login and save auth state', async ({ page }) => {
  const { username, password } = resolveCredentials();

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('https://www.saucedemo.com');
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill(password);
  await page.locator('[data-test="login-button"]').click();

  await expect(page).toHaveURL(/inventory/);

  await page.context().storageState({ path: AUTH_FILE });
  console.warn(`[setup] Saucedemo auth saved to ${AUTH_FILE}`);
});