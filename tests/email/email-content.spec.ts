import { test, expect } from '../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Email Tests -- Inbox arrival + content assertions
 * ─────────────────────────────────────────────────────────────────────────────
 * Flow:
 *   1. Trigger an HTML email via the local sender app (HTTP POST).
 *   2. Poll Mailpit's REST API for the per-test mailbox until it arrives.
 *   3. Assert subject + rendered body content.
 *
 * Mailbox safety
 *   Each test gets a fresh, unique recipient via the `emailAddress` fixture, so
 *   tests never race against each other.
 */
test.beforeEach(async () => {
  await allure.epic('Email Verification');
  await allure.feature('Inbox content');
});

test.describe('Email -- inbox arrival + content', { tag: ['@email'] }, () => {
  test(
    'rich HTML email arrives in Mailpit with expected subject and body',
    { tag: ['@smoke'] },
    async ({ emailApp, emailAddress, mailpitInbox }) => {
      await allure.allureId('EMAIL-CT-001');
      await allure.story('Rich HTML email arrival');
      await allure.label('severity', 'critical');

      await allure.step('Trigger HTML email', async () => {
        const result = await emailApp.triggerHtml(emailAddress);
        expect(result.ok).toBe(true);
      });

      await allure.step('Wait for the message in Mailpit', async () => {
        await mailpitInbox.waitForMessageBySubject(/rich HTML/i, { timeoutMs: 30_000 });
      });

      await allure.step('Assert subject + content', async () => {
        const bodyText = await mailpitInbox.getHtmlBodyText();
        expect(bodyText).toMatch(/Hello, traveller/i);
        expect(bodyText).toMatch(/Item one[\s\S]+Item two[\s\S]+Item three/i);
      });
    },
  );
});
