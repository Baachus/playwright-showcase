import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.resolve('.auth/playwrightdev.json');

setup('playwright.dev – verify reachable and save stub auth', async ({ request }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });

  const response = await request.get('https://playwright.dev');
  if (!response.ok()) {
    throw new Error(`playwright.dev returned ${response.status()} — check your network.`);
  }

  fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }, null, 2));
  console.warn(`[setup] playwright.dev stub auth written to ${AUTH_FILE}`);
});