import fs from 'fs';
import path from 'path';

const CREDENTIALS_FILE = path.resolve('.auth/saucedemo-credentials.json');
const AUTH_FILE = path.resolve('.auth/saucedemo.json');

export function resolveCredentials(): { username: string; password: string } {
  // 1. Prefer environment variables (e.g. GitHub Actions secrets)
  const envUsername = process.env.SAUCEDEMO_USERNAME;
  const envPassword = process.env.SAUCEDEMO_PASSWORD;

  if (envUsername && envPassword) {
    console.warn('[setup] Using credentials from environment variables');
    return { username: envUsername, password: envPassword };
  }

  // 2. Fall back to local .auth credentials file
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    throw new Error(
      `No credentials found.\n` +
      `Either set SAUCEDEMO_USERNAME and SAUCEDEMO_PASSWORD environment variables,\n` +
      `or create .auth/saucedemo-credentials.json with { "username": "...", "password": "..." }`
    );
  }

  console.warn('[setup] Using credentials from .auth/saucedemo-credentials.json');
  return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
}
