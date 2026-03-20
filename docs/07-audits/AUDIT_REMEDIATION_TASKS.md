# Audit Remediation Tasks

**Created:** March 20, 2026  
**Purpose:** Track all remaining audit findings that need to be addressed before audit documents can be removed.

---

## Overview

This file consolidates all unaddressed findings from the audit reports in `docs/07-audits/`. Once all tasks are completed, the audit reports can be archived/removed.

### Status Legend
- ❌ Not started
- 🔄 In progress
- ✅ Completed

---

## P0 - Critical (Must Fix Immediately)

### 1. Fix Duplicate `regions` Key in vercel.json
- **Status:** ❌
- **Severity:** Critical
- **Source:** codebase-skills-audit-report.md
- **File:** `vercel.json:7,17`
- **Issue:** JSON has duplicate `regions` key which may cause parsing issues
- **Fix:** Remove duplicate key
- **Effort:** 5 minutes

### 2. Restrict CORS Configuration
- **Status:** ❌
- **Severity:** High
- **Source:** codebase-skills-audit-report.md
- **File:** `vercel.json:12-23`
- **Issue:** `Access-Control-Allow-Origin: *` exposes API to cross-origin attacks
- **Fix:** Restrict to known origins (gebeta.app, staging.gebeta.app)
- **Effort:** 30 minutes

---

## P1 - High Priority (Within 1 Week)

### 3. Reduce Google Fonts Loading
- **Status:** ❌
- **Severity:** High
- **Source:** codebase-skills-audit-report.md
- **File:** `src/app/layout.tsx`
- **Issue:** 7 Google Fonts loaded (Inter, Manrope, Plus Jakarta Sans, Playfair, JetBrains Mono, Geist, Instrument Serif) impacts LCP
- **Fix:** Reduce to 2-3 essential fonts
- **Effort:** 2 hours

### 4. Remove `force-dynamic` from Root Layout
- **Status:** ❌
- **Severity:** High
- **Source:** codebase-skills-audit-report.md
- **File:** `src/app/layout.tsx:32`
- **Issue:** Disables static rendering for entire app
- **Fix:** Move dynamic rendering to specific routes that need it
- **Effort:** 1 hour

### 5. Enable User Scaling (WCAG Compliance)
- **Status:** ❌
- **Severity:** Medium (WCAG violation)
- **Source:** codebase-skills-audit-report.md
- **File:** `src/app/layout.tsx:56`
- **Issue:** `userScalable: false` prevents users from zooming (WCAG 2.1 violation)
- **Fix:** Set `userScalable: true` and `maximumScale: 5`
- **Effort:** 5 minutes

### 6. Add Firefox to CI Test Matrix
- **Status:** ❌
- **Severity:** High
- **Source:** codebase-skills-audit-report.md
- **File:** `playwright.config.ts`
- **Issue:** Only Chromium tested in CI, Firefox missing
- **Fix:** Add Firefox project to CI test matrix
- **Effort:** 15 minutes

### 7. Fix Remaining RLS Policies with `USING (true)`
- **Status:** ❌
- **Severity:** High
- **Source:** security-skills-audit-report.md
- **Files:** 
  - `supabase/migrations/20260317_crit11_push_notification_support.sql`
  - `supabase/migrations/20260317_crit11_notification_metrics.sql`
  - `supabase/migrations/20260316110000_device_sync_status.sql`
- **Issue:** These migrations still have permissive `USING (true)` / `WITH CHECK (true)` policies
- **Fix:** Create new migration to replace with tenant-scoped policies
- **Effort:** 2 hours

---

## P2 - Medium Priority (Within 2 Weeks)

### 8. Lazy Load Three.js Components
- **Status:** ❌
- **Severity:** Medium
- **Source:** platform-grade-a-plus-tasks.md, codebase-skills-audit-report.md
- **Issue:** Three.js and React Three Fiber included but may not be needed for all routes
- **Fix:** Implement dynamic imports for 3D components
- **Effort:** 4 hours

### 9. Complete Image Optimization Audit
- **Status:** ❌
- **Severity:** Medium
- **Source:** platform-grade-a-plus-tasks.md
- **Issue:** Not all routes use `next/image` for optimization
- **Fix:** Audit all routes, add missing image optimizations, configure WebP/AVIF
- **Effort:** 2 hours

### 10. Add Load Tests to CI Pipeline
- **Status:** ❌
- **Severity:** Medium
- **Source:** platform-grade-a-plus-tasks.md
- **Issue:** No load testing in CI for peak flow scenarios
- **Fix:** Integrate k6 or Artillery load tests into CI workflow
- **Effort:** 4 hours

---

## P3 - Low Priority (Within 1 Month)

### 11. External Penetration Testing
- **Status:** ❌
- **Severity:** High (but requires external resource)
- **Source:** platform-grade-a-plus-tasks.md
- **Issue:** No third-party security review documented
- **Fix:** Schedule and conduct penetration testing, document findings
- **Effort:** External engagement

### 12. One-Click Rollback Automation
- **Status:** ❌
- **Severity:** Medium
- **Source:** platform-grade-a-plus-tasks.md
- **Issue:** Rollback requires manual intervention
- **Fix:** Configure Vercel rollback automation, add script to GitHub Actions
- **Effort:** 2 hours

### 13. Chaos Engineering Tests
- **Status:** ❌
- **Severity:** Medium
- **Source:** platform-grade-a-plus-tasks.md
- **Issue:** No failure scenario testing
- **Fix:** Design chaos experiments, test failure scenarios, document runbooks
- **Effort:** 8 hours

### 14. Replace console.warn with Structured Logging
- **Status:** ❌
- **Severity:** Low
- **Source:** platform-grade-a-plus-tasks.md
- **Issue:** Some files use `console.warn` for errors
- **Fix:** Audit and replace with structured logger
- **Effort:** 2 hours

### 15. Add Explicit Return Types
- **Status:** ❌
- **Severity:** Low
- **Source:** platform-grade-a-plus-tasks.md
- **Issue:** Some functions missing explicit return types
- **Fix:** Audit and add return types, update linting rules
- **Effort:** 2 hours

---

## Already Addressed ✅

These items have been completed and can be removed from the audit reports:

| Finding | Source | Evidence |
|---------|--------|----------|
| CRIT-001: Permissive RLS policies (main tables) | security-skills-audit-report.md | `supabase/migrations/20260320_security_fix_rls_policies.sql` |
| CRIT-002: Open redirect in auth callback | security-skills-audit-report.md | `src/app/auth/callback/route.ts` - `validateRedirectPath()` |
| HIGH-001: E2E auth bypass | security-skills-audit-report.md | `src/lib/supabase/middleware.ts` - requires secret |
| HIGH-002: x-forwarded-host validation | security-skills-audit-report.md | `src/app/auth/callback/route.ts` - `allowedHosts` |
| Missing CI/CD workflows | git-cicd-audit-report.md | All workflows created |
| Missing CODEOWNERS | git-cicd-audit-report.md | `.github/CODEOWNERS` exists |
| Inconsistent tool versions | git-cicd-audit-report.md | Node 22, pnpm 10 standardized |
| Missing concurrency controls | git-cicd-audit-report.md | All workflows have concurrency |
| Missing timeout configurations | git-cicd-audit-report.md | Jobs have timeouts |
| Missing dependabot.yml | git-cicd-audit-report.md | `.github/dependabot.yml` exists |
| Missing PR/Issue templates | git-cicd-audit-report.md | Templates created |
| Missing IaC | comprehensive-skills-audit-report.md | `terraform/` directory exists |
| Limited UI component library | comprehensive-skills-audit-report.md | Modal, Dropdown, Toast, Table, Pagination added |
| Redis rate limiting | comprehensive-skills-audit-report.md | `src/lib/rate-limit.ts` implemented |
| Missing CSP headers | platform-audit-2026-03.md | `middleware.ts` - `buildCSP()` |
| Missing rate limiting | platform-audit-2026-03.md | `src/lib/rate-limit.ts` |
| Missing CSRF protection | platform-audit-2026-03.md | `src/lib/security/csrf.ts` |

---

## Progress Summary

| Priority | Total | Completed | Remaining |
|----------|-------|-----------|-----------|
| P0 - Critical | 2 | 0 | 2 |
| P1 - High | 5 | 0 | 5 |
| P2 - Medium | 3 | 0 | 3 |
| P3 - Low | 5 | 0 | 5 |
| **Total** | **15** | **0** | **15** |

---

## Audit Removal Checklist

Before removing audit documents, all items above must be completed:

- [ ] All P0 items resolved
- [ ] All P1 items resolved
- [ ] All P2 items resolved (or explicitly deferred with justification)
- [ ] P3 items documented in backlog
- [ ] Integration tests verify all fixes
- [ ] Security review sign-off

---

## Notes

- Some P3 items (penetration testing) require external resources and may be scheduled separately
- Items can be prioritized up/down based on business needs
- Each completed item should reference the PR/commit that fixed it

---

_Last Updated: 2026-03-20_