import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  getSaucedemoAuthFile,
  SD_AUTH_FILES,
  resolveCredentials,
  SD_PASSWORD,
  type SaucedemoUser,
} from '../../src/utils/authentication.utils.js';

/**
 * Unit tests for authentication.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * These tests verify credential resolution logic, auth-file path mapping, and
 * the SD_AUTH_FILES constant — all without requiring a browser.
 */

test.describe('authentication.utils', () => {

  // ── SD_AUTH_FILES constant ───────────────────────────────────────────────
  test.describe('SD_AUTH_FILES', () => {
    test('contains an entry for every login-able user', async () => {
      await allure.allureId('UNIT-AUTH-001');
      const expected: Exclude<SaucedemoUser, 'locked_out_user'>[] = [
        'standard_user',
        'problem_user',
        'performance_glitch_user',
        'error_user',
        'visual_user',
      ];
      for (const user of expected) {
        expect(SD_AUTH_FILES).toHaveProperty(user);
      }
    });

    test('does NOT contain locked_out_user (they cannot log in)', async () => {
      await allure.allureId('UNIT-AUTH-002');
      expect(Object.keys(SD_AUTH_FILES)).not.toContain('locked_out_user');
    });

    test('all values are .json file paths', async () => {
      await allure.allureId('UNIT-AUTH-003');
      for (const filePath of Object.values(SD_AUTH_FILES)) {
        expect(filePath).toMatch(/\.json$/);
      }
    });

    test('each path contains .auth directory segment', async () => {
      await allure.allureId('UNIT-AUTH-004');
      for (const filePath of Object.values(SD_AUTH_FILES)) {
        // path.resolve returns an absolute path containing .auth
        expect(filePath).toContain('.auth');
      }
    });

    test('all 5 login-able users have distinct file paths', async () => {
      await allure.allureId('UNIT-AUTH-005');
      const paths = Object.values(SD_AUTH_FILES);
      const unique = new Set(paths);
      expect(unique.size).toBe(paths.length);
    });
  });

  // ── getSaucedemoAuthFile ─────────────────────────────────────────────────
  test.describe('getSaucedemoAuthFile', () => {
    const users: Exclude<SaucedemoUser, 'locked_out_user'>[] = [
      'standard_user',
      'problem_user',
      'performance_glitch_user',
      'error_user',
      'visual_user',
    ];

    const userIds: Record<string, string> = {
      standard_user:           'UNIT-AUTH-006',
      problem_user:            'UNIT-AUTH-007',
      performance_glitch_user: 'UNIT-AUTH-008',
      error_user:              'UNIT-AUTH-009',
      visual_user:             'UNIT-AUTH-010',
    };

    for (const user of users) {
      test(`returns the correct path for "${user}"`, async () => {
        await allure.allureId(userIds[user]);
        const result = getSaucedemoAuthFile(user);
        expect(result).toBe(SD_AUTH_FILES[user]);
      });
    }

    test('returns a path ending with .json for every user', async () => {
      await allure.allureId('UNIT-AUTH-011');
      for (const user of users) {
        expect(getSaucedemoAuthFile(user)).toMatch(/\.json$/);
      }
    });

    test('standard_user path contains "sd_standard_user"', async () => {
      await allure.allureId('UNIT-AUTH-012');
      expect(getSaucedemoAuthFile('standard_user')).toContain('sd_standard_user');
    });

    test('problem_user path contains "sd_problem_user"', async () => {
      await allure.allureId('UNIT-AUTH-013');
      expect(getSaucedemoAuthFile('problem_user')).toContain('sd_problem_user');
    });
  });

  // ── SD_PASSWORD ──────────────────────────────────────────────────────────
  test.describe('SD_PASSWORD', () => {
    test('is a non-empty string', async () => {
      await allure.allureId('UNIT-AUTH-014');
      expect(typeof SD_PASSWORD).toBe('string');
      expect(SD_PASSWORD.length).toBeGreaterThan(0);
    });
  });

  // ── resolveCredentials ───────────────────────────────────────────────────
  test.describe('resolveCredentials', () => {
    test('returns env var credentials when both SAUCEDEMO_USERNAME and SAUCEDEMO_PASSWORD are set', async () => {
      await allure.allureId('UNIT-AUTH-015');
      const savedUser = process.env.SAUCEDEMO_USERNAME;
      const savedPass = process.env.SAUCEDEMO_PASSWORD;

      process.env.SAUCEDEMO_USERNAME = 'ci_user';
      process.env.SAUCEDEMO_PASSWORD = 'ci_secret';

      try {
        const result = resolveCredentials();
        expect(result.username).toBe('ci_user');
        expect(result.password).toBe('ci_secret');
      } finally {
        // Always restore env — avoids leaking state into other tests
        if (savedUser === undefined) delete process.env.SAUCEDEMO_USERNAME;
        else process.env.SAUCEDEMO_USERNAME = savedUser;

        if (savedPass === undefined) delete process.env.SAUCEDEMO_PASSWORD;
        else process.env.SAUCEDEMO_PASSWORD = savedPass;
      }
    });

    test('does NOT use env var credentials when only username is set', async () => {
      await allure.allureId('UNIT-AUTH-016');
      const savedUser = process.env.SAUCEDEMO_USERNAME;
      const savedPass = process.env.SAUCEDEMO_PASSWORD;

      process.env.SAUCEDEMO_USERNAME = 'only_user';
      delete process.env.SAUCEDEMO_PASSWORD;

      try {
        const result = resolveCredentials();
        // Should fall through to file or default — not return 'only_user'
        expect(result.username).not.toBe('only_user');
      } finally {
        if (savedUser === undefined) delete process.env.SAUCEDEMO_USERNAME;
        else process.env.SAUCEDEMO_USERNAME = savedUser;

        if (savedPass === undefined) delete process.env.SAUCEDEMO_PASSWORD;
        else process.env.SAUCEDEMO_PASSWORD = savedPass;
      }
    });

    test('returns an object with username and password string properties', async () => {
      await allure.allureId('UNIT-AUTH-017');
      const result = resolveCredentials();
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('password');
      expect(typeof result.username).toBe('string');
      expect(typeof result.password).toBe('string');
    });

    test('username and password are both non-empty regardless of source', async () => {
      await allure.allureId('UNIT-AUTH-018');
      const result = resolveCredentials();
      expect(result.username.length).toBeGreaterThan(0);
      expect(result.password.length).toBeGreaterThan(0);
    });
  });
});
