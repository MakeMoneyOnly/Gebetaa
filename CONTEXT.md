# lole - The Restaurant Operating System for Ethiopia

## 1. Mission & Identity

**lole** is the definitive Restaurant Operating System (ROS) for the Ethiopian market. It is engineered to solve for the "Addis Reality": frequent power cuts, unstable internet, and local fiscal compliance.

- **Branding**: Professional, high-density, and premium.
- **Motto**: "Resilience by Design."
- **Core Value**: Local-first operations that never stop, even when the cloud is unreachable.

---

## 2. Domain Glossary (The Ubiquitous Language)

### Infrastructure & Sync

- **Store Gateway**: The authoritative LAN brain for a restaurant. Acts as the local sync coordinator.
- **PowerSync**: The CRDT-based synchronization fabric providing offline-first reliability.
- **Local-First Mesh**: Lateral communication between POS and KDS devices on the restaurant LAN.
- **Santim**: The base monetary unit (1/100th of an ETB). All financial values are `INTEGER` Santim.
- **Native Shell**: The **CapacitorJS** wrapper that provides hardware access (printers, Bluetooth) on Android tablets.

### Front of House (FOH)

- **POS (Point of Sale)**: The merchant terminal for order entry and table management.
- **Revenue Center**: A logical grouping of tables (e.g., "Dining Room", "Patio").
- **Table Session**: The lifecycle of a dining group, from opening a check to settlement.
- **QR Ordering**: Guest PWA for dine-in, validated via HMAC-signed table tokens.

### Kitchen (BOH)

- **KDS (Kitchen Display System)**: Digital ticket orchestration for prep stations.
- **Course Firing**: Timing order releases (e.g., Appetizers → Entrees).
- **Prep Station**: Routing targets for menu items (e.g., "Grill", "Bar").

### Logistics & Compliance

- **Aggregator**: Third-party services (Telebirr Food, Glovo) injected into the pipeline.
- **Fiscal / ERCA**: Tax compliance integration with the Ethiopian Revenues and Customs Authority.
- **Tsom (Fasting)**: Cultural dietary flags critical for the Ethiopian Orthodox calendar.

---

## 3. Architecture & Tech Stack

### Core Runtime

- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4.
- **Native Shell**: **CapacitorJS** (Android) for hardware-bound devices (POS/KDS).
- **API Gateway**: Apollo Router (Rust) / GraphQL Federation.
- **Backend**: Modular Monolith (Next.js API) → NestJS (Phase 2).

### Persistence & Data

- **Primary DB**: Supabase PostgreSQL 15 + TimescaleDB.
- **Offline Sync**: PowerSync (Postgres-to-SQLite CRDT sync).
- **Caching**: Upstash Redis + Cloudflare KV (Africa Edge).
- **Job Queue**: Upstash QStash (Durable background tasks).

### Hardware & Printing

- **Direct Printing**: Capacitor Native Plugins (`ThermalPrinter`) handle ESC/POS via Bluetooth, USB, or Network.
- **Legacy Fallback**: Termux/Node.js bridges are deprecated in favor of native app hardware access.

---

## 4. Design System (Lole Enterprise)

- **Primary Color**: **Lole Lime** (#DDF853) — High-visibility for active states and primary actions.
- **Secondary Color**: **Deep Carbon** (#1A1C1E) — For authority and professional weight.
- **Typography**: **Inter** (Strict -0.04em tracking for a "tight" engineered look).
- **Shapes**: Generous 24px (3xl) radii for containers; 12px (lg) for interactive elements.
- **Rhythm**: Strict 8px grid. No drop shadows (use 1px borders).

---

## 5. Engineering Invariants

1. **Local-First Always**: Core flows (Order → KDS → Print) must work without internet.
2. **Security by RLS**: Multi-tenancy is enforced at the DB layer via `restaurant_id`.
3. **Integer Money**: Always use `Santim`. ETB 10.00 = `1000`.
4. **Mobile-First UX**: High-density, touch-optimized layouts for tablets.
5. **Zero-Waste Logging**: Structured Axiom logs tagged with `restaurant_id`.

---

## 6. Agent Protocol & Workflow

Agents working on this repo should utilize the organized skills in `.agents/skills/`:

- **`gstack/`**: Use for headless browser testing, design audits, and shipping gated PRs.
- **`mattpocock/`**: Use for TDD, diagnosing complex bugs, and architectural refactors.
- **`caveman/`**: Use for high-efficiency, token-saving communication.

### Source of Truth Order

1. User Request.
2. `AGENTS.md` (Project Rules).
3. `CONTEXT.md` (Domain & Architecture).
4. `docs/` (Specific Specifications).
