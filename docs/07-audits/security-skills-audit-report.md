# Gebeta Restaurant OS - Comprehensive Security Audit Report

**Audit Date:** March 20, 2026  
**Audit Scope:** Full codebase security review using security skills  
**Auditor:** Cline AI (using security-best-practices, api-security-best-practices, security-threat-model, sql-injection-testing, vulnerability-scanner, webapp-testing skills)

---

## Executive Summary

This audit evaluated the Gebeta Restaurant OS codebase against OWASP Top 10 2025, Next.js security best practices, React security patterns, and API security standards. The codebase demonstrates **strong security posture** in many areas with some critical findings requiring immediate attention.

### Overall Security Grade: **B+** (Good with Critical Findings)

| Category                       | Score | Status                |
| ------------------------------ | ----- | --------------------- |
| Authentication & Authorization | A     | Strong                |
| Input Validation               | A-    | Strong                |
| Rate Limiting                  | A     | Strong                |
| CSRF Protection                | A     | Strong                |
| RLS Policies                   | C     | **Critical Finding**  |
| Secrets Management             | B+    | Good                  |
| XSS Prevention                 | B     | Good                  |
| Open Redirect Protection       | C     | **Needs Improvement** |
| Webhook Security               | A     | Strong                |
| Dependency Security            | A     | Strong                |

---

## Critical Findings (Must Fix Immediately)

### CRIT-001: Permissive RLS Policies with `USING (true)` / `WITH CHECK (true)`

**Severity:** Critical  
**Rule ID:** NEXT-AUTH-001, OWASP A01  
**Location:** Multiple migration files

**Evidence:**

```sql
-- supabase/migrations/20260204_initial_schema.sql
CREATE POLICY "Anon Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);

-- supabase/migrations/20260201_audit_compliance_updates.sql
CREATE POLICY "Anyone can create service requests" ON public.service_requests
    WITH CHECK (true);

-- supabase/migrations/20260214_phase1_foundation.sql
CREATE POLICY "Public tables are viewable" ON tables FOR SELECT USING (true);
CREATE POLICY "Order items viewable by public (guest) and staff" ON order_items FOR SELECT USING (true);
```

**Impact:**

- Any anonymous user can insert orders without proper validation
- Service requests can be created by anyone without authentication
- Tables and order items are publicly readable without tenant scoping
- Potential for data exfiltration and unauthorized data manipulation

**Fix:**
Replace permissive policies with proper tenant-scoped policies:

```sql
-- Example fix for orders
DROP POLICY IF EXISTS "Anon Insert Orders" ON public.orders;

CREATE POLICY "Guests can insert orders for their session" ON public.orders
    FOR INSERT
    WITH CHECK (
        -- Validate through guest session context
        restaurant_id IN (
            SELECT id FROM restaurants WHERE slug = current_setting('request.jwt.claims')->>'slug'
        )
    );

CREATE POLICY "Staff can view orders for their restaurant" ON public.orders
    FOR SELECT
    USING (
        restaurant_id IN (
            SELECT restaurant_id FROM restaurant_staff
            WHERE user_id = auth.uid() AND is_active = true
        )
    );
```

**Mitigation:** The application layer does enforce validation (see `src/lib/security/guestContext.ts`), but RLS should be the last line of defense.

---

### CRIT-002: Open Redirect Vulnerability in Auth Callback

**Severity:** High  
**Rule ID:** NEXT-REDIRECT-001, OWASP A01  
**Location:** `src/app/auth/callback/route.ts:12-22`

**Evidence:**

```typescript
const next = searchParams.get('next') ?? '/auth/post-login';
// ...
if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
} else if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
}
```

**Impact:**

- The `next` parameter is not validated before use in redirect
- Attackers can craft malicious URLs like `/auth/callback?next=//evil.com/phish`
- Can be used for phishing attacks and OAuth flow hijacking

**Fix:**

```typescript
function validateRedirectPath(path: string): string {
    // Only allow relative paths starting with /
    if (path.startsWith('/') && !path.startsWith('//')) {
        // Validate against allowlist of valid routes
        const allowedPrefixes = ['/auth/', '/merchant/', '/kds/', '/app/'];
        if (allowedPrefixes.some(prefix => path.startsWith(prefix))) {
            return path;
        }
    }
    return '/auth/post-login'; // Safe default
}

const next = validateRedirectPath(searchParams.get('next') ?? '/');
```

---

## High Severity Findings

### HIGH-001: E2E Test Auth Bypass in Production Code

**Severity:** High  
**Rule ID:** NEXT-AUTH-002  
**Location:** `src/lib/supabase/middleware.ts:12-23`

**Evidence:**

```typescript
// E2E test bypass: allows Playwright specs to exercise protected routes with mocked APIs.
if (request.headers.get('x-e2e-bypass-auth') === '1') {
    // Set mock auth cookies for E2E tests
    supabaseResponse.cookies.set('sb-access-token', 'e2e-mock-access-token', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 3600,
    });
```

**Impact:**

- Anyone knowing the bypass header can access protected routes without authentication
- The header `x-e2e-bypass-auth` is documented in the code and could be exploited

**Fix:**

```typescript
// Only allow E2E bypass in non-production environments
if (
    process.env.NODE_ENV !== 'production' &&
    process.env.E2E_TEST_MODE === 'true' &&
    request.headers.get('x-e2e-bypass-auth') === process.env.E2E_BYPASS_SECRET
) {
    // ... bypass logic
}
```

---

### HIGH-002: Untrusted `x-forwarded-host` Header Usage

**Severity:** High  
**Rule ID:** NEXT-HOST-001, NEXT-PROXY-001  
**Location:** `src/app/auth/callback/route.ts:19-20`

**Evidence:**

```typescript
const forwardedHost = request.headers.get('x-forwarded-host');
// ...
return NextResponse.redirect(`https://${forwardedHost}${next}`);
```

**Impact:**

- `x-forwarded-host` can be spoofed by attackers
- Could redirect to attacker-controlled domain
- Undermines OAuth security

**Fix:**

```typescript
const allowedHosts = [
    'gebetamenu.com',
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
].filter(Boolean);

const forwardedHost = request.headers.get('x-forwarded-host');
if (forwardedHost && allowedHosts.includes(forwardedHost)) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
}
```

---

### HIGH-003: Device Token Storage in localStorage

**Severity:** Medium-High  
**Rule ID:** REACT-AUTH-001  
**Location:** Multiple files

**Evidence:**

```typescript
// src/app/(guest)/[slug]/setup/page.tsx
localStorage.setItem('gebata_device_token', result.data.device_token);

// src/app/(terminal)/terminal/page.tsx
const token = localStorage.getItem('gebata_device_token');

// src/app/(pos)/waiter/pin/page.tsx
localStorage.setItem('gebata_waiter_context', JSON.stringify(data.staff));
```

**Impact:**

- Tokens stored in localStorage are vulnerable to XSS attacks
- Any malicious JavaScript can exfiltrate device tokens and staff context
- Could lead to unauthorized device access

**Recommendation:**

- For device tokens: Use HttpOnly cookies where possible
- For staff context: Store minimal data, use short-lived session tokens
- Consider using sessionStorage for temporary context (cleared on tab close)

---

## Medium Severity Findings

### MED-001: CSP Allows `unsafe-inline` and `unsafe-eval`

**Severity:** Medium  
**Rule ID:** NEXT-CSP-001, REACT-CSP-001  
**Location:** `middleware.ts:22-23`

**Evidence:**

```typescript
isProduction
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
```

**Impact:**

- Reduces effectiveness of CSP as XSS defense-in-depth
- `unsafe-eval` allows dynamic code execution
- `unsafe-inline` allows inline script injection

**Mitigation:**

- This is a known limitation for Next.js SSR compatibility
- Consider using nonces for scripts where possible
- Document as accepted risk with future improvement plan

---

### MED-002: Missing Secure Cookie Attribute in Development

**Severity:** Medium  
**Rule ID:** NEXT-SESS-001  
**Location:** `src/lib/security/csrf.ts:17`

**Evidence:**

```typescript
const CSRF_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
```

**Status:** Actually correctly implemented! This is a positive finding showing proper handling.

---

### MED-003: Potential XSS via innerHTML in Print Window

**Severity:** Medium  
**Rule ID:** REACT-XSS-001, REACT-DOM-001  
**Location:** `src/app/(dashboard)/merchant/tables/page.tsx`

**Evidence:**

```typescript
printWindow.document.write(`
    <html>
        <h2>Table QR Codes</h2>
        ...
        ${container.innerHTML}
```

**Impact:**

- If `container.innerHTML` contains user-controlled content, could lead to XSS
- Print window runs in same origin

**Fix:**
Ensure QR code content is sanitized before rendering, or use textContent for user-controlled portions.

---

### MED-004: Missing Rate Limiting on Read Endpoints

**Severity:** Medium  
**Rule ID:** NEXT-DOS-001  
**Location:** `src/lib/rate-limit.ts:95-98`

**Evidence:**

```typescript
// For now, don't rate limit read operations at middleware level
// They can be added later if needed
return null;
```

**Impact:**

- Read endpoints could be targeted for DoS attacks
- No protection against scraping/data harvesting

**Recommendation:**
Add rate limiting for read endpoints, especially:

- `/api/orders` (GET)
- `/api/menu`
- `/api/analytics/*`

---

## Low Severity Findings

### LOW-001: Verbose Error Messages in Some API Responses

**Severity:** Low  
**Rule ID:** NEXT-ERROR-001  
**Location:** Various API routes

**Evidence:**

```typescript
// Some endpoints return detailed error info
return apiError('Failed to load orders', 500, 'ORDERS_FETCH_FAILED', error.message);
```

**Impact:**

- Internal error details could leak to clients
- May reveal implementation details

**Recommendation:**

- In production, log detailed errors server-side
- Return generic error messages to clients

---

### LOW-002: Missing SRI for External Scripts

**Severity:** Low  
**Rule ID:** REACT-SRI-001  
**Location:** N/A (no external scripts found)

**Status:** No external scripts from CDNs were found in the codebase. This is a positive finding.

---

## Positive Security Findings

### ✅ Strong Authentication Implementation

- Supabase Auth with proper session management
- Device authentication via tokens with proper validation
- Multi-factor authentication support via PIN verification

### ✅ Comprehensive Input Validation

- Zod schemas used throughout for request validation
- Type-safe validators in `src/lib/validators/`
- Runtime validation for all user inputs

### ✅ Proper HMAC Implementation

- Timing-safe comparison for signature verification
- QR code signing with expiration
- Session token signing with master secret

### ✅ CSRF Protection

- Token-based CSRF protection implemented
- Origin validation for Server Actions
- SameSite cookie attributes set correctly

### ✅ Rate Limiting

- Comprehensive rate limiting on mutation endpoints
- Redis-backed rate limiting available
- Proper rate limit headers returned

### ✅ Webhook Security

- Signature verification for Chapa webhooks
- Raw body verification (not re-serialized)
- Proper error handling

### ✅ Tenant Isolation

- `enforceTenantScope` function for authorization
- Resource validation functions for orders, menu items, tables
- Security event logging for violations

### ✅ Security Headers

- CSP implemented
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS with long max-age
- Permissions-Policy set

### ✅ Dependency Security

- Security audit scripts in package.json
- pnpm overrides for vulnerable packages
- Regular update process documented

---

## Threat Model Summary

### Trust Boundaries

1. **Guest → Application**: Untrusted; validated via HMAC-signed QR codes
2. **Staff → Application**: Authenticated via Supabase Auth; authorized via restaurant_staff
3. **Device → Application**: Authenticated via device tokens; scoped by device type
4. **Payment Provider → Application**: Webhooks verified via signatures
5. **Public Internet → Application**: Protected by rate limiting, WAF recommended

### Critical Assets

- Restaurant data (multi-tenant)
- Order information
- Payment transactions
- Staff credentials and PINs
- Device tokens
- Guest session tokens

### Attack Surface

- Guest ordering flow (QR-based authentication)
- Payment processing (Chapa integration)
- Staff authentication (PIN-based)
- Device provisioning
- Webhook endpoints
- GraphQL API

---

## Recommendations Priority Matrix

| Priority | Finding                                     | Effort | Impact   |
| -------- | ------------------------------------------- | ------ | -------- |
| P0       | Fix RLS policies (CRIT-001)                 | High   | Critical |
| P0       | Fix open redirect (CRIT-002)                | Low    | Critical |
| P1       | Secure E2E bypass (HIGH-001)                | Low    | High     |
| P1       | Validate forwarded host (HIGH-002)          | Low    | High     |
| P2       | Migrate tokens from localStorage (HIGH-003) | Medium | Medium   |
| P2       | Add read endpoint rate limiting (MED-004)   | Medium | Medium   |
| P3       | Improve CSP (MED-001)                       | High   | Medium   |

---

## Security Checklist Results

### OWASP Top 10 2025

| Category                       | Status | Notes                              |
| ------------------------------ | ------ | ---------------------------------- |
| A01: Broken Access Control     | ⚠️     | RLS policies need fixing           |
| A02: Cryptographic Failures    | ✅     | Proper HMAC, bcrypt usage          |
| A03: Injection                 | ✅     | Parameterized queries via Supabase |
| A04: Insecure Design           | ✅     | Threat modeling evident            |
| A05: Security Misconfiguration | ⚠️     | CSP could be stricter              |
| A06: Vulnerable Components     | ✅     | Dependencies managed               |
| A07: Authentication Failures   | ✅     | Strong auth implementation         |
| A08: Integrity Failures        | ✅     | Webhook signatures verified        |
| A09: Logging Failures          | ✅     | Audit logs implemented             |
| A10: SSRF                      | ✅     | No user-controlled URLs found      |

---

## Conclusion

The Gebeta Restaurant OS demonstrates a **mature security posture** with comprehensive implementations of authentication, authorization, input validation, and audit logging. The codebase follows Next.js and React security best practices in most areas.

**Immediate Actions Required:**

1. Fix permissive RLS policies in Supabase migrations
2. Implement redirect path validation in auth callback
3. Secure the E2E test bypass mechanism

**Short-term Improvements:**

1. Validate `x-forwarded-host` against allowlist
2. Add rate limiting to read endpoints
3. Consider migrating sensitive tokens from localStorage

The security foundation is solid, and addressing the critical findings will bring the platform to enterprise-grade security compliance.

---

**Report Generated:** March 20, 2026  
**Skills Applied:**

- api-security-best-practices
- security-best-practices
- security-threat-model
- sql-injection-testing
- vulnerability-scanner
- webapp-testing
