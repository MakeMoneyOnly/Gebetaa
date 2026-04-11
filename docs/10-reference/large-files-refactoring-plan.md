# Large Files Refactoring Plan

**Created:** 2026-04-09
**Purpose:** Identify large files in the codebase and recommend refactoring strategies

## Overview

Files exceeding 300 lines should be evaluated for decomposition. The following list prioritizes the largest files that would benefit most from splitting.

## Priority Refactoring Targets

| Lines | File                                           | Suggested Refactoring                                                       |
| ----- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| 1946  | `src/app/page.tsx`                             | Extract hero, features, pricing sections into separate components           |
| 1304  | `src/features/kds/components/StationBoard.tsx` | Extract order card, prep summary, and toolbar into sub-components           |
| 1276  | `src/app/api/docs/route.ts`                    | Extract OpenAPI spec generation into a separate module                      |
| 1044  | `src/app/(terminal)/terminal/page.tsx`         | Extract terminal UI components (order list, action pad, receipt)            |
| 1025  | `src/app/(pos)/waiter/page.tsx`                | Extract menu browser, order pad, and table selector into components         |
| 960   | `src/app/(guest)/[slug]/menu-client.tsx`       | Extract menu grid, cart panel, and category filter into components          |
| 920   | `src/lib/services/loyaltyService.ts`           | Split into loyaltyService (core) and loyaltyCalculation (rules engine)      |
| 914   | `src/lib/monitoring/notification-metrics.ts`   | Split into metrics collection and metrics aggregation/reporting             |
| 913   | `src/lib/services/dashboardDataService.ts`     | Split into dashboardDataService (orchestrator) and per-widget data fetchers |
| 855   | `src/features/menu/components/CartDrawer.tsx`  | Extract cart item list, tip selector, and payment method selector           |

## General Refactoring Guidelines

1. **Extract components** - Large React components should be split into smaller, focused components
2. **Extract utilities** - Shared logic should be moved to `src/lib/` utilities
3. **Domain-driven structure** - Business logic should live in `src/domains/` or `src/lib/services/`
4. **Single responsibility** - Each file should have one clear purpose
5. **Test coverage** - Refactored modules should maintain or improve test coverage

## Refactoring Checklist

Before refactoring a large file:

- [ ] Ensure existing tests pass
- [ ] Create tests for the module before splitting
- [ ] Use TypeScript strict types for new extracted modules
- [ ] Verify no circular dependencies are introduced
- [ ] Run `pnpm run lint` and `npx tsc --noEmit` after refactoring
