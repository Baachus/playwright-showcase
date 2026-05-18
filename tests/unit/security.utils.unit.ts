import { test, expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';
import {
  auditSecurityHeaders,
  assertRequiredHeadersPresent,
  assertHeaderPresent,
  assertHeaderAbsent,
  getHeader,
  printSecurityReport,
  SECURITY_HEADERS,
  type SecurityHeaderDefinition,
  type SecurityReport,
} from '../../src/utils/security.utils.js';

/**
 * Unit tests for security.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * APIResponse is mocked via a lightweight cast — no real HTTP request needed.
 * All tests exercise the pure classification, assertion, and reporting logic.
 */

// ── Mock helpers ─────────────────────────────────────────────────────────────

/** Build a minimal APIResponse mock from a plain headers object. */
function mockResponse(
  headers: Record<string, string>,
  url = 'https://example.com',
): APIResponse {
  return {
    headers: () => headers,
    url:     () => url,
  } as unknown as APIResponse;
}

/** Build a SecurityReport with all required and recommended headers present. */
function makeFullReport(url = 'https://example.com'): SecurityReport {
  return {
    url,
    score: 100,
    passed: SECURITY_HEADERS.map((def) => ({
      header:         def.header,
      severity:       def.severity,
      present:        true,
      value:          'some-value',
      recommendation: def.recommendation,
    })),
    requiredFailed:     [],
    recommendedFailed:  [],
  };
}

// ── SECURITY_HEADERS constant ────────────────────────────────────────────────

test.describe('security.utils › SECURITY_HEADERS', () => {

  test('is a non-empty array', () => {
    expect(Array.isArray(SECURITY_HEADERS)).toBe(true);
    expect(SECURITY_HEADERS.length).toBeGreaterThan(0);
  });

  test('every entry has header, severity, and recommendation fields', () => {
    for (const def of SECURITY_HEADERS) {
      expect(def).toHaveProperty('header');
      expect(def).toHaveProperty('severity');
      expect(def).toHaveProperty('recommendation');
      expect(['required', 'recommended']).toContain(def.severity);
    }
  });

  test('contains at least one required header', () => {
    const required = SECURITY_HEADERS.filter((d) => d.severity === 'required');
    expect(required.length).toBeGreaterThan(0);
  });

  test('strict-transport-security is required', () => {
    const hsts = SECURITY_HEADERS.find((d) => d.header === 'strict-transport-security');
    expect(hsts).toBeDefined();
    expect(hsts!.severity).toBe('required');
  });

  test('x-content-type-options is required', () => {
    const xcto = SECURITY_HEADERS.find((d) => d.header === 'x-content-type-options');
    expect(xcto).toBeDefined();
    expect(xcto!.severity).toBe('required');
  });

  test('all header names are lowercase', () => {
    for (const def of SECURITY_HEADERS) {
      expect(def.header).toBe(def.header.toLowerCase());
    }
  });
});

// ── auditSecurityHeaders ─────────────────────────────────────────────────────

test.describe('security.utils › auditSecurityHeaders', () => {

  test('scores 100 when all headers are present', () => {
    const allHeaders: Record<string, string> = {};
    for (const def of SECURITY_HEADERS) allHeaders[def.header] = 'value';
    const response = mockResponse(allHeaders);
    const report = auditSecurityHeaders(response);
    expect(report.score).toBe(100);
  });

  test('scores 0 when no headers are present', () => {
    const response = mockResponse({});
    const report = auditSecurityHeaders(response);
    expect(report.score).toBe(0);
  });

  test('passed array contains only headers that are present', () => {
    const response = mockResponse({ 'strict-transport-security': 'max-age=31536000' });
    const report = auditSecurityHeaders(response);
    expect(report.passed.every((h) => h.present)).toBe(true);
    expect(report.passed.map((h) => h.header)).toContain('strict-transport-security');
  });

  test('requiredFailed contains missing required headers', () => {
    // Provide only recommended headers, leave required ones out
    const response = mockResponse({ 'content-security-policy': 'default-src self' });
    const report = auditSecurityHeaders(response);
    const requiredHeaders = SECURITY_HEADERS.filter((d) => d.severity === 'required').map((d) => d.header);
    for (const name of requiredHeaders) {
      expect(report.requiredFailed.map((h) => h.header)).toContain(name);
    }
  });

  test('recommendedFailed contains missing recommended headers', () => {
    // Provide only required headers
    const requiredHeaders: Record<string, string> = {};
    for (const def of SECURITY_HEADERS.filter((d) => d.severity === 'required')) {
      requiredHeaders[def.header] = 'present';
    }
    const response = mockResponse(requiredHeaders);
    const report = auditSecurityHeaders(response);
    expect(report.recommendedFailed.length).toBeGreaterThan(0);
    expect(report.recommendedFailed.every((h) => h.severity === 'recommended')).toBe(true);
  });

  test('every audit entry has present flag matching whether a value exists', () => {
    const response = mockResponse({ 'strict-transport-security': 'max-age=31536000' });
    const report = auditSecurityHeaders(response);
    for (const entry of [...report.passed, ...report.requiredFailed, ...report.recommendedFailed]) {
      if (entry.present) {
        expect(entry.value).not.toBeNull();
      } else {
        expect(entry.value).toBeNull();
      }
    }
  });

  test('score is proportional to the number of passed headers', () => {
    // Pass exactly half the headers
    const half = SECURITY_HEADERS.slice(0, Math.floor(SECURITY_HEADERS.length / 2));
    const headers: Record<string, string> = {};
    for (const def of half) headers[def.header] = 'v';
    const response = mockResponse(headers);
    const report = auditSecurityHeaders(response);
    const expectedScore = Math.round((half.length / SECURITY_HEADERS.length) * 100);
    expect(report.score).toBe(expectedScore);
  });

  test('accepts a custom definitions array', () => {
    const customDefs: SecurityHeaderDefinition[] = [
      { header: 'x-custom-header', severity: 'required', recommendation: 'Add it' },
    ];
    const response = mockResponse({ 'x-custom-header': 'present' });
    const report = auditSecurityHeaders(response, customDefs);
    expect(report.score).toBe(100);
    expect(report.passed[0].header).toBe('x-custom-header');
  });

  test('returns the correct URL from the response', () => {
    const response = mockResponse({}, 'https://mysite.com/path');
    const report = auditSecurityHeaders(response);
    expect(report.url).toBe('https://mysite.com/path');
  });
});

// ── assertRequiredHeadersPresent ─────────────────────────────────────────────

test.describe('security.utils › assertRequiredHeadersPresent', () => {

  test('does not throw when no required headers are missing', () => {
    const report = makeFullReport();
    expect(() => assertRequiredHeadersPresent(report)).not.toThrow();
  });

  test('throws when at least one required header is missing', () => {
    const report: SecurityReport = {
      ...makeFullReport(),
      requiredFailed: [
        {
          header:         'strict-transport-security',
          severity:       'required',
          present:        false,
          value:          null,
          recommendation: 'Add HSTS',
        },
      ],
    };
    expect(() => assertRequiredHeadersPresent(report)).toThrow(/strict-transport-security/);
  });

  test('error message includes the recommendation text', () => {
    const report: SecurityReport = {
      ...makeFullReport(),
      requiredFailed: [
        {
          header:         'x-content-type-options',
          severity:       'required',
          present:        false,
          value:          null,
          recommendation: 'Add X-Content-Type-Options: nosniff',
        },
      ],
    };
    expect(() => assertRequiredHeadersPresent(report)).toThrow(/nosniff/);
  });

  test('does not throw when only recommended headers are missing', () => {
    const report: SecurityReport = {
      ...makeFullReport(),
      recommendedFailed: [
        {
          header:         'content-security-policy',
          severity:       'recommended',
          present:        false,
          value:          null,
          recommendation: 'Add CSP',
        },
      ],
    };
    expect(() => assertRequiredHeadersPresent(report)).not.toThrow();
  });
});

// ── assertHeaderPresent ──────────────────────────────────────────────────────

test.describe('security.utils › assertHeaderPresent', () => {

  test('does not throw when the header is present', () => {
    const response = mockResponse({ 'x-custom': 'value' });
    expect(() => assertHeaderPresent(response, 'x-custom')).not.toThrow();
  });

  test('throws when the header is absent', () => {
    const response = mockResponse({});
    expect(() => assertHeaderPresent(response, 'x-missing')).toThrow(/x-missing/);
  });

  test('does not throw when header value matches expected string', () => {
    const response = mockResponse({ 'x-frame-options': 'DENY' });
    expect(() => assertHeaderPresent(response, 'x-frame-options', 'DENY')).not.toThrow();
  });

  test('throws when header value does not contain expected string', () => {
    const response = mockResponse({ 'x-frame-options': 'SAMEORIGIN' });
    expect(() => assertHeaderPresent(response, 'x-frame-options', 'DENY')).toThrow(/DENY/);
  });

  test('does not throw when header value matches expected RegExp', () => {
    const response = mockResponse({ 'strict-transport-security': 'max-age=31536000; includeSubDomains' });
    expect(() =>
      assertHeaderPresent(response, 'strict-transport-security', /max-age=\d+/)
    ).not.toThrow();
  });

  test('throws when header value does not match expected RegExp', () => {
    const response = mockResponse({ 'strict-transport-security': 'max-age=0' });
    expect(() =>
      assertHeaderPresent(response, 'strict-transport-security', /includeSubDomains/)
    ).toThrow();
  });

  test('is case-insensitive for header name lookup', () => {
    // The response stores lowercase; assertHeaderPresent lowercases the input
    const response = mockResponse({ 'x-custom-header': 'ok' });
    expect(() => assertHeaderPresent(response, 'X-Custom-Header')).not.toThrow();
  });
});

// ── getHeader ────────────────────────────────────────────────────────────────

test.describe('security.utils › getHeader', () => {

  test('returns the header value when present', () => {
    const response = mockResponse({ 'x-powered-by': 'Express' });
    expect(getHeader(response, 'x-powered-by')).toBe('Express');
  });

  test('returns null when the header is absent', () => {
    const response = mockResponse({});
    expect(getHeader(response, 'x-powered-by')).toBeNull();
  });

  test('is case-insensitive for the header name', () => {
    const response = mockResponse({ 'content-type': 'application/json' });
    expect(getHeader(response, 'Content-Type')).toBe('application/json');
  });
});

// ── assertHeaderAbsent ───────────────────────────────────────────────────────

test.describe('security.utils › assertHeaderAbsent', () => {

  test('does not throw when the header is absent', () => {
    const response = mockResponse({});
    expect(() => assertHeaderAbsent(response, 'x-powered-by')).not.toThrow();
  });

  test('throws when a sensitive header is present', () => {
    const response = mockResponse({ 'x-powered-by': 'PHP/7.4' });
    expect(() => assertHeaderAbsent(response, 'x-powered-by')).toThrow(/x-powered-by/);
  });

  test('error message includes the exposed value', () => {
    const response = mockResponse({ 'server': 'Apache/2.4' });
    expect(() => assertHeaderAbsent(response, 'server')).toThrow(/Apache\/2\.4/);
  });
});

// ── printSecurityReport ──────────────────────────────────────────────────────

test.describe('security.utils › printSecurityReport', () => {

  test('does not throw for a perfect (100) report', () => {
    const report = makeFullReport();
    expect(() => printSecurityReport(report)).not.toThrow();
  });

  test('does not throw for a report with all headers missing', () => {
    const report: SecurityReport = {
      url:               'https://example.com',
      score:             0,
      passed:            [],
      requiredFailed:    SECURITY_HEADERS.filter((d) => d.severity === 'required').map((d) => ({
        ...d, present: false, value: null,
      })),
      recommendedFailed: SECURITY_HEADERS.filter((d) => d.severity === 'recommended').map((d) => ({
        ...d, present: false, value: null,
      })),
    };
    expect(() => printSecurityReport(report)).not.toThrow();
  });

  test('does not throw for a mixed report', () => {
    const response = mockResponse({ 'strict-transport-security': 'max-age=31536000' });
    const report = auditSecurityHeaders(response);
    expect(() => printSecurityReport(report)).not.toThrow();
  });
});
