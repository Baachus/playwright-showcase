import { test, expect } from '../../../src/fixtures/index.js';
import { TI_ABTestPage } from '../../../src/pages/the-internet/TI_ABTestPage.js';
import * as allure from 'allure-js-commons';

/**
 * UI Tests – A/B Testing Page
 *
 * The /abtest endpoint on the-internet.herokuapp.com randomly serves one of
 * two variants per page load:
 *   • "A/B Test Control"     – the baseline experience
 *   • "A/B Test Variation 1" – an alternate experience
 *
 * Because the variant is non-deterministic, tests are written to accept
 * either variant unless they are specifically testing a single variant in
 * isolation (achieved by reloading until the desired variant appears).
 */

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('A/B Testing');
});

test.describe('The Internet – A/B Testing', { tag: ['@ui', '@theinternethero', '@abtest'] }, () => {

  // ── Page Load ────────────────────────────────────────────────────────────────

  test('page loads and displays a valid variant heading', { tag: ['@smoke'] }, async ({ ti_abTestPage }) => {
    await allure.allureId('TI-AB-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    await allure.step('Assert we are on the A/B test page', async () => {
      await ti_abTestPage.assertOnABTestPage();
    });

    await allure.step('Assert heading is a recognised variant', async () => {
      await ti_abTestPage.assertValidVariant();
    });
  });

  test('page content paragraph is visible and non-empty', { tag: ['@smoke'] }, async ({ ti_abTestPage }) => {
    await allure.allureId('TI-AB-002');
    await allure.story('Page Load');
    await allure.label('severity', 'normal');

    await allure.step('Assert body copy is visible and contains text', async () => {
      await ti_abTestPage.assertContentVisible();
    });
  });

  test('page title is correct', async ({ ti_abTestPage }) => {
    await allure.allureId('TI-AB-003');
    await allure.story('Page Load');
    await allure.label('severity', 'minor');

    await allure.step('Assert document title', async () => {
      await expect(ti_abTestPage.page).toHaveTitle(/The Internet/);
    });
  });

  // ── Variant Detection ────────────────────────────────────────────────────────

  test('heading text is exactly one of the two known variants', async ({ ti_abTestPage }) => {
    await allure.allureId('TI-AB-004');
    await allure.story('Variant Detection');
    await allure.label('severity', 'normal');

    await allure.step('Read the heading and confirm it matches a known variant string', async () => {
      const headingText = await ti_abTestPage.getHeadingText();
      expect(
        TI_ABTestPage.VALID_HEADINGS.some(v => headingText.includes(v)),
        `Unexpected heading text: "${headingText}"`,
      ).toBe(true);
    });
  });

  test('control variant renders when served', async ({ page }) => {
    await allure.allureId('TI-AB-005');
    await allure.story('Variant Detection');
    await allure.label('severity', 'normal');

    const abTestPage = new TI_ABTestPage(page);

    // Reload until we get the control variant (max 10 attempts to avoid
    // an infinite loop if the server changes behavior).
    let headingText = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      await abTestPage.goto();
      headingText = await abTestPage.getHeadingText();
      if (headingText.includes('A/B Test Control')) break;
    }

    await allure.step('Assert control heading when control variant is served', async () => {
      // If after 10 reloads we still haven't seen Control, skip gracefully –
      // the server may be stuck on Variation for this session.
      test.skip(
        !headingText.includes('A/B Test Control'),
        'Control variant was not served in 10 reload attempts; skipping.',
      );
      await abTestPage.assertIsControlVariant();
    });
  });

  test('variation 1 renders when served', async ({ page }) => {
    await allure.allureId('TI-AB-006');
    await allure.story('Variant Detection');
    await allure.label('severity', 'normal');

    const abTestPage = new TI_ABTestPage(page);

    let headingText = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      await abTestPage.goto();
      headingText = await abTestPage.getHeadingText();
      if (headingText.includes('A/B Test Variation 1')) break;
    }

    await allure.step('Assert variation heading when variation 1 is served', async () => {
      test.skip(
        !headingText.includes('A/B Test Variation 1'),
        'Variation 1 was not served in 10 reload attempts; skipping.',
      );
      await abTestPage.assertIsVariation1();
    });
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  test('page is accessible directly via /abtest URL', async ({ page }) => {
    await allure.allureId('TI-AB-007');
    await allure.story('Navigation');
    await allure.label('severity', 'normal');

    await allure.step('Navigate directly to /abtest', async () => {
      await page.goto('/abtest');
    });

    await allure.step('Confirm URL and heading are correct', async () => {
      await expect(page).toHaveURL(/\/abtest/);
      const abTestPage = new TI_ABTestPage(page);
      await abTestPage.waitForPageLoad();
      await abTestPage.assertValidVariant();
    });
  });

  test('page reloads serve a valid variant on each load', async ({ page }) => {
    await allure.allureId('TI-AB-008');
    await allure.story('Navigation');
    await allure.label('severity', 'minor');

    const abTestPage = new TI_ABTestPage(page);
    const seenVariants = new Set<string>();

    await allure.step('Load the page three times and collect served variants', async () => {
      for (let i = 0; i < 3; i++) {
        await abTestPage.goto();
        const text = await abTestPage.getHeadingText();
        await abTestPage.assertValidVariant();
        seenVariants.add(text);
      }
    });

    await allure.step('Confirm all observed headings were valid variants', async () => {
      for (const variant of seenVariants) {
        expect(
          TI_ABTestPage.VALID_HEADINGS.some(v => variant.includes(v)),
          `Saw unexpected variant: "${variant}"`,
        ).toBe(true);
      }
    });
  });
});
