# lole — Enterprise Master Blueprint

## Toast-Grade Platform · Modern · Ethiopia-First

### Complete Platform Audit · Toast Comparison · 12 Domains · 500 → 10,000+ Restaurants

#### Version 4.0 · March 2026 · CTO & Co-Founder Edition

---

> **Your Mandate:** Build the infrastructure layer for Ethiopia's restaurant industry.  
> **Your Advantage:** Toast took 10 years and 500 engineers. You have AI and no legacy debt.  
> **Your Market:** No POS in Addis Ababa offers Amharic-first UI, ERCA compliance, and modern architecture. You win by default if you ship right.

---

## How to Use This Document

Feed this entire document to Claude Opus 4.6 at the start of every coding session. It is your system prompt for building lole. Every sprint, every task, every architectural decision in this document is derived from:

1. Direct analysis of your live codebase (Q4–Q18 IDE audit)
2. Verified research into Toast's actual production architecture
3. Ethiopia-specific market and infrastructure constraints

This is not generic advice. Every line is specific to what you have built and what you need to build.

---

## Table of Contents

1. [Complete Platform Snapshot](#1-complete-platform-snapshot)
2. [Toast vs lole — Full Domain Matrix](#2-toast-vs-lole--full-domain-matrix)
3. [POS App](#3-pos-app)
4. [Backend](#4-backend)
5. [API Layer — GraphQL Federation](#5-api-layer--graphql-federation)
6. [Frontend Web — Dashboard](#6-frontend-web--dashboard)
7. [Mobile Apps](#7-mobile-apps)
8. [Messaging & Events](#8-messaging--events)
9. [Primary Database](#9-primary-database)
10. [NoSQL Layer](#10-nosql-layer)
11. [Analytics & Batch](#11-analytics--batch)
12. [Infrastructure](#12-infrastructure)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Internationalization](#14-internationalization)
15. [Payments & ERCA Compliance](#15-payments--erca-compliance)
16. [Guest Experience — QR, Loyalty & Tracker](#16-guest-experience--qr-loyalty--tracker)
17. [Subscription & Monetization](#17-subscription--monetization)
18. [Migration Execution Plan — 9 Sprints](#18-migration-execution-plan--9-sprints)
19. [The 12 Laws](#19-the-12-laws)
20. [Scale Thresholds & Cost Projections](#20-scale-thresholds--cost-projections)

---

## 1. Complete Platform Snapshot

> Every row below is derived from direct IDE codebase analysis. This is the ground truth.

### What Is Already Built

| Surface                      | Routes                  | Status              | Key Details                                                                     |
| ---------------------------- | ----------------------- | ------------------- | ------------------------------------------------------------------------------- |
| **Dashboard**                | `/merchant` (14 routes) | ✅ Production-ready | Revenue, orders, tables, staff, guests, finance, inventory, channels, analytics |
| **Waiter POS**               | `/pos/waiter`           | ✅ Working          | Orders, modifiers (JSONB), split bills, service requests, cash + Chapa payments |
| **PIN Login**                | `/pos/waiter/pin`       | ✅ Working          | Per-staff 4-digit PIN, stored in `restaurant_staff.pin_code`                    |
| **KDS — 5 stations**         | `/kds/*`                | ✅ Working          | Kitchen, Bar, Coffee, Dessert, Expeditor                                        |
| **Guest QR Ordering**        | `/[slug]`               | ✅ Working          | HMAC-SHA256 signed URL, splash + loyalty + skip, anonymous sessions             |
| **Guest Tracker**            | `/[slug]/tracker`       | ✅ Working          | Real-time Supabase subscription scoped to `orderId`                             |
| **Loyalty System**           | DB only                 | ✅ Schema complete  | `loyalty_programs`, `loyalty_accounts`, `loyalty_transactions`                  |
| **Delivery Channels**        | DB + UI shell           | ✅ Schema complete  | BEU, Deliver Addis, Zmall, Esoora                                               |
| **Inventory**                | DB + UI                 | ✅ Schema complete  | `inventory_items`, `recipes`, `recipe_ingredients`, `stock_movements`           |
| **Finance**                  | DB + UI                 | ✅ Schema complete  | `payments`, `payouts`, `refunds`, `reconciliation_entries`                      |
| **Staff & Roles**            | DB + UI                 | ✅ Complete         | 6 roles: owner, admin, manager, kitchen, bar, waiter + PIN                      |
| **Analytics**                | Real queries            | ✅ Working          | Real Postgres queries, all time periods, comparisons — no TimescaleDB yet       |
| **Real-time**                | Supabase subscriptions  | ✅ Active           | 6 active subscriptions across all surfaces                                      |
| **QR Security**              | HMAC-SHA256             | ✅ Enterprise-grade | Timing-safe, 24h expiry, table + restaurant validation                          |
| **Subscription / PRO**       | UI placeholder          | ❌ Not implemented  | No plan column, no feature gating                                               |
| **Discounts**                | —                       | ❌ Missing          | Not in waiter POS, not in guest ordering                                        |
| **Payment webhooks**         | —                       | ❌ Missing          | Chapa and Telebirr have no `/api/webhooks/*` endpoints                          |
| **Auto inventory deduction** | —                       | ❌ Logic missing    | Schema exists, trigger not written                                              |
| **ERCA VAT**                 | —                       | ❌ Missing          | Legal compliance gap                                                            |
| **Amharic i18n**             | —                       | ❌ Missing          | Primary adoption blocker                                                        |
| **Event bus**                | —                       | ❌ Missing          | All services directly coupled                                                   |
| **Background job queue**     | —                       | ❌ Missing          | No durable async processing                                                     |
| **API contract**             | —                       | ❌ Missing          | Ad-hoc REST routes, no schema, no versioning                                    |
| **Monitoring**               | —                       | ❌ Missing          | No Sentry, no uptime checks, no alerting                                        |
| **Modifier tables**          | JSONB only              | ⚠️ Partial          | No required-field validation, no separate table                                 |
| **Manager mobile app**       | —                       | ❌ Not built        | Phase 2                                                                         |

### Complete Sitemap

```
/merchant                       Dashboard — revenue, KPIs, active tables, attention queue
/merchant/analytics             Revenue charts, trends, period comparisons, top items
/merchant/orders                Live order queue (kanban + table views), order management
/merchant/tables                Table grid, status, QR code generation/regeneration
/merchant/menu                  Categories, items, modifiers, pricing, availability
/merchant/staff                 Staff list, roles, PINs, schedules
/merchant/staff/schedule        Shift scheduling calendar
/merchant/staff/time-entries    Clock-in/out tracking
/merchant/guests                Guest directory, visit history, lifetime value, loyalty
/merchant/finance               Payments, payouts, refunds, reconciliation ledger
/merchant/inventory             Stock levels, recipes, purchase orders, suppliers
/merchant/channels              Delivery partner integrations (BEU, Deliver Addis, Zmall, Esoora)
/merchant/settings              Restaurant profile, preferences, notifications
/merchant/help                  Support tickets, FAQs

/pos/waiter                     Waiter POS — order taking, table management, billing
/pos/waiter/pin                 Per-staff 4-digit PIN login

/kds/kds                        Main kitchen display — all orders
/kds/bar                        Bar station KDS
/kds/coffee                     Coffee station KDS
/kds/dessert                    Dessert station KDS
/kds/expeditor                  Expeditor / order handoff station

/[slug]                         Guest QR menu ordering (browser, no install required)
/[slug]/setup                   Guest account creation
/[slug]/tracker                 Real-time order tracking for guests
```

---

## 2. Toast vs lole — Full Domain Matrix

| Domain                     | Toast Production Stack                                                       | lole Current State                                      | Gap                                                                                | Priority   |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| **POS App**                | Native Android, proprietary hardware ($600–900), Java/Kotlin                 | Next.js 16 PWA, any Android tablet (ETB 4,000–8,000)    | Discounts missing, Telebirr UI missing from POS                                    | P1         |
| **KDS**                    | Native Android, multi-station, hardware-specific                             | PWA multi-station (5 stations), Supabase Realtime       | None significant — feature-complete                                                | ✅ Equal   |
| **Guest Ordering**         | Browser PWA for QR (no app install). Loyalty prompt at checkout only         | Browser PWA, splash + loyalty + skip, HMAC-signed QR    | **lole is better** — loyalty at entry point                                        | ✅ Better  |
| **Guest Tracker**          | Toast sends SMS with link                                                    | PWA `/[slug]/tracker`, Supabase Realtime                | —                                                                                  | ✅ Equal   |
| **Backend**                | Java/Kotlin microservices, DropWizard, AWS ECS, containerized                | Next.js API Routes + Supabase Edge Functions            | No event bus, no job queue, no API contract                                        | P0         |
| **API Layer**              | GraphQL Federation (Apollo Router), REST for webhooks                        | Ad-hoc REST routes, no schema, no versioning            | No contract surface for delivery apps                                              | P0         |
| **Web Dashboard**          | React SPAs + TypeScript + GraphQL                                            | Next.js 16 + React 19, 14 routes, real-time sync        | No Amharic, no feature gating, missing modifier tables                             | P0/P1      |
| **Manager App**            | Toast Now — iOS + Android (live sales, quick actions, staff mgmt)            | Not built                                               | Full gap                                                                           | P2         |
| **Customer App**           | Browser-only for QR; Toast TakeOut app for loyalty/ordering                  | Browser PWA (correct — no native needed for Phase 1)    | None for Phase 1                                                                   | ✅ Correct |
| **Messaging/Events**       | Apache Pulsar (primary), Apache Camel (integrations), RabbitMQ (tablet sync) | None — all services directly coupled                    | No event bus at all                                                                | P1         |
| **Primary DB**             | Sharded Aurora PostgreSQL, AWS RDS                                           | Supabase PostgreSQL 15                                  | Money not in santim, no TimescaleDB, no modifier tables, no auto-deduction trigger | P0         |
| **NoSQL**                  | AWS DynamoDB — high-frequency reads (menu, pricing, sessions)                | None — every read hits Postgres directly                | 5,000 concurrent reads at 500 restaurants                                          | P1         |
| **Analytics**              | Apache Spark + Avro/Parquet, custom BI dashboards                            | Real Postgres queries, good periods/groupings           | No TimescaleDB, no EOD reports, no owner delivery                                  | P1         |
| **Infrastructure**         | AWS ECS, ALB, full microservices on multiple availability zones              | Vercel + Supabase                                       | No Cloudflare, no API gateway, no CDN strategy                                     | P1         |
| **Monitoring**             | Datadog (APM + infra) + Splunk (security analytics)                          | Nothing                                                 | Completely blind in production                                                     | P0         |
| **Internationalization**   | English only — US market                                                     | English only                                            | No Amharic — primary adoption blocker for Addis                                    | P0         |
| **Payments**               | Toast Payments (proprietary, US only)                                        | Chapa ✅ + Telebirr ✅ (initiate + verify). No webhooks | No webhook callbacks, no auto-order confirmation, no ERCA                          | P0         |
| **Loyalty**                | Toast Loyalty — POS + App, points at checkout                                | Schema complete, splash-first enrollment, tracker       | Loyalty earning not wired to order.completed                                       | P1         |
| **Inventory**              | Full with auto-deduction on sale                                             | Schema complete, no auto-deduction trigger              | Trigger not written                                                                | P2         |
| **Delivery Channels**      | Toast Delivery integrations                                                  | Schema complete (4 Ethiopian providers)                 | API integration not built                                                          | P2         |
| **Discounts**              | Full discount engine in POS and guest ordering                               | Not implemented anywhere                                | Full build needed                                                                  | P1         |
| **Subscription**           | Tiered pricing $69–165/month/location                                        | UI placeholder only — no plan column, no gating         | Full build needed                                                                  | P2         |
| **Modifier Tables**        | Proper relational tables                                                     | JSONB on `menu_items` — no required-field validation    | Migration needed                                                                   | P1         |
| **Finance/Reconciliation** | Automated reconciliation triggers                                            | Schema complete, no reconciliation triggers             | Logic not wired                                                                    | P2         |

---

## 3. POS App

### Toast's Production Approach

Toast runs a fully native Android application on **proprietary hardware** that costs $600–$900 per device. The OS is a locked-down custom Android fork. Printing uses native Android APIs. Offline uses SQLite with a custom sync protocol via RabbitMQ. Updates require APK distribution. Every terminal is a managed device.

### Why lole's PWA Strategy Wins in Ethiopia

| Factor                     | Toast                                    | lole                                        | Verdict               |
| -------------------------- | ---------------------------------------- | ------------------------------------------- | --------------------- |
| Hardware cost per terminal | $600–900 (Toast-only)                    | ETB 4,000–8,000 any Android tablet          | ✅ lole — 10x cheaper |
| Offline capability         | SQLite native                            | PowerSync CRDT (target)                     | Equal                 |
| Receipt printing           | Native Android API                       | Termux Node.js server                       | Equal                 |
| Update deployment          | APK to every device                      | Instant PWA push to all                     | ✅ lole               |
| Play Store dependency      | Required                                 | None — browser-based                        | ✅ lole               |
| Dev talent in Addis        | Android/Kotlin (scarce)                  | React/Next.js (growing)                     | ✅ lole               |
| Hardware availability      | Toast hardware not available in Ethiopia | Sold everywhere in Addis Mercato            | ✅ lole               |
| Kiosk lockdown             | Full Android kiosk                       | PWA fullscreen + Android Kiosk mode via MDM | Equal at scale        |

### Current POS Feature Audit (confirmed from Q12 codebase analysis)

| Feature                     | Status          | Confirmed Details                                                                                                |
| --------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| Browse menu by category     | ✅ Working      | —                                                                                                                |
| Add items to cart           | ✅ Working      | —                                                                                                                |
| Modifiers (JSONB)           | ✅ Working      | Stored as JSONB in `order_items.modifiers` — no required-field validation                                        |
| Split bills                 | ✅ Working      | Even split, custom split, item-based split — all three modes                                                     |
| Service requests            | ✅ Working      | Via `POST /api/device/service-requests` (water, check, etc.)                                                     |
| Cash payments               | ✅ Working      | —                                                                                                                |
| Chapa digital payments      | ✅ Working      | Initiates + returns checkout URL — staff must manually confirm capture                                           |
| Telebirr digital payments   | ⚠️ Backend only | `src/lib/payments/telebirr.ts` complete — not exposed in waiter POS UI                                           |
| Per-staff 4-digit PIN login | ✅ Working      | Per staff, verified against `restaurant_staff.pin_code`. Session stored in `localStorage: gebata_waiter_context` |
| Table open/close sessions   | ✅ Working      | —                                                                                                                |
| Payment webhook callbacks   | ❌ Missing      | No `/api/payments/callback/*` endpoints — confirmed Q13                                                          |
| Auto payment confirmation   | ❌ Missing      | Order status requires manual staff update after payment                                                          |
| Offline order queue         | ⚠️ Partial      | Dexie.js — last-write-wins, no CRDT, no unified KDS sync                                                         |
| Discounts                   | ❌ Missing      | Confirmed Q12 — not in codebase anywhere                                                                         |
| Thermal receipt printing    | ⚠️ Partial      | Termux server not yet deployed on tablets                                                                        |
| Kiosk mode lockdown         | ⚠️ None         | No PWA manifest kiosk settings yet                                                                               |
| Amharic UI                  | ❌ Missing      | No i18n strings anywhere in POS                                                                                  |

> **Security note:** PIN session stored in `localStorage` as `gebata_waiter_context`. This is acceptable for POS (single-device, staff-controlled environment) but should be documented. Do not replicate this pattern in guest-facing surfaces.

### What to Build: Discount Engine

```sql
-- New table needed
CREATE TABLE discounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id        UUID NOT NULL REFERENCES restaurants(id),
  name                 TEXT NOT NULL,
  name_am              TEXT,                    -- Amharic name for POS display
  type                 TEXT NOT NULL CHECK (type IN ('percentage','fixed_amount','bogo','item_override')),
  value                INTEGER NOT NULL,        -- basis points (percentage) or santim (fixed)
  applies_to           TEXT CHECK (applies_to IN ('order','item','category')),
  requires_manager_pin BOOLEAN DEFAULT false,   -- large discounts need manager approval
  max_uses_per_day     INTEGER,
  is_active            BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Link discounts to orders
ALTER TABLE orders ADD COLUMN discount_id     UUID REFERENCES discounts(id);
ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0; -- in santim
```

### Termux Print Server (Full Spec)

The POS tablet IS the print server. No separate hardware needed for single-tablet stations.

**When you need a Raspberry Pi instead:** One printer serves multiple tablets on the same network, or the kitchen printer is physically separate from the POS station.

**Hardware in Addis:**

| Item            | Model                                                         | Cost (ETB)  | Where                   |
| --------------- | ------------------------------------------------------------- | ----------- | ----------------------- |
| POS Tablet      | Samsung Galaxy Tab A8 or Tecno T40 Pro (Android 10+, 3GB RAM) | 4,500–8,000 | Addis Mercato           |
| Thermal Printer | Xprinter XP-80 (80mm) or XP-58 (58mm)                         | 2,500–4,500 | Kazanchis office supply |
| USB OTG Cable   | USB-C to USB-A OTG                                            | 50–150      | Any mobile shop         |

```bash
# Run once on each POS tablet
# Step 1: Install Termux from F-Droid (NOT Play Store — that version is abandoned)
# Step 2: Install Termux:Boot from F-Droid

# Step 3: Inside Termux
pkg update && pkg upgrade -y
pkg install nodejs-lts -y
mkdir -p ~/lole-print && cd ~/lole-print
npm init -y
npm install express node-thermal-printer

# Step 4: Find printer path
ls /dev/usb/    # usually /dev/usb/lp0 after connecting USB OTG

# Step 5: Create autostart
mkdir -p ~/.termux/boot
cat > ~/.termux/boot/start.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/sh
cd ~/lole-print && node server.js >> ~/print.log 2>&1 &
EOF
chmod +x ~/.termux/boot/start.sh
```

```javascript
// ~/lole-print/server.js — Bilingual ESC/POS receipt server
const express = require('express');
const { ThermalPrinter, PrinterTypes, CharacterSet } = require('node-thermal-printer');
const app = express();
app.use(express.json());

// Allow PWA on same device (localhost) to call this
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/print/receipt', async (req, res) => {
    const { order, restaurant, items, total_santim, payment_method } = req.body;
    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: '/dev/usb/lp0', // USB OTG — change to BT MAC if Bluetooth
        characterSet: CharacterSet.UTF8,
        width: 48, // 80mm paper
    });

    try {
        await printer.isPrinterConnected();

        // Header — Amharic restaurant name first
        printer.alignCenter();
        printer.bold(true);
        printer.println(restaurant.name_am || restaurant.name);
        printer.println(restaurant.name_en || '');
        printer.bold(false);
        printer.println(restaurant.address || '');
        printer.drawLine();

        // Order info (bilingual)
        printer.alignLeft();
        printer.println(`ትዕዛዝ #: ${order.order_number}`);
        printer.println(`ጠረጴዛ / Table: ${order.table_number}`);
        printer.println(`ቀን / Date: ${new Date().toLocaleDateString('am-ET')}`);
        printer.drawLine();

        // Line items with Amharic names
        items.forEach(item => {
            const lineTotal = ((item.price_santim * item.quantity) / 100).toFixed(2);
            printer.tableCustom([
                {
                    text: `${item.quantity}x ${item.name_am || item.name_en}`,
                    align: 'LEFT',
                    width: 0.7,
                },
                { text: `${lineTotal} ብር`, align: 'RIGHT', width: 0.3 },
            ]);
            // Print modifier selections if any
            if (item.modifiers?.length) {
                item.modifiers.forEach(mod => printer.println(`  + ${mod.name_am || mod.name}`));
            }
        });
        printer.drawLine();

        // Totals
        const totalETB = (total_santim / 100).toFixed(2);
        const vatSantim = Math.round(total_santim * 0.15);
        const vatETB = (vatSantim / 100).toFixed(2);
        const subtotalETB = ((total_santim - vatSantim) / 100).toFixed(2);

        printer.println(`ንዑስ ጠቅላላ / Subtotal: ${subtotalETB} ብር`);
        printer.println(`VAT (15%): ${vatETB} ብር`);
        printer.bold(true);
        printer.tableCustom([
            { text: 'ጠቅላላ / TOTAL:', align: 'LEFT', width: 0.6 },
            { text: `${totalETB} ብር`, align: 'RIGHT', width: 0.4 },
        ]);
        printer.bold(false);
        printer.println(`አከፋፈል / Payment: ${payment_method}`);
        printer.println(`VAT Reg: ${restaurant.vat_number || 'Pending ERCA'}`);
        printer.drawLine();

        // Footer
        printer.alignCenter();
        printer.println('ስለ ምርጫዎ እናመሰግናለን!');
        printer.println('Thank you for your visit!');
        printer.println('Powered by lole POS');
        printer.cut();

        await printer.execute();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(3001, '127.0.0.1', () => console.log('lole Print Server ready on localhost:3001'));
```

---

## 4. Backend

### Toast's Production Architecture

Toast runs **Java/Kotlin microservices** using the DropWizard framework, containerized on AWS ECS. Each service owns a complete domain — Orders, Payments, Menu, Inventory, Staff, Reporting. They communicate via Apache Pulsar (event bus) and gRPC (synchronous service calls). The API layer is GraphQL Federation served via Apollo Router. The platform required a decade and hundreds of engineers to reach this state.

### lole Target: Modular Monolith → Federated Services

**The rule:** Extract a service only when you hit a real bottleneck. A well-structured modular monolith with GraphQL Federation boundaries serves 500 restaurants without extraction. Premature microservices kill solo-builder velocity.

```
Phase 1 (Now → 200 restaurants):   Next.js modular monolith + Apollo Federation
Phase 2 (200+ restaurants):         Extract Orders + Payments to NestJS services
Phase 3 (500+ restaurants):         Extract Analytics + Notifications
```

### Target Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── graphql/route.ts              # Apollo Server 4 — single GraphQL entry point
│   │   ├── webhooks/
│   │   │   ├── chapa/route.ts            # ← BUILD THIS FIRST (P0)
│   │   │   ├── telebirr/route.ts         # ← BUILD THIS FIRST (P0)
│   │   │   └── cbe/route.ts              # Phase 2
│   │   ├── jobs/                         # QStash CRON job handlers
│   │   │   ├── eod-report/route.ts
│   │   │   ├── erca-invoice/route.ts
│   │   │   ├── payment-retry/route.ts
│   │   │   └── sync-reconcile/route.ts
│   │   └── health/route.ts
│
├── domains/                              # Shared-nothing business logic
│   ├── orders/
│   │   ├── schema.graphql                # Subgraph schema
│   │   ├── resolvers.ts                  # GraphQL resolvers
│   │   ├── service.ts                    # Business logic — no framework coupling
│   │   └── repository.ts                # Supabase queries ONLY
│   ├── menu/
│   ├── payments/
│   ├── guests/
│   ├── loyalty/
│   ├── staff/
│   ├── inventory/
│   ├── analytics/
│   ├── channels/
│   └── notifications/
│
└── lib/
    ├── sync/                             # PowerSync config + conflict resolver
    ├── printing/                         # PrintService (calls Termux server)
    ├── queue/                            # Upstash QStash job definitions
    ├── events/                           # Redis Streams event bus
    ├── cache/                            # Upstash Redis cache layer
    ├── security/                         # HMAC verifiers (already exists — keep)
    └── i18n/                             # next-intl Amharic + English
```

### P0: Payment Webhooks — Build This Week

This is the single most critical missing piece. Without webhooks, every digital payment requires manual staff confirmation. At scale this is inoperable.

```typescript
// src/app/api/webhooks/chapa/route.ts
import crypto from 'crypto';
import { publishEvent } from '@/lib/events/event-bus';

function verifyChapaSignature(payload: string, sig: string, secret: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    // Timing-safe comparison — prevents timing attacks
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

export async function POST(req: Request) {
    const raw = await req.text();
    const sig = req.headers.get('Chapa-Signature') ?? '';

    if (!verifyChapaSignature(raw, sig, process.env.CHAPA_WEBHOOK_SECRET!)) {
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Publish to event bus — NEVER process synchronously in a webhook handler
    // Chapa will retry if you return non-200. You must return in < 5 seconds.
    await publishEvent({ type: 'payment.completed', payload: JSON.parse(raw) });
    return Response.json({ received: true });
}
```

---

## 5. API Layer — GraphQL Federation

### Toast's Production API Strategy

Toast uses **GraphQL Federation 2** via Apollo Router as their single API gateway. Every client (POS, web, manager app, delivery integrations) consumes one GraphQL endpoint. Each backend service exposes a subgraph. Apollo Studio provides schema governance with breaking change detection. This architecture took them years to build — you start here from day one.

### Why You Cannot Remain on REST Routes

Your current ad-hoc REST routes have no contract. When BEU or Deliver Addis integrates with lole, you give them an endpoint. You then refactor a route. Their integration breaks silently. At 500 restaurants with 4 delivery partners, this is unrecoverable. GraphQL Federation solves this permanently.

### Subgraph Map

| Subgraph      | Owns                                                                | External Consumers                       | Phase   |
| ------------- | ------------------------------------------------------------------- | ---------------------------------------- | ------- |
| Orders        | orders, order_items, order_status, KDS                              | Delivery apps (push + status), reporting | Phase 1 |
| Menu          | menu_items, categories, modifier_groups, pricing                    | Delivery apps (menu sync), guest PWA     | Phase 1 |
| Payments      | transactions, Telebirr, Chapa, CBE                                  | Accounting APIs, finance exports         | Phase 1 |
| Guests        | guests, loyalty_accounts, loyalty_transactions, guest_menu_sessions | CRM tools, manager app                   | Phase 1 |
| Staff         | restaurant_staff, roles, shifts, time_entries, pin_codes            | Manager app, HR tools                    | Phase 1 |
| Restaurants   | restaurants, settings, tables, floor_plans                          | Admin panel, onboarding                  | Phase 1 |
| Inventory     | inventory_items, recipes, stock_movements, purchase_orders          | Supplier integrations                    | Phase 2 |
| Analytics     | hourly_sales, top_items, payment_breakdown                          | Manager app, BI tools                    | Phase 2 |
| Channels      | delivery_partners, external_orders, online_ordering_settings        | Delivery platform webhooks               | Phase 2 |
| Notifications | Telegram, push, SMS, email                                          | Internal only                            | Phase 1 |

### Apollo Router Configuration

```yaml
# router.yaml — deploy to Railway as always-on container
supergraph:
    listen: 0.0.0.0:4000

authentication:
    router:
        jwt:
            jwks:
                - url: https://YOUR_PROJECT.supabase.co/auth/v1/.well-known/jwks.json
                  issuer: https://YOUR_PROJECT.supabase.co/auth/v1

traffic_shaping:
    router:
        rate_limit:
            capacity: 1000
            interval: 1s

limits:
    max_depth: 10
    max_aliases: 30
    max_tokens: 10000

cors:
    origins:
        - https://lole.app
        - https://pos.lole.app
        - https://lolemenu.com
        - https://dashboard.lole.app
```

### Migration Path: REST Routes → GraphQL Resolvers

1. `npm install @apollo/server @apollo/subgraph @as-integrations/next graphql`
2. Create `app/api/graphql/route.ts` — Apollo Server Next.js adapter
3. Per domain, create `domains/{name}/schema.graphql` and `domains/{name}/resolvers.ts`
4. Move logic from `app/api/{name}/route.ts` into resolvers — business logic in `service.ts` stays unchanged
5. Run `graphql-code-generator` — web, POS, and KDS get full TypeScript type safety automatically
6. Keep `/api/webhooks/*` as REST — payment providers cannot send GraphQL
7. Deploy Apollo Router to Railway — $10–20/month, always-on container
8. Document the schema for BEU, Deliver Addis, Zmall, Esoora — they get a typed, versioned API

---

## 6. Frontend Web — Dashboard

### Toast's Web Dashboard

React SPAs with TypeScript and GraphQL. Full merchant management interface. Role-based access with manager vs. owner views. Responsive for mobile use by owners checking sales on their phones.

### lole's Current Dashboard State

Your dashboard already has **full feature parity with Toast's web dashboard** across 14 routes. The screenshot confirms production-quality UI with real-time sync ("IN SYNC" indicator), role-based dashboard presets (Owner/Manager/Kitchen Lead), Alert Rules engine, Command Bar (Ctrl+K), and ETB-denominated Income Tracker. This is well ahead of where it needs to be for 50 restaurants.

### Dashboard Feature Comparison

| Feature                                  | Toast | lole            | Status                                              |
| ---------------------------------------- | ----- | --------------- | --------------------------------------------------- |
| Revenue overview                         | ✅    | ✅              | Equal                                               |
| Live orders (kanban view)                | ✅    | ✅              | Equal                                               |
| Table management + QR gen                | ✅    | ✅              | Equal                                               |
| Menu management                          | ✅    | ✅              | Equal                                               |
| Staff management + scheduling            | ✅    | ✅              | Equal                                               |
| Guest directory + loyalty                | ✅    | ✅              | Equal                                               |
| Finance + reconciliation schema          | ✅    | ✅              | Schema confirmed — no auto-reconcile triggers yet   |
| Inventory + recipes                      | ✅    | ✅              | Equal                                               |
| Delivery channels                        | ✅    | ✅ Schema       | API integration not built                           |
| Analytics — revenue, trends, comparisons | ✅    | ✅ Real queries | Equal — confirmed Q15                               |
| Analytics — satisfaction/mood data       | ✅    | ✅              | Equal — confirmed Q15                               |
| Analytics — API performance metrics      | ✅    | ✅              | Equal — confirmed Q15                               |
| Role-based dashboard presets             | ✅    | ✅              | Equal                                               |
| Command bar (Ctrl+K)                     | ❌    | ✅              | **lole ahead of Toast**                             |
| Amharic UI                               | ❌    | ❌              | Critical gap — P0                                   |
| KPI cards auto-refresh                   | ✅    | ⚠️              | Manual Refresh button — needs reactive subscription |
| Subscription feature gating              | ✅    | ❌ UI only      | Phase 2                                             |
| Mobile responsive for owners             | ✅    | Unknown         | Verify on phone — feeds Manager App strategy        |

> **Finance confirmed (Q18):** All `amount` columns in `payments`, `payouts`, and `reconciliation_entries` are `NUMERIC` today — all are in scope for the Sprint 1.3 santim migration. `reconciliation_entries` has `source_type` ('payment'/'payout'/'refund') and `source_id` columns ready for trigger wiring. No automatic reconciliation process exists yet.

### What Needs to Change

**Real-time KPI cards (remove the Refresh button):**

Your Supabase subscriptions update tables but the top-level KPI cards (Orders In Flight, Active Tables, Open Requests) require a manual Refresh click. These should update automatically.

```typescript
// Replace manual Refresh with reactive subscription
// Subscribe to orders INSERT/UPDATE → recompute KPIs client-side
const { data: liveKPIs } = useRealtimeKPIs(restaurantId);
```

**Subscription feature gating (Phase 2):**

```typescript
// src/lib/subscription/plan-gates.ts
export const PlanFeatures = {
    starter: ['pos', 'menu', 'basic_orders', 'tables_10', 'staff_2'],
    pro: [
        'analytics',
        'loyalty',
        'inventory',
        'staff_scheduling',
        'unlimited_tables',
        'unlimited_staff',
        'kds_stations',
    ],
    business: ['channels', 'advanced_analytics', 'api_access', 'multi_station_kds'],
    enterprise: ['multi_location', 'white_label', 'sla', 'dedicated_support'],
} as const;

export function checkFeature(plan: string, feature: string): boolean {
    const tiers = ['starter', 'pro', 'business', 'enterprise'];
    return tiers
        .slice(0, tiers.indexOf(plan) + 1)
        .some(t => PlanFeatures[t as keyof typeof PlanFeatures]?.includes(feature as never));
}
```

---

## 7. Mobile Apps

### Toast's Mobile Portfolio

| App           | Platform                              | Users            | Key Features                                          |
| ------------- | ------------------------------------- | ---------------- | ----------------------------------------------------- |
| Toast POS     | Native Android (proprietary hardware) | Restaurant staff | Full POS, offline, native printing                    |
| Toast Now     | iOS + Android (free for customers)    | Owners, managers | Live sales, quick actions, multi-location, staff mgmt |
| Toast TakeOut | iOS + Android                         | End customers    | Online ordering + loyalty                             |
| Toast Tables  | iOS                                   | Host staff       | Reservations, waitlist                                |

### lole Mobile Strategy

| App              | Technology                                     | Users                                  | Phase        |
| ---------------- | ---------------------------------------------- | -------------------------------------- | ------------ |
| **lole POS**     | PWA on Android tablet                          | Waitstaff, cashiers                    | P0 — Live    |
| **lole KDS**     | PWA on tablet (same codebase, separate routes) | Kitchen, bar, coffee, dessert stations | P0 — Live    |
| **lole Guest**   | PWA in mobile browser (no install required)    | Dine-in customers                      | P0 — Live    |
| **lole Now**     | React Native (Expo)                            | Owners, managers                       | P1 — Phase 2 |
| **lole Loyalty** | Progressive enhancement of Guest PWA           | Repeat customers                       | P2 — Phase 3 |

### Why No Native App for Guests — Ever (Phase 1 & 2)

Toast's own data confirms: requiring an app install for QR-based dine-in ordering causes **significant abandonment**. Toast's production QR ordering is 100% browser-based. Your current implementation is correct. The guest PWA in the browser is the product. The PWA install prompt is a soft, optional upgrade for regulars — never a requirement.

Your splash screen with Login / Signup / **Skip to Menu** is strategically better than Toast's approach (which only prompts for loyalty at checkout). You capture loyalty signups at peak attention (arrival) while maintaining zero friction via Skip.

**Add the checkout re-prompt for skippers:**

```tsx
// In order checkout, for guests who used "Skip to Menu":
{
    !isAuthenticated && orderTotal > 0 && (
        <div className="loyalty-checkout-prompt">
            <p>ነጥቦችን ያግኙ! / Earn {calculatePoints(orderTotal)} loyalty points</p>
            <p>Sign up in 10 seconds — it stays for next time</p>
            <Button onClick={() => setShowQuickSignup(true)}>ተመዝገቡ / Sign Up</Button>
            <TextButton onClick={proceedWithoutAccount}>
                ያለ ሂሳብ ይቀጥሉ / Continue without account
            </TextButton>
        </div>
    );
}
```

This doubles loyalty enrollment with zero disruption to the core guest flow.

### lole Now — Manager App (Phase 2)

**Technology:** React Native (Expo SDK 52) — one codebase for iOS and Android.  
**Data source:** 100% from your existing GraphQL Federation endpoint — zero new backend work needed.  
**Updates:** Expo OTA (over-the-air) updates push like your PWA — no App Store review for bug fixes.

**Core features — mirrors Toast Now:**

```
Home Screen
├── Live revenue today (ETB) + % vs yesterday
├── Orders in flight right now
├── Active tables count
├── Staff currently clocked in
└── Last 5 alerts (low stock, payment failures)

Quick Actions
├── Mark item out of stock → instant menu update
├── 86 item → remove from menu temporarily
├── Pause / resume online ordering
└── Broadcast message to all staff

Reports
├── Today / This week / This month
├── Revenue chart in ETB
├── Top 10 selling items (Amharic names)
├── Revenue by payment method (Telebirr vs Chapa vs Cash)
└── ERCA VAT summary for accountant

Staff
├── Who is clocked in right now
├── Clock someone in or out
├── View tips and breaks
└── PIN reset

Alerts (push notifications)
├── Low stock: "{item_name_am} is running low"
├── Payment failure: "Order #{n} payment failed"
└── Large order: "Table A3 — ETB {amount} order placed"
```

---

## 8. Messaging & Events

### Toast's Production Event Architecture

Toast uses **Apache Pulsar** as their primary event bus (chosen over Kafka for its multi-tenancy model — each restaurant is a tenant). **Apache Camel** handles integration routing (delivery apps, accounting tools). **RabbitMQ** handles tablet-to-cloud sync for offline scenarios. This infrastructure requires a platform team to operate.

### The Problem with lole's Current Direct Coupling

```
Current flow (fragile):
  Order created
    → Directly updates KDS via Supabase subscription
    → Directly sends notification (if fails, order appears to fail)
    → Nothing updates inventory (logic not wired)
    → Nothing awards loyalty points (not connected)
    → Nothing submits ERCA (not built)
    → Nothing retries failed payment (no queue)

At 500 restaurants with 4 delivery partners:
  One slow ERCA API → holds up entire order confirmation
  One missing notification → lost revenue event audit trail
  One network blip during webhook → payment never confirmed
```

### lole Event Architecture: Upstash Redis Streams

Redis Streams gives 80% of Apache Pulsar's capability at 0% of the operational cost. No infrastructure team needed.

### Complete Event Schema

| Event                   | Producer            | Consumers                                          | Payload                                                                |
| ----------------------- | ------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| `order.created`         | Orders domain       | KDS, Notifications, Analytics                      | `{order_id, restaurant_id, items[], table_number, table_id}`           |
| `order.status_changed`  | Orders domain       | Notifications, Guest Tracker, Analytics            | `{order_id, old_status, new_status, table_id}`                         |
| `order.completed`       | Orders domain       | Loyalty (award points), Analytics, ERCA, Inventory | `{order_id, restaurant_id, total_santim, guest_id?, items[]}`          |
| `payment.completed`     | Payments domain     | Orders (auto-confirm), Analytics, ERCA, Finance    | `{payment_id, order_id, amount_santim, method, provider}`              |
| `payment.failed`        | Payments domain     | Notifications, QStash (retry job)                  | `{payment_id, order_id, error, attempt, provider}`                     |
| `menu.updated`          | Menu domain         | Redis cache invalidation, PowerSync push           | `{restaurant_id, changed_item_ids[]}`                                  |
| `inventory.low`         | Inventory (trigger) | Notifications → manager, Manager App push          | `{restaurant_id, item_id, item_name_am, current_stock, reorder_level}` |
| `loyalty.points_earned` | Loyalty domain      | Notifications → guest                              | `{guest_id, points_earned, new_balance, order_id, restaurant_id}`      |
| `table.opened`          | Tables domain       | Analytics                                          | `{restaurant_id, table_id, opened_at}`                                 |
| `table.closed`          | Tables domain       | Analytics, Finance                                 | `{restaurant_id, table_id, duration_minutes, total_revenue_santim}`    |
| `receipt.printed`       | Print service       | Analytics, ERCA trigger                            | `{order_id, restaurant_id, vat_amount_santim}`                         |

### Implementation

```typescript
// src/lib/events/event-bus.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type loleEvent =
    | { type: 'order.created'; payload: OrderCreatedPayload }
    | { type: 'order.status_changed'; payload: OrderStatusPayload }
    | { type: 'order.completed'; payload: OrderCompletedPayload }
    | { type: 'payment.completed'; payload: PaymentCompletedPayload }
    | { type: 'payment.failed'; payload: PaymentFailedPayload }
    | { type: 'menu.updated'; payload: MenuUpdatedPayload }
    | { type: 'inventory.low'; payload: InventoryLowPayload }
    | { type: 'loyalty.points_earned'; payload: LoyaltyPointsPayload }
    | { type: 'table.opened'; payload: TableOpenedPayload }
    | { type: 'table.closed'; payload: TableClosedPayload };

export async function publishEvent(event: loleEvent): Promise<void> {
    await redis.xadd(`events:${event.type}`, '*', {
        type: event.type,
        payload: JSON.stringify(event.payload),
        restaurant_id: (event.payload as any).restaurant_id ?? '',
        timestamp: new Date().toISOString(),
    });
}
```

### The Rule: Webhook Handlers Are Async-Only

```
WRONG — current risk with Chapa/Telebirr callbacks when you build them:
  Webhook arrives → process payment → update order → award loyalty → submit ERCA
  ERCA times out → Chapa marks webhook failed → resends → double payment processed

CORRECT:
  Webhook arrives → verify signature → publishEvent('payment.completed') → return 200
  QStash job     → update order status                (independent, retriable)
  QStash job     → award loyalty points               (independent, retriable)
  QStash job     → submit ERCA invoice                (independent, 5 retries)
```

---

## 9. Primary Database

### Toast's Database Architecture

Toast uses **sharded Aurora PostgreSQL** on AWS RDS for transactional data and **DynamoDB** for high-frequency reads. Data is partitioned by restaurant/region. TimescaleDB (or equivalent time-series) for analytics. Full PITR (point-in-time recovery) on all production databases.

### lole Supabase PostgreSQL — Enterprise Configuration

#### Scale Thresholds

| Restaurants  | Configuration                     | Monthly Cost (USD) | Key Action                           |
| ------------ | --------------------------------- | ------------------ | ------------------------------------ |
| 0–50         | Supabase Pro                      | $25                | Enable TimescaleDB, santim migration |
| 50–200       | Supabase Pro + Read Replica       | $60–80             | Route analytics queries to replica   |
| 200–500      | Supabase Team / Dedicated compute | $150–200           | Dedicated compute, PITR enabled      |
| 500–2,000    | Neon serverless                   | $300–500           | Serverless Postgres autoscaling      |
| 2,000–10,000 | Neon + regional replicas          | $800–2,000         | Horizontal read scaling              |

#### P0 This Week: Santim Migration

```sql
-- NEVER: FLOAT or DECIMAL for monetary values
-- ALWAYS: INTEGER in Santim (100 santim = 1 ETB)
-- ETB 45.50 is stored as 4550
-- Every ETB rounding error on a receipt destroys customer trust

-- Step 1: Add santim columns
ALTER TABLE orders
  ADD COLUMN total_price_santim INTEGER
  GENERATED ALWAYS AS (ROUND(total_price::NUMERIC * 100)::INTEGER) STORED;

ALTER TABLE payments
  ADD COLUMN amount_santim INTEGER
  GENERATED ALWAYS AS (ROUND(amount::NUMERIC * 100)::INTEGER) STORED;

ALTER TABLE order_items
  ADD COLUMN unit_price_santim INTEGER
  GENERATED ALWAYS AS (ROUND(unit_price::NUMERIC * 100)::INTEGER) STORED;

-- Step 2: Verify — this must return 0 before proceeding
SELECT COUNT(*) FROM orders   WHERE total_price_santim IS NULL;
SELECT COUNT(*) FROM payments WHERE amount_santim IS NULL;

-- Step 3: Rename
ALTER TABLE orders     RENAME COLUMN total_price TO total_price_etb_legacy;
ALTER TABLE orders     RENAME COLUMN total_price_santim TO total_price;
ALTER TABLE payments   RENAME COLUMN amount TO amount_etb_legacy;
ALTER TABLE payments   RENAME COLUMN amount_santim TO amount;
ALTER TABLE order_items RENAME COLUMN unit_price TO unit_price_etb_legacy;
ALTER TABLE order_items RENAME COLUMN unit_price_santim TO unit_price;

-- Step 4: Add currency_code for future multi-currency (hotels billing in USD)
ALTER TABLE payments ADD COLUMN currency_code CHAR(3) DEFAULT 'ETB' NOT NULL;
```

#### Migrate Modifiers from JSONB to Proper Tables

Your current `menu_items.modifiers JSONB` structure (confirmed from Q17):

```json
{
    "groups": [
        {
            "name": "Size",
            "required": true,
            "multi_select": false,
            "options": [
                { "name": "Small", "price": 0 },
                { "name": "Medium", "price": 50 },
                { "name": "Large", "price": 100 }
            ]
        },
        {
            "name": "Extras",
            "required": false,
            "multi_select": true,
            "options": [
                { "name": "Cheese", "price": 30 },
                { "name": "Bacon", "price": 50 }
            ]
        }
    ]
}
```

This JSONB structure works today but prevents:

- Required group validation before order submission (currently not enforced — any order goes through)
- Proper pricing of modifier options in santim (prices are in ETB decimal today — missed by santim migration)
- Reporting on which modifiers are most selected
- Amharic names on modifier options

```sql
-- New modifier tables (migrate JSONB data after creating these)
-- The JSONB groups[] maps directly to modifier_groups
-- The JSONB options[] maps directly to modifier_options
CREATE TABLE modifier_groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  menu_item_id  UUID NOT NULL REFERENCES menu_items(id),
  name          TEXT NOT NULL,
  name_am       TEXT,
  required      BOOLEAN DEFAULT false,   -- maps from JSONB "required"
  multi_select  BOOLEAN DEFAULT false,   -- maps from JSONB "multi_select"
  min_select    INTEGER DEFAULT 0,
  max_select    INTEGER,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE modifier_options (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id     UUID NOT NULL REFERENCES restaurants(id),
  modifier_group_id UUID NOT NULL REFERENCES modifier_groups(id),
  name              TEXT NOT NULL,
  name_am           TEXT,
  price_adjustment  INTEGER DEFAULT 0,  -- in SANTIM (maps from JSONB "price" × 100)
  is_available      BOOLEAN DEFAULT true,
  sort_order        INTEGER DEFAULT 0
);

ALTER TABLE modifier_groups  ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifier_options ENABLE ROW LEVEL SECURITY;

-- Data migration: convert existing JSONB to tables
-- Run this after table creation to migrate all existing modifier data
INSERT INTO modifier_groups (restaurant_id, menu_item_id, name, required, multi_select, sort_order)
SELECT
  mi.restaurant_id,
  mi.id,
  grp->>'name',
  (grp->>'required')::boolean,
  (grp->>'multi_select')::boolean,
  ordinality - 1
FROM menu_items mi,
     jsonb_array_elements(mi.modifiers->'groups') WITH ORDINALITY AS t(grp, ordinality)
WHERE mi.modifiers IS NOT NULL;
```

#### Finance & Reconciliation — Confirmed Schema (Q18)

All financial tables confirmed in codebase. All `amount` columns are currently `NUMERIC` — all are in scope for the Sprint 1.3 santim migration.

```sql
-- payments (amount NUMERIC → migrate to INTEGER santim)
-- method: 'cash' | 'card' | 'telebirr' | 'chapa'
-- status: 'pending' | 'captured' | 'failed'

-- payouts (amount NUMERIC → migrate to INTEGER santim)
-- status: 'pending' | 'processing' | 'completed' | 'failed'
-- Tracks per-period payouts (daily/weekly) from payment providers

-- reconciliation_entries (amount NUMERIC → migrate to INTEGER santim)
-- source_type: 'payment' | 'payout' | 'refund'
-- source_id: FK → payments.id / payouts.id / refunds.id
-- The source_type + source_id columns are already wired for trigger-based automation
```

**Reconciliation trigger to wire in Phase 2 (Sprint 8):**

```sql
-- Auto-insert reconciliation_entries when a payment is captured
CREATE OR REPLACE FUNCTION create_reconciliation_on_capture()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'captured' AND OLD.status != 'captured' THEN
    INSERT INTO reconciliation_entries (
      id, restaurant_id, source_type, source_id,
      amount, status, reconciled_at
    ) VALUES (
      gen_random_uuid(), NEW.restaurant_id,
      'payment', NEW.id, NEW.amount, 'reconciled', NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_reconcile_payment
  AFTER UPDATE OF status ON payments
  FOR EACH ROW EXECUTE FUNCTION create_reconciliation_on_capture();
```

#### Wire Inventory Auto-Deduction

Schema exists. The trigger does not.

```sql
CREATE OR REPLACE FUNCTION deduct_inventory_on_order_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- Only execute when status changes TO 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN

    -- Insert stock_out movements for each ingredient in each ordered item
    INSERT INTO stock_movements (
      id, restaurant_id, inventory_item_id,
      movement_type, quantity, reference_id, created_at
    )
    SELECT
      gen_random_uuid(),
      oi.restaurant_id,
      ri.inventory_item_id,
      'out',
      ri.qty_per_recipe * oi.quantity,
      NEW.id,
      NOW()
    FROM order_items oi
    JOIN recipes r           ON r.menu_item_id = oi.menu_item_id AND r.is_active = true
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    WHERE oi.order_id = NEW.id;

    -- Update current_stock on inventory_items
    UPDATE inventory_items ii
    SET current_stock = ii.current_stock - sm_total.total_qty
    FROM (
      SELECT inventory_item_id, SUM(quantity) AS total_qty
      FROM stock_movements
      WHERE reference_id = NEW.id AND movement_type = 'out'
      GROUP BY inventory_item_id
    ) sm_total
    WHERE ii.id = sm_total.inventory_item_id;

    -- Notify event bus for low-stock items
    PERFORM pg_notify(
      'inventory_check',
      json_build_object('restaurant_id', NEW.restaurant_id, 'order_id', NEW.id)::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_deduct_inventory
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION deduct_inventory_on_order_confirm();
```

#### PowerSync: Replace Dexie.js Manual Sync

| Feature              | Current (Dexie.js + 20s polling)                           | Target (PowerSync)              |
| -------------------- | ---------------------------------------------------------- | ------------------------------- |
| Conflict strategy    | Last-write-wins (data loss on concurrent edits)            | CRDT + domain-specific rules    |
| Sync trigger         | 20-second interval (1,500 requests/min at 500 restaurants) | Postgres WAL — event-driven     |
| KDS + Orders         | Two separate systems (Dexie + localStorage)                | Single unified PowerSync schema |
| Offline window       | Undefined / brittle                                        | 24+ hours by design             |
| Supabase integration | Manual queries                                             | Built-in connector              |

```typescript
// src/lib/sync/conflict-resolver.ts
// Replaces blanket last-write-wins with domain knowledge

export const conflictRules = {
    'orders.status': 'server_wins', // Server knows if item sold out
    'orders.notes': 'client_wins', // Waiter knows what guest said
    'orders.discount_id': 'server_wins', // Discounts are manager-approved server-side
    'menu_items.price': 'server_wins', // Pricing is authoritative on server
    'menu_items.available': 'server_wins', // Availability is server truth
    'kds_actions.*': 'merge', // Both kitchen events valid — append both
    'payments.*': 'server_wins', // Financial data: server always wins
    'loyalty_accounts.*': 'server_wins', // Points balance: server always wins
} as const;
```

---

## 10. NoSQL Layer

### The Problem

Every menu display request on every POS tablet and every guest browser hits Postgres directly. At 500 restaurants with 10 tablets each:

- 5,000 potential concurrent connections
- Menu queries running on every page load
- Supabase connection pool exhaustion before you hit 200 restaurants

### Toast's Approach

AWS DynamoDB for all high-frequency reads — menu items, pricing, session state, active table data. Millisecond reads at any scale with no connection pool concerns.

### lole: Upstash Redis as NoSQL Cache Layer

| Data                  | Key Pattern                  | TTL           | Invalidated By          |
| --------------------- | ---------------------------- | ------------- | ----------------------- |
| Menu items + pricing  | `menu:{restaurant_id}`       | 5 min         | `menu.updated` event    |
| Restaurant settings   | `settings:{restaurant_id}`   | 30 min        | Settings save action    |
| Active table sessions | `session:{table_id}`         | 24 hrs        | Table close event       |
| Guest session context | `guest:{session_id}`         | 4 hrs         | Session expiry          |
| Rate limit counters   | `ratelimit:{ip}:{window}`    | 1 min rolling | Auto-expiry             |
| Auth token blacklist  | `blacklist:{token_jti}`      | Token TTL     | Logout / token revoke   |
| Dashboard KPIs        | `kpi:{restaurant_id}:{date}` | 5 min         | `order.completed` event |

### Implementation

```typescript
// src/lib/cache/menu-cache.ts
import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const MenuCache = {
  async get(restaurantId: string): Promise<MenuItem[] | null> {
    try {
      const cached = await redis.get<MenuItem[]>(`menu:${restaurantId}`);
      return cached;
    } catch { return null; }
  },

  async set(restaurantId: string, items: MenuItem[]): Promise<void> {
    await redis.setex(`menu:${restaurantId}`, 300, JSON.stringify(items));
  },

  async invalidate(restaurantId: string): Promise<void> {
    await redis.del(`menu:${restaurantId}`);
    await publishEvent({
      type: 'menu.updated',
      payload: { restaurant_id: restaurantId, changed_item_ids: [] },
    });
  },
};

// Usage in GraphQL resolver — cache-aside pattern
Query: {
  menuItems: async (_, { restaurantId }) => {
    const cached = await MenuCache.get(restaurantId);  // ~3ms from Upstash
    if (cached) return cached;
    const items = await menuRepo.findByRestaurant(restaurantId); // ~30ms Postgres
    await MenuCache.set(restaurantId, items);
    return items;
  },
}
```

---

## 11. Analytics & Batch

### Toast's Approach

Apache Spark for large-scale analytics processing, Avro/Parquet for data warehouse storage, custom BI dashboards. Data engineering team of 5–10 people. Toast reports that 78% of restaurant owners check their analytics daily — it is the highest-value feature for retention.

### lole Current Analytics State (confirmed Q15)

Real Postgres queries powering `/merchant/analytics`. **Not mock data.** Three API endpoints confirmed:

| Endpoint                     | Data                           | Status          |
| ---------------------------- | ------------------------------ | --------------- |
| `/api/analytics/overview`    | Revenue + orders aggregation   | ✅ Real queries |
| `/api/analytics/mood`        | Order satisfaction / mood data | ✅ Real queries |
| `/api/analytics/api-metrics` | API performance metrics        | ✅ Real queries |

**Time periods supported:** Today, Yesterday, This week, Last week, This month, Last month, Custom date range, Comparison vs. previous period.

**Groupings:** By day/week/month · By category/item · By payment method · By channel (dine-in, delivery).

**What's missing:** No TimescaleDB (complex queries are slow at scale) · No automated EOD report delivery · No Telegram report to owner · No ERCA daily summary integration.

### Target: TimescaleDB + Automated Owner Reports

#### TimescaleDB Setup

```sql
-- Enable extension (free in Supabase — toggle in Dashboard → Extensions)
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Convert orders to time-series hypertable
SELECT create_hypertable('orders', 'created_at',
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE);

-- Continuous aggregate: hourly revenue per restaurant (auto-updates every 30 min)
CREATE MATERIALIZED VIEW hourly_sales
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', created_at) AS hour,
  restaurant_id,
  SUM(total_price)  AS revenue_santim,
  COUNT(*)          AS order_count,
  AVG(total_price)  AS avg_order_santim
FROM orders
WHERE status = 'completed'
GROUP BY hour, restaurant_id
WITH NO DATA;

SELECT add_continuous_aggregate_policy('hourly_sales',
  start_offset      => INTERVAL '3 hours',
  end_offset        => INTERVAL '1 hour',
  schedule_interval => INTERVAL '30 minutes');

-- Compress chunks older than 30 days (saves ~90% storage)
SELECT add_compression_policy('orders', INTERVAL '30 days');
```

#### Power Queries

```sql
-- Top 10 selling items this week (Amharic names first)
SELECT
  mi.name_am, mi.name_en,
  SUM(oi.quantity)                       AS total_sold,
  SUM(oi.quantity * oi.unit_price) / 100 AS revenue_etb
FROM order_items oi
JOIN menu_items mi ON oi.menu_item_id = mi.id
JOIN orders o      ON oi.order_id = o.id
WHERE o.restaurant_id = $1
  AND o.created_at >= NOW() - INTERVAL '7 days'
  AND o.status = 'completed'
GROUP BY mi.id, mi.name_am, mi.name_en
ORDER BY total_sold DESC LIMIT 10;

-- Hourly heatmap — when is this restaurant busiest?
SELECT
  EXTRACT(HOUR FROM created_at) AS hour,
  COUNT(*)                       AS order_count,
  SUM(total_price) / 100         AS revenue_etb
FROM orders
WHERE restaurant_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
  AND status = 'completed'
GROUP BY hour ORDER BY hour;

-- Revenue by payment method
SELECT
  method,
  COUNT(*)         AS transactions,
  SUM(amount) / 100 AS total_etb
FROM payments
WHERE restaurant_id = $1
  AND created_at >= NOW()::date
  AND status = 'captured'
GROUP BY method;

-- Average ticket time (open to served) — matches your "Avg Ticket Time" dashboard card
SELECT AVG(EXTRACT(EPOCH FROM (served_at - created_at)) / 60) AS avg_minutes
FROM orders
WHERE restaurant_id = $1
  AND status = 'served'
  AND created_at >= NOW()::date;
```

#### End-of-Day Report — Automated to Owner Telegram

```typescript
// src/app/api/jobs/eod-report/route.ts
// QStash CRON: runs daily at 19:00 UTC = 10:00 PM Addis Ababa (UTC+3)

export async function POST(req: Request) {
    // Validate this request came from QStash (not a random HTTP call)
    const isValid = await verifyQStashSignature(req);
    if (!isValid) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const restaurants = await getAllActiveRestaurants();

    for (const restaurant of restaurants) {
        const report = await generateEODReport(restaurant.id);

        // 1. Save to Supabase for dashboard history
        await saveReport(report);

        // 2. Send to owner via Telegram — primary channel in Ethiopia
        if (restaurant.owner_telegram_id) {
            await sendTelegramEODReport(restaurant.owner_telegram_id, report);
        }

        // 3. Submit daily ERCA VAT summary if VAT-registered
        if (restaurant.vat_number) {
            await Jobs.submitDailyERCA(restaurant.id, report.date);
        }
    }

    return Response.json({ processed: restaurants.length });
}
```

---

## 12. Infrastructure

### Toast's Infrastructure

AWS ECS (Elastic Container Service) for all microservices, ALB (Application Load Balancer), RDS Aurora for databases, ElastiCache for Redis, S3 for object storage, CloudFront CDN. Multiple availability zones in US regions. Estimated annual AWS spend: $2–5M.

### lole: Enterprise Reliability at Startup Cost

| Service                       | Provider              | Role                                               | Cost (USD/mo)         |
| ----------------------------- | --------------------- | -------------------------------------------------- | --------------------- |
| Frontend + PWA hosting        | Vercel Pro            | Next.js, edge functions, ISR                       | $20                   |
| API Gateway                   | Railway (1 container) | Apollo Router — always-on binary                   | $10–20                |
| Primary Database              | Supabase Pro          | PostgreSQL 15 + TimescaleDB + RLS + Realtime       | $25                   |
| Cache + Event Bus             | Upstash Redis         | Menu cache, sessions, rate limiting, Redis Streams | $0–10                 |
| Job Queue                     | Upstash QStash        | Payment retries, ERCA, EOD reports, sync reconcile | $0–10                 |
| Offline Sync                  | PowerSync Cloud       | CRDT Postgres sync for all POS devices             | $0 (1M ops/mo free)   |
| Object Storage                | Cloudflare R2         | Receipt PDFs, menu images, EOD reports             | $0–5                  |
| CDN + WAF + DDoS              | Cloudflare Free       | DNS, WAF, DDoS protection, Africa PoPs             | $0                    |
| Error monitoring              | Sentry Free           | POS + web crashes, restaurant_id-tagged            | $0                    |
| Uptime monitoring             | Better Uptime         | Endpoint health + Telegram alerts                  | $0                    |
| CI/CD                         | GitHub Actions        | Automated deploy pipeline                          | $0                    |
| **Total — 50 restaurants**    |                       |                                                    | **~$65–90/month**     |
| **Total — 500 restaurants**   |                       |                                                    | **~$300–450/month**   |
| **Total — 2,000 restaurants** |                       |                                                    | **~$700–1,200/month** |

### Cloudflare — Non-Negotiable First Step

All traffic goes through Cloudflare before reaching Vercel or Railway. No exceptions.

- **Africa CDN:** PoPs in Nairobi and Johannesburg — dramatically lower latency from Addis than Vercel's US/EU edge
- **DDoS:** Restaurant platform + payments = real target. Cloudflare absorbs this for free
- **WAF:** Blocks SQL injection, XSS, credential stuffing before your app sees it
- **Workers for menu caching:** Cache GraphQL menu queries at Nairobi PoP — POS loads menu in <100ms on Ethio Telecom 4G
- **R2 storage:** Free egress vs. S3 pricing — use for receipt PDFs, menu images, export files

```javascript
// workers/menu-cache.js — deploys to Cloudflare edge (free)
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (request.method === 'POST' && url.pathname === '/graphql') {
            const body = await request.clone().json();
            if (body.operationName === 'GetMenuItems') {
                const key = `menu:${body.variables?.restaurantId}`;
                const cached = await env.MENU_CACHE.get(key, 'json');
                if (cached) {
                    return new Response(JSON.stringify(cached), {
                        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
                    });
                }
                const response = await fetch(request);
                const data = await response.json();
                await env.MENU_CACHE.put(key, JSON.stringify(data), { expirationTtl: 300 });
                return new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
                });
            }
        }
        return fetch(request);
    },
};
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy lole

on:
    push:
        branches: [main]

jobs:
    validate:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - run: npm ci
            - run: npm run type-check
            - run: npm run lint
            - run: npm run test:unit

    migrate:
        needs: validate
        runs-on: ubuntu-latest
        steps:
            - uses: supabase/setup-cli@v1
            - run: supabase db push --linked
              env:
                  SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

    deploy:
        needs: migrate
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - name: Deploy to Vercel
              run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
            - name: Deploy Apollo Router to Railway
              run: railway up --service apollo-router
              env:
                  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 13. Monitoring & Observability

### Toast's Approach

Datadog for full APM and infrastructure monitoring (estimated $50K+/year). Splunk for security analytics. Internal alerting routed to PagerDuty for on-call engineers. You do not need this. You need enough visibility to never be surprised by an outage or a data problem.

### lole Observability Stack (Zero to Minimal Cost)

| Layer             | Tool               | Catches                                             | Cost         |
| ----------------- | ------------------ | --------------------------------------------------- | ------------ |
| Error tracking    | Sentry             | Crashes, exceptions, POS offline errors             | $0           |
| Uptime monitoring | Better Uptime      | Endpoint down, latency spikes                       | $0           |
| Structured logs   | Axiom              | GraphQL query logs, payment events, sync events     | $0 (25GB/mo) |
| Real user metrics | Vercel Analytics   | Core Web Vitals, page load on real devices in Addis | $0           |
| Database          | Supabase Dashboard | Slow queries, connection pool usage, RLS hits       | Included     |
| Infrastructure    | Railway Metrics    | Apollo Router container CPU/memory                  | Included     |

### Critical Alerts — Configure Before You Sign Your First Restaurant

| Alert                  | Trigger Condition                                                     | Notify Via                   | Why It Matters                    |
| ---------------------- | --------------------------------------------------------------------- | ---------------------------- | --------------------------------- |
| POS offline            | Device has not synced for >5 min during business hours (9AM–11PM EAT) | Telegram (you)               | Restaurant taking paper orders    |
| Payment webhook silent | No Chapa/Telebirr callback in 10 min after initiation                 | Telegram                     | Revenue needs manual confirmation |
| Payment failure rate   | >5% failure in 10-minute rolling window                               | Telegram + email             | Revenue impact                    |
| API P99 latency        | >2 seconds for 5 consecutive minutes                                  | Email                        | POS feels broken to staff         |
| DB connection pool     | >80% utilization                                                      | Telegram                     | Cascading failures imminent       |
| Job queue backlog      | QStash depth >100 jobs                                                | Telegram                     | ERCA or payments piling up        |
| Low stock (restaurant) | `inventory_items.current_stock <= reorder_level`                      | Telegram to restaurant owner | Service disruption                |

```typescript
// src/lib/monitoring/alerts.ts
export async function sendAlert(
    level: 'critical' | 'warning',
    message: string,
    context?: Record<string, string>
): Promise<void> {
    const emoji = level === 'critical' ? '🔴' : '🟡';
    const lines = [
        `${emoji} *lole ${level === 'critical' ? 'CRITICAL' : 'Warning'}*`,
        '',
        message,
        '',
        ...(context ? Object.entries(context).map(([k, v]) => `*${k}:* ${v}`) : []),
        '',
        `_${new Date().toLocaleString('am-ET', { timeZone: 'Africa/Addis_Ababa' })}_`,
    ];

    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: process.env.TELEGRAM_ALERT_CHAT_ID,
            text: lines.join('\n'),
            parse_mode: 'Markdown',
        }),
    });
}
```

```typescript
// src/app/api/health/route.ts
export async function GET() {
    const [db, cache, queue] = await Promise.allSettled([
        supabase.from('restaurants').select('count').limit(1),
        redis.ping(),
        qstash.queues.get('default'),
    ]);
    const healthy = [db, cache, queue].every(r => r.status === 'fulfilled');
    return Response.json(
        {
            status: healthy ? 'healthy' : 'degraded',
            version: process.env.NEXT_PUBLIC_VERSION ?? 'unknown',
            timestamp: new Date().toISOString(),
            checks: {
                database: db.status,
                cache: cache.status,
                queue: queue.status,
            },
        },
        { status: healthy ? 200 : 503 }
    );
}
// Configure Better Uptime: poll /api/health every 60 seconds
// Alert via Telegram on non-200. Cost: $0.
```

### Sentry — POS-Specific Setup

```typescript
// sentry.client.config.ts
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    beforeSend(event) {
        // Tag every error with the restaurant it came from — critical for support
        const restaurantId = getActiveRestaurantId();
        if (restaurantId) {
            event.tags = { ...event.tags, restaurant_id: restaurantId };
        }
        return event;
    },

    integrations: [
        Sentry.replayIntegration({
            maskAllText: false, // Keep visible — POS errors need full context
            blockAllMedia: true,
        }),
    ],

    tracesSampleRate: 0.2,
    replaysOnErrorSampleRate: 1.0, // Always capture replays on POS errors
});
```

---

## 14. Internationalization

### The Business Case

Toast is English-only. They cannot serve the Ethiopian market. You win by default the moment you ship Amharic-first UI — no foreign POS vendor will ever prioritize Amharic. This is your permanent, defensible moat.

A waiter who cannot read item names on the POS makes errors. A restaurant owner who sees financial data in a foreign language feels the software is not built for them. Amharic is a product requirement, not a feature toggle.

### Database: Bilingual Columns

```sql
-- Every user-facing entity needs parallel Amharic columns
ALTER TABLE menu_items
  ADD COLUMN name_am        TEXT,
  ADD COLUMN description_am TEXT;

ALTER TABLE categories
  ADD COLUMN name_am TEXT;

ALTER TABLE restaurants
  ADD COLUMN name_am    TEXT,
  ADD COLUMN address_am TEXT;

ALTER TABLE modifier_groups
  ADD COLUMN name_am TEXT;

ALTER TABLE modifier_options
  ADD COLUMN name_am TEXT;

ALTER TABLE discounts
  ADD COLUMN name_am TEXT;

-- Full-text search for Amharic menu items (POS search bar)
CREATE INDEX idx_menu_items_am_fts
  ON menu_items USING gin(to_tsvector('simple', COALESCE(name_am, '')));

-- Combined bilingual search (matches either language)
CREATE INDEX idx_menu_items_bilingual_fts
  ON menu_items USING gin(
    to_tsvector('simple', COALESCE(name_am, '') || ' ' || COALESCE(name, ''))
  );
```

### next-intl Configuration

```typescript
// src/middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
    locales: ['am', 'en'],
    defaultLocale: 'am', // Amharic is DEFAULT — not optional
    localePrefix: 'as-needed',
});

export const config = {
    matcher: ['/(pos|merchant|kds)/:path*'],
};
// Guest routes (/[slug]/*) handle their own locale via query param or browser preference
```

### Translation Keys

```json
// src/i18n/messages/am.json
{
    "common": {
        "confirm": "አረጋግጥ",
        "cancel": "ሰርዝ",
        "save": "አስቀምጥ",
        "delete": "ሰርዝ",
        "search": "ፈልግ",
        "loading": "እየጫነ ነው..."
    },
    "pos": {
        "new_order": "አዲስ ትዕዛዝ",
        "table": "ጠረጴዛ",
        "items": "ምግቦች",
        "total": "ጠቅላላ",
        "payment": "ክፍያ",
        "cash": "ጥሬ ገንዘብ",
        "telebirr": "ቴሌ ብር",
        "cbe_birr": "ሲቢኢ ብር",
        "chapa": "ቻፓ",
        "receipt": "ሪሲት",
        "print": "አትም",
        "split_bill": "ሂሳብ ክፋፈል",
        "discount": "ቅናሽ",
        "order_ready": "ትዕዛዝ ተዘጋጅቷል",
        "order_sent": "ትዕዛዝ ተልኳል",
        "out_of_stock": "አልቋል",
        "search_menu": "ምናሌ ፈልግ",
        "service_request": "አገልግሎት ጠይቅ",
        "close_table": "ጠረጴዛ ዝጋ",
        "open_table": "ጠረጴዛ ክፈት"
    },
    "kds": {
        "new_order": "አዲስ ትዕዛዝ",
        "in_progress": "በሂደት ላይ",
        "ready": "ዝግጁ",
        "recalled": "ተመልሷል",
        "all_stations": "ሁሉም ጣቢያዎች"
    },
    "dashboard": {
        "sales_today": "የዛሬ ሽያጭ",
        "orders": "ትዕዛዞች",
        "revenue": "ገቢ",
        "active_tables": "ንቁ ጠረጴዛዎች",
        "staff": "ሰራተኞች",
        "top_items": "ምርጥ ምግቦች",
        "orders_in_flight": "በሂደት ያሉ ትዕዛዞች",
        "avg_ticket_time": "አማካይ የትዕዛዝ ጊዜ"
    },
    "guest": {
        "welcome": "እንኳን ደህና መጡ",
        "earn_points": "ነጥቦችን ያግኙ",
        "skip_to_menu": "ወደ ምናሌ ዝለሉ",
        "your_order": "ትዕዛዝዎ",
        "order_tracking": "ትዕዛዝ ክትትል",
        "preparing": "እየተዘጋጀ ነው",
        "ready": "ዝግጁ ነው",
        "loyalty_points": "የታማኝነት ነጥቦች"
    }
}
```

### Amharic Font

```typescript
// app/layout.tsx
import { Noto_Sans_Ethiopic } from 'next/font/google';

const amharic = Noto_Sans_Ethiopic({
    subsets: ['ethiopic'],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
    variable: '--font-amharic',
    preload: true,
});
// Apply: className={`${amharic.variable}`} on <html>
// CSS: font-family: var(--font-amharic), sans-serif
```

---

## 15. Payments & ERCA Compliance

### Payment Methods — Ethiopia Market Reality

| Method   | Users                               | Priority | Current Status       | Action                        |
| -------- | ----------------------------------- | -------- | -------------------- | ----------------------------- |
| Telebirr | 40M+ — dominant in Ethiopia         | P0       | ✅ Initiate + verify | Add webhook endpoint + POS UI |
| Chapa    | Developer-friendly, Visa/MC gateway | P0       | ✅ Initiate + verify | Add webhook endpoint          |
| Cash     | Universal                           | P0       | ✅ Working           | —                             |
| CBE Birr | Commercial Bank of Ethiopia         | P1       | ❌ Not integrated    | Phase 2                       |
| Amole    | Dashen Bank                         | P2       | ❌ Not integrated    | Phase 3                       |

### P0: Build Both Webhook Endpoints This Week

```typescript
// src/app/api/webhooks/telebirr/route.ts
// Telebirr uses different signature format — verify with their specific method
export async function POST(req: Request) {
    const raw = await req.text();
    const nonce = req.headers.get('X-Telebirr-Nonce') ?? '';
    const timestamp = req.headers.get('X-Telebirr-Timestamp') ?? '';
    const signature = req.headers.get('X-Telebirr-Signature') ?? '';

    const isValid = verifyTelebirrWebhook(
        raw,
        nonce,
        timestamp,
        signature,
        process.env.TELEBIRR_WEBHOOK_SECRET!
    );
    if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 401 });

    await publishEvent({ type: 'payment.completed', payload: JSON.parse(raw) });
    return Response.json({ received: true });
}
```

### ERCA e-Invoice — Your Enterprise Sales Differentiator

No POS system in Addis Ababa currently handles ERCA electronic invoicing natively. Every VAT-registered restaurant does this manually. When you build it, it becomes your primary reason enterprise restaurants switch to lole.

```typescript
// src/domains/payments/erca-service.ts
export class ERCAService {
    private readonly baseUrl = process.env.ERCA_API_URL!;

    async submitInvoice(order: CompletedOrder): Promise<ERCAInvoiceResult> {
        const vatSantim = Math.round(order.total_price * 0.15);

        const payload = {
            invoice_number: `${order.restaurant_id.slice(0, 8)}-${order.order_number}`,
            tin: order.restaurant.tin_number,
            buyer_tin: order.guest?.tin_number ?? null,
            issue_date: new Date().toISOString(),
            currency: 'ETB',
            items: order.items.map(item => ({
                description: item.name_en,
                description_am: item.name_am,
                quantity: item.quantity,
                unit_price_santim: item.unit_price,
                vat_rate: 0.15,
                vat_amount_santim: Math.round(item.unit_price * item.quantity * 0.15),
            })),
            subtotal_santim: order.total_price - vatSantim,
            vat_total_santim: vatSantim,
            grand_total_santim: order.total_price,
        };

        const res = await fetch(`${this.baseUrl}/invoices`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.ERCA_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            // Never lose an invoice — always retry
            await Jobs.submitERCA(order.id);
            throw new Error(`ERCA submission failed: ${res.status}`);
        }

        return res.json();
    }
}
```

### Job Queue — All Async Operations Are Durable

```typescript
// src/lib/queue/jobs.ts
import { Client } from '@upstash/qstash';
const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
const APP = process.env.APP_URL!;

export const Jobs = {
    // Retry failed digital payment — exponential backoff
    retryPayment: (orderId: string, attempt: number) =>
        qstash.publishJSON({
            url: `${APP}/api/jobs/payment-retry`,
            body: { orderId, attempt },
            retries: 3,
            delay: Math.pow(2, attempt) * 60, // 1min → 2min → 4min
        }),

    // Submit ERCA invoice — 5 retries over 2 hours
    submitERCA: (orderId: string) =>
        qstash.publishJSON({
            url: `${APP}/api/jobs/erca-invoice`,
            body: { orderId },
            retries: 5,
        }),

    // Daily 10PM Addis EOD report
    scheduleEOD: () =>
        qstash.schedules.create({
            destination: `${APP}/api/jobs/eod-report`,
            cron: '0 19 * * *', // 10PM Addis Ababa = 19:00 UTC
            retries: 3,
        }),

    // Award loyalty points after order completion
    awardLoyalty: (orderId: string, guestId: string) =>
        qstash.publishJSON({
            url: `${APP}/api/jobs/loyalty-award`,
            body: { orderId, guestId },
            deduplicationId: `loyalty-${orderId}`, // Idempotent — never double-award
        }),

    // Reconcile sync conflicts (replaces 20s polling)
    reconcileSync: (restaurantId: string) =>
        qstash.publishJSON({
            url: `${APP}/api/jobs/sync-reconcile`,
            body: { restaurantId },
            deduplicationId: `sync-${restaurantId}`,
        }),
};
```

---

## 16. Guest Experience — QR, Loyalty & Tracker

### Your QR Implementation Is Enterprise-Grade

From the codebase audit, your QR security is better than Toast's:

```
URL: https://lolemenu.com/{slug}?table={n}&sig={hmac}&exp={timestamp}

Security layers:
1. HMAC-SHA256 signature (timing-safe comparison — prevents timing attacks) ✅
2. 24-hour expiry timestamp embedded in signature ✅
3. Restaurant active status validation ✅
4. Table active status validation ✅
5. Signature format validation (64 hex chars) ✅

Session flow:
1. HMAC validated server-side at /api/guest/context ✅
2. guest_menu_sessions record created, tied to restaurant_id + table_id ✅
3. Anonymous sessions use guest_fingerprint for non-authenticated guests ✅
4. Authenticated guests link orders to guests table ✅
```

### Guest Ordering Flow — Current + Target

```
CURRENT FLOW:
Scan QR → Splash [Login | Signup | Skip] → Menu → Add items → Order → Tracker

TARGET FLOW (add checkout re-prompt):
Scan QR → Splash [Login | Signup | Skip] → Menu → Add items
       → Checkout → [Loyalty prompt for skippers] → Pay → Tracker
```

**The checkout loyalty re-prompt (doubles enrollment rate):**

```tsx
// In order summary before payment:
{
    !guestIsAuthenticated && orderItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">
                ነጥቦችን ያግኙ! / Earn {calculatePoints(orderTotalSantim)} loyalty points
            </p>
            <p className="mt-1 text-sm text-amber-700">
                Sign up in 10 seconds — saves your order history too
            </p>
            <div className="mt-3 flex gap-2">
                <Button onClick={() => setShowQuickSignup(true)}>ተመዝገቡ / Sign Up</Button>
                <TextButton onClick={proceedToPayment}>ያለ ሂሳብ ይቀጥሉ / Skip</TextButton>
            </div>
        </div>
    );
}
```

### Wire the Loyalty Earning Logic

Schema is complete. The earn-on-order trigger is not wired.

```typescript
// src/domains/loyalty/award-points.ts
// Called by QStash job on 'order.completed' event

export async function awardLoyaltyPoints(payload: OrderCompletedPayload) {
    const { order_id, guest_id, restaurant_id, total_santim } = payload;

    // Anonymous guests cannot earn points
    if (!guest_id) return;

    const program = await getLoyaltyProgram(restaurant_id);
    if (!program || program.status !== 'active') return;

    // ETB amount × points_per_currency_unit from program config
    const etbAmount = total_santim / 100;
    const points = Math.floor(etbAmount * program.points_rule_json.points_per_currency_unit);
    if (points <= 0) return;

    // Get or create loyalty account for this guest + program
    const account = await getOrCreateLoyaltyAccount(guest_id, program.id, restaurant_id);

    // Insert transaction record (immutable ledger)
    await supabase.from('loyalty_transactions').insert({
        restaurant_id,
        account_id: account.id,
        order_id,
        points,
        transaction_type: 'earn',
    });

    // Publish event to notify guest
    await publishEvent({
        type: 'loyalty.points_earned',
        payload: {
            guest_id,
            points,
            restaurant_id,
            order_id,
            new_balance: account.points_balance + points,
        },
    });
}
```

### Guest Tracker — Confirmed Implementation (Q16)

The tracker at `/[slug]/tracker` uses a **separate HMAC-signed URL** (same security pattern as the QR code):

```
URL: /[slug]/tracker?order_id={orderId}&table={n}&sig={signature}&exp={expiry}
```

This means the tracker URL is tamper-proof — only the guest who placed the order gets a valid tracking URL. No other guest can spy on another table's order.

**Supabase subscriptions (confirmed Q16):**

```typescript
// Two parallel subscriptions, both scoped to the specific orderId
supabase
    .channel(`tracker-${orderId}`)
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`, // Only this order
        },
        payload => {
            /* update status display */
        }
    )
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'order_items',
            filter: `order_id=eq.${orderId}`, // Only items in this order
        },
        payload => {
            /* update item-level status */
        }
    )
    .subscribe();
```

**Statuses shown to guest:** `pending → confirmed → preparing → ready → served`

**Item-level statuses:** started · held · ready

**What to add:** Amharic status labels (Sprint 2.6) and estimated time display using the `avg_ticket_time` TimescaleDB query from Section 11.

---

## 17. Subscription & Monetization

### Toast's Pricing Model

Toast charges $69–$165/month per location (SaaS fee), plus 2.49% + $0.15 per digital payment transaction, plus proprietary hardware $600–$900/device. Multi-location volume discounts. This is a US-centric price point. Direct copy would price you out of the Ethiopian market.

### lole Pricing — Ethiopia Market

| Plan           | Monthly (ETB) | USD Equiv | Targets                        | Gated Features                                                                          |
| -------------- | ------------- | --------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| **Starter**    | Free          | $0        | Single café, testing           | POS, menu, basic orders, 10 tables, 2 staff                                             |
| **Pro**        | 1,200 ETB     | ~$22      | Growing restaurant             | Analytics, loyalty, inventory, staff scheduling, unlimited tables/staff, 5 KDS stations |
| **Business**   | 3,500 ETB     | ~$64      | Multi-station, delivery-active | Channels (delivery integrations), advanced analytics, API access                        |
| **Enterprise** | Custom        | Custom    | Hotel groups, chains           | Multi-location, white label, SLA, dedicated support                                     |

### Implementation

```sql
-- Add subscription to restaurants table
ALTER TABLE restaurants
  ADD COLUMN plan               TEXT    DEFAULT 'starter'
    CHECK (plan IN ('starter','pro','business','enterprise')),
  ADD COLUMN plan_expires_at    TIMESTAMPTZ,
  ADD COLUMN chapa_subscription_id TEXT;
```

```typescript
// src/lib/subscription/plan-gates.ts
export const PlanFeatures = {
    starter: ['pos', 'menu', 'basic_orders', 'tables_10', 'staff_2', 'kds_1'],
    pro: [
        'analytics',
        'loyalty',
        'inventory',
        'staff_scheduling',
        'unlimited_tables',
        'unlimited_staff',
        'kds_5',
        'reports',
    ],
    business: ['channels', 'advanced_analytics', 'api_access', 'multi_kds'],
    enterprise: ['multi_location', 'white_label', 'sla', 'dedicated_support'],
} as const;

// Usage in page/component:
const canUseAnalytics = checkFeature(restaurant.plan, 'analytics');
if (!canUseAnalytics) redirect('/merchant/upgrade?feature=analytics');
```

---

## 18. Migration Execution Plan — 9 Sprints

> **How to use:** Each task is one focused session with Claude Opus 4.6. Start the session by pasting this entire document as context. Build one task at a time. The sequence is strict — later sprints depend on earlier ones.

---

### Sprint 1 — Critical P0 Fixes (Week 1–2)

_Financial and legal risk. No dependencies. Do these before anything else._

| #   | Task                           | Opus 4.6 Prompt Seed                                                                                                                                                                                                                                                      | Why Now                                            |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| 1.1 | Chapa webhook endpoint         | "Build `POST /api/webhooks/chapa` with timing-safe HMAC-SHA256 verification using `crypto.timingSafeEqual`. On valid signature, call `publishEvent('payment.completed')` and return 200 immediately. Never process business logic in webhook handler."                    | Revenue is manually confirmed today                |
| 1.2 | Telebirr webhook endpoint      | Same pattern, Telebirr signature format (X-Telebirr-Signature header)                                                                                                                                                                                                     | Revenue is manually confirmed today                |
| 1.3 | Santim monetary migration      | "Write Supabase migration converting `orders.total_price`, `payments.amount`, `order_items.unit_price` from DECIMAL to INTEGER santim (×100). Include verification query that must return 0 rows before rename step."                                                     | ETB float errors on receipts                       |
| 1.4 | Upstash QStash job queue       | "Set up Upstash QStash client in Next.js 16 TypeScript. Define `Jobs` object with: `retryPayment` (exponential backoff 3 retries), `submitERCA` (5 retries), `scheduleEOD` (cron `0 19 * * *`), `awardLoyalty` (deduplicationId = `loyalty-{orderId}`), `reconcileSync`." | Payment retries lost on cold start                 |
| 1.5 | Redis Streams event bus        | "Implement `publishEvent` function and `loleEvent` discriminated union using Upstash Redis `XADD`. Include all 11 event types from the blueprint."                                                                                                                        | Required by webhook handlers above                 |
| 1.6 | Sentry + restaurant_id tagging | "Add Sentry to Next.js 16 App Router. In `beforeSend`, tag every event with `restaurant_id` from active session. Enable session replay on error (POS route only)."                                                                                                        | Flying blind in production                         |
| 1.7 | Better Uptime health check     | "Create `GET /api/health` checking Supabase ping, Upstash Redis ping, QStash availability. Return `{status: 'healthy'                                                                                                                                                     | 'degraded', checks: {...}}` with HTTP 200 or 503." | Zero production awareness today |

---

### Sprint 2 — Amharic i18n (Week 3)

_Standalone — no upstream dependencies. Do in parallel with Sprint 1._

| #   | Task                    | Opus 4.6 Prompt Seed                                                                                                                                                                                                                        |
| --- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Bilingual DB columns    | "Write Supabase migrations to add `name_am`, `description_am` columns to `menu_items`, `categories`, `restaurants`, `modifier_groups`, `modifier_options`, `discounts`. Add GIN full-text index on `name_am` and combined bilingual index." |
| 2.2 | next-intl setup         | "Configure next-intl in Next.js 16 App Router. Locales: `[am, en]`, defaultLocale: `am`. Apply to `/pos`, `/merchant`, `/kds` routes. Create `am.json` and `en.json` with all keys from the blueprint Section 14."                          |
| 2.3 | POS waiter Amharic      | "Replace all hardcoded English strings in `/pos/waiter/page.tsx` and its child components with `useTranslations('pos')` from next-intl. Use keys from `am.json`."                                                                           |
| 2.4 | KDS Amharic             | "Replace all hardcoded English strings in `/kds/*.tsx` with next-intl `useTranslations('kds')` calls."                                                                                                                                      |
| 2.5 | Dashboard Amharic       | "Replace all hardcoded English strings in `/merchant` dashboard layout and KPI cards with `useTranslations('dashboard')`."                                                                                                                  |
| 2.6 | Guest ordering Amharic  | "Add Amharic translations to `/[slug]/page.tsx` splash screen, menu display, and order flow. Amharic is shown first; English is secondary."                                                                                                 |
| 2.7 | Noto Sans Ethiopic font | "Add `Noto_Sans_Ethiopic` from `next/font/google` to `app/layout.tsx` as CSS variable `--font-amharic`. Apply to `<html>` element."                                                                                                         |

---

### Sprint 3 — Event-Driven Architecture (Week 4–5)

| #   | Task                            | Opus 4.6 Prompt Seed                                                                                                                                                                                                                  |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Publish events from Orders      | "In the orders domain service, add `publishEvent('order.created')` after successful order insert and `publishEvent('order.completed')` when status reaches 'served'. Remove all direct synchronous service calls."                    |
| 3.2 | Publish events from Payments    | "In the payments domain, publish `payment.completed` or `payment.failed` from webhook handlers only. Remove all direct calls to other services from payment logic."                                                                   |
| 3.3 | Menu cache with invalidation    | "Implement `MenuCache` using Upstash Redis with 5-min TTL. On `menu.updated` event (Redis Streams consumer), call `MenuCache.invalidate(restaurantId)`. Add cache-aside in menu GraphQL resolver."                                    |
| 3.4 | Loyalty earn on order.completed | "Implement `awardLoyaltyPoints` QStash job handler. Consumes `order.completed` payload. Inserts `loyalty_transactions` record. Updates `loyalty_accounts.points_balance`. Publishes `loyalty.points_earned` event."                   |
| 3.5 | Inventory deduction trigger     | "Write Postgres trigger `deduct_inventory_on_order_confirm` that executes when `orders.status` changes to 'confirmed'. Deducts from `inventory_items.current_stock` via `recipe_ingredients`. Sends `pg_notify` for low-stock check." |
| 3.6 | Low stock → Telegram alert      | "Implement Supabase Edge Function listening to `pg_notify('inventory_check')`. For each low-stock item, call `sendAlert('warning', ...)` via Telegram."                                                                               |

---

### Sprint 4 — Offline Architecture (Week 6–7)

| #   | Task                                 | Opus 4.6 Prompt Seed                                                                                                                                                                            |
| --- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | PowerSync install + config           | "Integrate `@powersync/web` with Supabase in Next.js 16 App Router. Configure PowerSync connector with Supabase JWT auth from existing session."                                                |
| 4.2 | PowerSync schema                     | "Create PowerSync schema for `orders`, `menu_items`, `kds_actions`. Mirror Supabase columns exactly. All tables must include `restaurant_id`."                                                  |
| 4.3 | Conflict resolution                  | "Implement conflict resolver using rules from blueprint: `orders.status=server_wins`, `orders.notes=client_wins`, `menu_items.*=server_wins`, `kds_actions.*=merge`, `payments.*=server_wins`." |
| 4.4 | Migrate KDS localStorage → PowerSync | "Migrate KDS offline queue from `localStorage` (`QueuedKdsAction` interface in `src/lib/kds/offlineQueue.ts`) to PowerSync `kds_actions` table. Preserve all existing `idempotencyKey` values." |
| 4.5 | Service worker cache strategy        | "Replace next-pwa default caching with explicit strategy: menu API = NetworkFirst (3s timeout, 24h TTL), GraphQL = NetworkFirst (5s), static = CacheFirst, payments = NetworkOnly."             |
| 4.6 | Remove 20s sync polling              | "Find all `setInterval`/`setTimeout` calls used for sync in `src/`. Replace with PowerSync reactive query subscriptions. Remove the 20-second sync trigger from `StationBoard.tsx`."            |

---

### Sprint 5 — Modifier Tables + Discount Engine (Week 8–9)

| #   | Task                               | Opus 4.6 Prompt Seed                                                                                                                                                                                                     |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 5.1 | Modifier tables migration          | "Write Supabase migration creating `modifier_groups` and `modifier_options` tables (schema from blueprint Section 9). Write data migration script to convert existing `menu_items.modifiers JSONB` to the new tables."   |
| 5.2 | Modifier required-field validation | "Add server-side validation to order creation: before inserting `order_items`, verify all `modifier_groups` with `required=true` have at least one selected option. Return 400 with Amharic error message if not."       |
| 5.3 | Discount schema migration          | "Write Supabase migration creating `discounts` table (schema from blueprint Section 3). Add `discount_id` and `discount_amount` columns to `orders` table."                                                              |
| 5.4 | Discount UI in waiter POS          | "Add discount picker to waiter POS order summary. Show list of active `discounts` for `restaurant_id`. Apply selected discount to order total. If `requires_manager_pin=true`, show manager PIN prompt before applying." |
| 5.5 | Discount UI in guest ordering      | "Add optional discount code input to guest order checkout. Validate against `discounts` table. Apply discount and show updated total."                                                                                   |

---

### Sprint 6 — GraphQL Federation (Week 10–13)

| #   | Task                      | Opus 4.6 Prompt Seed                                                                                                                                                                      |
| --- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Apollo Server 4 setup     | "Install `@apollo/server @apollo/subgraph @as-integrations/next graphql`. Create `src/app/api/graphql/route.ts` as Apollo Server 4 Next.js App Router handler with Federation 2 support." |
| 6.2 | Orders subgraph           | "Create `src/domains/orders/schema.graphql` and `src/domains/orders/resolvers.ts`. Wrap existing API route handler logic into resolvers. Do not change `service.ts` logic."               |
| 6.3 | Menu subgraph             | Same pattern — include modifier_groups and modifier_options                                                                                                                               |
| 6.4 | Payments subgraph         | Same pattern                                                                                                                                                                              |
| 6.5 | Guests + Loyalty subgraph | Same pattern — include `loyalty_accounts`, `loyalty_transactions`                                                                                                                         |
| 6.6 | Staff subgraph            | Same pattern — include `time_entries`, `schedules`                                                                                                                                        |
| 6.7 | GraphQL Codegen           | "Set up `graphql-code-generator`. Generate TypeScript types for all operations in `/pos`, `/merchant`, `/kds`, and `/[slug]`. Add to CI pipeline."                                        |
| 6.8 | Apollo Router on Railway  | "Write `Dockerfile` pulling Apollo Router binary. Write `router.yaml` with Supabase JWT auth and Upstash rate limiting. Write `railway.json` for deployment."                             |

---

### Sprint 7 — Infrastructure Hardening (Week 14–15)

| #   | Task                           | Opus 4.6 Prompt Seed                                                                                                                                                                                                 |
| --- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Cloudflare DNS + WAF           | Cloudflare dashboard — proxy all lole.app and lolemenu.com traffic. Enable WAF managed rules.                                                                                                                        |
| 7.2 | Cloudflare Worker — menu cache | "Deploy Cloudflare Worker from blueprint Section 12 to cache `GetMenuItems` GraphQL operations for 5 minutes at edge."                                                                                               |
| 7.3 | Supabase DB lanes              | Enable connection pooler in Supabase dashboard. Set `DATABASE_URL` to pooler and `DATABASE_DIRECT_URL` to direct Postgres. Keep direct lane infra-only for PowerSync replication, migrations, CI, and admin tooling. |
| 7.4 | TimescaleDB setup              | Execute SQL from blueprint Section 11 in Supabase SQL editor. Enable `timescaledb` extension first in Dashboard → Extensions.                                                                                        |
| 7.5 | EOD report CRON                | "Implement `POST /api/jobs/eod-report` handler. Generate per-restaurant EOD report. Send Telegram message to `restaurant.owner_telegram_id`. Submit ERCA daily summary if `restaurant.vat_number` exists."           |
| 7.6 | Telegram alert system          | "Implement `sendAlert(level, message, context)` function from blueprint Section 13. Configure Better Uptime to poll `/api/health` every 60 seconds with Telegram notification."                                      |
| 7.7 | GitHub Actions CI/CD           | "Create `.github/workflows/deploy.yml`: type-check, lint, unit tests, Supabase migration push, Vercel deploy, Railway Apollo Router deploy. Fail fast on any step."                                                  |

---

### Sprint 8 — ERCA + Subscription Model (Week 16–17)

| #   | Task                       | Opus 4.6 Prompt Seed                                                                                                                                                                                        |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1 | ERCA service + job handler | "Implement `ERCAService` class from blueprint Section 15. Implement `POST /api/jobs/erca-invoice` QStash job handler. Test against ERCA sandbox."                                                           |
| 8.2 | ERCA on order.completed    | "Wire `ERCAService.submitInvoice()` to fire from `order.completed` event, via QStash job (not directly). Only fire for restaurants where `vat_number` is not null."                                         |
| 8.3 | Subscription schema        | "Write migration adding `plan`, `plan_expires_at`, `chapa_subscription_id` to `restaurants` table. Default plan = 'starter'."                                                                               |
| 8.4 | Feature gating             | "Implement `checkFeature(plan, feature)` function and `useFeatureGate(feature)` React hook. Gate `/merchant/analytics`, `/merchant/inventory`, `/merchant/channels`, `/merchant/guests` behind `pro` plan." |
| 8.5 | Upgrade flow               | "Build the upgrade journey from the 'Upgrade Plan' sidebar CTA. Show plan comparison page. Integrate Chapa subscription API for recurring monthly billing in ETB."                                          |

---

### Sprint 9 — Manager App (Phase 2, Month 4+)

| #   | Task                     | Opus 4.6 Prompt Seed                                                                                                                                                               |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9.1 | Expo project init        | "Initialize Expo SDK 52 project with TypeScript, Apollo Client (pointing to our GraphQL Federation endpoint), Zustand, NativeWind, Expo Router."                                   |
| 9.2 | Authentication           | "Build login screen for lole Now using Supabase Auth. On login, store session in Expo SecureStore. Verify `restaurant_staff.role` is 'owner' or 'manager'."                        |
| 9.3 | Home screen              | "Build home screen with live metrics via GraphQL: today's revenue (ETB), orders in flight, active tables count, clocked-in staff count. Auto-refresh every 30 seconds."            |
| 9.4 | Quick actions            | "Build quick actions: mark item out of stock (set `menu_items.available=false`), pause online ordering (set `online_ordering_settings.is_active=false`), send broadcast to staff." |
| 9.5 | Reports screen           | "Build reports screen with period selector. Query `hourly_sales` TimescaleDB view. Show revenue chart (ETB), top 10 items with `name_am`, payment method breakdown."               |
| 9.6 | Push notifications       | "Add Expo Push Notifications. Subscribe to: `inventory.low` events (send to owner), `payment.failed` events, large orders (>500 ETB)."                                             |
| 9.7 | EAS Build + distribution | "Configure Expo EAS Build for Android APK. Set up internal distribution for restaurant owners. Configure OTA updates."                                                             |

---

## 19. The 12 Laws

_These are non-negotiable. They do not bend as the platform grows._

| #      | Law                                                                          | Consequence of Breaking It                                                                                               |
| ------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **01** | `restaurant_id` on EVERY table, no exceptions                                | Cannot partition or shard at 10,000 restaurants. One missing table breaks multi-tenancy.                                 |
| **02** | All monetary values are INTEGER in Santim (100 santim = 1 ETB)               | Float arithmetic errors appear on receipts. Customer trust never recovers.                                               |
| **03** | Payment logic and API keys are server-side only                              | You already follow this. It never changes. A leaked key is a financial catastrophe.                                      |
| **04** | Every mutation that matters has an idempotency key                           | Already true for orders. Apply to KDS actions, payment retries, ERCA submissions. This is what makes offline-first safe. |
| **05** | Amharic is the default locale on every staff-facing surface                  | Staff in Addis are not comfortable reading English POS screens. Errors follow.                                           |
| **06** | Offline window is minimum 24 hours                                           | Addis has power outages that last hours. A restaurant that loses POS access overnight loses you as a vendor.             |
| **07** | GraphQL schema is a contract — no breaking changes without deprecation       | Once delivery apps integrate with your API, a broken field is a broken integration and a lost partner.                   |
| **08** | Every receipt prints in Amharic and English                                  | Legal (ERCA) and customer expectation. Both languages, always.                                                           |
| **09** | All async operations that cannot fail silently live in QStash                | setTimeout and fire-and-forget promises are invisible when they fail. QStash is not.                                     |
| **10** | Cloudflare in front of everything — no direct traffic to Vercel or Railway   | One successful DDoS or WAF bypass takes down every restaurant simultaneously.                                            |
| **11** | Row Level Security is always on, on every table                              | A single application bug should NEVER be able to show Restaurant A the data of Restaurant B.                             |
| **12** | Sentry is capturing errors before any feature goes live in a real restaurant | You will not know production bugs exist until a restaurant calls you angrily. That is not acceptable.                    |

---

## 20. Scale Thresholds & Cost Projections

| Milestone   | Restaurants  | Revenue (ETB/mo at Pro rate) | Infrastructure Change                                               | Cost (USD/mo) |
| ----------- | ------------ | ---------------------------- | ------------------------------------------------------------------- | ------------- |
| Beta        | 1–10         | 12,000 ETB                   | Supabase Pro + Vercel Pro                                           | $45–65        |
| Soft Launch | 10–50        | 60,000 ETB                   | + Cloudflare + Railway Apollo Router                                | $65–90        |
| Growth      | 50–200       | 240,000 ETB                  | + Supabase read replica + Upstash paid                              | $130–180      |
| Scale       | 200–500      | 600,000 ETB                  | + Supabase Team, extract Orders/Payments to NestJS                  | $250–400      |
| Expansion   | 500–2,000    | 2,400,000 ETB                | + Neon serverless Postgres, multiple Railway services               | $500–900      |
| Dominance   | 2,000–10,000 | 12,000,000 ETB               | Regional architecture (Addis + Hawassa + Bahir Dar), dedicated DBAs | $1,500–3,500  |

---

## Appendix A — Key Files to Know

| File                                              | Purpose                                                                 | Status                                       | From    |
| ------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------- | ------- |
| `src/lib/security/hmac.ts`                        | QR code generation + validation                                         | ✅ Complete — do not modify                  | Q4      |
| `src/lib/security/guestContext.ts`                | Guest session resolution (HMAC verify + restaurant/table lookup)        | ✅ Complete                                  | Q4      |
| `src/lib/payments/chapa.ts`                       | Chapa initiation + verification                                         | ✅ Complete — add webhook handler separately | Q13     |
| `src/lib/payments/telebirr.ts`                    | Telebirr initiation + verification                                      | ✅ Complete — add webhook handler + POS UI   | Q12/Q13 |
| `src/app/api/staff/verify-pin/route.ts`           | Per-staff 4-digit PIN auth                                              | ✅ Complete                                  | Q12     |
| `src/app/api/merchant/dashboard-presets/route.ts` | Role-based dashboard presets (owner/manager/kitchen_lead)               | ✅ Complete                                  | Q11     |
| `src/app/api/analytics/overview`                  | Revenue + orders aggregation                                            | ✅ Real queries                              | Q15     |
| `src/app/api/analytics/mood`                      | Satisfaction data                                                       | ✅ Real queries                              | Q15     |
| `src/app/api/analytics/api-metrics`               | API performance                                                         | ✅ Real queries                              | Q15     |
| `src/app/api/finance/payments`                    | Payment recording (called manually today)                               | ✅ Complete — supplement with webhook        | Q13     |
| `src/app/api/device/service-requests`             | POS service requests (water, check, etc.)                               | ✅ Complete                                  | Q12     |
| `src/app/(guest)/[slug]/page.tsx`                 | Guest QR entry — splash screen at line 672, skip handler at line 599    | ✅ Complete — add checkout re-prompt         | Q6      |
| `src/app/(guest)/[slug]/tracker/page.tsx`         | Guest order tracker — Supabase subscriptions at line 205                | ✅ Complete — add Amharic status labels      | Q16     |
| `src/hooks/useKDSRealtime.ts`                     | KDS Supabase subscriptions (orders, kds_order_items, delivery_partners) | ✅ Keep — supplement with event bus          | Q6      |
| `src/lib/kds/offlineQueue.ts`                     | KDS localStorage offline queue                                          | ⚠️ Replace with PowerSync (Sprint 4.4)       | Q6      |
| `src/components/merchant/Sidebar.tsx`             | 'Upgrade Plan' CTA at line 183                                          | ⚠️ Wire subscription model Sprint 8          | Q7      |

---

## Appendix B — Ethiopia-Specific Constraints

| Constraint                                               | Impact                             | Mitigation                                                                                                       |
| -------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Ethio Telecom outages (2–4 hours, unpredictable)         | POS must work offline              | PowerSync 24h offline window                                                                                     |
| Load shedding (power cuts, evenings especially)          | Devices lose power mid-service     | PWA offline-first + Termux autostart on boot                                                                     |
| 4G average 10–15 Mbps, degrades 7–9PM peak               | Slow menu loads                    | Cloudflare Worker menu cache at Nairobi PoP                                                                      |
| Chrome 90+ on older tablets (2019–2021 devices)          | PWA compatibility risk             | Test on Chrome 90, disable newer APIs if not supported                                                           |
| No Google Play Store in some cases                       | App distribution harder            | PWA removes this dependency entirely                                                                             |
| NBE data residency policy (under discussion)             | May require local DB               | Monitor — plan local Supabase instance if required                                                               |
| ERCA e-invoicing mandatory for VAT-registered businesses | Legal compliance                   | ERCAService in Sprint 8                                                                                          |
| Ethiopian calendar ( የኢትዮጵያ ዘመን አቆጣጠር)                   | Date display for some users        | `Intl.DateTimeFormat` with `am-ET` locale handles Gregorian. Ethiopian calendar display is optional enhancement. |
| Amharic right-to-left adjacency (numbers are LTR)        | Mixed text rendering               | Use `dir="auto"` on text containers with Amharic content                                                         |
| Telebirr dominant (40M+ users) — not Chapa               | Payment UX must lead with Telebirr | Show Telebirr first in payment method list everywhere                                                            |

---

> **This document is your source of truth.**  
> Feed it to Claude Opus 4.6 at the start of every session.  
> Build one sprint at a time. Sequence matters.  
> You are building the infrastructure layer for Ethiopia's restaurant industry.  
> Build it like it.

---

_lole Enterprise Master Blueprint v4.1 — Final_  
_March 2026 · Addis Ababa, Ethiopia_  
_All 18 IDE audit questions incorporated · 500 → 10,000+ Restaurants & Cafés_
