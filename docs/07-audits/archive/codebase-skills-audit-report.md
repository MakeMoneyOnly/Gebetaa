# Gebeta Restaurant OS - Comprehensive Codebase Audit Report

**Audit Date:** March 20, 2026  
**Auditor:** Cline AI  
**Skills Applied:** vercel-deploy, vercel-deployment, web-quality-audit, webapp-testing

---

## Executive Summary

This audit evaluates the Gebeta Restaurant OS codebase against four specialized skill frameworks: Vercel deployment, web quality, and webapp testing. The codebase demonstrates **strong enterprise-grade practices** with some areas requiring attention.

| Category          | Grade  | Critical Issues | High Issues | Medium Issues |
| ----------------- | ------ | --------------- | ----------- | ------------- |
| Vercel Deployment | B+     | 1               | 2           | 3             |
| Web Quality       | A-     | 0               | 3           | 5             |
| Testing           | A      | 0               | 1           | 2             |
| **Overall**       | **A-** | **1**           | **6**       | **10**        |

---

## 1. Vercel Deployment Audit

### 1.1 Configuration Analysis (`vercel.json`)

#### Critical Issues

**🔴 CRITICAL: Duplicate `regions` key in vercel.json**

- **File:** `vercel.json:7` and `vercel.json:17`
- **Impact:** JSON parsing may use only the second definition, causing unexpected behavior
- **Fix:** Remove duplicate `regions` key

```json
// Current (problematic)
{
    "regions": ["iad1"],
    "env": { ... },
    "regions": ["iad1"],  // Duplicate!
}

// Fixed
{
    "regions": ["iad1"],
    "env": { ... },
}
```

#### High Priority Issues

**🟠 HIGH: Overly permissive CORS configuration**

- **File:** `vercel.json:12-23`
- **Impact:** `Access-Control-Allow-Origin: *` exposes API to cross-origin attacks
- **Fix:** Restrict to known origins

```json
{
    "source": "/api/(.*)",
    "headers": [
        {
            "key": "Access-Control-Allow-Origin",
            "value": "https://gebeta.app,https://staging.gebeta.app"
        }
    ]
}
```

**🟠 HIGH: Missing environment-specific database configuration**

- **File:** `.env.example`
- **Impact:** Preview deployments may use production database
- **Recommendation:** Implement environment variable validation to prevent production database usage in preview deployments

#### Medium Priority Issues

**🟡 MEDIUM: Placeholder project configuration**

- **File:** `vercel.json:19-23`
- **Impact:** Projects array uses placeholder values

```json
"projects": [
    {
        "projectId": "@vercel/project-id",  // Placeholder
        "teamId": "@vercel/team-id"         // Placeholder
    }
]
```

**🟡 MEDIUM: Missing function configuration**

- **Impact:** No explicit function memory/timeout configuration
- **Recommendation:** Add function configuration for API routes

```json
"functions": {
    "src/app/api/**/*.ts": {
        "memory": 1024,
        "maxDuration": 10
    }
}
```

**🟡 MEDIUM: Single region deployment**

- **Impact:** `regions: ["iad1"]` limits to US East, may affect latency for Ethiopian users
- **Recommendation:** Consider edge functions or multi-region for global access

### 1.2 CI/CD Pipeline Analysis (`.github/workflows/ci.yml`)

#### Strengths ✅

- Comprehensive pipeline with lint, test, security, build, and E2E stages
- Proper concurrency control to prevent duplicate runs
- Build artifact caching for faster deployments
- Bundle size monitoring with thresholds (>500KB warning, >1MB critical)
- Separate staging and production deployment jobs
- Health checks after deployment
- Rollback capability on failure

#### Issues Identified

**🟡 MEDIUM: No deployment approval gate for production**

- **Impact:** Production deploys automatically on main branch push
- **Recommendation:** Add `environment: production` with required reviewers

### 1.3 Next.js Configuration (`next.config.ts`)

#### Strengths ✅

- PWA configuration with offline support and runtime caching
- Image optimization with AVIF/WebP formats
- Security headers (XSS, Frame-Options, Content-Type-Options)
- Preconnect headers for critical origins
- Package import optimization for reduced bundle size
- Bundle analyzer integration

#### Issues Identified

**🟡 MEDIUM: `unoptimized: true` in CI environment**

- **File:** `next.config.ts:88`
- **Impact:** Images not optimized in CI builds
- **Recommendation:** Ensure this only applies to CI, not production

---

## 2. Web Quality Audit

### 2.1 Performance Analysis

#### Core Web Vitals Targets (`lighthouse-budget.json`)

| Metric      | Budget  | Status        |
| ----------- | ------- | ------------- |
| LCP         | < 2.5s  | ✅ Configured |
| FCP         | < 1.8s  | ✅ Configured |
| CLS         | < 0.1   | ✅ Configured |
| TBT         | < 300ms | ✅ Configured |
| Speed Index | < 3.4s  | ✅ Configured |
| TTI         | < 3.8s  | ✅ Configured |

#### Bundle Size Budgets

| Resource    | Budget (KB) | Count Budget |
| ----------- | ----------- | ------------ |
| Scripts     | 100         | 15 files     |
| Stylesheets | 30          | 5 files      |
| Images      | 200         | 20 files     |
| Fonts       | 100         | 4 files      |
| **Total**   | **500**     | -            |

#### Strengths ✅

- Comprehensive PWA caching strategy with NetworkFirst for API calls
- Font optimization with `display: 'swap'` for all 7 Google Fonts
- Image preconnect for critical image sources
- Service worker with offline fallback

#### High Priority Issues

**🟠 HIGH: Seven Google Fonts loaded**

- **File:** `src/app/layout.tsx:20-50`
- **Impact:** Excessive font loading may impact LCP
- **Recommendation:** Reduce to 2-3 essential fonts

```typescript
// Current: 7 fonts (Inter, Manrope, Plus Jakarta Sans, Playfair, JetBrains Mono, Geist, Instrument Serif)
// Recommended: 2-3 fonts maximum
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
    display: 'swap',
});
```

**🟠 HIGH: `force-dynamic` on root layout**

- **File:** `src/app/layout.tsx:32`
- **Impact:** Disables static rendering for entire app
- **Recommendation:** Move dynamic rendering to specific routes that need it

```typescript
// Current
export const dynamic = 'force-dynamic';

// Recommendation: Remove and use per-route configuration
```

**🟠 HIGH: Heavy dependencies in client bundle**

- **File:** `package.json`
- **Impact:** Large bundle sizes from three.js, framer-motion, recharts
- **Dependencies of concern:**
    - `three` (3D library - large)
    - `@react-three/drei` (3D helpers)
    - `@react-three/fiber` (3D React renderer)
    - `framer-motion` (animation library)
    - `recharts` (charting)
- **Recommendation:** Use dynamic imports for 3D features

```typescript
// Lazy load 3D components
const ThreeScene = dynamic(() => import('./ThreeScene'), { ssr: false });
```

#### Medium Priority Issues

**🟡 MEDIUM: Missing image preload for LCP**

- **Impact:** LCP image may not be prioritized
- **Recommendation:** Add preload link for above-fold images in `<head>`

**🟡 MEDIUM: No critical CSS extraction**

- **Impact:** Render-blocking CSS
- **Recommendation:** Consider critical CSS inlining for above-fold content

### 2.2 Accessibility Analysis

#### Strengths ✅

- Skip link implemented (`<SkipLink href="#main-content">`)
- Main content has `id="main-content"` and `tabIndex={-1}`
- Focus trap component available (`src/components/ui/FocusTrap.tsx`)
- Accessibility E2E tests (`e2e/accessibility.spec.ts`)
- `@axe-core/playwright` integrated for automated a11y testing

#### Issues Identified

**🟡 MEDIUM: `userScalable: false` in viewport**

- **File:** `src/app/layout.tsx:56`
- **Impact:** Prevents users from zooming (WCAG 2.1 violation)
- **Recommendation:** Remove or set to `true`

```typescript
// Current
export const viewport: Viewport = {
    userScalable: false, // WCAG violation
};

// Fixed
export const viewport: Viewport = {
    userScalable: true,
    maximumScale: 5,
};
```

**🟡 MEDIUM: Missing `lang` attribute for Amharic support**

- **File:** `src/app/layout.tsx:62`
- **Impact:** Screen readers may not pronounce Amharic content correctly
- **Recommendation:** Add `lang="am"` for Amharic pages

### 2.3 Security Analysis

#### Strengths ✅

- Comprehensive CSP in middleware with proper directives
- HSTS with preload enabled
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Rate limiting middleware implemented
- CSRF protection (`src/lib/csrf.ts`)
- HMAC signing for guest sessions
- Sentry integration for error monitoring

#### Issues Identified

**🟡 MEDIUM: `unsafe-inline` and `unsafe-eval` in CSP**

- **File:** `middleware.ts:24-25`
- **Impact:** Reduces XSS protection
- **Mitigation:** Required for Next.js SSR, but consider nonce-based CSP for production

---

## 3. Webapp Testing Audit

### 3.1 Unit Testing (`vitest.config.ts`)

#### Strengths ✅

- 80% coverage threshold for all metrics (lines, functions, statements, branches)
- Proper test file patterns (`*.test.ts`, `*.spec.ts`)
- React Testing Library configured
- jsdom environment for component testing
- Coverage reports in multiple formats (text, json, html, lcov)

#### Coverage Configuration

```typescript
thresholds: {
    lines: 80,
    functions: 80,
    statements: 80,
    branches: 80,  // Note: 70% typical for complex branches
}
```

#### Issues Identified

**🟡 MEDIUM: Large exclusion list**

- **File:** `vitest.config.ts:15-50`
- **Impact:** Many files excluded from coverage, may mask untested code
- **Excluded items:** API routes, page components, service files
- **Recommendation:** Ensure integration/E2E tests cover excluded files

### 3.2 E2E Testing (`playwright.config.ts`)

#### Strengths ✅

- Multi-browser testing (Chromium, Mobile Chrome, Mobile Safari)
- CI-specific configuration (retries, single worker)
- Proper timeout configuration (45s)
- Trace collection on retry for debugging
- Web server auto-start for local testing
- Page Object Model pattern implemented (`e2e/page-objects/`)

#### Test Coverage

| Test File                               | Purpose                 |
| --------------------------------------- | ----------------------- |
| `accessibility.spec.ts`                 | WCAG compliance         |
| `merchant-dashboard-audit.spec.ts`      | Dashboard functionality |
| `guest-signed-qr-order.spec.ts`         | Guest ordering flow     |
| `kds-operational-flow.spec.ts`          | Kitchen Display System  |
| `p1-localization-accessibility.spec.ts` | i18n and a11y           |
| `p2-finance-reconciliation.spec.ts`     | Financial operations    |
| `visual-regression.spec.ts`             | UI consistency          |

#### High Priority Issue

**🟠 HIGH: Missing Firefox project**

- **File:** `playwright.config.ts`
- **Impact:** No Firefox testing in CI
- **Recommendation:** Add Firefox to CI test matrix

```typescript
projects: isCI
    ? [
          { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
      ]
    : [...]
```

### 3.3 Lighthouse CI (`.github/workflows/lighthouse.yml`)

#### Strengths ✅

- Automated performance auditing on PRs
- Budget enforcement with `lighthouse-budget.json`
- Artifact upload for results
- Temporary public storage for sharing results

---

## 4. Environment Variables Audit

### 4.1 Configuration (`package.json`)

#### Strengths ✅

- Node.js >= 20.0.0 required
- pnpm >= 9.0.0 required
- Security audit scripts configured
- Dependency override for vulnerable packages

#### Security Scripts Available

```json
"security:audit": "pnpm audit --audit-level=high",
"security:audit:fix": "pnpm audit --fix",
"security:outdated": "pnpm outdated",
"security:deprecated": "node scripts/security/check-deprecated.mjs",
"security:overrides:check": "node scripts/security/check-unused-overrides.mjs"
```

### 4.2 Environment Variables (`.env.example`)

#### Strengths ✅

- Comprehensive documentation with [REQUIRED], [OPTIONAL], [SECRET], [PUBLIC] labels
- Separate staging environment variables
- Feature flags for pilot rollout control
- Connection pooling configuration for Supabase

#### Issues Identified

**🟡 MEDIUM: Many optional integrations without feature flags**

- **Impact:** Dead code may be included in bundle
- **Recommendation:** Add build-time feature flags for optional integrations

---

## 5. Recommendations Summary

### Immediate Actions (Critical/High)

| Priority | Issue                                 | Action                    | Effort |
| -------- | ------------------------------------- | ------------------------- | ------ |
| 🔴 P0    | Duplicate `regions` in vercel.json    | Remove duplicate key      | 5 min  |
| 🟠 P1    | CORS `Access-Control-Allow-Origin: *` | Restrict to known origins | 30 min |
| 🟠 P1    | Missing Firefox in CI tests           | Add Firefox project       | 15 min |
| 🟠 P1    | 7 Google Fonts loaded                 | Reduce to 2-3 fonts       | 2 hrs  |
| 🟠 P1    | `force-dynamic` on root layout        | Move to specific routes   | 1 hr   |
| 🟠 P1    | Heavy client-side dependencies        | Implement code splitting  | 4 hrs  |

### Short-term Improvements (Medium)

| Priority | Issue                            | Action                      | Effort |
| -------- | -------------------------------- | --------------------------- | ------ |
| 🟡 P2    | `userScalable: false`            | Enable user scaling         | 5 min  |
| 🟡 P2    | Missing production approval gate | Add environment protection  | 30 min |
| 🟡 P2    | Single region deployment         | Evaluate multi-region needs | 2 hrs  |
| 🟡 P2    | Large test exclusion list        | Verify E2E coverage         | 4 hrs  |
| 🟡 P2    | Missing Amharic lang support     | Add dynamic lang attribute  | 1 hr   |

### Long-term Optimizations

1. **Implement nonce-based CSP** for enhanced XSS protection
2. **Add critical CSS extraction** for improved LCP
3. **Evaluate Edge Runtime** for API routes to reduce latency for Ethiopian users
4. **Implement database branching** for preview deployments
5. **Add visual regression testing** to CI pipeline

---

## 6. Compliance Checklist

### Vercel Deployment Best Practices

- [x] Environment variables separated by environment
- [x] Build caching configured
- [x] Preview deployments enabled
- [x] Health checks implemented
- [x] Rollback capability
- [ ] Production approval gates (missing)
- [ ] Multi-region deployment (single region)

### Web Quality Standards

- [x] Core Web Vitals budgets defined
- [x] Lighthouse CI integrated
- [x] Image optimization enabled
- [x] Security headers configured
- [ ] Font loading optimized (7 fonts - needs reduction)
- [ ] User scalability enabled (disabled - WCAG issue)

### Testing Standards

- [x] Unit tests with 80% coverage threshold
- [x] E2E tests with Playwright
- [x] Accessibility tests with axe-core
- [x] Visual regression tests
- [x] Security scanning in CI
- [ ] Firefox browser testing (missing in CI)

---

## 7. Skills Used

| Skill             | Version | Application                            |
| ----------------- | ------- | -------------------------------------- |
| vercel-deploy     | -       | Deployment configuration review        |
| vercel-deployment | -       | CI/CD and environment analysis         |
| web-quality-audit | 1.0     | Performance, accessibility, SEO review |
| webapp-testing    | -       | Testing infrastructure evaluation      |

---

## 8. Conclusion

The Gebeta Restaurant OS codebase demonstrates **strong enterprise-grade practices** with comprehensive CI/CD pipelines, security measures, and testing infrastructure. The main areas requiring attention are:

1. **Configuration cleanup** (duplicate keys, CORS settings)
2. **Performance optimization** (font loading, bundle size)
3. **Accessibility compliance** (user scaling, language support)

The overall grade of **A-** reflects a well-maintained codebase with room for optimization in deployment configuration and frontend performance.

---

_Report generated using Cline AI with skills: vercel-deploy, vercel-deployment, web-quality-audit, webapp-testing_
