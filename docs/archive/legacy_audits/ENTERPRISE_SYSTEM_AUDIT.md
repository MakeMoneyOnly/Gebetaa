# ENTERPRISE_SYSTEM_AUDIT

Date: 2026-04-20

## Scope

This document is a bird's eye architectural audit of the indexed codebase against two operating assumptions:

- The Addis reality: internet can disappear for up to 48 hours.
- The Toast standard: zero data loss, sub-100ms local latency, seamless multi-terminal sync, and continuous fiscal/legal compliance.

The audit is based on the code and docs currently present in the repository, with special focus on outbound network dependencies, offline behavior, synchronization, fiscal operations, hardware integration, security, and fleet deployment.

## Architecture Health Score

**Enterprise Readiness: 4/10**

The codebase shows strong product ambition and some important building blocks:

- local persistence intent via PowerSync and SQLite
- queue-oriented thinking for KDS, fiscal, and events
- device pairing and managed shell foundations
- schema work aimed at enterprise device/fiscal readiness

But the runtime architecture is still fundamentally cloud-centric. Core restaurant operations remain too dependent on Supabase, Next.js APIs, hosted payment/fiscal providers, and internet-mediated realtime. The current system is not yet a resilient local-first Restaurant Operating System.

## Executive Verdict

The platform is currently best described as a **cloud-assisted restaurant application with partial offline affordances**, not a **headless, local-first restaurant operating system**.

The largest structural issues are:

- the business core is not fully decoupled from UI and cloud transport layers
- realtime operations still traverse the cloud instead of the local network
- conflict resolution is too weak for true split-brain offline operation
- offline audit and fiscal guarantees are not legally strong enough
- hardware integration is bridge-based, not driver-based
- provisioning and device orchestration do not yet scale to a 50+ device restaurant

If the fiber cable is cut today, the system degrades unevenly and unpredictably. Some local UI workflows may still appear to function, but the architecture does not yet guarantee durable, synchronized, compliant restaurant operations for 48 hours.

## 2026-04-29 Progress Addendum

The original audit verdict above still stands at platform level, but the following Phase 2 operational slices now have concrete runtime coverage and focused verification:

- `ENT-075` Delivery aggregator runtime wiring now covers both direct aggregator intake and legacy delivery webhook intake: partner orders still land in `external_orders`, but they also inject through `AggregatorService` so the local-first gateway bus sees the same inbound order stream.
- `ENT-076` Tablet-triggered payment receipts now queue into the gateway-owned printer spooler when native silent printing is unavailable, and paired devices can now recover printer memory plus re-bootstrap their gateway session after first-launch misses or local cache loss.
- `ENT-077` Staff PIN verification now checks fetched active staff rows against stored hashed PINs, preserves session expiry issuance, and the payroll sync path now accepts `tip_allocations` for downstream labor reporting.
- `ENT-078` Expanded KDS station runtime now recognizes `grill` and `cold` across queue filters, telemetry, board types, and dedicated KDS pages, closing the gap between routing rules and operator-visible station surfaces.
- `ENT-079` PowerSync server sync now accepts `time_entries` and `tip_allocations`, matching the existing dashboard/labor KPI calculations so payroll-facing metrics can converge from local-first writes.

Focused verification completed on 2026-04-29 with:

- `src/app/api/__tests__/delivery-aggregator.route.test.ts`
- `src/app/api/__tests__/channels-api-routes.test.ts`
- `src/app/api/__tests__/staff-verify-pin.route.test.ts`
- `src/app/api/sync/__tests__/payroll-sync.route.test.ts`
- `src/features/kds/lib/__tests__/read-adapter.test.ts`
- `src/app/api/__tests__/kds-telemetry.route.test.ts`
- `src/lib/printer/transaction-print.test.ts`
- `src/lib/delivery/aggregator.test.ts`
- `src/lib/sync/__tests__/powersync-config.test.ts`

## 1. Outbound Network Dependency Map

This section starts with the required map of outbound requests and their offline criticality for restaurant operations.

### Criticality Scale

- `Critical`: fiber cut materially breaks core in-store operations
- `High`: store can limp temporarily, but an operational department degrades fast
- `Medium`: not immediately fatal to dine-in order execution, but significant business impact
- `Low`: convenience, observability, or non-core enhancement

### Network Dependency Inventory

| Dependency                     | Evidence                                                                                                  | Purpose                                   | Criticality | Offline consequence                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| Supabase Postgres/Auth/Storage | `src/lib/supabase/*`, broad `createClient()` usage, server routes throughout `src/app/api/**`             | system of record, auth, data reads/writes | Critical    | central reads/writes fail; many API routes and state transitions stop                                      |
| Supabase Realtime              | `src/hooks/useKDSRealtime.ts`                                                                             | KDS event propagation                     | Critical    | kitchen updates stop flowing across terminals through the intended path                                    |
| Next.js internal API layer     | `src/features/kds/components/StationBoard.tsx`, many `fetch('/api/...')` calls                            | operational app mutations and reads       | Critical    | browser clients lose core mutation/read path when backend is unreachable                                   |
| PowerSync Cloud endpoint       | `src/lib/sync/powersync-config.ts`                                                                        | intended local DB sync transport          | Critical    | intended local-first sync fabric is unavailable; current client config is likely broken even before outage |
| Upstash Redis Streams          | `src/lib/events/runtime.ts`, `src/lib/events/publisher.ts`                                                | event fan-out and async workflows         | Critical    | async downstream processing becomes lossy or skipped                                                       |
| Upstash QStash                 | `src/lib/events/runtime.ts`, health routes                                                                | deferred jobs                             | Critical    | background workflows do not reliably run                                                                   |
| MOR / ERCA fiscal API          | `src/lib/fiscal/mor-client.ts`, `src/lib/fiscal/erca-service.ts`, `src/app/api/jobs/erca/submit/route.ts` | legal invoice submission/fiscalization    | Critical    | legal compliance falls back to stub/queued behavior; trading risk rises immediately                        |
| Chapa API                      | `src/lib/payments/chapa.ts`, `src/lib/services/chapaService.ts`                                           | hosted payment session and payment events | High        | hosted payment flow unavailable                                                                            |
| Telebirr API                   | `src/lib/payments/telebirr.ts`                                                                            | hosted payment session and payment events | High        | telebirr processing unavailable                                                                            |
| KDS printer webhook target     | `src/lib/kds/printer.ts`                                                                                  | print dispatch                            | High        | print path depends on reachable webhook target; no local broker guarantee                                  |
| Delivery partner APIs          | `src/lib/delivery/*.ts`                                                                                   | dispatch to aggregators                   | High        | delivery integrations stop or queue externally                                                             |
| Esper API                      | `src/lib/integrations/esper.ts`                                                                           | remote device actions                     | Medium      | central device management actions unavailable                                                              |
| Africa's Talking SMS           | `src/lib/notifications/sms.ts`                                                                            | guest/staff SMS notifications             | Medium      | notification reliability drops                                                                             |
| Firebase/FCM/Web Push          | `src/lib/notifications/push.ts`                                                                           | push notifications                        | Medium      | push propagation fails                                                                                     |
| Telegram / PagerDuty           | `src/lib/alerts/telegram.ts`, `src/lib/monitoring/pagerduty.ts`                                           | alerting and ops escalation               | Low         | observability and incident alerting degrade                                                                |
| Merchant webhooks              | `src/lib/webhook.ts`                                                                                      | downstream integrations                   | Low         | partner callbacks fail or backlog                                                                          |
| Maps/fonts/image/CDN surfaces  | assorted UI/docs references                                                                               | convenience/UI                            | Low         | cosmetic or ancillary features degrade                                                                     |

### Architectural Meaning

The network map shows a clear pattern: **restaurant-critical traffic is still routed upward to cloud services rather than sideways across the store LAN**.

That is the core reason the system does not yet meet the Addis constraint.

## 2. The Addis Failure Log

This is the practical moment-of-fiber-cut failure list.

### What Stops Immediately

- Cloud-backed KDS synchronization degrades because `useKDSRealtime.ts` depends on Supabase Realtime instead of local peer or gateway transport.
- Any browser workflow that depends on `fetch('/api/...')` to the hosted backend becomes unavailable once the app can no longer reach its server APIs.
- Hosted payment session creation for Chapa and Telebirr stops.
- Fiscal submission certainty stops. The code falls back to queueing or stub behavior instead of guaranteed legal local signing.
- Device pairing, provisioning, and heartbeat flows stop because they are server-mediated.
- Event-driven side effects on Redis/QStash stop or are skipped.

### What Becomes Unsafe or Ambiguous

- Orders may appear locally actionable but lack guaranteed cross-device convergence.
- KDS items can diverge from POS state because there is no local authoritative broker.
- Audit logging is no longer guaranteed durable because current audit writes are server-centric.
- Concurrent offline edits can produce last-write-wins or server-wins outcomes that are operationally incorrect.
- Receipt printing may partially work depending on local/native fallback, but there is no store-wide print relay guarantee.
- Fiscal receipts can become legally questionable because local signing/EFM-grade continuity is not present.

### What Keeps Working Only Partially

- Some local UI state and cached pages can still render because of PWA caching and browser storage.
- Some local queue adapters may hold intended actions in localStorage or IndexedDB.
- Native device shell screens can continue to launch.

These are useful survival aids, but they are not enough to qualify as continuous restaurant operations.

## 3. Bird's Eye Findings By Audit Domain

## 3.1 Core Infrastructure & Orchestration

### Headless Core Gap

Business logic is not yet cleanly isolated into a single headless runtime that can execute identically:

- in the browser
- on a local gateway
- in the cloud

Evidence:

- `src/features/kds/components/StationBoard.tsx` mixes UI behavior, operational fetches, queue behavior, and device-side workflow logic.
- many workflows are expressed directly as `fetch('/api/...')` calls from client surfaces rather than commands against a local domain core
- cloud APIs remain the primary orchestration layer for order, KDS, payment, and fiscal flows

Result:

- browser surfaces are operationally thick
- cloud routes act as hidden process managers
- local execution is not symmetrical with cloud execution

### Single Point of Failure Analysis

Current SPOFs include:

- Supabase as central source for reads, writes, auth, and realtime
- hosted Next.js APIs as operational entry point
- Upstash for async event propagation
- external fiscal provider availability

This creates cross-department coupling:

- a fiscal or eventing outage can delay order finalization side effects
- a realtime outage affects KDS visibility even if kitchen devices are on the same LAN
- a cloud API outage affects local departments that should remain autonomous

### Network Topology Assessment

The codebase is still closer to a **client-cloud** model than a **local-first mesh** model.

Missing or incomplete foundational pieces:

- no local edge gateway process
- no LAN message bus
- no mDNS/Bonjour-style discovery
- no local websocket hub or MQTT broker
- no store-local failover coordinator

The repository docs describe cloud topology well, but the runtime code does not yet implement a restaurant-local orchestration plane.

## 3.2 Real-Time Operations

### Device-to-Device Communication Gap

There is no meaningful lateral communication fabric between:

- POS terminals
- KDS screens
- printers
- handhelds

Evidence:

- no implementation of mDNS, zeroconf, MQTT, or local broker discovery was found
- `useKDSRealtime.ts` uses Supabase Realtime
- KDS pages still call hosted API routes for queue refresh and actions

This means the kitchen path still has a cloud gap in the middle of a same-building workflow.

### Hardware Abstraction Gap

Peripheral integration is not yet backed by a durable driver abstraction.

Evidence:

- `src/lib/kds/printer.ts` supports `log` or `webhook` provider modes, which is an integration adapter, not a hardware driver model
- `src/lib/printer/silent-print.ts` attempts native plugin bridges, but fallback behavior is fragmented
- printer/session selections are stored locally in `src/lib/mobile/device-storage.ts`

What is missing:

- swappable driver contracts for printers, scanners, drawers, displays
- local spooler ownership
- queue retry policy per device
- health reporting per peripheral
- deterministic printer routing independent of cloud reachability

### Operational Result

The system has local print and device ideas, but not a store-wide hardware control plane.

## 3.3 Data Integrity & Global Consistency

### PowerSync / SQLite Readiness Gap

The intended local data core is not production-solid yet.

Evidence:

- `src/lib/sync/powersync-config.ts` reads `POWERSYNC_API_KEY` in client initialization logic even though it is a server-style env variable
- when config is missing, initialization drops into "offline-only mode"
- schema setup is partial and does not include all enterprise tables needed for audit/conflict durability

This is a major issue because the local-first story currently depends on a path that can silently downgrade.

### Split-Brain Conflict Resolution Gap

Current conflict handling is too weak for offline multi-terminal restaurant operations.

Evidence:

- `src/lib/sync/conflict-resolution.ts` relies heavily on table-level strategies like `last_write_wins` and `server_wins`
- conflict detection is largely version mismatch based
- generic merge logic does not understand restaurant intent
- `kds_items` defaults to `server_wins`

Operationally unsafe examples:

- two tablets editing Table 5 while offline
- course fire state changed in kitchen and FOH concurrently
- seat assignment, item void, or payment attachment edited on different devices

These cases require **intent-aware merge semantics**, not generic object merge.

### Audit Trail Gap

There is no strong evidence of a non-repudiable, offline-durable audit ledger.

Evidence:

- audit writers in `src/lib/api/audit.ts`, `src/lib/audit.ts`, and `src/lib/auditLogger.ts` write to server-side tables
- some background audit/event writes occur after API response completion
- local sync schema does not clearly establish a durable append-only `audit_logs` journal on device

Result:

- if a device acts offline, later proof of who did what is not guaranteed
- if the server path fails after an API response, audit evidence may be lost

That is below enterprise standard for discipline, compliance, and dispute resolution.

## 3.4 Fiscal, Legal & Security

### ERCA / EFM Compliance Gap

This is one of the highest-risk areas in the entire system.

Evidence:

- `src/lib/fiscal/mor-client.ts` falls back to stub mode when fiscal config is missing
- `src/lib/fiscal/erca-service.ts` can record stub submission states
- `src/app/api/jobs/erca/submit/route.ts` is explicitly stub-like and still references legacy naming
- `src/lib/fiscal/offline-queue.ts` depends on PowerSync availability

Critical conclusion:

The codebase does **not** currently demonstrate true **local signing** or EFM-grade autonomous fiscal continuity during internet outages.

That means a 48-hour outage creates a real risk of:

- illegal trading
- non-compliant receipt issuance
- reconciliation disputes after reconnect

### Security and Encryption Gap

Sensitive local operational data does not appear to be strongly encrypted at rest on device.

Evidence:

- `src/lib/mobile/device-storage.ts` uses Capacitor Preferences, `localStorage`, and `sessionStorage`
- no evidence of SQLCipher or equivalent encrypted local database layer was found
- no clear implementation was found for the migration's claim that some financial fields are encrypted at application layer before insert

### PCI-DSS Posture

The platform seems to reduce PCI scope by using hosted payment providers rather than handling raw card data directly. That is good.

However:

- payment continuity is not local-first
- payment references and transactional state are still cloud-mediated
- no offline payment token vault or in-store terminal orchestration plane is visible

This is acceptable for a cloud commerce app, but not enough for a Toast-grade resilient store system.

## 3.5 Deployment & Device Management

### MDM / Esper Constraint

The code shows cloud-side Esper integration, but not an architecture that actively works around kiosk restrictions for local operations.

Evidence:

- `src/lib/integrations/esper.ts` is outbound command dispatch
- no local inbound service pattern is visible
- Android manifest permissions are minimal and do not suggest a mature LAN/peripheral runtime

Likely conflict points:

- kiosk policy may block inbound ports or local service hosting
- no explicit bypass pattern for local relay traffic is present
- no evidence of multicast/discovery permissions or service orchestration on device

### Provisioning Scale Gap

Provisioning is not yet zero-touch for large rollouts.

Evidence:

- `src/app/api/devices/provision/route.ts` and `src/app/api/devices/pair/route.ts` use pairing-code flows
- `src/hooks/useDeviceHeartbeat.ts` reports to the cloud every 45 seconds

For a 50+ device store rollout, missing pieces include:

- bulk enrollment templates
- per-store bootstrap bundles
- automatic LAN discovery of gateway and peripherals
- fleet certificate/device identity provisioning
- role-based auto-claiming of device function on first boot

## 4. Toast Gap Analysis

This section summarizes what Toast-like enterprise store architecture typically has that this codebase still lacks structurally.

### Missing Structural Elements

- **Local store controller / gateway failover**
  Toast-class systems keep in-store operations alive through a local authority. This codebase still depends too much on cloud APIs and hosted realtime.

- **Proximity-based service discovery**
  There is no real local discovery layer for printers, KDS, handhelds, or a store gateway.

- **Store-local realtime bus**
  Realtime currently rides cloud services instead of a LAN bus.

- **Deterministic hardware driver layer**
  Hardware is integrated through point bridges and webhooks rather than a managed driver framework.

- **Append-only local operational ledger**
  Orders, audit events, fiscal actions, and device actions are not clearly recorded in a single durable local journal first.

- **Intent-aware conflict resolution**
  Merge behavior is generic and table-driven, not domain-driven.

- **Local fiscal continuity**
  There is no demonstrated local legal signing path for outages.

- **Fleet-scale provisioning**
  The current pairing model does not yet look like zero-touch enterprise rollout.

### Bottom Line

Toast does not win merely by having more features. It wins by having a **store-resident operating model**. That is the missing architectural layer here.

## 5. The Local-First Mesh Pivot Plan

The correct pivot is not "more offline caching." The correct pivot is a **gateway-based restaurant systems architecture**.

### Proposed Target Topology

Each restaurant should have a **Store Gateway** running locally on the LAN. This can be a hardened Android box, mini-PC, or embedded Linux appliance.

### Gateway Responsibilities

- local command bus for orders, KDS, tables, and device control
- authoritative LAN realtime hub using WebSockets or MQTT
- mDNS-based discovery for terminals and peripherals
- print spooler and routing engine
- fiscal queue and local signing module
- append-only event journal and audit ledger
- local auth/session cache for staff/device operation during outages
- sync bridge to cloud when connectivity exists
- device policy cache and bootstrap server for new terminals
- metrics buffer and delayed observability export

### Client Responsibilities

Clients should become thinner and more deterministic:

- run the same headless domain logic package used by the gateway
- write intents to a local journal first
- subscribe to gateway-issued authoritative state
- degrade gracefully to direct peer fallback only if gateway fails

### Cloud Responsibilities

The cloud should become:

- cross-store coordination
- analytics
- central reporting
- remote management
- long-term backup
- global menu/config propagation
- reconciliation and escalation, not the live store heartbeat itself

### Architectural Rule

For in-store operations, the cloud should be treated as **eventually connected**, not **immediately required**.

## 6. Prioritized Task Matrix

## Phase 1: Foundation

**Goal:** create the minimum local networking and store authority needed to remove cloud dependence from core in-store operations.

### Required work

- Build a per-store Edge Gateway service.
- Introduce LAN discovery with mDNS or equivalent.
- Stand up a store-local message bus using WebSockets or MQTT.
- Refactor order/KDS/table logic into a headless domain core reusable by client, gateway, and cloud workers.
- Fix PowerSync/bootstrap architecture so local persistence is deterministic and correctly authenticated.
- Replace silent offline downgrades with explicit operational mode management.

### Exit criteria

- a POS can create and mutate orders with the internet disconnected
- KDS receives updates over LAN only
- two terminals can remain convergent without cloud dependency

## Phase 2: Operational Resiliency

**Goal:** make kitchen, print, and table operations fully survivable during outages.

### Required work

- add a local KDS relay owned by the gateway
- implement a real print spooler with printer health, retries, and routing rules
- create hardware driver contracts for printers, scanners, and drawers
- add gateway-side table/session authority
- introduce domain-specific merge rules for orders, courses, voids, and payments

### Exit criteria

- kitchen and print continue normally for 48 hours offline
- printer outages do not corrupt order flow
- local state remains deterministic across devices

## Phase 3: Compliance & Security

**Goal:** reach legal and security survivability under outage conditions.

### Required work

- implement local fiscal signing or certified EFM bridge behavior
- create an append-only local audit ledger that syncs upstream later without loss
- encrypt sensitive local data at rest
- verify app-layer encryption claims for financial fields and close gaps
- harden device identity, key rotation, and offline authorization boundaries

### Exit criteria

- legal receipts remain valid offline
- every high-risk action is provably attributable
- stolen/offline device data is not trivially readable

## Phase 4: Scaling

**Goal:** make multi-store and 50+ device rollout operationally cheap and repeatable.

### Required work

- add zero-touch restaurant bootstrap bundles
- support role-based device auto-provisioning on first boot
- cache Esper/MDM policies locally and define kiosk-safe LAN rules
- add fleet templates for printer maps, station roles, and gateway trust
- automate branch replacement and re-enrollment workflows

### Exit criteria

- a new store can be stood up without manual per-device pairing rituals
- kiosk policies no longer interfere with local networking responsibilities
- gateway and terminals can self-heal after power/network interruptions

## 7. Highest-Priority Deficiencies

If only a handful of issues are addressed first, these should be the first ones:

1. Replace cloud-only in-store realtime with a gateway-owned LAN bus.
2. Make local persistence and sync deterministic; fix the fragile PowerSync bootstrap path.
3. Create a durable append-only local journal for orders, audit, fiscal, and device actions.
4. Implement real domain-aware conflict resolution for offline concurrent edits.
5. Add local fiscal continuity instead of stub-or-queue-only behavior.
6. Replace webhook-style printing with a proper local hardware control layer.

## 8. Recommended Architectural Principle Set

To become enterprise-grade, the system should adopt these principles:

- **Journal first, sync second**: every action lands durably on local storage before any cloud acknowledgment matters.
- **Gateway authoritative, cloud eventual**: store operations should not require internet to remain correct.
- **Intent merges, not record overwrites**: restaurant workflows need semantic reconciliation.
- **Hardware behind drivers**: apps should never care which specific printer or drawer implementation is active.
- **Audit as a product primitive**: audit and fiscal evidence must survive the same failures as orders.
- **Offline is normal mode**: not an exception path.

## 9. Final Assessment

This codebase is on the path toward an enterprise ROS, but it has not crossed the architectural threshold yet.

Today, it can support selective offline behavior. It cannot yet guarantee:

- zero-loss local operation for 48 hours
- seamless multi-terminal convergence
- legally safe fiscal continuity
- store-local realtime autonomy
- enterprise-scale device rollout

The next leap is not another feature sprint. It is the introduction of a **store-resident operating layer** that becomes the brain and body of each restaurant.

Without that layer, the platform will continue to behave like a smart cloud app under stress.

With that layer, it can start behaving like Toast for Addis.
