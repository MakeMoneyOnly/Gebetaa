# LOW-Priority Remediation Implementation Plan

**Created:** 2026-04-09
**Protocol:** Research-Plan-Implement (RPI)
**Status:** Implementation Phase

## Research Summary

Research completed across 4 agent sessions covering database migrations, code-level implementations, and documentation gaps. Key findings:

- 22 migrations lack descriptive header comments (LOW-001)
- 35 indexes have inconsistent naming patterns (LOW-002)
- 7 columns need NOT NULL constraints added (LOW-003)
- Unused index cleanup campaign is 14 stages deep, needs finalization (LOW-004)
- No ERD or comprehensive schema documentation exists (LOW-005)
- Agency user access lacks audit logging (LOW-006)
- Zero P0 endpoints use query monitoring (LOW-007)
- ~120+ missing Amharic translation keys (~60% coverage) (LOW-008)
- 252 exported functions lack explicit return types (LOW-009)
- 30+ files exceed 300 lines (LOW-010)
- Multiple documentation gaps identified (LOW-011)
- API versioning module exists but is not integrated (LOW-012)
- Feature flag documentation exists but DB tier is unimplemented (LOW-014)
- Health check endpoints undocumented (LOW-015)
- Rollback procedures lack database migration coverage (LOW-016)
- Incident response lacks real contact info (LOW-017)
- No customer-facing privacy policy (LOW-018)
- Data retention schedule vs implementation mismatch (LOW-019)
- Rate limiting lacks telemetry integration (LOW-021)
- Request signing needs shared utility extraction (LOW-022)

## In-Scope

All LOW-001 through LOW-022 tasks from PRE-PRODUCTION-REMEDIATION-TASKS.md, excluding LOW-013 (completed) and LOW-020 (verified none found).

## Out-of-Scope

- HIGH and MEDIUM severity tasks
- Database-backed feature flag implementation (Tier 1 from LOW-014) - too large for LOW scope
- Full i18n refactoring of all components (LOW-008) - translation keys only
- Full file refactoring of all large files (LOW-010) - top 5 priority only
- Adding return types to all 252 functions (LOW-009) - top 30 lib functions only

## Implementation Waves

### Wave 1: Database Migrations (LOW-001, LOW-002, LOW-003, LOW-004)

**Files Created:**

- `supabase/migrations/20260409000000_low_priority_remediation.sql` - Consolidated migration for:
    - LOW-002: Rename inconsistent indexes to `idx_{table}_{columns}` pattern
    - LOW-003: Add NOT NULL constraints with backfills
    - LOW-004: Finalize unused index cleanup
- Migration comment additions for LOW-001 handled via documentation update

**Verification:** `npx supabase db lint` and verify migration applies cleanly

### Wave 2: Code Changes (LOW-006, LOW-007, LOW-021, LOW-022)

**Files Modified/Created:**

- `src/lib/auth/requireAuth.ts` - Add audit logging (LOW-006)
- `src/app/api/merchant/command-center/route.ts` - Add query monitoring (LOW-007)
- `src/app/api/orders/route.ts` - Add query monitoring (LOW-007)
- `src/app/api/orders/[orderId]/status/route.ts` - Add query monitoring (LOW-007)
- `src/lib/rate-limit.ts` - Add telemetry integration (LOW-021)
- `src/lib/security/requestSigning.ts` - Extract shared signing utility (LOW-022)

**Verification:** `npx tsc --noEmit` and `pnpm run lint`

### Wave 3: Documentation (LOW-005, LOW-008, LOW-011, LOW-014, LOW-015, LOW-016, LOW-017, LOW-018, LOW-019)

**Files Created:**

- `docs/10-reference/database-erd.md` - ERD and schema documentation (LOW-005)
- `src/lib/i18n/translations.ts` - Add missing Amharic translations (LOW-008)
- `docs/10-reference/feature-flags-catalogue.md` - Feature flag documentation (LOW-014)
- `docs/05-infrastructure/monitoring/health-check-api.md` - Health check docs (LOW-015)
- `docs/08-reports/rollout/rollback-procedures-enhanced.md` - Enhanced rollback (LOW-016)
- `docs/09-runbooks/incident-response-plan.md` - Enhanced incident response (LOW-017)
- `docs/02-security/privacy-policy.md` - Customer-facing privacy policy (LOW-018)
- `docs/02-security/data-retention-policy.md` - Standalone retention policy (LOW-019)
- `docs/implementation/documentation-coverage-audit.md` - Documentation gaps audit (LOW-011)

**Verification:** Review file content and structure

### Wave 4: Code Quality (LOW-009, LOW-010, LOW-012)

**Files Modified:**

- `src/lib/api/authz.ts` - Add return types (LOW-009)
- `src/lib/api/audit.ts` - Add return types (LOW-009)
- `src/lib/sync/syncWorker.ts` - Add return types (LOW-009)
- `src/lib/supabase/connection-pooling.ts` - Add return types (LOW-009)
- `src/hooks/useRole.ts` - Add return types (LOW-009)
- `src/hooks/useStaff.ts` - Add return types (LOW-009)
- `src/lib/api/versioning.ts` - Wire up versioning headers to middleware (LOW-012)
- `src/app/(pos)/waiter/page.old-logic.tsx` - Remove dead file (LOW-010)

**Verification:** `npx tsc --noEmit` and `pnpm run lint`

### Final Wave: Update Task Tracking

**Files Modified:**

- `PRE-PRODUCTION-REMEDIATION-TASKS.md` - Update all LOW task statuses to completed
- Update progress summary table

## Test Commands

- `npx tsc --noEmit` - Type checking
- `pnpm run lint` - Linting
- `npx supabase db lint` - Database lint (if applicable)
