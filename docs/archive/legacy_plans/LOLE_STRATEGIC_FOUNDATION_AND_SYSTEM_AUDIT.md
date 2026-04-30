# lole Strategic Foundation And System Audit

Date: 2026-04-27
Status: Working source of truth for strategy and production-readiness review
Scope: Founder positioning, feature truth map, commercial packaging, and launch blockers

## Company Position

lole is a modern Ethiopia-native restaurant operating system for Addis Ababa.
The ambition is not "a better local POS." The ambition is "Toast for Addis" with:

- Amharic-first operations
- offline-first store survivability
- Telebirr/Chapa-native payments
- ERCA-aware fiscal continuity
- multi-surface restaurant operations across FOH, KDS, guest ordering, and merchant management

Current company stage:

- pre-product
- not launched
- broad feature surface already exists in code
- customer truth is still forming through operator conversations, not live production usage

## Sales Strategy Reset

The company should not be reduced to a single KDS wedge.

What we should do instead:

- preserve the full "Toast for Addis" company vision
- tell the market a package story, not a feature soup story
- choose a first sale package that is narrow enough to land, but broad enough to represent the real platform
- stop claiming inventory until it is truly rebuilt, because current repo truth says inventory tables were removed

### Commercial Packaging Direction

The strongest packaging model from the current codebase is:

1. Service Core
    - waiter POS
    - table sessions
    - split settlement
    - KDS
    - local-first/offline runtime
    - Chapa/Telebirr payment flows

2. Guest Experience
    - QR ordering
    - guest tracker
    - loyalty foundation
    - upsell and marketing surfaces

3. Operator Control
    - merchant dashboard
    - command center
    - reports and analytics
    - staff and payroll/time attendance
    - channels and delivery oversight

4. Enterprise Reliability
    - gateway
    - device pairing and shells
    - OTA/device fleet surfaces
    - fiscal queueing
    - notifications and monitoring primitives

The first sale should come from one of these packages, not from pretending the company is only "fire to kitchen."

## First Package Hypothesis

Reference operator:

- Kategna Restaurant, Bole Medhane Alem branch
- operational champion: Haymanot, Head Waiter / Floor Lead
- economic buyer: General Manager / owner-family stakeholder

Current best first-package hypothesis:

- Service Core for high-volume full-service restaurants in Addis

Why this package is stronger than a single-feature wedge:

- it solves the visible floor-to-kitchen chaos
- it also includes billing, table control, and payment flow, which are easier to justify commercially than a narrow kitchen tool
- it represents the real operational spine of lole
- it leaves room to upsell Guest Experience, Operator Control, and Enterprise Reliability as subsequent layers

Champion promise:

- "You will run service from one modern flow instead of paper, shouting, and cashier cleanup."

Buyer promise:

- "You will capture more revenue, reduce service chaos, and get a system that looks and feels like a serious modern restaurant company."

## What The Codebase Already Contains

Breadth snapshot from current repo audit:

- 48 page routes
- 137 API route files
- 149 test files under `src/`
- 5 GraphQL subgraph files

Implemented platform domains verified in code:

1. Store-local runtime foundations
    - standalone gateway bootstrap and health surface
    - PowerSync-backed canonical local schema
    - journal-first local write path
    - local payment ledger and reconciliation records
    - fiscal job queue with replay support

2. Core restaurant operations
    - waiter POS surfaces
    - KDS multi-station surfaces
    - order command envelopes and course-firing primitives
    - table session workflows
    - split checks and local settlement adapters

3. Guest and revenue surfaces
    - QR guest menu and tracker
    - loyalty services
    - delivery aggregator and partner tables
    - command center and merchant dashboard routes
    - reporting, analytics, marketing, payroll, and staff surfaces

4. Enterprise operations
    - managed device pairing and shell routing
    - OTA/device config surfaces
    - notification queue with retries and fallback
    - GraphQL subgraph structure
    - security and RLS-heavy migration history

5. Important absence to respect
    - inventory is not currently a shippable product surface
    - docs still reference old inventory scope in several places
    - the repo contains plan/subscription references to inventory that are now misleading

## Code Anchors

Key files that best represent the real system:

- `src/lib/gateway/entrypoint.ts`
- `src/lib/sync/powersync-config.ts`
- `src/lib/payments/local-ledger.ts`
- `src/lib/fiscal/offline-queue.ts`
- `src/lib/domain/orders/commands.ts`
- `src/lib/delivery/aggregator.ts`
- `src/lib/notifications/queue.ts`
- `src/lib/devices/shell.ts`
- `src/app/api/merchant/command-center/route.ts`

## Strategic Read

The repo is no longer "vibe coding." It already contains the bones of a serious restaurant platform.

But it is not yet safe to describe as a finished company platform for one reason:

- feature breadth is ahead of commercial proof and ahead of a few critical end-to-end operational guarantees

In plain language:

- many domains exist in code
- several of them look production-shaped
- not all of them are equally integrated, deployed, or proven under live-store conditions

## Maturity Tiers

### Tier A: Strongest and most differentiated now

- local-first store runtime direction
- waiter POS plus KDS plus table-session operational model
- KDS and course pacing architecture
- payment resilience and local settlement model
- enterprise device/gateway thinking
- merchant command center and multi-surface operations model

### Tier B: Built and strategically valuable, but needs go-live proof

- fiscal continuity path
- notification and retry systems
- delivery ingestion and channel operations
- loyalty and guest lifecycle
- subscription and packaging surfaces
- payroll/time-attendance and operator reporting surfaces

### Tier C: Highest executive risk despite existing code

- launch discipline across docs, rollout, support, and commercial packaging
- proof that the local-first bridge is fully operational end-to-end in the actual environment
- proof that the first sale package closes a real pilot and survives live service
- source-of-truth drift between code, product docs, and go-to-market language

## Critical Gaps Before Launch

1. Source-of-truth drift
    - some docs still describe gaps that later code has already partially or fully addressed
    - some docs also claim features that are no longer present, especially inventory
    - this creates executive confusion about what is truly shipped versus merely planned

2. End-to-end readiness is uneven
    - several systems are implemented as modules, migrations, or adapters
    - fewer are proven as full live-store loops with operational evidence

3. Product packaging is under-defined
    - the codebase contains multiple saleable packages
    - the company story still swings between "full Toast clone" and a too-narrow operational wedge
    - we need a deliberate packaging model for first sale, second sale, and expansion sale

4. Market proof still needs conversion
    - Kategna gives us a real operator story
    - it is still pilot interest, not revenue-backed pull

5. Inventory must be treated as a future rebuild, not a current claim
    - there are docs, plan types, and messaging references to inventory
    - the migration history explicitly removed inventory tables
    - this must be cleaned up before any serious commercial narrative

## Recommended Gstack Sequence

1. `/gstack-plan-ceo-review`
    - redefine commercial packaging and decide what the first sale package actually is

2. `/gstack-plan-eng-review`
    - map the real launch-critical architecture path from first package to stable pilot

3. `/gstack-cso`
    - audit production security and operational trust boundaries before any live rollout

4. `/gstack-qa-only` then `/gstack-qa`
    - report-first adversarial validation, then fix highest-risk breakpoints in the selected launch package

5. `/gstack-review`
    - staff-level scrutiny on subtle logic and integration gaps

6. `/gstack-document-release`
    - reconcile README and docs with actual implemented state, especially inventory and payment/webhook truth

7. `/gstack-ship`
    - only after the above creates a believable pilot-ready slice

## Definition Of Strategic Success

lole becomes a company, not just a codebase, when all of the following are true:

- one Addis operator uses the first sale package in a real shift
- the system survives offline and peak-hour stress without operator panic
- buyer value is measurable in speed, captured revenue, or reduced complaints
- docs and rollout controls match reality
- the broader platform story expands from a proven package instead of replacing it
