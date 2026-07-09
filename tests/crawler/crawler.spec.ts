import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  crawlSite,
  assertNoUnexpectedBrokenLinks,
  getUnexpectedBrokenPages,
  getUnexpectedBrokenImages,
  printCrawlReport,
} from '@utils/crawler.utils.js';

/**
 * Web Crawler Tests -- the-internet.herokuapp.com
 * ─────────────────────────────────────────────────────────────────────────────
 * Breadth-first crawls the site starting from the homepage and verifies every
 * discovered page and image resolves successfully. the-internet is purpose-
 * built with a handful of intentionally broken links/images/status pages, so
 * those are declared up front rather than treated as failures.
 */

const START_URL = 'https://the-internet.herokuapp.com/';

// Demo content the-internet serves on purpose -- a crawl hitting these is the
// site working as designed, not a regression.
const EXPECTED_BROKEN_LINKS = [
  /\/status_codes\/(301|404|500)$/, // demo status-code responses
  /\/basic_auth$/, // 401 without credentials
  /\/digest_auth(\/.*)?$/, // 401 without credentials
  /\/download_secure$/, // 401 without credentials
  /\/(about|contact-us|portfolio|gallery)\/$/, // decoy nav on the Disappearing Elements page
  /\/users\/\d+$/, // stub profile links on the Hovers page
];

// The Broken Images page purposefully serves images with bad src attributes.
const EXPECTED_BROKEN_IMAGES = [/\/(asdf|hjkl)\.jpg$/];

// The File Download page lists every file ever uploaded by any visitor to
// this public shared demo instance -- an unbounded, ever-changing list with
// no bearing on the site's own link integrity. Crawling into it would make
// the page budget (and thus which real pages get reached) nondeterministic.
const EXCLUDE_FROM_CRAWL = [/\/download\/?$/];

test.describe('Web Crawler – the-internet.herokuapp.com', { tag: ['@crawler'] }, () => {
  test.beforeEach(async ({}) => {
    await allure.epic('The Internet');
    await allure.feature('Web Crawler');
  });

  test('crawls the site and finds only the intentionally broken links/images',
    async ({ request }) => {
      await allure.allureId('CRWL-001');
      await allure.story('Link Integrity');
      await allure.label('severity', 'critical');

      const report = await crawlSite(request, START_URL, {
        maxDepth: 2,
        maxPages: 100,
        expectedBrokenLinks: EXPECTED_BROKEN_LINKS,
        expectedBrokenImages: EXPECTED_BROKEN_IMAGES,
        excludeFromCrawl: EXCLUDE_FROM_CRAWL,
      });

      await allure.step('Assert no unexpected broken links or images', async () => {
        printCrawlReport(report);
        await allure.attachment('Crawl Report', JSON.stringify({
          pagesVisited: report.pages.length,
          imagesChecked: report.images.length,
          unexpectedBrokenPages: getUnexpectedBrokenPages(report).map((p) => ({ url: p.url, status: p.status })),
          unexpectedBrokenImages: getUnexpectedBrokenImages(report).map((i) => ({ url: i.url, foundOn: i.foundOn, status: i.status })),
        }, null, 2), { contentType: 'application/json' });

        // Sanity check: a crawler that silently stops after the homepage
        // would otherwise report "zero broken links" while testing nothing.
        expect(report.pages.length, 'crawl should have walked well beyond the homepage').toBeGreaterThan(20);

        assertNoUnexpectedBrokenLinks(report);
      });
    });

  test('positive control -- the crawler actually detects known-broken content',
    async ({ request }) => {
      await allure.allureId('CRWL-002');
      await allure.story('Link Integrity');
      await allure.label('severity', 'normal');

      // No allowlist here -- proves detection works rather than the suite
      // passing because status codes are silently never read. Still exclude
      // the unbounded file-listing page so the page budget stays deterministic.
      const report = await crawlSite(request, START_URL, {
        maxDepth: 2,
        maxPages: 100,
        excludeFromCrawl: EXCLUDE_FROM_CRAWL,
      });

      const brokenPages = getUnexpectedBrokenPages(report);
      const brokenImages = getUnexpectedBrokenImages(report);

      await allure.step('Assert known-broken demo content was found', async () => {
        expect(brokenPages.some((p) => /\/status_codes\/404$/.test(p.url))).toBe(true);
        expect(brokenPages.some((p) => /\/status_codes\/500$/.test(p.url))).toBe(true);
        expect(brokenImages.some((i) => /\/(asdf|hjkl)\.jpg$/.test(i.url))).toBe(true);
      });
    });
});
