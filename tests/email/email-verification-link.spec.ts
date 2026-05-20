import { test, expect } from '../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';
import { extractLink } from '../../src/utils/mailinator.utils.js';

/**
 * Email Tests -- Verification link click flow
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow:
 *   1. POST /send/verification on the local sender app.  The server returns
 *      the verification link in the JSON response (convenient!) AND embeds it
 *      in the email body itself -- the real-world flow comes from the email.
 *   2. Open Mailinator, wait for the message, extract the link from the body.
 *   3. Cross-check: the link extracted from the email must equal the one the
 *      server returned (proves the email genuinely carried the right token).
 *   4. Click the link in Playwright and assert the success page renders.
 */
test.beforeEach(async () => {
  await allure.epic('Email Verification');
  await allure.feature('Verification link');
});

test.describe('Email -- verification link', { tag: ['@email'] }, () => {
  test(
    'user can verify by clicking the link in the verification email',
    { tag: ['@smoke', '@critical'] },
    async ({ emailApp, emailAddress, mailinatorInbox }) => {
      await allure.allureId('EMAIL-VL-001');
      await allure.story('Click verification link from inbox');
      await allure.label('severity', 'blocker');

      // 1. trigger send
      const send = await allure.step('Trigger verification email', async () => {
        const result = await emailApp.triggerVerification(emailAddress, 'Robert');
        expect(result.ok).toBe(true);
        expect(result.link).toMatch(/\/verify\//);
        return result;
      });

      // 2. open inbox + wait for arrival
      await allure.step('Open Mailinator and wait for the message', async () => {
        await mailinatorInbox.goto();
        await mailinatorInbox.waitForMessageBySubject(/verify your email/i, { timeoutMs: 90_000 });
        await mailinatorInbox.openFirstMessage();
      });

      // 3. extract link from the rendered HTML body
      const linkFromEmail = await allure.step('Extract verification link from email body', async () => {
        const bodyText = await mailinatorInbox.getHtmlBodyText();
        const link =
          (await mailinatorInbox.getFirstLinkHref()) ??
          extractLink(bodyText, u => u.includes('/verify/'));
        expect(link, 'verification link should be in the email body').toBeTruthy();
        return link!;
      });

      // 4. cross-check: server-issued link must match what the email carried
      await allure.step('Email link matches the server-issued link', async () => {
        expect(linkFromEmail).toContain(send.token!);
      });

      // 5. follow the link and confirm verification
      await allure.step('Open the link and confirm verification page', async () => {
        await emailApp.openVerifyLink(linkFromEmail);
        await emailApp.assertVerifiedEmail(emailAddress);
      });
    },
  );

  test(
    'opening an unknown token shows the failure page',
    async ({ emailApp, page }) => {
      await allure.allureId('EMAIL-VL-002');
      await allure.story('Invalid verification token rejected');
      await allure.label('severity', 'normal');

      const bogus = `${emailApp.baseURL}/verify/not-a-real-token`;
      await page.goto(bogus);
      await expect(emailApp.verifyFailed).toBeVisible();
    },
  );
});
