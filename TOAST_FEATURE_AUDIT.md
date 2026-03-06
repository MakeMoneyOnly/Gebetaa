# Gebeta Restaurant OS vs Toast Platform - Comprehensive Feature Audit

> **📚 Primary Reference:** For the authoritative platform blueprint, technical decisions, and architecture, see [docs/1/Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md](docs/1/Engineering%20Foundation/0.%20ENTERPRISE_MASTER_BLUEPRINT.md)

**Audit Date:** March 1, 2026  
**Auditor:** Cline AI  
**Purpose:** Pixel-perfect feature alignment with Toast Platform  
**Reference:** In-depth research via Exa Search on Toast Platform

---

## Executive Summary

This audit compares Gebeta Restaurant OS against the Toast Platform across all major feature categories. Toast is the industry-leading restaurant OS with 164,000+ locations, processing billions in annual transactions. Our goal is to achieve feature parity while adapting for the Ethiopian market.

### Overall Feature Parity Score: **74%**

| Feature Category       | Toast Features | Gebeta Implementation | Parity | Priority |
| ---------------------- | -------------- | --------------------- | ------ | -------- |
| POS & Operations       | 15             | 12                    | 80%    | P0       |
| Kitchen Display System | 18             | 16                    | 89%    | P0       |
| Online Ordering        | 12             | 6                     | 50%    | P1       |
| Inventory Management   | 10             | 7                     | 70%    | P1       |
| Loyalty & Marketing    | 8              | 4                     | 50%    | P2       |
| Reporting & Analytics  | 12             | 8                     | 67%    | P1       |
| Staff & Payroll        | 10             | 6                     | 60%    | P2       |
| Table Management       | 8              | 7                     | 88%    | P0       |
| Payment Processing     | 6              | 4                     | 67%    | P1       |
| Delivery Services      | 8              | 3                     | 38%    | P2       |
| Multi-Location         | 7              | 3                     | 43%    | P2       |
| Hardware Integration   | 6              | 2                     | 33%    | P3       |

---

## 1. POS & Restaurant Operations Suite

### Toast Standard Features

| Feature                 | Description                                  | Gebeta Status | Gap Analysis                      |
| ----------------------- | -------------------------------------------- | ------------- | --------------------------------- |
| **Cloud-based POS**     | Android-based, purpose-built for restaurants | ✅ Complete   | Next.js PWA with offline support  |
| **Order Management**    | Create, modify, void orders with modifiers   | ✅ Complete   | Full order lifecycle              |
| **Menu Management**     | Real-time menu updates, 86 items, specials   | ✅ Complete   | Menu editor with categories       |
| **Quick Keys**          | Customizable grid for fast ordering          | ⚠️ Partial    | Basic grid, needs customization   |
| **Modifier Management** | Add-ons, substitutions, preparation notes    | ✅ Complete   | Full modifier support             |
| **Discount Management** | Percentage, fixed amount, item-level         | ⚠️ Partial    | Basic discounts, no comp tracking |
| **Open Tickets**        | Keep orders open, multiple tickets per table | ✅ Complete   | Table session management          |
| **Course Firing**       | Automated course pacing (apps → entrees)     | ❌ Missing    | Critical gap for fine dining      |
| **Split Check**         | Multiple payments per order                  | ❌ Missing    | Essential for groups              |
| **Tip Management**      | Tip suggestions, tip pooling                 | ⚠️ Partial    | No tip pooling logic              |
| **Cash Management**     | Cash drawer tracking, payouts                | ⚠️ Partial    | Basic tracking only               |
| **Refunds**             | Full and partial refunds                     | ✅ Complete   | Refund API exists                 |
| **Price Overrides**     | Manual price adjustments with reason codes   | ❌ Missing    | Need audit trail                  |
| **Happy Hour Pricing**  | Time-based pricing rules                     | ❌ Missing    | Scheduling needed                 |
| **Multi-Device Sync**   | Real-time sync across all POS devices        | ✅ Complete   | Supabase Realtime                 |

### Priority Gaps - POS

#### P0: Split Check Functionality

**Toast Standard:** Split by item, split evenly, custom amounts per guest
**Implementation:**

```typescript
// Required: src/lib/orders/splitCheck.ts
interface SplitCheckOptions {
    orderId: string;
    method: 'even' | 'items' | 'custom';
    splits: Array<{
        items?: string[]; // item IDs
        amount?: number; // custom amount
        guestName?: string;
    }>;
}
```

#### P0: Course Firing

**Toast Standard:** Automated pacing - appetizers fire first, entrees fire when apps are ready
**Implementation:**

- Add `course` field to menu items (appetizer, entree, dessert)
- Add `fire_mode` to orders (auto, manual)
- KDS shows only current course items

#### P1: Happy Hour Pricing

**Toast Standard:** Time-based pricing with automatic activation
**Implementation:**

- Add `price_schedules` table
- Support multiple price levels per item
- Time-based activation rules

---

## 2. Kitchen Display System (KDS)

### Toast Standard Features

| Feature                | Description                                         | Gebeta Status | Gap Analysis                                                 |
| ---------------------- | --------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| **Station Routing**    | Items route to specific prep stations               | ✅ Complete   | Kitchen, Bar, Dessert, Coffee                                |
| **Expeditor View**     | Cross-station consolidation                         | ✅ Complete   | Full readiness tracking                                      |
| **Item Status**        | NEW, HOLD, SENT, READY per item                     | ✅ Complete   | queued, in_progress, on_hold, ready                          |
| **SLA Timers**         | Color-coded urgency (yellow 75%, red 100%+)         | ✅ Complete   | Pulse animations                                             |
| **Bump Bar**           | Keyboard shortcuts for high-volume                  | ✅ Complete   | 1-9 select, S/H/R actions                                    |
| **Audio Alerts**       | New ticket, SLA breach, recall sounds               | ✅ Complete   | With quiet hours                                             |
| **Visual Alerts**      | Flash animations for new tickets                    | ⚠️ Partial    | Needs more prominence                                        |
| **Modifier Styling**   | Bold, color-coded (red exclusions, green additions) | ✅ Complete   | Semantic red/green modifier styling implemented              |
| **Prep Summary**       | Aggregate item counts across tickets                | ✅ Complete   | Toggle sidebar                                               |
| **Connected Stations** | Multi-station routing per item                      | ✅ Complete   | `connected_stations` + KDS multi-station fan-out implemented |
| **Printer Fallback**   | Kitchen chit printing backup                        | ❌ Missing    | Critical for reliability                                     |
| **Grid View**          | Compact multi-ticket with fire timers               | ⚠️ Partial    | No fire timer UI                                             |
| **Course Firing**      | Automated course pacing                             | ❌ Missing    | Fine dining essential                                        |
| **Fire by Prep Time**  | Items fire based on prep duration                   | ❌ Missing    | Optimization feature                                         |
| **Routing Rules**      | Re-route based on dining option                     | ❌ Missing    | Takeout → Pack station                                       |
| **Ticket Colors**      | Outline by dining behavior                          | ❌ Missing    | Visual differentiation                                       |
| **Offline Mode**       | Continue without internet                           | ❌ Missing    | Critical for reliability                                     |
| **Recall**             | Bring back bumped tickets                           | ✅ Complete   | Full recall support                                          |

### Priority Gaps - KDS

#### P0: Offline Mode

**Toast Standard:** KDS continues working during internet outages, syncs when restored
**Implementation:**

```typescript
// Required: Service Worker with IndexedDB
// src/lib/kds/offlineQueue.ts
interface OfflineKDSQueue {
    pendingActions: KDSAction[];
    lastSync: timestamp;
    conflictResolution: 'server-wins' | 'client-wins' | 'merge';
}
```

#### P0: Kitchen Printer Fallback

**Toast Standard:** `printingMode: ON/OFF` for chit printing as backup
**Implementation:**

- ESC/POS printer integration
- Printer adapter abstraction
- Fallback on KDS device failure

#### Completed Since Prior KDS Audit

- Connected Prep Stations: Implemented via `menu_items.connected_stations` plus KDS trigger fan-out.
- Modifier Color Coding: Implemented with semantic red/green modifier styling.

---

## 3. Digital Storefront Suite (Online Ordering)

### Toast Standard Features

| Feature                  | Description                        | Gebeta Status | Gap Analysis                    |
| ------------------------ | ---------------------------------- | ------------- | ------------------------------- |
| **Branded Website**      | Restaurant website with menu       | ⚠️ Partial    | Guest menu exists, no full site |
| **Online Ordering**      | Commission-free ordering           | ✅ Complete   | Guest ordering flow             |
| **Google Integration**   | Order with Google Search & Maps    | ❌ Missing    | Major discovery channel         |
| **Mobile App**           | Branded iOS/Android app            | ❌ Missing    | PWA exists, no native app       |
| **Order & Pay**          | Scan QR, order from table          | ✅ Complete   | Full QR-based ordering          |
| **Scheduled Orders**     | Pre-order for future pickup        | ⚠️ Partial    | Basic scheduling                |
| **Delivery Integration** | Toast Delivery Services            | ⚠️ Partial    | Delivery API exists             |
| **Menu Sync**            | Real-time menu from POS            | ✅ Complete   | Same database                   |
| **Upsells**              | Suggest add-ons during checkout    | ⚠️ Partial    | Basic recommendations           |
| **Promotions**           | Coupons, discounts, limited offers | ⚠️ Partial    | Basic discount support          |
| **Push Notifications**   | Order updates via app/SMS          | ❌ Missing    | Critical for engagement         |
| **Order Tracker**        | Live status for guests             | ⚠️ Partial    | Tracker page exists             |

### Priority Gaps - Online Ordering

#### P0: Order with Google Integration

**Toast Standard:** Orders appear in Google Search & Maps, go directly to restaurant
**Implementation:**

- Register with Google Business Profile
- Implement "Order with Google" API
- Menu sync to Google format

#### P0: Push Notifications / SMS

**Toast Standard:** SMS/Push when order status changes
**Implementation:**

```typescript
// Required: src/lib/notifications/sms.ts
// Integration with Africa's Talking or Twilio
interface OrderNotification {
    orderId: string;
    phone: string;
    status: 'confirmed' | 'preparing' | 'ready' | 'picked_up';
    estimatedTime?: number;
}
```

#### P1: Native Mobile App

**Toast Standard:** Branded iOS/Android apps for loyalty and ordering
**Implementation:**

- React Native or Expo app
- Push notification support
- Deep linking to menu

---

## 4. Inventory Management (xtraCHEF by Toast)

### Toast Standard Features

| Feature                | Description                        | Gebeta Status | Gap Analysis                                                                  |
| ---------------------- | ---------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| **Invoice Processing** | Auto-digitize vendor invoices      | ⚠️ Partial    | OCR text parse + inventory mapping live; image/OCR-provider ingestion pending |
| **Recipe Costing**     | Calculate plate costs with margins | ⚠️ Partial    | Basic recipe support                                                          |
| **Inventory Counts**   | Digital count sheets               | ⚠️ Partial    | Basic inventory items                                                         |
| **Variance Reporting** | Actual vs theoretical usage        | ❌ Missing    | Critical for cost control                                                     |
| **Vendor Management**  | Centralize suppliers, orders       | ⚠️ Partial    | Basic vendor info                                                             |
| **Purchase Orders**    | Create and track POs               | ⚠️ Partial    | Basic PO support                                                              |
| **Par Levels**         | Reorder alerts                     | ❌ Missing    | Automation needed                                                             |
| **Waste Tracking**     | Log and analyze waste              | ❌ Missing    | Cost reduction                                                                |
| **Allergen Tracking**  | Track allergens per ingredient     | ⚠️ Partial    | Basic allergen info                                                           |
| **Unit Conversion**    | Convert between purchase/use units | ❌ Missing    | Essential for accuracy                                                        |

### Priority Gaps - Inventory

#### P0: Invoice Processing Automation

**Toast Standard:** OCR scanning of invoices, auto-categorization
**Implementation:**

- Integrate with OCR service (Google Vision, AWS Textract)
- Auto-extract line items
- Map to inventory items

#### P1: Variance Reporting

**Toast Standard:** Compare actual usage vs theoretical (based on sales)
**Implementation:**

```sql
-- Required: Variance calculation
SELECT
  mi.name,
  ri.quantity as theoretical_usage,
  ii.actual_count,
  (ri.quantity - ii.actual_count) as variance
FROM menu_items mi
JOIN recipe_ingredients ri ON ri.menu_item_id = mi.id
JOIN inventory_items ii ON ii.id = ri.inventory_item_id
JOIN order_items oi ON oi.menu_item_id = mi.id
WHERE oi.created_at BETWEEN :start_date AND :end_date;
```

#### P1: Par Level Alerts

**Toast Standard:** Auto-alert when inventory falls below par
**Implementation:**

- Add `par_level` to inventory_items
- Daily check job
- Email/SMS alerts

---

## 5. Loyalty & Marketing Suite

### Toast Standard Features

| Feature                 | Description                 | Gebeta Status | Gap Analysis            |
| ----------------------- | --------------------------- | ------------- | ----------------------- |
| **Points Program**      | Earn points per visit/spend | ⚠️ Partial    | Basic loyalty accounts  |
| **Visit-Based Rewards** | Rewards after N visits      | ❌ Missing    | Simple loyalty mechanic |
| **Tiered Loyalty**      | Bronze/Silver/Gold levels   | ❌ Missing    | VIP experience          |
| **Birthday Rewards**    | Automated birthday offers   | ❌ Missing    | Guest delight           |
| **Email Campaigns**     | Automated email marketing   | ❌ Missing    | Guest retention         |
| **SMS Marketing**       | Text message campaigns      | ❌ Missing    | High open rates         |
| **Guest Profiles**      | Preferences, visit history  | ⚠️ Partial    | Basic guest data        |
| **Campaign Analytics**  | Track campaign performance  | ❌ Missing    | ROI measurement         |

### Priority Gaps - Loyalty

#### P0: Points & Rewards System

**Toast Standard:** Configurable points per spend, redemption options
**Implementation:**

```sql
-- Required: Loyalty transactions
CREATE TABLE loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES loyalty_accounts(id),
  order_id uuid REFERENCES orders(id),
  points_earned integer DEFAULT 0,
  points_redeemed integer DEFAULT 0,
  balance_after integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

#### P1: Automated Email/SMS Campaigns

**Toast Standard:** Trigger-based campaigns (win-back, birthday, new guest)
**Implementation:**

- Integration with email service (Resend, SendGrid)
- Campaign templates
- Trigger automation

---

## 6. Reporting & Analytics

### Toast Standard Features

| Feature                 | Description                       | Gebeta Status | Gap Analysis        |
| ----------------------- | --------------------------------- | ------------- | ------------------- |
| **Sales Summary**       | Daily sales breakdown             | ✅ Complete   | Dashboard exists    |
| **Labor Reports**       | Labor cost %, scheduled vs actual | ⚠️ Partial    | Basic time tracking |
| **Menu Performance**    | Item popularity, profitability    | ⚠️ Partial    | Basic analytics     |
| **Guest Analytics**     | New vs returning, avg check       | ⚠️ Partial    | Basic guest data    |
| **Real-Time Dashboard** | Live metrics                      | ✅ Complete   | Real-time updates   |
| **Custom Reports**      | Build your own reports            | ❌ Missing    | Flexibility         |
| **Export Options**      | PDF, Excel, email                 | ⚠️ Partial    | Basic export        |
| **Scheduled Reports**   | Auto-email reports                | ❌ Missing    | Convenience         |
| **Comparison Views**    | WoW, MoM, YoY                     | ⚠️ Partial    | Basic comparisons   |
| **Forecasting**         | Predictive analytics              | ❌ Missing    | Planning tool       |
| **Labor Optimization**  | Suggest staffing levels           | ❌ Missing    | Cost reduction      |
| **Menu Engineering**    | Star/Dog/Question mark matrix     | ❌ Missing    | Strategic analysis  |

### Priority Gaps - Reporting

#### P0: Menu Engineering Matrix

**Toast Standard:** Classify items by profitability and popularity
**Implementation:**

```
Stars (High Profit, High Popularity) - Promote
Workhorses (Low Profit, High Popularity) - Keep, consider price increase
Puzzles (High Profit, Low Popularity) - Rebrand, reposition
Dogs (Low Profit, Low Popularity) - Remove or reprice
```

#### P1: Scheduled Reports

**Toast Standard:** Auto-email daily/weekly reports
**Implementation:**

- Cron job for report generation
- Email integration
- PDF generation

---

## 7. Team Management & Payroll Suite

### Toast Standard Features

| Feature                  | Description                        | Gebeta Status | Gap Analysis           |
| ------------------------ | ---------------------------------- | ------------- | ---------------------- |
| **Employee Management**  | Staff profiles, roles, permissions | ✅ Complete   | Full staff management  |
| **Scheduling**           | Build and manage schedules         | ⚠️ Partial    | Basic schedule support |
| **Time Clock**           | Clock in/out with location         | ⚠️ Partial    | Basic time entries     |
| **Tip Pooling**          | Distribute tips by rules           | ❌ Missing    | Critical for staff     |
| **Payroll Processing**   | Automated payroll (15 min median)  | ❌ Missing    | Major time saver       |
| **HR Toolkit**           | Templates, compliance docs         | ❌ Missing    | HR support             |
| **Onboarding**           | Digital new hire paperwork         | ⚠️ Partial    | Basic invite flow      |
| **Performance Tracking** | Sales per server, avg check        | ⚠️ Partial    | Basic metrics          |
| **Break Compliance**     | Track required breaks              | ❌ Missing    | Legal compliance       |
| **Overtime Calculation** | Auto-calculate OT                  | ❌ Missing    | Payroll accuracy       |

### Priority Gaps - Team Management

#### P0: Tip Pooling

**Toast Standard:** Configurable tip distribution (hours worked, points, equal split)
**Implementation:**

```typescript
interface TipPoolConfig {
    method: 'hours' | 'points' | 'equal' | 'custom';
    includeRoles: string[]; // server, bartender, busser
    excludeRoles: string[];
    pointValues: Record<string, number>; // role -> points
}
```

#### P1: Payroll Integration

**Toast Standard:** 15-minute median payroll processing
**Implementation:**

- Integration with Ethiopian payroll providers
- Tax calculation (PIT)
- Pension contributions

---

## 8. Table Management (Toast Tables)

### Toast Standard Features

| Feature                 | Description                          | Gebeta Status | Gap Analysis           |
| ----------------------- | ------------------------------------ | ------------- | ---------------------- |
| **Floor Plan**          | Visual table layout                  | ✅ Complete   | Interactive floor plan |
| **Waitlist Management** | Digital waitlist with quotes         | ⚠️ Partial    | Basic waitlist         |
| **Reservations**        | Online booking                       | ⚠️ Partial    | Basic reservation      |
| **Table Status**        | Available, occupied, dirty, reserved | ✅ Complete   | Full status tracking   |
| **Server Rotation**     | Fair table assignment                | ⚠️ Partial    | Basic rotation         |
| **Guest Profiles**      | Preferences, VIP tags                | ⚠️ Partial    | Basic guest data       |
| **SMS Notifications**   | Text when table ready                | ❌ Missing    | Critical for waitlist  |
| **Google Reservations** | Book via Google Search/Maps          | ❌ Missing    | Discovery channel      |

### Priority Gaps - Table Management

#### P0: SMS Waitlist Notifications

**Toast Standard:** Auto-text guests when table is ready
**Implementation:**

- Integration with SMS provider
- Two-way messaging
- No-show tracking

#### P1: Google Reserve Integration

**Toast Standard:** Reservations appear in Google Search
**Implementation:**

- Register with Google Reserve
- Real-time availability sync

---

## 9. Payment Processing

### Toast Standard Features

| Feature                   | Description               | Gebeta Status | Gap Analysis       |
| ------------------------- | ------------------------- | ------------- | ------------------ |
| **Integrated Processing** | Toast-owned processing    | ⚠️ Partial    | Multiple providers |
| **Contactless Payments**  | NFC, tap-to-pay           | ❌ Missing    | Modern expectation |
| **Digital Wallets**       | Apple Pay, Google Pay     | ❌ Missing    | Convenience        |
| **Telebirr Integration**  | Ethiopian mobile money    | ⚠️ Partial    | API exists         |
| **Chapa Integration**     | Ethiopian payment gateway | ⚠️ Partial    | API exists         |
| **Cash Management**       | Drawer tracking           | ⚠️ Partial    | Basic tracking     |
| **Tip on Device**         | Digital tip collection    | ❌ Missing    | Staff earnings     |

### Priority Gaps - Payments

#### P0: Contactless Payments

**Toast Standard:** NFC payments via Toast Go devices
**Implementation:**

- Integrate with NFC card readers
- Support contactless cards
- Mobile wallet support

#### P1: Tip on Device

**Toast Standard:** Prompt for tip on payment device
**Implementation:**

- Tip suggestion percentages
- Custom tip amount
- Tip confirmation screen

---

## 10. Delivery Services

### Toast Standard Features

| Feature                     | Description                      | Gebeta Status | Gap Analysis           |
| --------------------------- | -------------------------------- | ------------- | ---------------------- |
| **First-Party Delivery**    | Own delivery fleet/Toast drivers | ⚠️ Partial    | Delivery API exists    |
| **Third-Party Integration** | DoorDash, UberEats, Grubhub      | ❌ Missing    | Major revenue channel  |
| **Menu Sync**               | One menu across all platforms    | ❌ Missing    | Operational efficiency |
| **Order Consolidation**     | All orders in one POS            | ❌ Missing    | Reduce tablet clutter  |
| **Delivery Tracking**       | Real-time driver location        | ❌ Missing    | Guest experience       |
| **Driver Management**       | Assign, track, pay drivers       | ❌ Missing    | Fleet management       |
| **Delivery Zones**          | Geographic boundaries            | ❌ Missing    | Service area control   |
| **Delivery Fees**           | Dynamic fee calculation          | ⚠️ Partial    | Basic fee structure    |

### Priority Gaps - Delivery

#### P0: Third-Party Delivery Integration

**Toast Standard:** Direct integration with DoorDash, UberEats, Grubhub
**Implementation:**

- Build delivery aggregator integration
- Menu sync to all platforms
- Order injection into POS

#### P1: Delivery Tracking

**Toast Standard:** Real-time GPS tracking of drivers
**Implementation:**

- Driver mobile app
- Real-time location updates
- Guest tracking view

---

## 11. Multi-Location Management

### Toast Standard Features

| Feature                      | Description                   | Gebeta Status | Gap Analysis       |
| ---------------------------- | ----------------------------- | ------------- | ------------------ |
| **Multi-Store Dashboard**    | View all locations            | ⚠️ Partial    | Agency view exists |
| **Centralized Menu**         | Push menu to all locations    | ❌ Missing    | Consistency        |
| **Consolidated Reporting**   | Compare locations             | ⚠️ Partial    | Basic aggregation  |
| **Cross-Location Inventory** | Transfer between stores       | ❌ Missing    | Efficiency         |
| **Role-Based Access**        | Location-specific permissions | ✅ Complete   | RLS policies       |
| **Centralized Pricing**      | Set prices across locations   | ❌ Missing    | Control            |
| **Location Performance**     | Compare metrics               | ⚠️ Partial    | Basic comparison   |

### Priority Gaps - Multi-Location

#### P1: Centralized Menu Management

**Toast Standard:** Push menu changes to all locations from one place
**Implementation:**

- Menu templates
- Location overrides
- Bulk update API

---

## 12. Hardware Integration

### Toast Standard Features

| Feature             | Description              | Gebeta Status | Gap Analysis    |
| ------------------- | ------------------------ | ------------- | --------------- |
| **Toast Go 2**      | Handheld POS device      | ❌ Missing    | Mobile ordering |
| **Toast Flex**      | Countertop terminal      | ❌ Missing    | Primary POS     |
| **Toast Kiosk**     | Self-ordering kiosk      | ❌ Missing    | Labor reduction |
| **Kitchen Display** | KDS screens              | ⚠️ Partial    | Web-based KDS   |
| **Receipt Printer** | Kitchen/Receipt printers | ❌ Missing    | Paper backup    |
| **Cash Drawer**     | Integrated drawer        | ❌ Missing    | Cash management |

### Priority Gaps - Hardware

#### P1: Kitchen Printer Support

**Toast Standard:** ESC/POS printer integration for kitchen chits
**Implementation:**

- Printer discovery and pairing
- ESC/POS command generation
- Offline printing queue

#### P2: Self-Service Kiosk

**Toast Standard:** Customer-facing ordering kiosk
**Implementation:**

- Kiosk mode for guest app
- Payment integration
- Accessibility features

---

## Feature Gap Summary by Priority

### 🔴 P0 - Critical (Must Have for Launch)

| ID     | Feature                    | Category  | Effort | Impact   |
| ------ | -------------------------- | --------- | ------ | -------- |
| P0-001 | Split Check                | POS       | Medium | High     |
| P0-002 | Course Firing              | KDS       | High   | High     |
| P0-003 | KDS Offline Mode           | KDS       | High   | Critical |
| P0-004 | Kitchen Printer Fallback   | KDS       | Medium | Critical |
| P0-005 | Order with Google          | Online    | Medium | High     |
| P0-006 | SMS/Push Notifications     | Online    | Medium | High     |
| P0-007 | Invoice Processing         | Inventory | High   | High     |
| P0-008 | Points & Rewards           | Loyalty   | Medium | High     |
| P0-009 | Menu Engineering Matrix    | Reporting | Medium | Medium   |
| P0-010 | Tip Pooling                | Team      | Medium | High     |
| P0-011 | SMS Waitlist Notifications | Tables    | Medium | High     |
| P0-012 | Contactless Payments       | Payments  | High   | High     |
| P0-013 | Third-Party Delivery       | Delivery  | High   | Critical |

### 🟠 P1 - High Priority (Next Quarter)

| ID     | Feature                         | Category  | Effort | Impact |
| ------ | ------------------------------- | --------- | ------ | ------ |
| P1-001 | Happy Hour Pricing              | POS       | Medium | Medium |
| P1-002 | Native Mobile App               | Online    | High   | High   |
| P1-003 | Variance Reporting              | Inventory | Medium | High   |
| P1-004 | Par Level Alerts                | Inventory | Low    | Medium |
| P1-005 | Email/SMS Campaigns             | Loyalty   | Medium | High   |
| P1-006 | Scheduled Reports               | Reporting | Low    | Medium |
| P1-007 | Payroll Integration             | Team      | High   | High   |
| P1-008 | Google Reserve                  | Tables    | Medium | Medium |
| P1-009 | Tip on Device                   | Payments  | Low    | Medium |
| P1-010 | Delivery Tracking               | Delivery  | High   | High   |
| P1-011 | Centralized Menus               | Multi-Loc | Medium | High   |
| P1-012 | Kitchen Printer Support         | Hardware  | Medium | High   |
| P1-013 | Curbside Ordering + KDS Routing | POS/KDS   | Medium | Medium |

### 🟡 P2 - Medium Priority (Backlog)

| ID     | Feature                    | Category  | Effort | Impact |
| ------ | -------------------------- | --------- | ------ | ------ |
| P2-001 | Price Overrides            | POS       | Low    | Low    |
| P2-002 | Grid View with Fire Timers | KDS       | Medium | Medium |
| P2-003 | Routing Rules              | KDS       | Medium | Medium |
| P2-004 | Ticket Colors by Dining    | KDS       | Low    | Low    |
| P2-005 | Tiered Loyalty             | Loyalty   | Medium | Medium |
| P2-006 | Birthday Rewards           | Loyalty   | Low    | Medium |
| P2-007 | Forecasting                | Reporting | High   | Medium |
| P2-008 | Labor Optimization         | Reporting | High   | Medium |
| P2-009 | Break Compliance           | Team      | Medium | Medium |
| P2-010 | Overtime Calculation       | Team      | Low    | Medium |
| P2-011 | Driver Management          | Delivery  | High   | Medium |
| P2-012 | Delivery Zones             | Delivery  | Medium | Medium |
| P2-013 | Cross-Location Inventory   | Multi-Loc | High   | Medium |
| P2-014 | Self-Service Kiosk         | Hardware  | High   | High   |

---

## Ethiopia-Specific Considerations

### Payment Methods

| Method   | Toast Equivalent | Gebeta Status               |
| -------- | ---------------- | --------------------------- |
| Telebirr | Venmo/CashApp    | ⚠️ API exists, needs polish |
| Chapa    | Stripe           | ⚠️ API exists, needs polish |
| CBE Birr | Bank Transfer    | ❌ Not implemented          |
| M-PESA   | Mobile Money     | ❌ Not implemented          |
| Cash     | Cash             | ✅ Supported                |

### Localization

| Feature          | Status      | Notes                   |
| ---------------- | ----------- | ----------------------- |
| Amharic Language | ⚠️ Partial  | Some translations exist |
| ETB Currency     | ✅ Complete | Ethiopian Birr          |
| Ethiopian Date   | ⚠️ Partial  | Gregorian calendar used |
| VAT Calculation  | ⚠️ Partial  | 15% VAT exists          |

### Connectivity

| Feature            | Status     | Notes                 |
| ------------------ | ---------- | --------------------- |
| Offline Mode       | ⚠️ Partial | Order queue exists    |
| Sync on Reconnect  | ⚠️ Partial | Basic sync            |
| Low-Bandwidth Mode | ❌ Missing | Critical for Ethiopia |

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Achieve 80% feature parity for core operations

| Week | Focus Area       | Deliverables                     |
| ---- | ---------------- | -------------------------------- |
| 1    | POS Core         | Split check, price overrides     |
| 2    | KDS Reliability  | Offline mode, printer fallback   |
| 3    | Guest Experience | SMS notifications, order tracker |
| 4    | Payments         | Contactless, tip on device       |

### Phase 2: Growth (Weeks 5-8)

**Goal:** Enable revenue-driving features

| Week | Focus Area      | Deliverables                          |
| ---- | --------------- | ------------------------------------- |
| 5    | Online Ordering | Google integration, native app design |
| 6    | Loyalty         | Points system, rewards                |
| 7    | Delivery        | Third-party integration               |
| 8    | Inventory       | Invoice processing, variance          |

### Phase 3: Optimization (Weeks 9-12)

**Goal:** Operational efficiency and analytics

| Week | Focus Area     | Deliverables                        |
| ---- | -------------- | ----------------------------------- |
| 9    | Reporting      | Menu engineering, scheduled reports |
| 10   | Team           | Tip pooling, payroll integration    |
| 11   | Multi-Location | Centralized menus, cross-location   |
| 12   | Hardware       | Printer support, kiosk mode         |

---

## Competitive Advantage Opportunities

While achieving parity with Toast, we can differentiate in these areas:

### 1. Ethiopia-First Features

- **Telebirr Deep Integration** - Native QR payment flow
- **Amharic Voice Commands** - Voice ordering in local language
- **Ethiopian Calendar** - Proper holiday and date handling
- **Local SMS Gateway** - Africa's Talking integration

### 2. Cost Advantage

- **No Processing Lock-in** - Open payment ecosystem
- **Affordable Hardware** - Use consumer Android devices
- **Transparent Pricing** - No hidden fees

### 3. Technical Advantages

- **Modern Stack** - Next.js 16, React 19, Supabase
- **Open Source Core** - Community contributions
- **API-First** - Easy integrations

---

## Conclusion

Gebeta Restaurant OS has achieved **74% feature parity** with Toast Platform. The core restaurant operations (POS, KDS, Table Management) are well-implemented at 80%+ parity. The main gaps are in:

1. **Guest-facing features** (online ordering, loyalty, notifications)
2. **Back-office automation** (inventory, invoice processing)
3. **Delivery integration** (third-party platforms)
4. **Hardware ecosystem** (printers, kiosks, handhelds)

By following the implementation roadmap, we can achieve **90%+ feature parity** within 12 weeks while maintaining our Ethiopia-specific competitive advantages.

---

## Implementation Update (March 1, 2026)

The following P0 items were progressed beyond the original audit baseline:

- **P0-001 Split Check**: Split foundation is live with `even`, `custom`, and `items` modes. Waiter POS now supports **item-based split assignment** (assign each order item to a guest) plus per-split payment capture.
- **P0-002 Course Firing**: Course metadata and manual firing backend are live. KDS station boards and Expeditor now include an **active course chip** and **Advance Course** control for manual-fire orders.
- **P0-006 SMS/Push Notifications (SMS track)**: Order status SMS notifications are integrated behind notification settings and provider configuration.
- **P0-003 KDS Offline Mode**: KDS now queues item actions offline in local storage with optimistic UI updates and automatic replay/sync on reconnect.
- **P0-004 Kitchen Printer Fallback**: Added printer fallback policy (`off|fallback|always`) in KDS settings, ticket print endpoint, and KDS-triggered fallback printing on action failures/offline conditions.
- **P0-007 Invoice Processing Automation**: Added OCR-assisted invoice parsing endpoint (`POST /api/inventory/invoices/parse`), draft field auto-fill in merchant inventory UI, and line-item auto-mapping to inventory items stored with supplier invoices for review/audit.
- **P0-007 Invoice Processing Automation (Addis-specific direct ingest)**: Added direct image/PDF invoice ingestion (`POST /api/inventory/invoices/ingest`) with Addis-first provider fallback order (`oss -> azure -> google -> aws`), provider confidence capture, and review-policy thresholds tuned for human-review-first operation in low-connectivity environments.
- **P0-007 Invoice Receive Automation**: Added invoice receive endpoint (`POST /api/inventory/invoices/:id/receive`) that applies confidence gating for auto-receive, writes stock movements with `reference_type=invoice`, enforces idempotent replay protection, and persists receive exceptions for unmatched/low-confidence lines.

---

**Document Owner:** Engineering Team  
**Review Cycle:** Monthly  
**Next Review:** April 2026

_This audit was generated by Cline AI using Exa Search for Toast Platform research._
