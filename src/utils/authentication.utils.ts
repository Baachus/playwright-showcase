import fs from 'fs';
import path from 'path';

// Resolved stored password
const CREDENTIALS_FILE = path.resolve('.auth/saucedemo-credentials.json');
const { username, password } = resolveCredentials();
void username;

export const SD_PASSWORD = password;

export type SaucedemoUser =
  | 'standard_user'
  | 'locked_out_user'
  | 'problem_user'
  | 'performance_glitch_user'
  | 'error_user'
  | 'visual_user';

/**
 * Map of users to their saved auth-state file paths.
 * Only users that can successfully log in have entries here.
 * (locked_out_user is intentionally excluded - use SD_LoginPage to test rejection.)
 */
export const SD_AUTH_FILES: Record<Exclude<SaucedemoUser, 'locked_out_user'>, string> = {
  standard_user:           path.resolve('.auth/sd_standard_user.json'),
  problem_user:            path.resolve('.auth/sd_problem_user.json'),
  performance_glitch_user: path.resolve('.auth/sd_performance_glitch_user.json'),
  error_user:              path.resolve('.auth/sd_error_user.json'),
  visual_user:             path.resolve('.auth/sd_visual_user.json'),
};

/**
 * Return the saved auth-state file path for a given user.
 */
export function getSaucedemoAuthFile(user: Exclude<SaucedemoUser, 'locked_out_user'>): string {
  return SD_AUTH_FILES[user];
}

export function resolveCredentials(): { username: string; password: string } {
  // 1. Prefer environment variables (e.g. GitHub Actions secrets)
  const envUsername = process.env.SAUCEDEMO_USERNAME;
  const envPassword = process.env.SAUCEDEMO_PASSWORD;

  if (envUsername && envPassword) {
    console.warn('[setup] Using credentials from environment variables');
    return { username: envUsername, password: envPassword };
  }

  // 2. Fall back to local .auth credentials file
  if (fs.existsSync(CREDENTIALS_FILE)) {
    console.warn('[setup] Using credentials from .auth/saucedemo-credentials.json');
    return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
  }

  // 3. Default to standard_user with the well-known test password
  console.warn('[setup] No credentials found -- defaulting to standard_user / password');
  return { username: 'standard_user', password: 'secret_sauce' };
}
