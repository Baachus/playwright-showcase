import { test, expect } from '../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';
import { extractOtp } from '../../src/utils/mailinator.utils.js';

/**
 * Email Tests -- OTP / one-time code extraction
 * ─────────────────────────────────────────────────────────────────────────────
 * The local sender app issues a fresh 6-digit code on every /send/otp call.
 * The test asserts that the OTP we read out of the inbox matches the one the
 * server issued -- which is the contract you'd want to test in any real OTP
 * authentication flow.
 */
test.beforeEach(async () => {
  await allure.epic('Email Verification');
  await allure.feature('OTP extraction');
});

test.describe('Email -- OTP', { tag: ['@email'] }, () => {
  test(
    'OTP read from inbox matches the code issued by the server',
    { tag: ['@smoke'] },
    async ({ emailApp, emailAddress, mailinatorInbox }) => {
      await allure.allureId('EMAIL-OTP-001');
      await allure.story('Read OTP from email');
      await allure.label('severity', 'critical');

      const send = await allure.step('Trigger OTP email', async () => {
        const r = await emailApp.triggerOtp(emailAddress);
        expect(r.ok).toBe(true);
        expect(r.code).toMatch(/^\d{6}$/);
        return r;
      });

      await allure.step('Open Mailinator and wait for the OTP message', async () => {
        await mailinatorInbox.goto();
        await mailinatorInbox.waitForMessageBySubject(/sign-in code/i, { timeoutMs: 90_000 });
        await mailinatorInbox.openFirstMessage();
      });

      await allure.step('OTP in body matches the server-issued code', async () => {
        const bodyText = await mailinatorInbox.getHtmlBodyText();
        const otp = extractOtp(bodyText);
        expect(otp, 'a 6-digit OTP should be present in the email body').not.toBeNull();
        expect(otp).toEqual(send.code);
      });
    },
  );
});
