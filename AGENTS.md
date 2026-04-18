# AGENTS.md

## Purpose

This file defines project-specific operating rules for Codex in this repo.
It is optimized for lole's goal: building "Toast for Addis Ababa" with enterprise-grade reliability, security, and delivery discipline.

## Product Context

- Platform: Restaurant Operating System for Ethiopia ("Toast for Addis").
- Primary benchmark: `TOAST_FEATURE_AUDIT.md`.
- Product baseline and requirements: `docs/PRODUCT/product-requirements-document.md`.
- Tech stack baseline: `docs/TECHNICAL/tech-stack.md`.

## North-Star Engineering Priorities

- `P0` reliability for core restaurant flows: orders, KDS, table sessions, payments, and realtime sync.
- Strict multi-tenant data isolation at the database layer (RLS first, app checks second).
- Offline-first behavior for unstable connectivity conditions.
- Mobile-first UX and performance for merchant and staff workflows.
- Safe, reversible rollouts using feature flags and explicit rollback levers.

## Mandatory Source-of-Truth Order

When guidance conflicts, follow this order:

1. User request in current task.
2. This `AGENTS.md`.
3. Project docs under `docs/` and audit docs (`TOAST_FEATURE_AUDIT.md`, `AUDIT.md`, `IMPLEMENTATION_AUDIT_REPORT.md`).
4. Skill guidance in `SKILLS/`.

## Platform Guardrails (Supabase/Postgres)

- Never expose `auth.users` in public/exposed schemas.
- If a user profile surface is needed, use:
    - a dedicated public profile table maintained by trigger, or
    - a Postgres 15+ view with `security_invoker=on` plus strict RLS.
- Remember views are `security definer` by default; in exposed schemas either:
    - set `security_invoker=on` (PG15+), or
    - keep view in non-exposed schema and revoke `anon`/`authenticated`.
- Enable and enforce RLS on all tenant-scoped tables:
    - `alter table ... enable row level security;`
    - `alter table ... force row level security;` for sensitive multi-tenant data.
- In RLS policies, wrap auth calls with `select` when safe to cache:
    - `(select auth.uid())`, `(select auth.jwt())`.
- Index every column used by:
    - foreign keys,
    - RLS predicates,
    - frequent filters/sorts/joins.
- Set explicit `search_path` in security-sensitive functions (especially `security definer`).
- Use least-privilege grants; do not use broad table grants where scoped grants are possible.

## Database and Migration Workflow

- All schema changes must be made in `supabase/migrations/*.sql`.
- Migrations must be idempotent where practical:
    - `if exists` / `if not exists`,
    - guarded alters,
    - reversible or safe-forward semantics.
- For large-table changes, prefer safe phased rollout:
    - add nullable column,
    - backfill in batches,
    - add constraints/indexes after backfill.
- When adding foreign keys, add covering indexes in the same migration set.
- For query changes affecting hot paths, validate with `explain analyze` before/after.
- After schema changes, run Supabase advisors and triage findings immediately.
- Highest-priority advisor findings:
    - exposed `auth.users`,
    - security-definer views in exposed schemas,
    - missing/permissive RLS policies,
    - missing FK/policy indexes.

## Next.js + Supabase Auth Guardrails

- Use App Router safe defaults: Server Components by default, Client Components only when needed.
- Use `@supabase/ssr` patterns for auth/session handling in Next.js.
- Keep service-role usage server-only; never expose service-role key to client paths.
- Auth/session refresh and route protection belong in middleware/server boundaries.
- Mutations should validate inputs (Zod or equivalent) and enforce tenant scope server-side.
- Do not treat TypeScript types as runtime validation.

## API and Security Guardrails

- Apply endpoint checklist from `docs/implementation/security-endpoint-checklist.md` for every new/changed API.
- Every mutating endpoint must have:
    - explicit authn/authz rules,
    - tenant scoping,
    - input validation,
    - rate-limit posture,
    - audit logging for high-risk actions.
- Never leak secrets/tokens/PII in logs, responses, or client bundles.
- Treat all browser-exposed env vars (`NEXT_PUBLIC_*`) as public.

## Frontend and UX Guardrails

- Use mobile-first layouts and interaction flows (merchant/staff reality in Addis).
- Preserve offline-friendly behavior for critical task paths where defined.
- Design for operational clarity over visual novelty in staff-facing surfaces.
- Enforce accessibility baseline (WCAG 2.1 AA) for interactive flows.
- Keep UI performance aligned with command center targets and Core Web Vitals goals.

## Performance and Reliability Targets

- Follow SLOs in `docs/implementation/performance-slos.md`:
    - `GET /api/merchant/command-center` P95 <= 500ms, error < 1%.
    - `GET /api/orders` P95 <= 400ms, error < 1%.
    - `PATCH /api/orders/:id/status` P95 <= 300ms, error < 0.5%.
    - Realtime propagation P95 <= 2s for order and table/session state.
- For performance-sensitive work, prioritize:
    - removing waterfalls (`Promise.all`, deferred awaits),
    - minimizing client bundle size,
    - caching where safe,
    - reducing rerenders and expensive client computations.
- Use load-test workflow when scope touches peak-flow endpoints:
    - `docs/implementation/p2-peak-flow-load-tests.md`.

## Testing and Release Discipline

- For behavior changes, add/update tests at the appropriate level:
    - unit (logic),
    - integration (API/db boundary, tenant isolation),
    - e2e (critical user paths).
- Release cadence and gates: `docs/implementation/release-cadence.md`.
- P0 readiness and rollback controls: `docs/08-reports/rollout/p0-release-readiness-and-rollback.md`.
- Incident handling and severity model: `docs/09-runbooks/incident-triage-rubric.md`.
- No release if Sev1/Sev2 blockers exist in changed scope.

## Skill Activation Matrix (Use When Relevant)

Use the minimal set of skills that covers the task. Prefer stack-specific skills first.

- `SKILLS/database/supabase-postgres-best-practices/SKILL.md`
    - Use for RLS design/performance, indexing, query optimization, connection/postgres tuning.
- `SKILLS/database/postgres-schema-design/SKILL.MD`
    - Use for schema modeling, data types, constraints, partitioning, FK/index strategy.
- `SKILLS/development/nextjs-best-practices/SKILL.md`
    - Use for App Router architecture, server/client boundaries, caching/fetch strategy.
- `SKILLS/development/nextjs-supabase-auth/SKILL.md`
    - Use for Supabase auth flows, middleware/session handling, protected routes.
- `SKILLS/web-development/react-best-practices/SKILL.md`
    - Use for React/Next performance work, bundle optimization, rerender reductions.
- `SKILLS/web-development/web-performance-optimization/SKILL.md`
    - Use for Lighthouse/Core Web Vitals optimization and performance audits.
- `SKILLS/development/core-web-vitals/SKILL.md`
    - Use when LCP/INP/CLS targets are part of acceptance criteria.
- `SKILLS/creative-design/frontend-design/SKILL.md`
    - Use for net-new UI surfaces and visual redesign tasks.
- `SKILLS/creative-design/accessibility-auditor/SKILL.md`
    - Use for accessibility audits and remediation tasks.
- `SKILLS/development/api-patterns/SKILL.md`
    - Use for endpoint contract design, response formats, versioning, and rate-limit posture.
- `SKILLS/security/security-best-practices/SKILL.md`
    - Use when user asks for secure-by-default guidance or security review.
- `SKILLS/security/security-threat-model/SKILL.md`
    - Use when user asks for threat modeling or abuse-path enumeration.
- `SKILLS/security/api-security-best-practices/SKILL.md`
    - Use for API-specific threat and control reviews.
- `SKILLS/development/testing-patterns/SKILL.md`
    - Use when improving test coverage, test architecture, and regression reliability.
- `SKILLS/development/deployment-procedures/SKILL.md`
    - Use for rollout, rollback, and production deployment planning.
- `SKILLS/workflow-automation/github-workflow-automation/SKILL.md`
    - Use for CI/CD automation, PR checks, and release workflow improvements.

## Skill Usage Protocol

- Before applying a skill, read only the minimum required sections.
- If multiple skills apply, use them in this order:
    1. Data/security foundations (database + security),
    2. Runtime architecture (Next.js/Supabase auth + API),
    3. UX/performance/testing/release.
- Do not load unrelated skill references.
- Record which skills were used in task output when work is substantial.

## Toast-Parity Focus for Implementation Decisions

When tradeoffs appear, prefer choices that close high-value Toast gaps and strengthen ops reliability in Addis conditions.

Current high-impact gap themes (from `TOAST_FEATURE_AUDIT.md`):

- Split checks and multi-payment workflows.
- Course firing and kitchen pacing.
- KDS offline resilience and printer fallback.
- Notification reliability (SMS/push) for guest order states.
- Delivery/multi-location readiness without weakening tenant safety.

## Definition of Done (Enterprise Grade)

A task is not done until all applicable items pass:

- Correctness: feature works and matches acceptance criteria.
- Security: authz/tenant scope/input validation/log hygiene reviewed.
- Data: migration safety, indexes, RLS, and advisor findings triaged.
- Performance: no obvious regressions against SLO/CWV expectations.
- Reliability: rollback path and flags considered for risky changes.
- Tests: appropriate unit/integration/e2e coverage updated.
- Docs: update relevant docs when behavior/contracts/operations change.

## Code Quality Standards

These rules are enforced by ESLint and TypeScript. All code written must comply:

### TypeScript Strict Typing

- **NEVER use `any` type** in production code (`src/` except `*.test.*`).
- If a type is unknown, use `unknown` and narrow it with type guards.
- If interfacing with untyped third-party code, create a proper type assertion.
- For table types not in generated schema, add them to `src/types/database.ts` rather than using `any`.
- Test files (`*.test.ts`, `*.test.tsx`, `__tests__/**`) are exempted for mocking flexibility.

### Unused Variables and Imports

- **Remove all unused imports** before committing.
- **Prefix intentionally unused variables with `_`** (e.g., `_event`, `_index`).
- This includes:
    - Unused function parameters
    - Unused destructured variables
    - Unused imports
- ESLint rule: `@typescript-eslint/no-unused-vars` with `argsIgnorePattern: '^_'`

### Image Optimization

- **ALWAYS use Next.js `<Image />` component** instead of `<img>`.
- Required props for `<Image />`:
    - `width` and `height` for fixed-size images
    - `fill` with `className="object-cover"` for responsive images in relative containers
- External images require domain configuration in `next.config.ts` under `images.remotePatterns`.
- ESLint rule: `@next/next/no-img-element`

### Console Logging

- **NEVER use `console.log`, `console.info`, `console.debug`, or `console.table`** in production code.
- Use the structured logger at `src/lib/logger.ts` instead:
    - `logger.info()` for informational messages
    - `logger.warn()` for warnings
    - `logger.error()` for errors
    - `logger.debug()` for debug messages (dev only)
- `console.warn` and `console.error` are allowed for CLI scripts and critical error surfacing.
- ESLint rule: `no-console` with `allow: ['warn', 'error']`

### Variable Declaration

- **Prefer `const` over `let`** when a variable is never reassigned.
- Only use `let` when the variable will be reassigned.
- ESLint rule: `prefer-const`

### Database Type Safety

- **Keep `src/types/database.ts` in sync** with the Supabase schema.
- When adding new tables via migration, immediately add corresponding types.
- Use `Tables<'table_name'>`, `TablesInsert<'table_name'>`, `TablesUpdate<'table_name'>` utility types.
- For RPC functions, add types to the `Functions` section in database.ts.

### Quick Reference: ESLint Rules

| Rule                                 | Level | Description                           |
| ------------------------------------ | ----- | ------------------------------------- |
| `@typescript-eslint/no-explicit-any` | error | No `any` in production code           |
| `@typescript-eslint/no-unused-vars`  | warn  | Unused vars must be prefixed with `_` |
| `@next/next/no-img-element`          | warn  | Use `<Image />` instead of `<img>`    |
| `no-console`                         | error | Only `warn` and `error` allowed       |
| `prefer-const`                       | error | Use `const` when not reassigned       |

### Pre-Commit Checklist

Before committing, ensure:

1. `pnpm run lint` passes with 0 errors (warnings acceptable but should be reviewed)
2. `npx tsc --noEmit` passes with 0 errors
3. No `any` types introduced (except in test files)
4. All new images use `<Image />` component
5. All logging uses `src/lib/logger.ts` (not `console.*`)
6. Database types updated for any new tables/columns

### Automated Enforcement

Pre-commit hooks (via Husky) automatically run on every commit:

1. **Formatting**: Prettier formats staged files
2. **Linting**: ESLint checks and fixes staged files
3. **Type checking**: TypeScript validates all code
4. **Security**: Pre-commit security audit
5. **Quality checks**: Warns about `any` types, `console.log`, `<img>` elements

CI pipeline (GitHub Actions) runs on every push/PR:

1. **lint**: ESLint validation
2. **typecheck**: TypeScript compilation
3. **test**: Unit tests with coverage
4. **security**: Dependency audit

These checks are non-negotiable. If they fail, the commit/PR cannot proceed.
