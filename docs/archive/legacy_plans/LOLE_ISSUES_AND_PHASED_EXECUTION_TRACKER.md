# lole Issues And Phased Execution Tracker

Date: 2026-04-27
Status: Active working tracker
Purpose: Document strategic, product, documentation, integration, and launch-readiness issues in one place

## Status Legend

- `[ ]` Not started
- `[-]` In progress
- `[x]` Done
- `[!]` Blocked / needs decision

## Phase 0: Product Truth Reset

Goal:

- establish one honest map of what is built, partial, missing, and stale in docs

Relevant Gstack skills:

- `/gstack-document-release`
- `/gstack-plan-ceo-review`
- `/gstack-plan-eng-review`

Tasks:

- [ ] `TRUTH-001` Reconcile product docs with live code for payments, delivery, loyalty, subscriptions, devices, and offline runtime.
- [ ] `TRUTH-002` Remove or downgrade all claims that inventory is currently built or sale-ready.
- [ ] `TRUTH-003` Publish a canonical commercial packaging document based on real capabilities, not historical aspiration.
- [ ] `TRUTH-004` Decide the authoritative doc set for company truth:
    - `plans/LOLE_STRATEGIC_FOUNDATION_AND_SYSTEM_AUDIT.md`
    - this tracker
    - selected docs under `docs/01-foundation/` and `docs/03-product/`

## Phase 1: Feature Truth Matrix

Goal:

- classify the full company surface by commercial reality

### 1.1 Service Core

- [x] `CORE-001` Waiter POS surface exists.
- [x] `CORE-002` KDS multi-station surface exists.
- [x] `CORE-003` Table/session workflows exist.
- [x] `CORE-004` Split settlement adapters and local payment ledger exist.
- [-] `CORE-005` Digital payment experience is broad but needs final truth pass on end-to-end live readiness.
- [ ] `CORE-006` Amharic-first operational UX still needs verification as a launch claim.

### 1.2 Guest Experience

- [x] `GUEST-001` Guest QR ordering exists.
- [x] `GUEST-002` Guest tracker exists.
- [-] `GUEST-003` Loyalty foundations exist, but must be classified as built vs fully wired vs sale-ready.
- [-] `GUEST-004` Upsell/guest growth surfaces exist, but packaging and proof are incomplete.

### 1.3 Operator Control

- [x] `OPS-001` Merchant dashboard breadth is real.
- [x] `OPS-002` Command center exists.
- [x] `OPS-003` Reports/analytics surfaces exist.
- [x] `OPS-004` Staff and payroll/time-attendance surfaces exist.
- [-] `OPS-005` Reporting and analytics need truth pass for live operational reliability and accuracy claims.

### 1.4 Channels And Growth

- [x] `CHAN-001` Delivery channel schemas and ingestion code exist.
- [-] `CHAN-002` Delivery story needs exact classification:
    - webhook ingestion
    - partner configuration
    - order normalization
    - POS injection
    - merchant oversight
- [-] `CHAN-003` Subscription gating primitives exist, but packaging and upgrade path need product truth validation.

### 1.5 Enterprise Reliability

- [x] `ENT-001` Gateway/bootstrap/runtime code exists.
- [x] `ENT-002` Device pairing/shell/management surfaces exist.
- [x] `ENT-003` Notification queue and retry/fallback code exists.
- [x] `ENT-004` Fiscal queueing/replay code exists.
- [-] `ENT-005` End-to-end launch proof is still incomplete across these systems.

### 1.6 Explicit Non-Current Features

- [x] `GAP-001` Inventory is not currently a valid product claim.
- [x] `GAP-002` Inventory tables were removed in `supabase/migrations/20260323_remove_inventory_tables.sql`.
- [ ] `GAP-003` All docs, marketing, roadmap, and plan references must be corrected to reflect that truth.

## Phase 2: Documentation Drift Cleanup

Goal:

- remove contradictions before strategy and launch planning continue

Relevant Gstack skills:

- `/gstack-document-release`
- `/gstack-review`

Tasks:

- [ ] `DOC-001` Fix architecture and roadmap references that still claim inventory exists.
- [ ] `DOC-002` Audit payment docs that still claim webhook gaps if webhook routes now exist.
- [ ] `DOC-003` Audit delivery docs that understate current channel capability.
- [ ] `DOC-004` Audit loyalty docs that may understate implemented services.
- [ ] `DOC-005` Audit subscription docs against current gating code.
- [ ] `DOC-006` Update README and product positioning to use package language instead of feature-sprawl language.

Known drift examples:

- `docs/01-foundation/architecture.md`
- `docs/03-product/roadmap.md`
- `docs/01-foundation/database-schema.md`
- `docs/06-integrations/developer-api.md`
- plan/feature-gating references mentioning inventory

## Phase 3: Commercial Packaging Redefinition

Goal:

- define how lole sells without discarding the broader platform

Relevant Gstack skills:

- `/gstack-plan-ceo-review`

Tasks:

- [ ] `PKG-001` Define Package A: Service Core.
- [ ] `PKG-002` Define Package B: Guest Experience.
- [ ] `PKG-003` Define Package C: Operator Control.
- [ ] `PKG-004` Define Package D: Enterprise Reliability / Multi-device operations.
- [ ] `PKG-005` Decide which package lands the first sale fastest.
- [ ] `PKG-006` Decide which package becomes the first upsell after pilot adoption.
- [ ] `PKG-007` Rewrite the company narrative so "Toast for Addis" is the category, while packages are the buying motion.

## Phase 4: Launch-Critical Engineering Review

Goal:

- identify the last 20 percent that matters for live restaurants

Relevant Gstack skills:

- `/gstack-plan-eng-review`
- `/gstack-cso`
- `/gstack-review`

Tasks:

- [ ] `ENG-001` Verify the selected first-sale package end-to-end across UI, API, DB, sync, and operational runbooks.
- [ ] `ENG-002` Verify what is module-complete versus live-loop-complete.
- [ ] `ENG-003` Verify rollout controls, feature flags, and rollback posture for pilot launch.
- [ ] `ENG-004` Verify the offline/local-first path in the actual target environment, not just unit tests.
- [ ] `ENG-005` Verify fiscal, payments, and device-management claims against current code and docs.

## Phase 5: Adversarial QA And Fix Loop

Goal:

- break the selected launch package before customers do

Relevant Gstack skills:

- `/gstack-qa-only`
- `/gstack-qa`

Tasks:

- [ ] `QA-001` Produce a report-only QA pass on the selected first-sale package.
- [ ] `QA-002` Convert findings into fix tickets with severity and owner.
- [ ] `QA-003` Re-run QA after fixes and keep evidence.
- [ ] `QA-004` Add missing test coverage where confidence is weak.

## Phase 6: Pilot Readiness

Goal:

- move from codebase breadth to deployable confidence

Relevant Gstack skills:

- `/gstack-ship`
- `/gstack-document-release`

Tasks:

- [ ] `PILOT-001` Produce a pilot-ready package checklist with exact environments, secrets, devices, and rollout controls.
- [ ] `PILOT-002` Produce a pilot restaurant onboarding checklist.
- [ ] `PILOT-003` Produce an incident/rollback checklist for first live restaurants.
- [ ] `PILOT-004` Produce a final docs sync before any launch branch is shipped.

## Open Strategic Questions

- [ ] `Q-001` What is the first sale package we want to lead with commercially?
- [ ] `Q-002` Which capabilities are true upsells versus noise in the first conversation?
- [ ] `Q-003` Which surfaces are safe to market today as "working" versus "coming soon"?
- [ ] `Q-004` How should inventory be represented publicly until rebuilt?

## Current Executive Summary

What is true now:

- lole is broader than a single KDS/FOH wedge
- the codebase contains multiple saleable surfaces already
- inventory should not be claimed today
- documentation drift is large enough to distort strategy if left alone
- the right next move is not to shrink ambition, but to package truthfully and sequence rigorously
