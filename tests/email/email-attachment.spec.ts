import { test, expect } from '../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Email Tests -- Attachment + HTML rendering
 * ─────────────────────────────────────────────────────────────────────────────
 * Mailpit parses MIME attachments and exposes them on the message via its REST
 * API, so we can assert on them properly (unlike the old Mailinator public
 * inbox, which often hid attachments).  Here we:
 *
 *   1. Send an HTML email with a CSV attachment.
 *   2. Confirm the message arrives.
 *   3. Assert the attachment is listed and named `report.csv`.
 *   4. Download the attachment and assert its CSV contents.
 *   5. Spot-check the HTML body rendered as HTML, not raw markup.
 */
test.beforeEach(async () => {
  await allure.epic('Email Verification');
  await allure.feature('Attachment + HTML rendering');
});

test.describe('Email -- attachments', { tag: ['@email'] }, () => {
  test(
    'attachment is present, downloadable, and HTML body renders correctly',
    async ({ emailApp, emailAddress, mailpitInbox }) => {
      await allure.allureId('EMAIL-AT-001');
      await allure.story('CSV attachment + HTML body');
      await allure.label('severity', 'normal');

      const send = await allure.step('Trigger attachment email', async () => {
        const r = await emailApp.triggerAttachment(emailAddress);
        expect(r.ok).toBe(true);
        expect(r.attachmentName).toBe('report.csv');
        return r;
      });

      await allure.step('Wait for the message in Mailpit', async () => {
        await mailpitInbox.waitForMessageBySubject(/weekly report/i, { timeoutMs: 30_000 });
      });

      await allure.step('Attachment is listed on the message', async () => {
        const names = await mailpitInbox.listAttachmentNames();
        expect(names).toContain(send.attachmentName);
      });

      await allure.step('Attachment downloads with the expected CSV contents', async () => {
        const csv = await mailpitInbox.getAttachmentText(/report\.csv/i);
        expect(csv).toContain('name,score');
        expect(csv).toMatch(/Ada,99/);
        expect(csv).toMatch(/Grace,98/);
        expect(csv).toMatch(/Linus,97/);
      });

      await allure.step('HTML body renders, not raw markup', async () => {
        const bodyText = await mailpitInbox.getHtmlBodyText();
        expect(bodyText).toMatch(/your CSV report is attached/i);
        // Rendered text must not contain the literal HTML tag.
        expect(bodyText).not.toContain('<p>');
      });
    },
  );
});
