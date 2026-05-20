import { test, expect } from '../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Email Tests -- Inbox arrival + content assertions
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow:
 *   1. Trigger an HTML email via the local sender app (HTTP POST).
 *   2. Open Mailinator's public inbox UI for the per-test inbox.
 *   3. Poll until the message arrives, open it, assert subject + body content.
 *
 * Inbox safety
 *   Each test gets a fresh, unique inbox name via the `emailInbox` fixture, so
 *   tests never race against each other and never accidentally read mail from
 *   another developer's run.
 */
test.beforeEach(async () => {
  await allure.epic('Email Verification');
  await allure.feature('Inbox content');
});

test.describe('Email -- inbox arrival + content', { tag: ['@email'] }, () => {
  test(
    'rich HTML email arrives in Mailinator with expected subject and body',
    { tag: ['@smoke'] },
    async ({ emailApp, emailAddress, mailinatorInbox }) => {
      await allure.allureId('EMAIL-CT-001');
      await allure.story('Rich HTML email arrival');
      await allure.label('severity', 'critical');

      await allure.step('Trigger HTML email', async () => {
        const result = await emailApp.triggerHtml(emailAddress);
        expect(result.ok).toBe(true);
      });

      await allure.step('Open Mailinator inbox and wait for the message', async () => {
        await mailinatorInbox.goto();
        await mailinatorInbox.assertOnInbox();
        await mailinatorInbox.waitForMessageBySubject(/rich HTML/i, { timeoutMs: 90_000 });
      });

      await allure.step('Open the message and assert subject + content', async () => {
        await mailinatorInbox.openFirstMessage();
        const bodyText = await mailinatorInbox.getHtmlBodyText();
        expect(bodyText).toMatch(/Hello, traveller/i);
        expect(bodyText).toMatch(/Item one[\s\S]+Item two[\s\S]+Item three/i);
      });
    },
  );
});
