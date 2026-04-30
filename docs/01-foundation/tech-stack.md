# ገበጣ lole — Tech Stack

**Version 1.0 · March 2026 · Definitive Reference**

> Every technology decision in this document is final for Phase 1 (0–200 restaurants). Decisions marked **Phase 2** are locked for that milestone. Nothing here is aspirational — every tool either is running today or has a concrete sprint to implement it.

---

## Decision Framework

Every tool was evaluated against four Ethiopia-specific criteria:

1. **Works offline or degrades gracefully** — Addis has daily power cuts and network drops
2. **Payable from Ethiopia** — Stripe, AWS, many US services are difficult to pay from Ethiopia
3. **Africa-edge CDN** — Nairobi/Johannesburg PoPs, not Frankfurt or Virginia
4. **Solo-builder operable** — No tool that requires a dedicated DevOps engineer to maintain

---

## Full Stack Reference

### Frontend & PWA

| Technology             | Version         | Role                                           | Why This, Not X                                                                                                                                         |
| ---------------------- | --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**            | 16 (App Router) | Web framework — dashboard, PWA, guest ordering | App Router gives React Server Components (smaller bundles on 4G) + edge functions + ISR. No alternative considered.                                     |
| **React**              | 19              | UI library                                     | Server Components reduce client JS significantly. React 19 concurrent features improve POS responsiveness.                                              |
| **TypeScript**         | 5               | Type safety across all surfaces                | GraphQL codegen generates types automatically — end-to-end type safety from DB to UI.                                                                   |
| **Tailwind CSS**       | 4               | Utility-first styling                          | Design system consistency across POS, KDS, dashboard, guest. Considered: CSS Modules (too verbose), Styled Components (runtime overhead).               |
| **Zustand**            | Latest          | Client-side state (POS cart, session state)    | ~3KB, no boilerplate, works perfectly with React 19. Considered: Redux (overkill), Jotai (fewer devs know it).                                          |
| **TanStack Query**     | v5              | Server state management                        | Pairs with GraphQL client for caching, background refetch, optimistic updates.                                                                          |
| **Radix UI**           | Latest          | Accessible component primitives                | Headless, fully accessible. Builds on top of Tailwind. Considered: Shadcn (built on Radix, still our choice for new components).                        |
| **next-intl**          | Latest          | Internationalization                           | Deep Next.js App Router integration. Supports `am` (Amharic) locale with Ethiopic script. Considered: react-i18next (no App Router-native RSC support). |
| **next-pwa / Serwist** | Latest          | PWA + service worker                           | Generates service worker from Next.js config. NetworkFirst strategy for menu, NetworkOnly for payments.                                                 |
| **Noto Sans Ethiopic** | —               | Amharic typeface                               | Google Fonts — renders Ethiopic script correctly across all Android devices. Loaded via `next/font` with `display: swap`.                               |
| **Framer Motion**      | Latest          | Animations                                     | **Dashboard only** — disabled on POS and KDS. Tablet responsiveness requires zero animation overhead.                                                   |
| **CapacitorJS**        | Latest          | Native Shell / Hardware Bridge                 | Wraps the Next.js bundle for Android. Enables silent printing, Bluetooth/USB access, and PWA+ performance on tablets.                                   |

---

### Backend

| Technology                  | Version | Role                                                          | Why This, Not X                                                                                                                                               |
| --------------------------- | ------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js API Routes**      | 16      | Domain API handlers (Phase 1 monolith)                        | Same codebase, same deploy, zero network hop for server-side calls. Considered: separate Express — adds complexity with no benefit at current scale.          |
| **Apollo Server**           | 4       | GraphQL Federation subgraph server                            | Federation 2 compatible. `@as-integrations/next` for Next.js App Router. Considered: Yoga (smaller, but less Federation tooling).                             |
| **Apollo Router**           | Latest  | GraphQL Federation gateway (Railway)                          | Rust binary — high performance, low memory. Centralized auth, rate limiting, schema registry. Considered: Apollo Gateway JS (deprecated in favour of Router). |
| **NestJS**                  | 10      | Extracted microservices (Phase 2, 200+ restaurants)           | TypeScript-native, decorator-based, GraphQL Federation native support. Orders + Payments domain extraction target.                                            |
| **Supabase Edge Functions** | —       | Lightweight edge workers (notifications, pg_notify consumers) | Runs on Deno at Supabase's edge. Used for: Telegram notifications, inventory low-stock events.                                                                |

---

### Database

| Technology                   | Version | Role                                                | Why This, Not X                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Supabase PostgreSQL**      | 15      | Primary database — all transactional data           | RLS multi-tenancy, Realtime subscriptions, Auth integration, Storage, Edge Functions — all in one platform. Considered: PlanetScale (MySQL, no RLS), Neon (excellent, used at 500+ restaurants).                                                                                                                                        |
| **TimescaleDB**              | Latest  | Time-series analytics on top of Postgres            | Free Supabase extension. Auto-partitions `orders` by day. Continuous aggregates for `hourly_sales`. 90% compression on old data. Considered: ClickHouse (separate system, operational overhead).                                                                                                                                        |
| **PowerSync**                | Latest  | Offline-first CRDT sync (replaces Dexie.js polling) | Built for Postgres + mobile sync. Handles CRDT conflict resolution. 1M free ops/month. Current repo status: client/bootstrap path is wired, but end-to-end Supabase replication in dev is still blocked pending direct logical replication and `powersync` publication. Considered: ElectricSQL (less mature tooling at decision time). |
| **Row Level Security (RLS)** | —       | Multi-tenant data isolation at database level       | `restaurant_id` RLS policies on every table. A bug in application code cannot expose cross-tenant data. Non-negotiable.                                                                                                                                                                                                                 |

**Monetary Storage Convention:**  
All monetary values are stored as `INTEGER` in **Santim** (100 santim = 1 ETB). Never `FLOAT` or `DECIMAL`. ETB 45.50 = `4550` in database. Display layer divides by 100.

---

### Caching & NoSQL

| Technology                      | Role                                                                    | Why                                                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Upstash Redis**               | Menu cache, session state, rate limiting counters, auth token blacklist | Serverless Redis — HTTP API, no connection pool management. Africa latency acceptable via HTTP. Free tier covers 0–200 restaurants. |
| **Cloudflare KV** (via Workers) | Edge menu cache at Nairobi PoP                                          | `GetMenuItems` GraphQL queries cached for 5 minutes at the Africa edge. POS menu load: <100ms on Ethio Telecom 4G.                  |

---

### Messaging & Events

| Technology                | Role                                                            | Why This, Not X                                                                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Upstash Redis Streams** | Internal event bus (`order.created`, `payment.completed`, etc.) | Same Upstash Redis instance. `XADD`/`XREADGROUP` semantics. Consumer groups ensure exactly-once processing. Considered: Apache Kafka (operational overhead), Apache Pulsar (Toast uses this — overkill for solo builder). |
| **Upstash QStash**        | Durable background job queue + CRON                             | HTTP-based job queue. Survives Vercel cold starts. Exponential backoff built in. CRON for EOD reports. Considered: BullMQ (requires persistent Redis connection — incompatible with serverless).                          |

---

### Authentication

| Technology               | Role                                                              | Why                                                                                                                   |
| ------------------------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Supabase Auth**        | Staff authentication (email + password), JWT generation           | Integrated with RLS — `auth.uid()` in RLS policies. `@supabase/ssr` for Next.js App Router cookie sessions.           |
| **HMAC-SHA256 (custom)** | Guest QR code signing and validation (`src/lib/security/hmac.ts`) | Stateless, serverless-compatible, 24h expiry. No database lookup needed to validate a QR scan.                        |
| **4-digit PIN (custom)** | Waiter POS quick staff login (`restaurant_staff.pin_code`)        | Verified via `POST /api/staff/verify-pin`. Session stored in `localStorage:gebata_waiter_context` on POS tablet only. |

---

### Payments

| Provider     | Integration Method                                     | Status                                  | Priority |
| ------------ | ------------------------------------------------------ | --------------------------------------- | -------- |
| **Telebirr** | REST API — initiate USSD/app payment, webhook callback | ✅ Initiate + verify. Webhook: Sprint 1 | P0       |
| **Chapa**    | REST API — initiate checkout, webhook callback         | ✅ Initiate + verify. Webhook: Sprint 1 | P0       |
| **Cash**     | Record only — no API                                   | ✅ Live                                 | P0       |

**Webhook security:** All payment webhooks verified with HMAC-SHA256 timing-safe comparison before any processing. All webhook handlers return 200 immediately and publish to event bus — zero synchronous business logic in webhook handlers.

---

### Infrastructure & Hosting

| Service                     | Provider        | Role                                               | Monthly Cost (USD)  |
| --------------------------- | --------------- | -------------------------------------------------- | ------------------- |
| **Frontend hosting**        | Vercel Pro      | Next.js, edge functions, ISR, CDN                  | $20                 |
| **API Gateway**             | Railway         | Apollo Router (always-on Rust binary)              | $10–20              |
| **Primary Database**        | Supabase Pro    | PostgreSQL 15, TimescaleDB, RLS, Realtime, Storage | $25                 |
| **Cache + Event Bus**       | Upstash         | Redis Streams + QStash                             | $0–20               |
| **Offline sync**            | PowerSync Cloud | CRDT sync for all POS devices                      | $0 (1M ops free)    |
| **Object storage**          | Cloudflare R2   | Receipt PDFs, menu photos, export files            | $0–5                |
| **CDN + WAF + DDoS**        | Cloudflare Free | DNS, WAF, DDoS, Africa PoPs, Workers               | $0                  |
| **Total (launch)**          | —               | —                                                  | **~$65–90/month**   |
| **Total (500 restaurants)** | —               | —                                                  | **~$300–450/month** |

---

### Monitoring & Observability

| Tool                   | Role                                                                      | Cost              |
| ---------------------- | ------------------------------------------------------------------------- | ----------------- |
| **Sentry**             | Error tracking — POS + dashboard crashes, tagged by `restaurant_id`       | Free              |
| **Better Uptime**      | Endpoint health monitoring, Telegram on-call alerts                       | Free              |
| **Axiom**              | Structured log aggregation — GraphQL queries, payment events, sync events | Free (25GB/month) |
| **Vercel Analytics**   | Real user monitoring — Core Web Vitals from actual devices in Addis       | Free              |
| **Supabase Dashboard** | Database slow queries, connection pool, RLS policy hits                   | Included          |
| **Railway Metrics**    | Apollo Router container CPU/memory                                        | Included          |

---

### CI/CD & Developer Tooling

| Tool                       | Role                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| **GitHub Actions**         | CI pipeline: type-check → lint → test → Supabase migration → Vercel deploy → Railway deploy |
| **Supabase CLI**           | `supabase db push` for migration deployment from CI                                         |
| **graphql-code-generator** | Auto-generate TypeScript types from GraphQL schema for all clients                          |
| **ESLint + Prettier**      | Code quality and formatting                                                                 |
| **Husky**                  | Pre-commit hooks: type-check + lint before every commit                                     |

---

### Mobile (Phase 2)

| Technology                     | Role                                           | Why                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React Native (Expo SDK 52)** | lole Now manager app — iOS + Android           | One codebase, OTA updates, Expo EAS build for APK distribution. Ethiopian Play Store access is inconsistent — EAS direct APK distribution bypasses this. |
| **Expo Router**                | Navigation                                     | File-based routing, consistent with Next.js mental model.                                                                                                |
| **Apollo Client**              | GraphQL queries from Expo app                  | Consumes existing Federation endpoint — zero new backend work.                                                                                           |
| **NativeWind**                 | Tailwind for React Native                      | Design system consistency between web and mobile.                                                                                                        |
| **Expo Push Notifications**    | Low stock, payment failure, large order alerts | No FCM/APNs setup required — Expo handles provider abstraction.                                                                                          |
| **Expo SecureStore**           | Auth session storage on device                 | Encrypted native storage — more secure than AsyncStorage for tokens.                                                                                     |
| **Expo EAS Build**             | Android APK + iOS IPA production builds        | Hosted build service — no Mac required for iOS builds.                                                                                                   |

---

### Native Hardware & Printing (POS/KDS)

| Technology                 | Role                               | Implementation                                                                                           |
| -------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Capacitor Native Shell** | Hardware bridge for POS tablets    | Android APK wrapper for the lole web bundle.                                                             |
| **ThermalPrinter Plugin**  | ESC/POS driver for silent printing | Native Capacitor plugin handling Bluetooth, USB OTG, and Network (TCP) printing directly from the app.   |
| **Capacitor SQLite**       | High-performance local caching     | Local persistence for large datasets (e.g. offline menu search) that exceed browser localStorage limits. |
| **Capacitor Device**       | Hardware identification            | Reliable serial/IMEI tracking for ERCA compliance and device-scoped security.                            |

**Legacy Transition:** The Termux/Node.js print server approach is deprecated and replaced by the native Capacitor hardware bridge for all new store deployments.

---

## Technology Decisions — Locked

These decisions are final and are not revisited unless a major external constraint forces a change.

| Decision        | Locked Choice               | Rejected Alternatives                             |
| --------------- | --------------------------- | ------------------------------------------------- |
| Web framework   | Next.js 16 App Router       | Remix, SvelteKit, Nuxt                            |
| Database        | Supabase PostgreSQL 15      | PlanetScale, Firebase, MongoDB                    |
| Offline sync    | PowerSync                   | ElectricSQL, manual Dexie.js                      |
| GraphQL gateway | Apollo Router (Rust)        | Apollo Gateway (JS, deprecated)                   |
| Event bus       | Upstash Redis Streams       | Apache Kafka, Pulsar, RabbitMQ                    |
| Job queue       | Upstash QStash              | BullMQ (not serverless-compatible), Inngest       |
| Mobile app      | React Native (Expo)         | Flutter (different language), native Android/iOS  |
| Guest ordering  | Browser PWA (no native app) | Native app (too much friction for dine-in guests) |
| CDN             | Cloudflare                  | AWS CloudFront (no Africa PoPs), Fastly           |
| Auth            | Supabase Auth               | Auth0 (expensive at scale), custom JWT            |

---

## Technology Decisions — Reconsidered at Scale

| Decision                 | Current            | Reconsider When                               | Alternative                         |
| ------------------------ | ------------------ | --------------------------------------------- | ----------------------------------- |
| Modular monolith         | Next.js API routes | 200+ restaurants, Orders domain shows latency | NestJS extracted service on Railway |
| Supabase PostgreSQL      | Pro plan           | 500+ restaurants                              | Neon serverless with autoscaling    |
| Realtime subscriptions   | Supabase native    | 500+ concurrent POS connections               | Redis pub/sub via event bus         |
| Single Railway container | 1 Apollo Router    | Multiple extracted services                   | Multi-service Railway project       |

---

_lole Tech Stack v1.0 · March 2026_
