# Enterprise Grade Design System & Feature Specification

**Document Version:** 1.0 (April 2026)
**Target:** Lole Restaurant Operating System — Web Dashboard
**Modules Audited:** Home (Command Center), Reports, Employees
**Benchmark Reference:** Toast Web, `lole_Dashboard_Audit.md`

---

## Executive Summary

The current architecture of the Lole Merchant Dashboard demonstrates a strong foundation localized for the Ethiopian market. Visually, the application utilizes a modern, high-contrast design system (Jet Black and Lime Green `#DDF853`) that differentiates it from legacy POS systems.

However, to achieve true enterprise-tier parity with industry leaders like Toast, the platform must transition from "operational overviews" to **high-density, actionable, data-rich interfaces**. This audit outlines the gaps and the architectural standards required to reach enterprise-grade scalability.

---

## 1. Home (Command Center) Audit

**Current File:** `MerchantDashboardClient.tsx`

### Feature Parity Gap Analysis

- **Missing Financial Context:** Toast's dashboard provides immediate visibility into **Labor Cost %** to help managers cut staff during slow hours. Lole currently tracks operations well (Wait times, Active tables) but lacks live cost analysis.
- **Drill-down Capabilities:** Operational metrics (e.g., "4 Orders in Flight") need to be clickable to reveal a fly-out sidebar or modal with the exact orders, bypassing full page navigation.
- **Onboarding & Companion App:** Missing a "Quick Start Checklist" for new merchants and a persistent call-to-action to download the "Lole Now" mobile companion app.
- **Historical Baselines:** Missing comparative metrics (e.g., "12,450 ETB — up 8% vs _same day last week_") on the front screen.

### UX/UI & Information Architecture

- **Data Density vs. Aesthetics:** The current layout relies on large whitespace, which is aesthetically pleasing but mathematically inefficient for power operators. Metric cards should be compact.
- **Attention Hierarchy:** The "Incoming alerts/Queue" needs stronger visual distinction (e.g., color-coded urgency states) compared to general statistics.
- **Dashboard Flexibility:** Needs customizable widget placement. A multi-location franchise will care more about aggregated sales, while a single-store GM will care more about active ticket times.

### Pros and Cons Assessment

- **Pros:** Modern `Supabase Realtime` integration prevents stale data. The `CommandBarShell` implementation accelerates navigation for power users.
- **Cons:** Over-reliance on generic charts. The dashboard does not yet serve as a comprehensive "Executive Summary".

### Dashboard Standards Evaluation

The dashboard successfully acts as a daily "Command Center" but fails the executive decision-making test. To reach enterprise standards, the Home view must aggregate:

1. **Live P&L Tracking:** (Gross Sales minus Live Labor Costs).
2. **Top Mover Commodities:** (What is selling _right now_).

---

## 2. Reports Module Audit

**Current File:** `ReportsPageClient.tsx`

### Feature Parity Gap Analysis

- **Custom Report Builder:** Toast allows enterprise operators to build custom pivot-table-like reports. Lole uses hardcoded tabs (Sales, Labor, Cash).
- **Automated Scheduling:** Missing the ability to email the "Z-Report" or "Weekly Sales Summary" to shareholders automatically every Friday at 5 PM.
- **Deep Filtering:** Lole lacks multi-dimensional filtering (e.g., "Show me Sales for Category: Beverages, AND Revenue Center: Patio, AND Order Type: Delivery").
- **Compliance Exporting:** While tabs for Tax exist, the system requires one-click formatting matching exactly what the Ethiopian Ministry of Revenue (MoR/Sigtas) expects for VAT and MAT filings.

### UX/UI & Information Architecture

- **Data Grids:** Enterprise software requires high-performance data grids that support sorting, pinning columns, and infinite scroll. Standard HTML tables will break under heavy transactional load.
- **Date Pickers:** Needs a robust, rapid comparative date picker (Q1 2026 vs Q1 2025). The current UI must support the Ethiopian Calendar interchangeably with the Gregorian calendar.

### Pros and Cons Assessment

- **Pros:** Exceptional categorization strategy. Splitting Tax/Service Charges away from general Cash Management is a mature accounting decision perfectly tailored for Ethiopian requirements.
- **Cons:** Creating fully functional charts and drill-downs for all 8 report tabs presents a massive front-end tech debt if not built using a unified declarative charting library and standardized table components.

---

## 3. Employees Module Audit

**Current File:** `EmployeesPageClient.tsx`

### Feature Parity Gap Analysis

- **Advanced Permissioning (ACL):** Toast offers highly granular, matrix-based permissions (e.g., "Can void tickets under 100 ETB"). Lole needs a robust Role-Based Access Control (RBAC) UI matrix mapping.
- **Compliance Workflows:** Missing document management for National ID/Kebele IDs (Fayda) onboarding.
- **Shift Swapping & Leave:** The "Time & Attendance" tab must support manager approvals for shift swaps and PTO (Paid Time Off).
- **Tip Pooling:** Lole's tips section requires complex rule-engine UIs (e.g., "Servers keep 70%, BOH gets 20%, Host gets 10%").

### UX/UI & Information Architecture

- **Bulk Actions:** When labor laws change, merchants need to update wages for 50+ staff instantly. The UI requires a "Bulk Edit" mode with spreadsheet-like data entry.
- **Modal vs Page:** Deep profile edits for employees should either be full-page takeovers or deep sliding sheets (drawers), not tiny modals, given the sheer volume of compliance data required (Pension/POESSA, Bank details).

### Pros and Cons Assessment

- **Pros:** Clean architecture mapping Ethiopian HR laws out of the box (e.g., Pension configuration toggles are front-and-center).
- **Cons:** High risk of form fatigue. The onboarding flow for a new employee is too dense. It needs to be broken out into a multi-step stepper UI.

---

## 4. Settings & Setup Module Audit

**Current Files:** `SetupPageClient.tsx`, and associated tabs (`BusinessInfoTab.tsx`, `FinancialsTab.tsx`, `IntegrationsTab.tsx`, etc.)

### Feature Parity Gap Analysis

- **Accounting Mapping:** While the `FinancialsTab` successfully tracks Ethiopian tax concepts like MAT (Minimum Alternative Tax) and POESSA (Pension), it lacks Chart of Accounts mapping to push this data automatically to general ledgers (e.g., Xero, QuickBooks), a baseline requirement in Toast.
- **Document Vault:** The `BusinessInfoTab` handles TIN and Fayda National IDs but lacks a dedicated, secure document vault for storing large compliance files (EFDA safety certificates, MoR trade licenses) with automated expiration warnings.
- **Cross-Location Syncing:** The `LocationsTab` manages multiple branches effectively. However, enterprise settings require "Master Data Management" hierarchies—allowing a corporate admin to push a single core menu edit across 10 branches simultaneously without maintaining them separately.

### UX/UI & Information Architecture

- **Horizontal Tab Fatigue:** The setup currently utilizes a horizontal scrollable tab bar for 9 different modules. For an enterprise dashboard with deeply nested settings, it is best practice to shift to a **persistent two-column vertical layout** (Left: Settings Categories, Right: Forms/Options) to prevent tab overflow.
- **Granular Save Actions:** The UI relies on a global "Save changes" button. Enterprise systems should save boolean toggles instantly (Optimistic Updates) and provide distinct save actions for distinct data blocks to prevent accidental data loss.

### Pros and Cons Assessment

- **Pros (The Localization Moat):** The architecture is exceptionally configured for the Ethiopian market. Granular configurations for Sub-city/Woreda, ERCA fiscal receipt sequential generation, Telebirr-linked MFA, and EthSwitch/Sigtas API stubs provide a massive localized advantage over generic foreign point-of-sale systems.
- **Cons:** The "Developer Tools" in the `IntegrationsTab` expose raw webhooks and API keys directly to the merchant without a secondary password prompt or strict audit logging.

---

## 5. Enterprise Design System Benchmarks

### 5.1 Interface Architecture

1. **Drawer Over Nav:** Use right-side sliding panels (`Drawers`) for creating/editing records to keep the user in context, rather than navigating away to new routes.
2. **Compact View Toggle:** Provide a global toggle in tables that reduces padding and font-size strictly for "Power Users".
3. **Skeleton Loading:** All metric widgets and tables must utilize skeleton loaders matching their precise shape to prevent layout shift (CLS).
4. **Keyboard First:** Forms must support full keyboard navigation (Tab indexing, Enter to submit, Esc to close).

### 5.2 Data & Performance Rules

1. **Pagination by Default:** Any table that can exceed 50 rows must use query-level pagination (or virtualization on the client).
2. **Optimistic Updates:** Toggling features (e.g. Online Ordering) or updating employee status must reflect instantly in the UI while the Supabase fetch happens in the background.

### 5.3 Typography & Colors (The Lole Identity)

- **Primary Action Theme:** `#DDF853` (Lole Lime). Must only be used for primary calls to action, active states, and AI engagement (e.g. Chatbot).
- **Contrast Layering:** Backgrounds must use off-whites (`#F8F9FA`) and cards use pure white (`#FFFFFF`) to establish depth.
- **Font Weights:** Limit use of `font-bold` for numeric metrics and headers. Information-dense text should rely on `font-medium` or `font-normal` to improve readability and reduce visual shouting.

---

## 6. Unimplemented Modules Specification Roadmap

The following analysis details the technical blueprint for the unimplemented dashboard modules, aligning with the benchmarks set in `lole_Dashboard_Audit.md`.

### 6.1 Menus Module

1. **Core Functional Objectives:** Centralized master data management for all food and beverage offerings, supporting multi-location elasticity and third-party delivery syndication.
2. **Feature Breakdown:**
    - **Category & Item Management:** Drag-and-drop hierarchy (Category → Subcategory → Item).
    - **Modifier Groups:** Complex nesting (e.g., "Choose 1 Protein", "Add extra toppings").
    - **Multi-Level Pricing:** Dine-in vs. Delivery markups, happy hour auto-scheduling.
    - **Amharic Localization:** Dual-language inputs for items and modifiers for Ethiopian receipts/KDS.
3. **Data Requirements:** JSONb structures for modifier trees, Array of string UUIDs for category tagging, Image CDN URLs for item photos.
4. **User Personas & Permissions:** Global Admin (Create/Delete), Branch Manager (Toggle 86/Availability only).
5. **Integration Touchpoints:** Glovo/Cheetah Delivery API (Menu pushes), KDS Routing (Station assignments).
6. **Edge Cases & Complexity Analysis:** Handling recursive modifier trees and resolving pricing conflicts when an item sits in two different scheduled menus simultaneously.

### 6.2 Takeout & Delivery Module

1. **Core Functional Objectives:** Manage the inbound pipeline of off-premise orders, configure delivery zones, and interface with third-party logistics.
2. **Feature Breakdown:**
    - **Availability Settings:** Independent controls for Takeout, Curbside, and Delivery.
    - **Order Dispatch Board:** Kanban-view of incoming, packing, and ready orders.
    - **Delivery Radius:** Geofencing (in kilometers) to restrict order regions in Addis Ababa.
    - **Partner Integrations:** Direct Glovo and Cheetah delivery config portals.
3. **Data Requirements:** GeoJSON for delivery polygons, minimum order thresholds (ETB), prep-time variables.
4. **User Personas & Permissions:** General Manager (Config delivery zones/fees), Expediter/Host (Manage order statuse).
5. **Integration Touchpoints:** Google Maps API (Distance matrix), Africa's Talking (SMS "Order Ready" alerts).
6. **Edge Cases & Complexity Analysis:** Throttling algorithms—automatically extending quote times or denying orders during high-volume spikes.

### 6.3 Front of House (FOH)

1. **Core Functional Objectives:** Map the physical restaurant layout to digital checks and manage table lifecycles.
2. **Feature Breakdown:**
    - **Floor Plan Builder:** Drag-and-drop visual editor for tables, bar stools, and outdoor terraces.
    - **Revenue Centers:** Segmenting financial data by zone (e.g., VIP Lounge vs Patio).
    - **QR Code Engine:** Mass generation and PDF export for table-specific ordering QR codes.
3. **Data Requirements:** X/Y coordinates for table nodes, seating capacities, assigned server arrays.
4. **User Personas & Permissions:** Floor Manager (Build floor plan), Host (Seating assignment).
5. **Integration Touchpoints:** POS Terminals (Syncing active table states).
6. **Edge Cases & Complexity Analysis:** Ghost tables (tables opened on POS that were deleted from the floor planner during a shift).

### 6.4 Kitchen (KDS)

1. **Core Functional Objectives:** Digital routing and orchestration of tickets to specific preparation stations, replacing paper workflows.
2. **Feature Breakdown:**
    - **Prep Stations:** Configuration for grill, cold prep, bar, etc.
    - **Routing Rules:** Logic dictating which items print/display on which specific screens.
    - **Course Firing:** Holding mains (fired manually or by delay) while starters are prepared.
3. **Data Requirements:** Boolean routing flags per item/category, threshold timers (Yellow/Red alerts in minutes).
4. **User Personas & Permissions:** Kitchen Manager (Read/Write rules), Line Cook (Read/Status interaction).
5. **Integration Touchpoints:** Android POS devices (Local network WebSocket sync for offline reliance), Epson Printers.
6. **Edge Cases & Complexity Analysis:** Maintaining strict offline syncing—if the internet drops, KDS screens must continue receiving tickets locally via the restaurant's intranet switch.

### 6.5 Employees (Enhanced Compliance Audit)

1. **Core Functional Objectives:** Full lifecycle management of restaurant staff, from onboarding to role mapping.
2. **Feature Breakdown:**
    - **Access Control Matrix (ACL):** Granular POS permission checks (e.g., void limits).
    - **Compliance Vault:** Document uploads for Kebele/Fayda IDs.
    - **Tip Pooling Engine:** Algorithmic splitting of digital tips between FOH and BOH.
3. **Data Requirements:** Encrypted PII (Fayda numbers), Wage rates (ETB/hr), Shift arrays.
4. **User Personas & Permissions:** Owner/HR (Full Access), Manager (Schedule view/edit).
5. **Integration Touchpoints:** POS (PIN/Swipe card login validation).
6. **Edge Cases & Complexity Analysis:** Complex tip-pooling math ensuring zero-sum distribution while handling fractional rounding errors.

### 6.6 Payroll

1. **Core Functional Objectives:** Automating Ethiopian labor law calculations and generating compliant payment schedules.
2. **Feature Breakdown:**
    - **Time & Attendance:** Integration mapping clock-ins to wage structures.
    - **Tax Engine:** Auto-calculating PAYE brackets (2025 amendments) and POESSA (Pension) deductions.
    - **Payroll Runs:** Step-by-step wizard to review, approve, and execute staff payments.
3. **Data Requirements:** Timecard deltas, gross wage formulas, historically immutable tax snapshots.
4. **User Personas & Permissions:** Owner / Financial Controller (Requires MFA to access).
5. **Integration Touchpoints:** Commercial Bank of Ethiopia (CBE) API / Telebirr for bulk wage disbursement.
6. **Edge Cases & Complexity Analysis:** Overtime multipliers (x1.25, x1.5) calculating dynamically when shifts unexpectedly cross into public holidays or exceed 48-hour weekly limits.

### 6.7 Payments

1. **Core Functional Objectives:** Manage all incoming revenue channels, receipt formatting, and hardware integrations.
2. **Feature Breakdown:**
    - **Method Configuration:** Toggles for Cash, Telebirr, CBE Birr, SantimPay, and Card Terminals.
    - **Tax & Surcharge Routing:** VAT configuration and NBE-mandated card surcharges.
    - **Digital Receipts:** SMS/Telegram delivery rules and MoR TIN inclusion.
3. **Data Requirements:** API keys for 3rd party gateways, Tax percentage integers, Void reason lookup tables.
4. **User Personas & Permissions:** General Manager (Setup), Server (Execution on POS).
5. **Integration Touchpoints:** Telebirr OpenAPI, SantimPay Gateway.
6. **Edge Cases & Complexity Analysis:** Reconciling split-check partial payments where one user pays via Telebirr (instant) and the other via Cash, requiring atomic database transactions.

### 6.8 Marketing

1. **Core Functional Objectives:** Retention mechanisms via local digital channels (Telegram/SMS) and loyalty programs.
2. **Feature Breakdown:**
    - **Loyalty Engine:** Point-to-ETB exchange conversions and Tiering (Bronze/Silver/Gold).
    - **Campaign Builder:** SMS and Telegram bot broadcast tools.
    - **Automations:** "We miss you" triggers for guests inactive for >30 days.
3. **Data Requirements:** Guest CRM profiles, aggregated visit histories, campaign open-rate telemetry.
4. **User Personas & Permissions:** Marketing Manager.
5. **Integration Touchpoints:** Telegram Bot API, Africa's Talking API.
6. **Edge Cases & Complexity Analysis:** Honoring global opt-out (Unsubscribe) commands across multiple decoupled communication channels (SMS vs Telegram).

### 6.9 Financial Products

1. **Core Functional Objectives:** Provide automated lending and instant settlement tailored for Ethiopian merchants.
2. **Feature Breakdown:**
    - **Working Capital Loans:** Auto-calculating loan eligibility based on the last 6 months of GMV.
    - **Repayment Engine:** Siphoning a set percentage (%) of daily revenue to pay down balances.
    - **Instant Payouts:** Triggering end-of-day sweeps to Telebirr wallets instead of T+2 bank cycles.
3. **Data Requirements:** Aggregated transactional ledgers, KYC approval states.
4. **User Personas & Permissions:** Owner / Legal Entity primary stakeholder only.
5. **Integration Touchpoints:** Development Bank of Ethiopia (DBE) or partner Microfinance tech stacks.
6. **Edge Cases & Complexity Analysis:** Handling daily repayment deductions accurately on days where the merchant issues more refunds than they process in new sales (negative net revenue).

### 6.10 Integrations

1. **Core Functional Objectives:** Open ecosystem allowing the restaurant to connect accounting, delivery, and bespoke APIs.
2. **Feature Breakdown:**
    - **App Marketplace:** Grid view mapping out "Available" vs "Connected" services.
    - **API Key Generation:** Scoped developer keys (e.g., "Read-only Orders").
    - **Webhook Emitters:** Firing JSON payloads to external URLs on events like `order.created`.
3. **Data Requirements:** API OAuth Bearer tokens, Webhook delivery success/failure logs.
4. **User Personas & Permissions:** System Admin / Technical Integrator.
5. **Integration Touchpoints:** Xero, QuickBooks Online, custom ERP suites.
6. **Edge Cases & Complexity Analysis:** Webhook idempotency—preventing infinite loops and instituting exponential backoff if the external server is down.

### 6.11 Shop

1. **Core Functional Objectives:** A seamless hardware and software upgrade marketplace integrated natively in the dashboard.
2. **Feature Breakdown:**
    - **Software Modules:** One-click upgrades to add features like "lole Payroll" to the monthly bill.
    - **Hardware Store:** E-commerce flow to order Receipt Printers, KDS Tablets, and Cash Drawers.
3. **Data Requirements:** Subscription tier logic, shipping address schemas mirroring the main business table.
4. **User Personas & Permissions:** Owner / Admin.
5. **Integration Touchpoints:** local payment gateway for the merchant's own subscription invoices.
6. **Edge Cases & Complexity Analysis:** Prorating subscription costs correctly when a merchant activates a new module in the middle of a billing cycle.
