# 🚀 Gebeta Restaurant OS - Audit Remediation Super Prompt

**Copy and paste this entire prompt to another AI session to systematically fix all audit findings.**

---

## Context

You are tasked with fixing all issues identified in the comprehensive platform audit for the **Gebeta Restaurant OS** project. This is a Next.js 16, React 19, TypeScript 5 restaurant operating system for Addis Ababa, Ethiopia.

### Critical Files to Reference:
1. **`PLATFORM_AUDIT.md`** - Contains all 88 findings with IDs, priorities, and fixes
2. **`/SKILLS/development/`** - Contains skill files with best practices and patterns
3. **`.clinerules`** - Project-specific coding standards and rules
4. **`.cursorrules`** - Additional coding guidelines

### Project Tech Stack:
- Frontend: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
- Backend: Next.js API Routes, Supabase (PostgreSQL + Auth + Realtime)
- State: Zustand (client), TanStack Query (server), Dexie.js (offline)
- Testing: Vitest (unit), Playwright (E2E)

---

## Instructions

Execute the following remediation plan **step by step**, updating the status in `PLATFORM_AUDIT.md` after completing each item. Work through items in priority order: Critical → High → Medium → Low.

---

## PHASE 1: CRITICAL ISSUES (Fix Immediately)

### Issue TEST-1: Increase Coverage Thresholds to 80%

**Skill to Apply:** `/SKILLS/development/testing-patterns.md`

**Step-by-step Instructions:**

1. Read `vitest.config.ts` and locate the coverage thresholds section
2. Update the thresholds from:
   ```typescript
   thresholds: {
       lines: 50,
       functions: 50,
       statements: 50,
       branches: 40,
   }
   ```
   To:
   ```typescript
   thresholds: {
       lines: 80,
       functions: 80,
       statements: 80,
       branches: 70,
   }
   ```
3. Run `pnpm test:coverage` to identify files with low coverage
4. Create missing test files for uncovered modules
5. Update `PLATFORM_AUDIT.md` to mark TEST-1 as `[x]`

**Files to Modify:**
- `vitest.config.ts`
- New test files in `src/lib/**/*.test.ts`

---

### Issue SEC-1: Enforce Dedicated QR_HMAC_SECRET Environment Variable

**Skill to Apply:** `/SKILLS/development/api-security-best-practices.md`

**Step-by-step Instructions:**

1. Read `src/lib/security/hmac.ts`
2. Locate the HMAC_SECRET constant definition:
   ```typescript
   const HMAC_SECRET =
       process.env.QR_HMAC_SECRET ||
       process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
       'default-secret-change-in-production';
   ```
3. Replace with strict enforcement:
   ```typescript
   const HMAC_SECRET = process.env.QR_HMAC_SECRET;
   
   if (!HMAC_SECRET) {
       throw new Error(
           'QR_HMAC_SECRET environment variable is required. ' +
           'Generate a secure key: openssl rand -hex 32'
       );
   }
   ```
4. Add validation at startup in a new file `src/lib/security/validateEnv.ts`:
   ```typescript
   export function validateSecurityEnvVars() {
       const required = ['QR_HMAC_SECRET'];
       const missing = required.filter(key => !process.env[key]);
       if (missing.length > 0) {
           throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
       }
   }
   ```
5. Update `.env.example` to include `QR_HMAC_SECRET=`
6. Update `PLATFORM_AUDIT.md` to mark SEC-1 as `[x]`

**Files to Modify:**
- `src/lib/security/hmac.ts`
- `src/lib/security/validateEnv.ts` (new)
- `.env.example`

---

### Issue ARCH-1: Add OpenAPI Documentation

**Skill to Apply:** `/SKILLS/development/api-patterns.md`

**Step-by-step Instructions:**

1. Install dependencies:
   ```bash
   pnpm add swagger-jsdoc swagger-ui-react
   pnpm add -D @types/swagger-jsdoc
   ```

2. Create `src/app/api/docs/route.ts`:
   ```typescript
   import swaggerJsdoc from 'swagger-jsdoc';
   import { NextResponse } from 'next/server';
   
   const options = {
       definition: {
           openapi: '3.0.0',
           info: {
               title: 'Gebeta Restaurant OS API',
               version: '1.0.0',
               description: 'API documentation for Gebeta Restaurant OS',
           },
           servers: [
               { url: 'https://gebeta.app/api', description: 'Production' },
               { url: 'http://localhost:3000/api', description: 'Development' },
           ],
       },
       apis: ['./src/app/api/**/*.ts'],
   };
   
   export async function GET() {
       const specs = swaggerJsdoc(options);
       return NextResponse.json(specs);
   }
   ```

3. Create `src/app/api/docs/ui/route.ts`:
   ```typescript
   import swaggerUi from 'swagger-ui-react';
   import { NextResponse } from 'next/server';
   
   export async function GET() {
       const html = `
       <!DOCTYPE html>
       <html>
       <head>
           <title>Gebeta API Documentation</title>
           <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
       </head>
       <body>
           <div id="swagger-ui"></div>
           <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
           <script>
               SwaggerUIBundle({
                   url: '/api/docs',
                   dom_id: '#swagger-ui',
               });
           </script>
       </body>
       </html>
       `;
       return new NextResponse(html, {
           headers: { 'Content-Type': 'text/html' },
       });
   }
   ```

4. Add JSDoc comments to API routes, starting with `src/app/api/orders/route.ts`:
   ```typescript
   /**
    * @openapi
    * /orders:
    *   get:
    *     summary: List orders
    *     tags: [Orders]
    *     security:
    *       - bearerAuth: []
    *     parameters:
    *       - in: query
    *         name: status
    *         schema:
    *           type: string
    *       - in: query
    *         name: limit
    *         schema:
    *           type: integer
    *           default: 50
    *     responses:
    *       200:
    *         description: List of orders
    *       401:
    *         description: Unauthorized
    */
   ```

5. Update `PLATFORM_AUDIT.md` to mark ARCH-1 as `[x]`

**Files to Create/Modify:**
- `src/app/api/docs/route.ts` (new)
- `src/app/api/docs/ui/route.ts` (new)
- `src/app/api/orders/route.ts` (add JSDoc)
- Other API routes (add JSDoc)

---

## PHASE 2: HIGH PRIORITY ISSUES (Fix This Sprint)

### Issue FE-1: Convert Excessive Client Components to Server Components

**Skill to Apply:** `/SKILLS/development/nextjs-best-practices.md`

**Step-by-step Instructions:**

1. Search for all files with `'use client'`:
   ```bash
   grep -r "'use client'" src/ --include="*.tsx"
   ```

2. For each dashboard page in `src/app/(dashboard)/merchant/`:
   - Analyze if data fetching is the only reason for client-side
   - If yes, split into:
     - `page.tsx` (Server Component - fetches data)
     - `ClientPage.tsx` (Client Component - handles interactivity)

3. Example pattern for `src/app/(dashboard)/merchant/orders/page.tsx`:
   ```typescript
   // page.tsx (Server Component)
   import { createClient } from '@/lib/supabase/server';
   import OrdersClient from './OrdersClient';
   
   export default async function OrdersPage() {
       const supabase = await createClient();
       const { data: orders } = await supabase
           .from('orders')
           .select('*')
           .order('created_at', { ascending: false });
       
       return <OrdersClient initialOrders={orders} />;
   }
   ```
   ```typescript
   // OrdersClient.tsx (Client Component)
   'use client';
   
   export default function OrdersClient({ initialOrders }) {
       // Interactivity only
   }
   ```

4. Update `PLATFORM_AUDIT.md` to mark FE-1 as `[x]`

**Files to Modify:**
- All pages in `src/app/(dashboard)/merchant/*/page.tsx`
- Create corresponding `*Client.tsx` files

---

### Issue FE-2: Implement Server Components with Suspense for Dashboard

**Skill to Apply:** `/SKILLS/development/react-best-practices.md`

**Step-by-step Instructions:**

1. Create loading skeletons in `src/components/ui/Skeleton.tsx` (if not exists)
2. Add `loading.tsx` files to dashboard routes:
   ```typescript
   // src/app/(dashboard)/merchant/loading.tsx
   import { Skeleton } from '@/components/ui/Skeleton';
   
   export default function Loading() {
       return (
           <div className="space-y-4">
               <Skeleton className="h-10 w-64" />
               <Skeleton className="h-48 w-full" />
               <Skeleton className="h-48 w-full" />
           </div>
       );
   }
   ```

3. Wrap slow data fetches in Suspense boundaries
4. Update `PLATFORM_AUDIT.md` to mark FE-2 as `[x]`

---

### Issue PERF-1: Add Lighthouse CI to GitHub Actions

**Skill to Apply:** `/SKILLS/development/github-actions-creator.md`

**Step-by-step Instructions:**

1. Create `.github/workflows/lighthouse.yml`:
   ```yaml
   name: Lighthouse CI
   
   on:
       pull_request:
           branches: [main, develop]
       push:
           branches: [main]
   
   jobs:
       lighthouse:
           runs-on: ubuntu-latest
           steps:
               - uses: actions/checkout@v4
               - uses: pnpm/action-setup@v3
                 with:
                     version: 9
               - uses: actions/setup-node@v4
                 with:
                     node-version: 20
                     cache: 'pnpm'
               - run: pnpm install --frozen-lockfile
               - run: pnpm build
               - name: Run Lighthouse CI
                 uses: treosh/lighthouse-ci-action@v11
                 with:
                     configPath: ./lighthouserc.json
                     uploadArtifacts: true
   ```

2. Update `lighthouserc.json` with proper configuration
3. Update `PLATFORM_AUDIT.md` to mark PERF-1 as `[x]`

---

### Issue PERF-2: Configure Performance Budgets

**Skill to Apply:** `/SKILLS/development/core-web-vitals.md`

**Step-by-step Instructions:**

1. Update `lighthouse-budget.json`:
   ```json
   {
       "ci": {
           "assert": {
               "assertions": {
                   "categories:performance": ["error", { "minScore": 0.9 }],
                   "categories:accessibility": ["error", { "minScore": 0.9 }],
                   "first-contentful-paint": ["error", { "maxNumericValue": 2000 }],
                   "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
                   "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
                   "total-blocking-time": ["error", { "maxNumericValue": 300 }],
                   "resource-summary:script:size": ["warn", { "maxNumericValue": 512000 }],
                   "resource-summary:total:size": ["warn", { "maxNumericValue": 2048000 }]
               }
           }
       }
   }
   ```

2. Update `PLATFORM_AUDIT.md` to mark PERF-2 as `[x]`

---

### Issue PERF-3: Add Accessibility Audit in CI

**Skill to Apply:** `/SKILLS/development/accessibility.md`

**Step-by-step Instructions:**

1. Install axe-core:
   ```bash
   pnpm add -D @axe-core/playwright
   ```

2. Create `e2e/accessibility.spec.ts`:
   ```typescript
   import { test, expect } from '@playwright/test';
   import AxeBuilder from '@axe-core/playwright';
   
   test.describe('Accessibility Tests', () => {
       test('Guest menu page should have no accessibility violations', async ({ page }) => {
           await page.goto('/');
           const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
           expect(accessibilityScanResults.violations).toEqual([]);
       });
       
       test('Merchant dashboard should have no accessibility violations', async ({ page }) => {
           await page.goto('/merchant');
           const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
           expect(accessibilityScanResults.violations).toEqual([]);
       });
   });
   ```

3. Update `.github/workflows/ci.yml` to include accessibility tests
4. Update `PLATFORM_AUDIT.md` to mark PERF-3 as `[x]`

---

### Issue TEST-2: Add Component Tests

**Skill to Apply:** `/SKILLS/development/testing-patterns.md`

**Step-by-step Instructions:**

1. Create test files for key components:
   - `src/components/merchant/OrdersKanbanBoard.test.tsx`
   - `src/components/merchant/RevenueChart.test.tsx`
   - `src/features/menu/components/MenuCard.test.tsx`

2. Example test pattern:
   ```typescript
   import { render, screen } from '@testing-library/react';
   import { describe, it, expect } from 'vitest';
   import { MenuCard } from './MenuCard';
   
   describe('MenuCard', () => {
       it('renders item name and price', () => {
           render(<MenuCard item={{ id: '1', name: 'Test Item', price: 100 }} />);
           expect(screen.getByText('Test Item')).toBeInTheDocument();
       });
   });
   ```

3. Update `PLATFORM_AUDIT.md` to mark TEST-2 as `[x]`

---

### Issue DEVOPS-1: Add Sentry Integration

**Skill to Apply:** `/SKILLS/development/vercel-deployment.md`

**Step-by-step Instructions:**

1. Install Sentry:
   ```bash
   pnpm add @sentry/nextjs
   ```

2. Run Sentry wizard:
   ```bash
   pnpm dlx @sentry/wizard@latest -i nextjs
   ```

3. Configure `sentry.client.config.ts`:
   ```typescript
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.init({
       dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
       tracesSampleRate: 0.1,
       environment: process.env.NODE_ENV,
   });
   ```

4. Add to `.env.example`:
   ```
   NEXT_PUBLIC_SENTRY_DSN=
   SENTRY_AUTH_TOKEN=
   ```

5. Update `PLATFORM_AUDIT.md` to mark DEVOPS-1 as `[x]`

---

### Issue DB-1: Document Backup Procedures

**Skill to Apply:** `/SKILLS/development/postgres-best-practices.md`

**Step-by-step Instructions:**

1. Create `docs/OPERATIONS/database/backup-restore.md`:
   ```markdown
   # Database Backup and Restore Procedures
   
   ## Automated Backups
   - Supabase provides automatic daily backups
   - Backup retention: 7 days (free), 30 days (pro)
   
   ## Manual Backup
   ```bash
   # Using pg_dump
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```
   
   ## Restore Procedure
   ```bash
   # Restore from backup
   psql $DATABASE_URL < backup_20260218.sql
   ```
   
   ## Disaster Recovery
   1. Contact Supabase support
   2. Restore from Point-in-Time Recovery (PITR)
   ```

2. Update `PLATFORM_AUDIT.md` to mark DB-1 as `[x]`

---

### Issue CODE-1: Add OpenAPI Documentation

**Note:** This is combined with ARCH-1 above. Mark both as complete.

---

## PHASE 3: MEDIUM PRIORITY ISSUES (Fix Next Sprint)

### Issue FE-3: Add React.lazy for Heavy Components

**Skill to Apply:** `/SKILLS/development/react-best-practices.md`

1. Identify heavy components (charts, 3D, large tables)
2. Wrap with dynamic imports:
   ```typescript
   const RevenueChart = dynamic(
       () => import('@/components/merchant/RevenueChart'),
       { loading: () => <Skeleton className="h-48 w-full" /> }
   );
   ```

---

### Issue FE-4: Split Large Component Files

**Skill to Apply:** `/SKILLS/development/clean-code.md`

1. Identify files > 300 lines
2. Extract logical sections into separate components
3. Maintain single responsibility principle

---

### Issue ARCH-2: Implement Sync Conflict Resolution

**Skill to Apply:** `/SKILLS/development/offline-first.md`

1. Read `src/lib/offlineQueue.ts`
2. Add conflict resolution metadata:
   ```typescript
   interface PendingOrder {
       version: number;
       lastModified: string;
       // ... existing fields
   }
   ```
3. Implement last-write-wins with audit trail

---

### Issue SEC-2: Tighten CSP for Production

**Skill to Apply:** `/SKILLS/development/api-security-best-practices.md`

1. Remove `'unsafe-eval'` from CSP if possible
2. Test thoroughly after changes

---

### Issue SEC-3: Add CSRF Protection

**Skill to Apply:** `/SKILLS/development/api-security-best-practices.md`

1. Install csrf library:
   ```bash
   pnpm add csrf
   ```
2. Add CSRF tokens to server actions

---

### Issue PERF-4: Code-Split Heavy Routes

**Skill to Apply:** `/SKILLS/development/performance.md`

1. Analyze bundle with:
   ```bash
   pnpm build && pnpm analyze
   ```
2. Implement dynamic imports for heavy routes

---

### Issue TEST-4: Add Visual Regression Tests

**Skill to Apply:** `/SKILLS/development/playwright-e2e-builder.md`

1. Configure Playwright screenshots
2. Create visual comparison tests

---

### Issue DEVOPS-2: Add Deployment Notifications

**Skill to Apply:** `/SKILLS/development/github-actions-creator.md`

1. Add Slack webhook to CI/CD
2. Notify on deployment success/failure

---

### Issue DEVOPS-3: Add Rollback Automation

**Skill to Apply:** `/SKILLS/development/vercel-deployment.md`

1. Add health check after deployment
2. Implement automatic rollback on failure

---

## PHASE 4: LOW PRIORITY ISSUES (Backlog)

### Issue ARCH-3: Add Architecture Diagrams
**Skill:** `/SKILLS/development/architecture.md`

### Issue FE-5: Standardize Tailwind Classes
**Skill:** `/SKILLS/development/clean-code.md`

### Issue SEC-4: Add Session Refresh Logic
**Skill:** `/SKILLS/development/nextjs-supabase-auth.md`

### Issue PERF-5: Add Resource Hints
**Skill:** `/SKILLS/development/performance.md`

### Issue TEST-3: Add Edge Case Tests
**Skill:** `/SKILLS/development/testing-patterns.md`

### Issue DB-2: Add Query Timing Logs
**Skill:** `/SKILLS/development/postgres-best-practices.md`

### Issue DB-3: Add Soft Delete Columns
**Skill:** `/SKILLS/development/database-design.md`

### Issue DEVOPS-4: Add Performance Monitoring
**Skill:** `/SKILLS/development/vercel-deployment.md`

### Issue CODE-2: Add Storybook
**Skill:** `/SKILLS/development/react-best-practices.md`

### Issue CODE-3: Add JSDoc Comments
**Skill:** `/SKILLS/development/clean-code.md`

---

## Progress Tracking

After completing each issue, update the status in `PLATFORM_AUDIT.md`:

1. Find the issue row in the appropriate table
2. Change `[ ]` to `[x]`
3. Commit with message: `fix(audit): Complete ISSUE-ID - Description`

---

## Verification Checklist

After all fixes are complete, verify:

- [ ] `pnpm lint` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm test` passes with 80% coverage
- [ ] `pnpm build` succeeds
- [ ] `pnpm test:e2e` passes
- [ ] All PLATFORM_AUDIT.md items marked `[x]`

---

## Final Output

When complete, provide:
1. Summary of all changes made
2. Any issues that couldn't be fixed and why
3. Recommendations for future improvements
4. Updated PLATFORM_AUDIT.md with all items marked complete

---

**End of Super Prompt**