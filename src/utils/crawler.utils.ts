import { APIRequestContext } from '@playwright/test';

/**
 * Web Crawler Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * A minimal breadth-first crawler for link-integrity testing. Starting from a
 * seed URL, it walks same-origin `<a href>` links (and optionally `<img src>`
 * assets), recording the HTTP status of everything it finds.
 *
 * Some sites serve non-2xx responses *on purpose* (demo status-code pages,
 * auth-walled routes, intentionally-broken images). Those are declared via
 * `expectedBrokenLinks` / `expectedBrokenImages` so the report can distinguish
 * "the site is doing what it's supposed to" from a real regression.
 */

export interface CrawlOptions {
  /** Hard cap on total pages visited, regardless of depth. Default 100. */
  maxPages?: number;
  /** BFS depth from the seed URL. Default 2. */
  maxDepth?: number;
  /** Only follow links on the same origin as the seed URL. Default true. */
  sameOriginOnly?: boolean;
  /** Fetch and status-check `<img src>` assets found on each crawled page. Default true. */
  checkImages?: boolean;
  /** URLs matching any of these are still visited, but a non-2xx status is expected, not a failure. */
  expectedBrokenLinks?: RegExp[];
  /** Image URLs matching any of these are expected to fail to load. */
  expectedBrokenImages?: RegExp[];
  /** Pages matching any of these are still visited and recorded, but their outbound links/images are not followed. */
  excludeFromCrawl?: RegExp[];
}

export interface CrawledPage {
  url: string;
  depth: number;
  status: number | null;
  ok: boolean;
  title: string | null;
  /** True if this URL matched an `expectedBrokenLinks` pattern. */
  expected: boolean;
  error?: string;
}

export interface CrawledImage {
  url: string;
  foundOn: string;
  status: number | null;
  ok: boolean;
  /** True if this URL matched an `expectedBrokenImages` pattern. */
  expected: boolean;
}

export interface CrawlReport {
  startUrl: string;
  pages: CrawledPage[];
  images: CrawledImage[];
}

const HREF_RE = /<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const IMG_SRC_RE = /<img\b[^>]*src\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const TITLE_RE = /<title[^>]*>([^<]*)<\/title>/i;

function normalize(url: string): string {
  const parsed = new URL(url);
  parsed.hash = '';
  return parsed.toString();
}

function resolveLinks(html: string, baseUrl: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(HREF_RE)) {
    const href = (match[1] ?? match[2] ?? '').trim();
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) continue;
    try {
      found.add(normalize(new URL(href, baseUrl).toString()));
    } catch {
      // Malformed href -- skip rather than fail the crawl.
    }
  }
  return [...found];
}

function resolveImages(html: string, baseUrl: string): string[] {
  const found = new Set<string>();
  for (const match of html.matchAll(IMG_SRC_RE)) {
    const src = (match[1] ?? match[2] ?? '').trim();
    if (!src || src.startsWith('data:')) continue;
    try {
      found.add(normalize(new URL(src, baseUrl).toString()));
    } catch {
      // Malformed src -- skip rather than fail the crawl.
    }
  }
  return [...found];
}

function extractTitle(html: string): string | null {
  return TITLE_RE.exec(html)?.[1]?.trim() || null;
}

/**
 * Breadth-first crawl of `startUrl`, recording page and (optionally) image
 * status codes as it goes. Uses `APIRequestContext` rather than real browser
 * navigation -- pages are fetched as plain HTTP requests, which is fast
 * enough to walk a whole site in one test and is sufficient for link-
 * integrity checking (no JS execution needed to read status codes / hrefs).
 */
export async function crawlSite(
  request: APIRequestContext,
  startUrl: string,
  options: CrawlOptions = {},
): Promise<CrawlReport> {
  const {
    maxPages = 100,
    maxDepth = 2,
    sameOriginOnly = true,
    checkImages = true,
    expectedBrokenLinks = [],
    expectedBrokenImages = [],
    excludeFromCrawl = [],
  } = options;

  const startOrigin = new URL(startUrl).origin;
  const visitedPages = new Set<string>();
  const visitedImages = new Set<string>();
  const pages: CrawledPage[] = [];
  const images: CrawledImage[] = [];
  const queue: { url: string; depth: number }[] = [{ url: normalize(startUrl), depth: 0 }];

  while (queue.length > 0 && pages.length < maxPages) {
    const next = queue.shift();
    if (!next || visitedPages.has(next.url)) continue;
    visitedPages.add(next.url);

    const expected = expectedBrokenLinks.some((p) => p.test(next.url));
    let status: number | null = null;
    let ok = false;
    let title: string | null = null;
    let error: string | undefined;
    let html = '';

    try {
      const response = await request.get(next.url);
      status = response.status();
      ok = response.ok();
      if (ok) {
        html = await response.text();
        title = extractTitle(html);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }

    pages.push({ url: next.url, depth: next.depth, status, ok, title, expected, error });

    // Only 2xx responses are parsed for further links/images -- a non-ok
    // response body (auth challenge, error page) isn't reliable HTML to mine.
    if (!ok || next.depth >= maxDepth) continue;
    if (excludeFromCrawl.some((p) => p.test(next.url))) continue;

    for (const link of resolveLinks(html, next.url)) {
      if (sameOriginOnly && new URL(link).origin !== startOrigin) continue;
      if (!visitedPages.has(link)) queue.push({ url: link, depth: next.depth + 1 });
    }

    if (checkImages) {
      for (const imgUrl of resolveImages(html, next.url)) {
        if (visitedImages.has(imgUrl)) continue;
        visitedImages.add(imgUrl);
        const imgExpected = expectedBrokenImages.some((p) => p.test(imgUrl));
        try {
          const imgResponse = await request.get(imgUrl);
          images.push({ url: imgUrl, foundOn: next.url, status: imgResponse.status(), ok: imgResponse.ok(), expected: imgExpected });
        } catch {
          images.push({ url: imgUrl, foundOn: next.url, status: null, ok: false, expected: imgExpected });
        }
      }
    }
  }

  return { startUrl, pages, images };
}

/** Pages that returned a non-2xx/errored response and were NOT declared expected. */
export function getUnexpectedBrokenPages(report: CrawlReport): CrawledPage[] {
  return report.pages.filter((p) => !p.ok && !p.expected);
}

/** Images that returned a non-2xx/errored response and were NOT declared expected. */
export function getUnexpectedBrokenImages(report: CrawlReport): CrawledImage[] {
  return report.images.filter((i) => !i.ok && !i.expected);
}

/**
 * Throws with a detailed breakdown if the crawl surfaced any broken link or
 * image that wasn't declared expected up front.
 */
export function assertNoUnexpectedBrokenLinks(report: CrawlReport): void {
  const brokenPages = getUnexpectedBrokenPages(report);
  const brokenImages = getUnexpectedBrokenImages(report);
  if (brokenPages.length === 0 && brokenImages.length === 0) return;

  const details = [
    ...brokenPages.map((p) => `\n    • [page]  ${p.url} → ${p.status ?? `ERROR: ${p.error}`}`),
    ...brokenImages.map((i) => `\n    • [image] ${i.url} (found on ${i.foundOn}) → ${i.status ?? 'ERROR'}`),
  ].join('');
  throw new Error(`Crawl found unexpected broken links/images:${details}`);
}

/** Pretty-print a crawl summary to the console. */
export function printCrawlReport(report: CrawlReport): void {
  const pad = '   ';
  const brokenPages = getUnexpectedBrokenPages(report);
  const brokenImages = getUnexpectedBrokenImages(report);
  const expectedPages = report.pages.filter((p) => p.expected);
  const expectedImages = report.images.filter((i) => i.expected);

  console.warn(`\n🕷️  Crawl Report: ${report.startUrl}`);
  console.warn(`${pad}Pages visited: ${report.pages.length}  |  Images checked: ${report.images.length}`);

  if (expectedPages.length + expectedImages.length > 0) {
    console.warn(`${pad}✅ Expected broken (${expectedPages.length + expectedImages.length}):`);
    for (const p of expectedPages) console.warn(`${pad}   [page]  ${p.url} → ${p.status}`);
    for (const i of expectedImages) console.warn(`${pad}   [image] ${i.url} → ${i.status}`);
  }

  if (brokenPages.length + brokenImages.length > 0) {
    console.warn(`${pad}❌ Unexpected broken (${brokenPages.length + brokenImages.length}):`);
    for (const p of brokenPages) console.warn(`${pad}   [page]  ${p.url} → ${p.status ?? `ERROR: ${p.error}`}`);
    for (const i of brokenImages) console.warn(`${pad}   [image] ${i.url} (found on ${i.foundOn}) → ${i.status ?? 'ERROR'}`);
  } else {
    console.warn(`${pad}✅ No unexpected broken links or images.`);
  }
}
