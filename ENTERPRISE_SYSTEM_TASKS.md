# ENTERPRISE_SYSTEM_TASKS

Date: 2026-04-21
Source audit: `ENTERPRISE_SYSTEM_AUDIT.md`

## Purpose

This document turns the enterprise audit into a working implementation tracker.

It is organized to help us:

- sequence the transformation safely
- track dependencies between foundational and downstream work
- measure whether we are actually closing the Addis and Toast gaps
- keep a single source of truth for execution status

## Status Legend

- `[ ]` Not started
- `[-]` In progress
- `[x]` Done
- `[!]` Blocked

## Program Goals

- 48-hour store survivability with 0% internet
- sub-100ms local write/read latency for in-store operations
- no data loss for orders, KDS events, fiscal events, and audit trails
- deterministic multi-terminal convergence
- legally valid fiscal continuity during outages
- zero-touch or near-zero-touch deployment for large device fleets

## Success Metrics

- POS, KDS, and table workflows continue for 48 hours with WAN disconnected
- KDS propagation over LAN remains under 250ms P95
- local command acknowledgement remains under 100ms P95
- every mutating action lands in a durable local journal before user success is shown
- no manual conflict intervention for defined offline concurrency scenarios
- fiscal receipts remain valid during WAN outage under target compliance model

## Operating Rules

- No feature work should bypass the local-first architecture once a gateway path exists.
- New core workflows should be modeled as domain commands/events, not direct UI-to-cloud calls.
- Audit and fiscal events must be treated as first-class operational data, not side effects.
- Hardware integration work should target reusable driver contracts, not one-off adapters.

## Phase Overview

| Phase   | Goal                                                                                             | Status | Exit signal                                                  |
| ------- | ------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------ |
| Phase 1 | Foundation: gateway, discovery, local bus, headless core, deterministic local persistence        | `[ ]`  | internet loss no longer stops core in-store operations       |
| Phase 2 | Operational Resiliency: KDS, print, table authority, hardware drivers, conflict semantics        | `[ ]`  | kitchen and FOH stay convergent and fast offline             |
| Phase 3 | Compliance & Security: local fiscal continuity, audit ledger, encryption, offline auth hardening | `[ ]`  | store remains compliant and forensically trustworthy offline |
| Phase 4 | Scaling: fleet bootstrap, Esper alignment, zero-touch provisioning, self-healing rollout         | `[ ]`  | 50+ device store rollout becomes repeatable and low-touch    |

## Immediate Priority Queue

These are the first tasks to start because other work depends on them.

- [x] `ENT-001` Define the Store Gateway architecture boundary, runtime choice, and hosting target.
- [x] `ENT-002` Extract a headless domain core for orders, KDS, tables, and device commands.
- [x] `ENT-003` Design the local journal schema for commands, events, audit, fiscal, and sync metadata.
- [x] `ENT-004` Choose and prototype the LAN transport layer: local WebSocket hub, MQTT, or equivalent.
- [x] `ENT-005` Fix the local persistence bootstrap path so offline mode is deterministic and observable.
- [x] `ENT-006` Decide the fiscal offline continuity model: local signing, certified bridge, or EFM appliance path.

## Phase 1: Foundation

### 1.1 Gateway Architecture

- [x] `ENT-001` Create an ADR for the Store Gateway runtime.
      Definition of done: runtime, hosting device, failure model, update model, and local storage strategy are documented and approved.

- [x] `ENT-007` Define gateway responsibilities versus client responsibilities versus cloud responsibilities.
      Definition of done: one boundary document exists and is referenced by all implementation work.

- [x] `ENT-008` Create the gateway service skeleton in the repo.
      Definition of done: a runnable local process exists with health endpoints, config loading, and persistent local storage initialization.

- [x] `ENT-009` Add restaurant-local mode detection and explicit operating-mode telemetry.
      Definition of done: clients and gateway can show `online`, `degraded`, `offline-local`, and `reconciling` states without silent downgrade.

### 1.2 LAN Discovery and Topology

- [x] `ENT-004` Select the store-local transport and discovery stack.
      Definition of done: protocol choice, auth model, discovery model, and reconnect strategy are approved.

- [x] `ENT-010` Implement gateway advertisement and client discovery over LAN.
      Definition of done: devices can discover the gateway automatically on a clean store network.

- [x] `ENT-011` Define a kiosk-safe networking policy for Android/Esper-managed devices.
      Definition of done: required inbound/outbound ports, multicast needs, and device permissions are documented and tested.

- [x] `ENT-012` Add transport auth for device-to-gateway sessions.
      Definition of done: each device gets a scoped identity and session establishment is authenticated on LAN.

### 1.3 Headless Domain Core

- [x] `ENT-002` Extract domain logic from UI and API layers into reusable packages/modules.
      Definition of done: order, KDS, table/session, and device command logic can run without React or Next route handlers.

- [x] `ENT-013` Replace direct client `fetch('/api/...')` orchestration in core flows with domain commands routed locally first.
      Definition of done: the main in-store flows can execute against a local adapter rather than a cloud adapter.

- [ ] `ENT-014` Standardize domain event contracts for orders, course fire, KDS state, print intents, fiscal intents, and audit intents.
      Definition of done: contracts are versioned and shared by client, gateway, and cloud sync code.

### 1.4 Local Persistence and Sync Foundation

- [x] `ENT-005` Audit and repair the current PowerSync bootstrap/config path.
      Definition of done: the app can initialize local persistence reliably with correct client-safe credentials and observable error states.

- [ ] `ENT-015` Define the canonical local database schema for store operations.
      Definition of done: local schema includes orders, items, KDS state, printer jobs, fiscal jobs, audit log, sync journal, and conflict records.

- [ ] `ENT-016` Introduce a journal-first write path for in-store mutations.
      Definition of done: user success is not shown until the local journal append succeeds.

- [ ] `ENT-017` Replace deprecated localStorage/Dexie fallback paths with one supported local data stack.
      Definition of done: deprecated offline queues are removed or fully isolated behind compatibility adapters scheduled for removal.

- [ ] `ENT-018` Add reconnect and replay orchestration from local journal to cloud sync bridge.
      Definition of done: replay is idempotent, observable, and can survive process restart.

### 1.5 Foundation Validation

- [ ] `ENT-019` Build a WAN-disconnected integration test harness for a single-store setup.
      Definition of done: we can simulate fiber cut and verify local order create/update flows still work.

- [ ] `ENT-020` Add chaos cases for gateway restart, client restart, and delayed reconnect.
      Definition of done: the harness verifies no data loss across these failures.

## Phase 2: Operational Resiliency

### 2.1 Local Realtime for KDS and FOH

- [ ] `ENT-021` Replace cloud-only KDS realtime with gateway-owned local event propagation.
      Definition of done: KDS screens update from LAN events without Supabase Realtime.

- [ ] `ENT-022` Add local subscriptions for table/session and order status events.
      Definition of done: FOH and handheld devices stay convergent over LAN.

- [ ] `ENT-023` Add local event sequencing and deduplication guarantees.
      Definition of done: duplicate delivery and out-of-order delivery are handled predictably.

### 2.2 Table and Order Authority

- [ ] `ENT-024` Move table/session authority to the gateway for offline operation.
      Definition of done: table opens, transfers, closes, and seat edits can be completed offline.

- [ ] `ENT-025` Move course firing and kitchen pacing rules into the headless domain core.
      Definition of done: course state changes do not depend on cloud APIs to remain correct.

- [ ] `ENT-026` Define offline-safe order numbering and receipt numbering rules.
      Definition of done: identifiers remain unique, reconcilable, and fiscally acceptable after reconnect.

### 2.3 Payments and Settlement Resiliency

- [ ] `ENT-068` Define the canonical local payment ledger schema with cloud parity.
      Definition of done: local `payment_sessions`, `payments`, `payment_events`, reconciliation records, and settlement metadata exist with parity to the cloud ledger where required.

- [ ] `ENT-069` Introduce journal-first payment command and event flows.
      Definition of done: payment session open, capture record, verification outcome, refund, and reconciliation actions append durable local journal records before user success is shown.

- [ ] `ENT-070` Implement full offline settlement for cash and manual payment methods.
      Definition of done: cash and approved manual settlement methods can complete table settlement offline with durable local ledger writes, receipts, audit records, and later replay.

- [ ] `ENT-071` Implement deferred-verification payment mode for Chapa and other online processors.
      Definition of done: the system can record offline payment intent and local operational settlement state without falsely marking processor-backed money as verified before upstream confirmation.

- [ ] `ENT-072` Build a payment reconciliation worker for reconnect and upstream replay.
      Definition of done: local payment ledger entries replay idempotently, reconcile against upstream provider/cloud state, and surface matched, rejected, duplicate, and manual-review outcomes.

- [ ] `ENT-073` Add full payment ledger parity for split, partial, and table-close settlement flows.
      Definition of done: split checks, partial captures, remaining balances, and table-close settlement all operate from the same local ledger model and converge correctly after reconnect.

- [ ] `ENT-074` Add operator-visible payment state labels for local capture, pending verification, verified, failed, and review-required outcomes.
      Definition of done: terminals, cashier views, and audit/support tooling make payment truth explicit during and after outages.

### 2.4 Print and Peripheral Reliability

- [ ] `ENT-027` Build a gateway-owned print spooler.
      Definition of done: print intents are queued locally with retries, health tracking, and deterministic routing.

- [ ] `ENT-028` Define printer driver contracts and adapter interfaces.
      Definition of done: network printers, native bridges, and future printer types plug into one contract.

- [ ] `ENT-029` Add printer/device health reporting and operator-visible fault states.
      Definition of done: staff can tell which printer is down and whether jobs are queued, rerouted, or failed.

- [ ] `ENT-030` Extend the hardware abstraction layer for scanners, cash drawers, and customer displays.
      Definition of done: new device classes can be added without touching order/KDS domain logic.

### 2.5 Conflict Resolution

- [ ] `ENT-031` Replace table-level generic conflict strategies with domain-aware merge rules.
      Definition of done: concurrent edits for tables, orders, voids, fires, and payments are resolved by intent.

- [ ] `ENT-032` Document split-brain scenarios and expected merge outcomes.
      Definition of done: a scenario matrix exists and is test-backed.

- [ ] `ENT-033` Add operator-safe exception handling for unresolvable conflicts.
      Definition of done: the system surfaces conflicts explicitly without silent corruption.

### 2.6 Operational Resiliency Validation

- [ ] `ENT-034` Run offline multi-terminal simulations for POS, KDS, and handheld combinations.
      Definition of done: convergence and latency targets are measured and tracked.

- [ ] `ENT-035` Run printer outage and gateway failover drills.
      Definition of done: order flow survives device failures without hidden drops.

## Phase 3: Compliance & Security

### 3.1 Fiscal Continuity

- [x] `ENT-006` Decide the compliant fiscal continuity path for Ethiopia.
      Definition of done: approved target model exists with legal and operational sign-off.

- [ ] `ENT-036` Implement gateway-side fiscal queue ownership.
      Definition of done: fiscal work is durably queued locally before cloud submission or later reconciliation.

- [ ] `ENT-037` Implement local fiscal signing or certified fiscal bridge integration.
      Definition of done: the store can continue issuing legally valid receipts during WAN outage under the chosen compliance path.

- [ ] `ENT-038` Add fiscal reconciliation and exception reporting after reconnect.
      Definition of done: mismatches, retries, and submission outcomes are fully traceable.

### 3.2 Audit and Forensics

- [ ] `ENT-003` Finalize the append-only local audit and event ledger design.
      Definition of done: one canonical journal model exists for commands, events, and audit evidence.

- [ ] `ENT-039` Implement audit journal writes for all high-risk actions.
      Definition of done: delete, void, comp, transfer, fire, payment, refund, and fiscal actions all generate durable local records first.

- [ ] `ENT-040` Sync audit records upstream with tamper-evident lineage.
      Definition of done: upstream audit reconstruction preserves order, origin device, actor identity, and hash chain or equivalent evidence.

- [ ] `ENT-041` Remove post-response fire-and-forget audit behavior from critical paths.
      Definition of done: critical audit evidence is never dependent on best-effort background execution alone.

### 3.3 Local Data Security

- [ ] `ENT-042` Define the local data classification model for device and gateway storage.
      Definition of done: sensitive, regulated, operational, and cache-only data classes are documented.

- [ ] `ENT-043` Encrypt sensitive data at rest on device and gateway.
      Definition of done: stored operational data cannot be trivially read from browser storage or device preferences.

- [ ] `ENT-044` Remove or minimize plaintext storage in `localStorage`, `sessionStorage`, and Capacitor Preferences for sensitive contexts.
      Definition of done: only low-sensitivity cache data remains in plaintext stores.

- [ ] `ENT-045` Verify and implement application-layer encryption where schema/comments currently assume it.
      Definition of done: financial fields with claimed encryption are actually encrypted and test-covered.

### 3.4 Identity, Session, and Offline Authorization

- [ ] `ENT-046` Harden device identity issuance and rotation for LAN operation.
      Definition of done: each device has revocable identity material suitable for offline trust decisions.

- [ ] `ENT-047` Define offline authz rules for staff and devices when cloud auth is unavailable.
      Definition of done: the system knows who may continue operating and for how long during outage.

- [ ] `ENT-048` Remove insecure fallback secrets and weak development fallbacks from production paths.
      Definition of done: production builds cannot silently rely on placeholder or weak secret defaults.

### 3.5 Compliance and Security Validation

- [ ] `ENT-049` Run outage drills focused on fiscal legality and audit completeness.
      Definition of done: we can prove what happens legally and forensically during 48-hour WAN loss.

- [ ] `ENT-050` Run a security review of local data-at-rest and LAN transport posture.
      Definition of done: open risks are documented with mitigation owners and deadlines.

## Phase 4: Scaling

### 4.1 Fleet Provisioning

- [ ] `ENT-051` Design a zero-touch or near-zero-touch device bootstrap flow.
      Definition of done: a new device can join a store with minimal manual entry.

- [ ] `ENT-052` Build store bootstrap bundles containing gateway trust, store identity, and baseline role config.
      Definition of done: new sites can be staged without hand-configuring each device.

- [ ] `ENT-053` Add role-based first-boot claiming for POS, KDS, handheld, and admin devices.
      Definition of done: device function can be assigned with a constrained workflow rather than custom setup.

### 4.2 Esper / MDM Alignment

- [ ] `ENT-054` Define Esper policy templates that preserve required local networking capabilities.
      Definition of done: kiosk mode and local mesh responsibilities are compatible by design.

- [ ] `ENT-055` Add local policy caching for critical device restrictions and capabilities.
      Definition of done: devices remain operable under WAN loss without waiting for MDM round-trips.

- [ ] `ENT-056` Create remote recovery and branch replacement workflows for damaged or lost devices.
      Definition of done: re-enrollment and trust re-establishment are documented and automated where possible.

### 4.3 Fleet Observability and Operations

- [ ] `ENT-057` Add store-local metrics buffering and delayed export.
      Definition of done: outages do not erase operational telemetry needed for diagnosis.

- [ ] `ENT-058` Add fleet dashboards for gateway health, device health, sync backlog, print backlog, and fiscal backlog.
      Definition of done: operations can see which stores are degraded before merchants report it.

- [ ] `ENT-059` Create rollout rings and rollback levers for gateway and client updates.
      Definition of done: risky changes can be gradually deployed and quickly reversed.

### 4.4 Scaling Validation

- [ ] `ENT-060` Simulate a 50-device restaurant rollout and onboarding workflow.
      Definition of done: provisioning bottlenecks are measured and documented.

- [ ] `ENT-061` Run full-store recovery drills: power loss, gateway replacement, and WAN return.
      Definition of done: store recovery time objectives are measurable and acceptable.

## Cross-Cutting Backlog

These tasks support every phase and should be maintained continuously.

- [ ] `ENT-062` Maintain an architectural decision record index for gateway, transport, storage, fiscal, and auth decisions.
- [ ] `ENT-063` Add feature flags and rollback levers for every high-risk architecture cutover.
- [ ] `ENT-064` Add test fixtures for offline restaurant scenarios across unit, integration, and e2e layers.
- [ ] `ENT-065` Keep the audit and task tracker updated as findings are resolved or expanded.
- [ ] `ENT-066` Add performance benchmarks for local latency, event throughput, replay time, and sync catch-up time.
- [ ] `ENT-067` Add a release gate that blocks rollout if offline resiliency checks fail.

## Recommended Implementation Order

1. `ENT-001` through `ENT-018`
2. `ENT-021` through `ENT-035`, plus `ENT-068` through `ENT-074`
3. `ENT-036` through `ENT-050`
4. `ENT-051` through `ENT-061`

## Weekly Review Template

Use this section during implementation reviews.

### This Week

- Completed:
- In progress:
- Blocked:

### Risk Watch

- Open architectural risks:
- Compliance risks:
- Security risks:
- Rollout risks:

### Next Up

- Top 3 tasks for next sprint:
- Decisions needed:
- Test gaps:

## Done Definition For This Program

A task should not be checked off until:

- implementation exists
- tests cover the intended failure mode
- observability exists for the new behavior
- rollback or recovery behavior is defined
- docs are updated if the operating model changed

## Notes

- The IDs are intentionally stable so we can reference them in PRs, issues, and sprint plans.
- If you want, the next step can be turning this file into a sprint-ready version with effort estimates, owners, and GitHub issue breakdowns.
- Current implementation artifacts for `ENT-001` to `ENT-006`:
  `docs/01-foundation/adr/ADR-001-store-gateway-runtime.md`
  `docs/01-foundation/local-first-boundary.md`
  `docs/01-foundation/mqtt-lan-transport.md`
  `docs/01-foundation/fiscal-local-signing.md`
  `docs/01-foundation/kiosk-safe-networking.md`
  `src/lib/gateway/config.ts`
  `src/lib/gateway/service.ts`
  `src/lib/gateway/dispatcher.ts`
  `src/lib/gateway/runtime-mode.ts`
  `src/lib/lan/discovery.ts`
  `src/lib/auth/gateway-session.ts`
  `src/lib/domain/core/contracts.ts`
  `src/lib/domain/orders/commands.ts`
  `src/lib/domain/kds/commands.ts`
  `src/lib/domain/tables/commands.ts`
  `src/lib/domain/printer/commands.ts`
  `src/lib/journal/local-journal.ts`
  `src/lib/lan/mqtt-topics.ts`
  `src/lib/lan/mqtt-client.ts`
  `src/lib/fiscal/local-signing.ts`
  `src/lib/sync/tableSessionSync.ts`
