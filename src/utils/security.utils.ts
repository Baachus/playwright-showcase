import { APIResponse } from '@playwright/test';

/**
 * Security Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Helpers for auditing HTTP security headers and common web security
 * misconfigurations.
 *
 * Headers are classified by severity:
 *   - 'required'    → must be present; a missing header is a test FAILURE.
 *   - 'recommended' → best-practice; a missing header is logged as a WARNING
 *                     but does NOT fail the test. Useful for auditing third-
 *                     party or public sites you don't fully control.
 */

export type HeaderSeverity = 'required' | 'recommended';

export interface SecurityHeaderDefinition {
  header: string;
  severity: HeaderSeverity;
  recommendation: string;
}

export interface SecurityHeaderAudit {
  header: string;
  severity: HeaderSeverity;
  present: boolean;
  value: string | null;
  recommendation: string;
}

export interface SecurityReport {
  url: string;
  /** 0-100 score across ALL headers (required + recommended) */
  score: number;
  passed: SecurityHeaderAudit[];
  /** Required headers that are missing → these should fail your tests */
  requiredFailed: SecurityHeaderAudit[];
  /** Recommended headers that are missing → logged as warnings only */
  recommendedFailed: SecurityHeaderAudit[];
}

/**
 * OWASP-based security header definitions.
 *
 * Severity guide:
 *  required    → universally expected on any production HTTPS site
 *  recommended → important best-practice but not universally deployed
 *                (e.g. static docs sites, CDN-served content, third-party)
 */
export const SECURITY_HEADERS: SecurityHeaderDefinition[] = [
  // ── Required ──────────────────────────────────────────────────────────────
  {
    header: 'strict-transport-security',
    severity: 'required',
    recommendation: 'Add HSTS: max-age=31536000; includeSubDomains',
  },
  {
    header: 'x-content-type-options',
    severity: 'required',
    recommendation: 'Add X-Content-Type-Options: nosniff',
  },

  // ── Recommended ───────────────────────────────────────────────────────────
  {
    header: 'x-frame-options',
    severity: 'recommended',
    recommendation: 'Add X-Frame-Options: DENY or SAMEORIGIN (or use CSP frame-ancestors)',
  },
  {
    header: 'content-security-policy',
    severity: 'recommended',
    recommendation: 'Implement a Content-Security-Policy header',
  },
  {
    header: 'referrer-policy',
    severity: 'recommended',
    recommendation: 'Add Referrer-Policy: strict-origin-when-cross-origin',
  },
  {
    header: 'permissions-policy',
    severity: 'recommended',
    recommendation: 'Add Permissions-Policy to restrict browser feature access',
  },
];

/**
 * Audit the security headers in a Playwright API response.
 * Returns a full report split by severity and pass/fail status.
 */
export function auditSecurityHeaders(
  response: APIResponse,
  definitions: SecurityHeaderDefinition[] = SECURITY_HEADERS,
): SecurityReport {
  const headers = response.headers();
  const passed: SecurityHeaderAudit[] = [];
  const requiredFailed: SecurityHeaderAudit[] = [];
  const recommendedFailed: SecurityHeaderAudit[] = [];

  for (const def of definitions) {
    const value = headers[def.header] ?? null;
    const audit: SecurityHeaderAudit = {
      header: def.header,
      severity: def.severity,
      present: value !== null,
      value,
      recommendation: def.recommendation,
    };

    if (value !== null) {
      passed.push(audit);
    } else if (def.severity === 'required') {
      requiredFailed.push(audit);
    } else {
      recommendedFailed.push(audit);
    }
  }

  const score = Math.round((passed.length / definitions.length) * 100);

  return {
    url: response.url(),
    score,
    passed,
    requiredFailed,
    recommendedFailed,
  };
}

/**
 * Assert that ALL required-severity headers are present.
 * Recommended headers that are missing are logged as warnings but do NOT throw.
 */
export function assertRequiredHeadersPresent(report: SecurityReport): void {
  // Log recommended gaps as warnings (informational, not failures)
  if (report.recommendedFailed.length > 0) {
    const names = report.recommendedFailed.map((h) => h.header).join(', ');
    console.warn(`  ⚠️  Recommended headers missing (not a failure): ${names}`);
    for (const h of report.recommendedFailed) {
      console.warn(`     → ${h.header}: ${h.recommendation}`);
    }
  }

  // Hard-fail on any required header that is absent
  if (report.requiredFailed.length > 0) {
    const details = report.requiredFailed
      .map((h) => `\n    • ${h.header} — ${h.recommendation}`)
      .join('');
    throw new Error(`Required security headers missing:${details}`);
  }
}

/**
 * Assert that a specific header is present with an optional value check.
 */
export function assertHeaderPresent(
  response: APIResponse,
  header: string,
  expectedValue?: string | RegExp,
): void {
  const headers = response.headers();
  const value = headers[header.toLowerCase()];

  if (!value) {
    throw new Error(`Security header missing: "${header}"`);
  }

  if (expectedValue) {
    if (expectedValue instanceof RegExp) {
      if (!expectedValue.test(value)) {
        throw new Error(
          `Header "${header}" value "${value}" does not match ${expectedValue.toString()}`,
        );
      }
    } else if (!value.includes(expectedValue)) {
      throw new Error(
        `Header "${header}" expected to contain "${expectedValue}", got "${value}"`,
      );
    }
  }
}

/**
 * Check whether a header is present without throwing.
 * Returns the header value if present, null if absent.
 */
export function getHeader(response: APIResponse, header: string): string | null {
  return response.headers()[header.toLowerCase()] ?? null;
}

/**
 * Assert that sensitive headers are NOT exposed.
 */
export function assertHeaderAbsent(response: APIResponse, header: string): void {
  const headers = response.headers();
  const value = headers[header.toLowerCase()];
  if (value) {
    throw new Error(`Sensitive header "${header}" is exposed with value: "${value}"`);
  }
}

/**
 * Pretty-print a full security report to the console.
 */
export function printSecurityReport(report: SecurityReport): void {
  const pad = '   ';
  console.warn(`\n🔒 Security Header Audit: ${report.url}`);
  console.warn(`${pad}Score: ${report.score}/100`);

  if (report.passed.length > 0) {
    console.warn(`${pad}✅ Present (${report.passed.length}):`);
    for (const h of report.passed) {
      console.warn(`${pad}   [${h.severity.toUpperCase()}] ${h.header}: ${h.value}`);
    }
  }

  if (report.requiredFailed.length > 0) {
    console.warn(`${pad}❌ Required – MISSING (${report.requiredFailed.length}):`);
    for (const h of report.requiredFailed) {
      console.warn(`${pad}   ${h.header} → ${h.recommendation}`);
    }
  }

  if (report.recommendedFailed.length > 0) {
    console.warn(`${pad}⚠️  Recommended – missing (${report.recommendedFailed.length}):`);
    for (const h of report.recommendedFailed) {
      console.warn(`${pad}   ${h.header} → ${h.recommendation}`);
    }
  }
}
