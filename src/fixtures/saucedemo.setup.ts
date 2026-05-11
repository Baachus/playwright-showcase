import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.resolve('.auth/saucedemo-credentials.json');
const AUTH_FILE = path.resolve('.auth/saucedemo.json');

setup('saucedemo – login and save auth state', async ({ page }) => {
  // Guard: fail fast if credentials file is missing
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    throw new Error(
      `Missing credentials file at ${CREDENTIALS_FILE}.\n` +
      `Create .auth/saucedemo-credentials.json with { "username": "...", "password": "..." }`
    );
  }

  const { username, password } = JSON.parse(
    fs.readFileSync(CREDENTIALS_FILE, 'utf-8')
  );

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  await page.goto('https://www.saucedemo.com');
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill(password);
  await page.locator('[data-test="login-button"]').click();

  await expect(page).toHaveURL(/inventory/);

  await page.context().storageState({ path: AUTH_FILE });
  console.warn(`[setup] Saucedemo auth saved to ${AUTH_FILE}`);
});