# ገበጣ lole — Product Requirements Document (PRD)

**Version 1.0 · March 2026 · Confidential**

---

## Overview

lole is a full-stack restaurant operating system built for Addis Ababa, Ethiopia — and ultimately all of Ethiopia. It replaces paper-based operations, imported POS hardware, and disconnected tools with a single modern platform that speaks Amharic, integrates with Ethiopian payment providers, and works offline during the frequent power and network outages that characterize daily operations in Addis.

The closest comparable product globally is Toast (US) — a $13B public company. lole is what Toast would have built if they had designed it for Ethiopia from day one: Amharic-first, Telebirr-native, offline-resilient, and priced for the Ethiopian market.

---

## Problem Statement

### What Ethiopian Restaurants Face Today

| Problem                | Current Reality                                                                                                                    | lole Solution                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| No Amharic POS         | Every POS in Addis is English-only. Waitstaff read item names they cannot pronounce. Errors happen.                                | Amharic-first UI — every surface defaults to አማርኛ                                 |
| Expensive hardware     | Imported POS terminals cost ETB 15,000–50,000+. Most restaurants use pen and paper.                                                | PWA on any Android tablet (ETB 4,000–8,000) from Addis Mercato                    |
| Power outages          | Load shedding cuts power for 2–6 hours without warning, often during peak service.                                                 | 24-hour offline window — orders, payments, KDS all work without internet or power |
| No digital payments    | Restaurants accept Telebirr but cannot integrate it with their ordering system. Orders are disconnected from payment confirmation. | Native Telebirr + Chapa integration in POS and guest ordering                     |
| Zero data insights     | Owners have no idea which items sell, what peak hours look like, or what their actual revenue is.                                  | Real-time analytics with Amharic item names, EOD Telegram reports                 |
| ERCA compliance        | VAT-registered restaurants manually prepare invoices. No POS generates e-invoices.                                                 | Automated ERCA e-invoice submission on every completed order                      |
| Delivery fragmentation | BEU, Deliver Addis, Zmall, Esoora all operate separately. Restaurants manage 4 tablets.                                            | Single Channels hub — all delivery orders come through one lole screen            |

---

## Target Users

### Primary Users (Pay for the Product)

**Restaurant Owners / Operators**

- 25–50 years old
- Running 1–5 restaurant or café locations in Addis Ababa
- Currently using paper orders, WhatsApp for order communication, or basic imported POS
- Checks business performance on their phone throughout the day
- Speaks Amharic and Ethiopian English
- Core need: "I need to know my business is running correctly when I'm not there"

**Multi-Location Chain Operators (Enterprise)**

- Managing 5–50 locations (hotel chains, fast food franchises, café chains)
- Need consolidated reporting across locations
- Need standardized menu management across all branches
- Currently using a patchwork of systems or a single expensive imported solution

### Secondary Users (Use the Product Daily)

**Waitstaff / Cashiers**

- 18–30 years old
- May have limited English literacy
- Uses the waiter POS app on a tablet for every shift
- Core need: "I need to take orders fast and get the bill right — in my language"

**Kitchen Staff**

- Uses KDS displays at their station (kitchen, bar, coffee, dessert, expeditor)
- Core need: "I need to know what to make in what order — in my language"

**Restaurant Managers**

- Operational oversight — staff schedules, inventory, daily reports
- Uses the merchant dashboard and (Phase 2) the manager mobile app
- Core need: "I need to manage everything from my phone"

### Tertiary Users (Use the Product Occasionally)

**Dine-In Guests**

- Scans table QR code to browse menu, order, and pay
- No account required — one tap to skip to menu
- Core need: "I want to order quickly without calling a waiter or installing an app"

**Delivery Riders / Partners**

- BEU, Deliver Addis, Zmall, Esoora
- Integrated via Channels — their orders flow into lole's order queue
- Core need: "My restaurant partner gets orders from me instantly"

---

## Product Surfaces

### 1. Waiter POS — `/pos/waiter`

**Who:** Waitstaff, cashiers
**Device:** Android tablet (landscape, kiosk mode)
**Connectivity:** Offline-capable (24h window)

The primary revenue-generating surface. Every order in the restaurant passes through this screen.

### 2. Kitchen Display System (KDS) — `/kds/*`

**Who:** Kitchen staff, bar staff, baristas, dessert station, expeditor
**Device:** Tablet or monitor mounted at each station
**Connectivity:** Offline-capable

Five specialized stations: Kitchen (all food items), Bar (drinks), Coffee (espresso bar), Dessert, Expeditor (final assembly and handoff).

### 3. Guest Menu & Ordering — `/[slug]`

**Who:** Dine-in customers
**Device:** Customer's own phone (mobile browser — no install required)
**Connectivity:** Requires internet for ordering; menu can be cached

QR code on each table opens a bilingual menu. Guests can order and pay directly. No app install. Account is optional but earns loyalty points.

### 4. Guest Order Tracker — `/[slug]/tracker`

**Who:** Dine-in customers
**Device:** Customer's own phone

Real-time order status from confirmed → preparing → ready → served.

### 5. Merchant Dashboard — `/merchant`

**Who:** Restaurant owners, managers, admin staff
**Device:** Desktop browser (primary), mobile browser (secondary)
**Connectivity:** Requires internet

Full restaurant management: 14 routes covering every operational domain.

### 6. lole Now — Mobile Manager App (Phase 2)

**Who:** Restaurant owners, managers
**Device:** iOS and Android smartphone
**Technology:** React Native (Expo)

The owner's companion app — live metrics, quick actions, staff management, reports. Mirrors Toast Now.

---

## Feature Requirements

### F-01: Waiter POS

#### F-01.1 — Order Management (P0 · Live)

- Browse menu by category with item photos and Amharic names
- Add items to cart with quantity controls
- Select modifier options (size, extras, preparation notes) per item
- Required modifier groups must be satisfied before order confirmation
- Add special notes to individual items (e.g., "no onion") — these are customer instructions, client wins over server on sync
- View and edit current order before sending to kitchen
- Send order to KDS with one tap
- **Acceptance criteria:** Order appears on KDS within 2 seconds of submission on standard Ethio Telecom 4G

#### F-01.2 — Table Management (P0 · Live)

- Open a table session by selecting table number
- View all open tables with status and elapsed time
- Close a table session on payment completion
- **Acceptance criteria:** Table status visible to all POS stations within 3 seconds of change

#### F-01.3 — Payment Processing (P0 · Partial)

- Accept cash payments — record amount and calculate change in ETB
- Accept Chapa digital payments — initiate, QR displayed to guest, webhook confirms automatically
- Accept Telebirr payments — initiate via USSD/app link, webhook confirms automatically
- Display payment confirmation to staff when webhook received
- Print receipt on confirmation (Termux print server)
- **Acceptance criteria:** Payment confirmed within 10 seconds of guest completing Telebirr/Chapa transaction (webhook-based, not polling)

#### F-01.4 — Split Bills (P0 · Live)

- Split bill evenly across N guests
- Split bill by custom amount per guest
- Split bill by item (each guest pays for their items)
- Apply separate payment methods per split (cash + Telebirr)
- **Acceptance criteria:** Each split generates its own receipt

#### F-01.5 — Discounts (P1 · Missing — Sprint 5)

- Owners define discounts: percentage, fixed ETB amount, BOGO, item price override
- Discounts optionally require manager PIN before application
- Discounts have optional daily use limits and validity dates
- Amharic discount name displayed on receipt
- **Acceptance criteria:** Discounted total recalculates instantly; discount line item visible on receipt

#### F-01.6 — Service Requests (P0 · Live)

- Waiter initiates service requests: water refill, check request, extra napkins, etc.
- Request appears on manager dashboard attention queue
- **Acceptance criteria:** Request visible on dashboard within 2 seconds

#### F-01.7 — PIN Authentication (P0 · Live)

- Each staff member has a unique 4-digit PIN
- PIN login at shift start identifies the staff member for audit trail
- Session persists until explicit logout or device restart

---

### F-02: Kitchen Display System (KDS)

#### F-02.1 — Multi-Station Display (P0 · Live)

- Five independent station views: Kitchen, Bar, Coffee, Dessert, Expeditor
- Each station only shows items relevant to that station (routing by category)
- New orders appear instantly via Supabase Realtime
- Orders sorted by time placed (oldest first by default)
- Visual aging indicator (color change when order is waiting >5 minutes)
- **Acceptance criteria:** New order appears on relevant KDS station within 2 seconds of POS submission

#### F-02.2 — Order Status Progression (P0 · Live)

- Staff taps item to mark as: in progress → ready
- Expeditor marks full order as ready → served
- Status updates propagate to guest tracker in real-time
- **Acceptance criteria:** Guest tracker updates within 3 seconds of KDS status change

#### F-02.3 — Offline Resilience (P1 · Sprint 4)

- KDS works for 24 hours without internet
- Orders queued locally (PowerSync) sync automatically when connection restores
- No data loss on reconnect — CRDT merge, not last-write-wins
- **Acceptance criteria:** KDS remains operational after disabling WiFi for 1 hour; all orders sync correctly on reconnect

---

### F-03: Guest QR Ordering

#### F-03.1 — QR Code Security (P0 · Live)

- Each table has a unique HMAC-SHA256 signed QR URL
- QR URLs expire after 24 hours
- Restaurant and table active status validated on every scan
- Signature uses timing-safe comparison to prevent timing attacks
- **Acceptance criteria:** Expired or forged QR codes return 403; valid codes resolve in <200ms

#### F-03.2 — Splash Screen & Authentication (P0 · Live)

- Splash screen shows restaurant branding (name in Amharic + English)
- Three options: Login (existing account), Sign Up (new account), Skip to Menu
- Skip creates anonymous session with device fingerprint
- Skip guests re-prompted at checkout to earn loyalty points
- **Acceptance criteria:** Skip to Menu → menu visible in <2 taps; login/signup completes in <30 seconds

#### F-03.3 — Menu Browsing (P0 · Live)

- Menu displays in Amharic (primary) with English toggle
- Browsing by category
- Item photos, Amharic name, English name, price in ETB
- Out-of-stock items shown greyed with "አልቋል" (Sold Out)
- Modifier selection with Amharic option names
- **Acceptance criteria:** Menu loads in <1 second from cache (Cloudflare Worker); <3 seconds from origin

#### F-03.4 — Order Placement & Tracking (P0 · Live)

- Guest builds cart, reviews order, selects payment method
- Payment via Telebirr or Chapa (in-browser) or "Pay at Counter"
- On order confirmation, guest receives tracker link
- Real-time order status in tracker (pending → confirmed → preparing → ready → served)
- **Acceptance criteria:** Order placed by guest appears on KDS within 3 seconds; tracker updates in real-time

#### F-03.5 — Loyalty Points (P1 · Sprint 3)

- Signed-in guests earn points on every order (configurable: points per ETB spent)
- Points balance visible in guest profile
- Redemption flow for future orders (points → ETB discount)
- **Acceptance criteria:** Points credited within 5 seconds of order.completed event

---

### F-04: Merchant Dashboard

#### F-04.1 — Live Dashboard (P0 · Live, needs real-time KPI refresh)

- KPI cards: Orders In Flight, Avg Ticket Time, Active Tables, Open Requests
- KPI cards update in real-time without manual Refresh
- Income Tracker chart (ETB, configurable time range)
- Recent Activity feed (last 20 events)
- Role-based presets: Owner, Manager, Kitchen Lead
- Alert Rules engine — custom alerts per restaurant
- Command Bar (Ctrl+K) for power users
- **Acceptance criteria:** KPI cards reflect current state without page refresh; <5 second lag from order event

#### F-04.2 — Order Management (P0 · Live)

- Live order queue in kanban view (by status) and table view
- Order detail panel: items, modifiers, notes, elapsed time
- Manual status override (for edge cases)
- Order history with full audit trail

#### F-04.3 — Menu Management (P0 · Live)

- Add/edit/delete categories with Amharic names
- Add/edit/delete menu items with Amharic names, photos, prices in ETB
- Modifier groups with required/optional settings and per-option pricing
- Bulk availability toggle (mark items in/out of stock)
- Menu preview in guest ordering view

#### F-04.4 — Table & QR Management (P0 · Live)

- Visual table grid showing availability/occupied status
- Generate new QR code per table (with HMAC signature)
- Regenerate QR code (invalidates old code — new HMAC signature)
- Download QR code as image for printing
- Print QR code directly from dashboard

#### F-04.5 — Staff Management (P0 · Live)

- Staff directory with roles (owner, admin, manager, kitchen, bar, waiter)
- PIN management per staff member
- Shift scheduling calendar
- Time entry tracking (clock in/out with timestamps)
- Role-based access control enforced at database level (RLS)

#### F-04.6 — Guest Directory & Loyalty (P1 · Schema complete)

- Guest profiles with visit history and lifetime value in ETB
- Loyalty account: balance, tier, transaction history
- Manual point adjustment (manager privilege)
- Loyalty program configuration: points per ETB, tier thresholds, rewards

#### F-04.7 — Analytics (P1 · Live queries, needs TimescaleDB)

- Revenue by day/week/month with period comparison
- Top 10 selling items (Amharic names, revenue, quantity)
- Revenue by payment method (Telebirr vs. Chapa vs. Cash)
- Hourly heatmap (when is the restaurant busiest?)
- Average ticket time (open table → bill paid)
- Staff performance metrics
- Custom date range with CSV/XLSX export

#### F-04.8 — Inventory (P2 · Schema complete, logic not wired)

- Inventory item catalog with units (kg, liter, piece, etc.)
- Recipe management: link menu items to ingredients with quantities
- Stock level tracking with reorder alerts
- Auto-deduction on order confirmation (via DB trigger)
- Purchase order management with supplier records
- Stock movement ledger (in, out, adjustment, waste, count)

#### F-04.9 — Delivery Channels (P2 · Schema complete, API not built)

- Connect delivery partners: BEU, Deliver Addis, Zmall, Esoora
- Toggle individual channels on/off
- Unified order queue (delivery orders appear alongside dine-in)
- Per-channel menu availability management
- Delivery order status tracking

#### F-04.10 — Finance (P0 · Schema complete, santim migration needed)

- All transactions in ETB (converted from santim for display)
- Payment method reconciliation
- Payout tracking by period and provider
- Refund processing with reason codes
- ERCA VAT report export (daily, monthly)

---

### F-05: Loyalty & Guest Retention

#### F-05.1 — Loyalty Programs (P1 · Schema complete)

- Restaurant creates a loyalty program (name, points per ETB, tiers)
- Guests enroll on first authenticated order or via signup
- Points earned automatically on every completed order
- Tier progression (base, silver, gold, platinum) with configurable thresholds
- Points never expire while account is active

#### F-05.2 — Loyalty Rewards (P2)

- Points redemption: X points = Y ETB discount on next order
- Special rewards: free item on birthday, double points day
- Tier-specific rewards: priority seating, free delivery, exclusive menu items

---

### F-06: Notifications & Communication

#### F-06.1 — Staff Broadcast (P1)

- Owner/manager broadcasts a message to all clocked-in staff
- Delivered via Command Bar notification on dashboard + POS
- "ዝግጁ ሁን — ቡድን ስብሰባ በ 3 ሰዓት" (Be ready — team meeting at 3PM)

#### F-06.2 — Guest Notifications (P1)

- "Your order is ready" push notification to guest (if PWA installed)
- Loyalty points earned notification after order completion
- Optional SMS/Telegram fallback for uninstalled PWA

#### F-06.3 — Owner Telegram Reports (P1 · Sprint 7)

- End-of-day report sent to owner's Telegram at 10PM Addis time
- Report: total revenue (ETB), order count, top 5 items, payment breakdown, avg ticket time
- Low stock alert sent to owner Telegram when items hit reorder level

---

### F-07: Printing

#### F-07.1 — Bilingual Thermal Receipt (P0 · Sprint 1)

- Every receipt prints in Amharic (primary) and English (secondary)
- Receipt includes: restaurant name (both languages), table number, items with Amharic names, modifiers, subtotal, VAT (15%), total in ETB, payment method, VAT registration number
- Termux Node.js server on POS tablet, USB OTG to thermal printer
- Fallback: `window.print()` browser print if Termux unavailable

#### F-07.2 — Kitchen Ticket Printing (P2)

- Separate kitchen printer for high-volume operations (Raspberry Pi server)
- Item name in Amharic, quantity, modifiers, special notes, table number, timestamp

---

### F-08: ERCA VAT Compliance (P1 · Sprint 8)

#### F-08.1 — E-Invoice Submission

- For VAT-registered restaurants: automatic ERCA e-invoice on every completed order
- Invoice includes: TIN number, line items with Amharic descriptions, 15% VAT calculation, grand total in santim
- Failed submissions retry automatically via QStash (5 retries over 2 hours)
- Invoice number format: `{restaurant_id_prefix}-{order_number}`

#### F-08.2 — VAT Report

- Daily ERCA VAT summary included in end-of-day Telegram report
- Monthly VAT report exportable as PDF for accountants
- **This is a key enterprise sales differentiator — no other POS in Addis does this**

---

### F-09: Subscription & Pricing (P2 · Sprint 8)

| Plan       | Price (ETB/mo) | Key Limits                        | Gated Features                                      |
| ---------- | -------------- | --------------------------------- | --------------------------------------------------- |
| Starter    | Free           | 10 tables, 2 staff, 1 KDS station | —                                                   |
| Pro        | 1,200          | Unlimited tables/staff, 5 KDS     | Analytics, Loyalty, Inventory, Scheduling           |
| Business   | 3,500          | Everything in Pro                 | Channels (delivery), API access, Advanced analytics |
| Enterprise | Custom         | Everything + multi-location       | White label, SLA, Dedicated support                 |

---

## Non-Functional Requirements

### Performance

- POS order submission → KDS display: **< 2 seconds** (P99, on 4G)
- Menu load from cache (Cloudflare Worker): **< 1 second**
- Dashboard KPI refresh: **< 5 seconds** lag from order event
- GraphQL API P99 response time: **< 500ms**
- Webhook processing (Chapa/Telebirr): **< 100ms** response (publish event only)

### Reliability

- POS offline window: **24 hours minimum**
- Zero data loss on KDS/POS reconnect (CRDT merge)
- Payment webhook idempotency: duplicate callbacks never double-process
- ERCA submission: 5 retries over 2 hours — zero invoice loss

### Security

- QR codes: HMAC-SHA256, timing-safe, 24h expiry
- Webhook verification: timing-safe HMAC comparison for all providers
- Payment keys: server-side only — never in client bundle
- Multi-tenancy: Row Level Security on every table — `restaurant_id` isolated at DB level
- Authentication: Supabase Auth with JWT; role stored in `restaurant_staff`, not in token

### Availability

- Target uptime: **99.5%** (26 hours downtime/year)
- Alert when any monitored endpoint returns non-200 for > 2 consecutive checks

### Internationalization

- All staff-facing surfaces: Amharic default, English toggle
- All monetary values: ETB with santim precision internally
- Date/time: East Africa Time (UTC+3), displayed in Ethiopian locale (`am-ET`)
- Receipts: always bilingual (Amharic + English)

---

## Out of Scope (Version 1.0)

- Table reservations / waitlist management (Toast Tables equivalent)
- Online ordering for pickup/delivery to non-table guests (this is Channels domain)
- Kitchen display voice readout
- Customer-facing digital menu boards
- Payroll processing integration
- Multi-currency support (ETB only in V1)
- Ethiopian calendar display (Gregorian calendar used throughout V1)

---

## Success Metrics

| Metric                                   | Target (6 months) | Target (12 months) |
| ---------------------------------------- | ----------------- | ------------------ |
| Active restaurants                       | 50                | 200                |
| Monthly orders processed                 | 50,000            | 500,000            |
| Payment success rate                     | >95%              | >98%               |
| POS session uptime during business hours | >99%              | >99.5%             |
| Loyalty account enrollment rate          | >30% of guests    | >45% of guests     |
| NPS (restaurant owners)                  | >40               | >55                |
| Average revenue per restaurant (ETB/mo)  | 800 ETB           | 1,200 ETB          |

---

_lole PRD v1.0 · March 2026 · Confidential_
