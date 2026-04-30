# Plan: Fix All CI Failures on develop Branch

## Research Summary

6 CI checks are failing with the following root causes:

1. **Node version incompatibility** - `@capacitor/cli@8.3.0` requires Node >=22, but 4 workflows use Node 20 + pnpm 9
2. **ESLint errors** - 21 errors from misplaced eslint-disable comments, untyped `any`, console.log, require() imports in utility scripts and k6 test files
3. **ESLint warnings** - 23 warnings from unused imports in src/ and tests/
4. **Next.js security vulnerability** - GHSA-q4gf-8mx6-v5v3 (HIGH) in next@16.2.2, fixed in 16.2.3
5. **TypeScript build error** - `HydratedDeviceRecord` type cast from `Record<string, unknown>` fails
6. **Migration drift check** - `supabase link` missing `--db-password` flag

## Step-by-Step File Changes

### Step 1: Fix ESLint Config (`eslint.config.mjs`)

- Add root utility scripts to `globalIgnores`: `clear-templates.js`, `fix-scaffold.js`, `scaffold-dashboard.js`
- Add `tests/load/**` and `tests/performance/**` to `globalIgnores` (k6 files cannot be linted by standard ESLint)
- Add `tests/**` to the test file override for relaxed rules

### Step 2: Fix `marketingCampaignService.ts` (lines 233, 277, 664)

- Move `eslint-disable-next-line` comments to the line immediately before the `(supabase as any)` expression
- Combine with the HIGH-013 comment on the same line

### Step 3: Fix unused imports in `src/` files

- `src/app/(dashboard)/merchant/page.tsx`: Remove `Monitor` from imports
- `src/components/merchant/Sidebar.tsx`: Remove `CreditCard`, `ChevronRight`, `Search` from imports
- `src/lib/api/response.ts`: Remove `createSanitizedErrorResponse`, `AppError`, `ERROR_STATUS_MAP`, `ErrorCode`, `logger` from imports
- `src/lib/sync/syncWorker.ts`: Remove `detectConflict` from imports; prefix `processConflicts` with `_`

### Step 4: Fix unused imports in `tests/` files

- `tests/load/common.js`: Prefix `check`, `sleep` with `_`
- `tests/load/payments-api.js`: Remove `PEAK_STAGES` from import

### Step 5: Fix TypeScript build error in `authz.ts`

- Define `EnterpriseDeviceRow` interface for Supabase query results
- Replace `Record<string, unknown>` casts with `EnterpriseDeviceRow`
- Use proper type for `hydrateEnterpriseDeviceRecord` parameter

### Step 6: Update workflow Node versions

- `code-quality.yml`: Node 20→22, pnpm 9→10, action-setup v4
- `deploy-staging.yml`: Node 20→22, pnpm 9.0.0→10, action-setup v3→v4
- `migration-sync-check.yml`: Node 20→22
- `dependency-review.yml`: Node 20→22, pnpm 9.0.0→10, action-setup v3→v4

### Step 7: Update `package.json` engines

- `"node": ">=22.0.0"`, `"pnpm": ">=10.0.0"`

### Step 8: Upgrade Next.js

- Update `next` to `^16.2.3` in package.json and run pnpm install

### Step 9: Fix migration drift check workflow

- Add `--db-password "$SUPABASE_DB_PASSWORD"` to `supabase link` command
- Add `SUPABASE_DB_PASSWORD` to env vars

## In-Scope

- All changes listed above
- Verification that `pnpm lint` passes with 0 errors
- Verification that `pnpm type-check` passes

## Out-of-Scope

- Refactoring k6 test files to TypeScript
- Removing the `@capacitor/cli` dependency (it's needed for mobile)
- Changing the ESLint rule configurations (only adding ignores)
- Any functional changes to business logic

## Verification Commands

- `pnpm lint` (must pass with 0 errors)
- `pnpm type-check` (must pass with 0 errors)
- `pnpm build` (must succeed)
