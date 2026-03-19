import { test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Global Setup
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs once before the entire test suite. Use this for:
 *  - Authenticating and saving storage state
 *  - Seeding test data via API calls
 *  - Any one-time expensive setup
 *
 * playwright.dev is public so we just verify the site is reachable and
 * create an empty auth state stub so dependent projects don't error.
 */

const AUTH_DIR = path.join(__dirname, '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

setup('global setup – verify site reachable', async ({ request }) => {
  // Ensure auth directory exists
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  // Verify the target site is reachable
  const response = await request.get('https://playwright.dev');
  if (!response.ok()) {
    throw new Error(`playwright.dev returned ${response.status()} — check your network.`);
  }

  // Write a stub storage state (replace with real auth for protected sites)
  const storageState = { cookies: [], origins: [] };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(storageState, null, 2));

  console.warn(`[setup] Site reachable. Auth stub written to ${AUTH_FILE}`);
});