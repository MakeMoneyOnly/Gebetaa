# lole Merchant Dashboard — Complete Blueprint

> **"Toast for Addis Ababa"** | Ethiopian Localization + Feature Parity Specification
> Version: April 2026 | Status: Planning Reference

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Gap Analysis vs Toast Web](#2-gap-analysis-vs-toast-web)
3. [New Sidebar Architecture](#3-new-sidebar-architecture)
4. [Tab Blueprints — Full Field-Level Specification](#4-tab-blueprints)
    - [Home](#41-home)
    - [Reports](#42-reports)
    - [Employees](#43-employees)
    - [Payroll](#44-payroll)
    - [Menus](#45-menus)
    - [Takeout & Delivery](#46-takeout--delivery)
    - [Payments](#47-payments)
    - [Marketing](#48-marketing)
    - [Front of House](#49-front-of-house)
    - [Kitchen](#410-kitchen)
    - [Financial Products](#411-financial-products)
    - [Integrations](#412-integrations)
    - [Shop](#413-shop)
    - [Help & Support](#414-help--support)
5. [Settings Page Restructure](#5-settings-page-restructure)
6. [Ethiopia Localization Reference](#6-ethiopia-localization-reference)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Current State Audit

### 1.1 Sidebar — Current vs Required

| Slot | Label              | Route                    | Status                             |
| ---- | ------------------ | ------------------------ | ---------------------------------- |
| 1    | Home               | `/merchant`              | ✅ Exists (core)                   |
| 2    | Reports            | `/merchant/reports`      | ❌ Deleted (Starting from scratch) |
| 3    | Menus              | `/merchant/menus`        | ❌ Deleted (Starting from scratch) |
| 4    | Front of House     | `/merchant/foh`          | ❌ Deleted (Starting from scratch) |
| 5    | Kitchen            | `/merchant/kitchen`      | ❌ Deleted (Starting from scratch) |
| 6    | Takeout & Delivery | `/merchant/takeout`      | ❌ Deleted (Starting from scratch) |
| 7    | Employees          | `/merchant/employees`    | ❌ Deleted (Starting from scratch) |
| 8    | Payroll            | `/merchant/payroll`      | ❌ Missing — create                |
| 9    | Payments           | `/merchant/payments`     | ❌ Missing — create                |
| 10   | Marketing          | `/merchant/marketing`    | ❌ Deleted (Starting from scratch) |
| 11   | Financial Products | `/merchant/financial`    | ❌ Missing — create                |
| 12   | Integrations       | `/merchant/integrations` | ❌ Deleted (Starting from scratch) |
| 13   | Shop               | `/merchant/shop`         | ❌ Missing — create                |
| 14   | Help & Support     | `/merchant/help`         | ✅ Exists (shell)                  |
| —    | Settings           | `/merchant/setup`        | ✅ Shell exists, tabs deleted      |

### 1.2 Settings — Current Tabs

| Tab           | Contents                                  | Assessment                                          |
| ------------- | ----------------------------------------- | --------------------------------------------------- |
| Business Info | Name, address, logo, hours, service types | ✅ Good foundation — enhance with Amharic, TIN, Map |
| Financials    | VAT, TOT, bank accounts, fiscal year      | ⚠️ Needs MAT, updated PAYE brackets, MoR config     |
| Locations     | Multi-location management                 | ✅ Good — add sub-city/woreda fields                |
| Security      | Password, MFA, POS PIN                    | ✅ Good — add Telebirr-based 2FA option             |
| Integrations  | 3rd-party integrations                    | ⚠️ Needs Ethiopian payment providers                |
| Modules       | Feature flags                             | ✅ Good — reorder to match new tab list             |

### 1.3 Components Inventory (Clean Slate)

All legacy components and stubs have been removed to ensure an enterprise-grade rebuild from scratch.

**Deleted Components:**

- `MenuPageClient.tsx` (Menu Builder)
- `StaffPageClient.tsx` (Employee Management)
- `BusinessInfoTab.tsx`, `FinancialsTab.tsx` (Old Settings)
- `OnlineOrderingSettingsPanel.tsx`, `DeliveryPartnerHub.tsx` (Partial Takeout)
- `LoyaltyProgramBuilder.tsx`, `GuestsPageClient.tsx` (Marketing/Guests)
- `ScheduleCalendar.tsx` (Scheduling)

**Deleted Stubs:**

- `/merchant/reports`, `/merchant/foh`, `/merchant/kitchen`, `/merchant/takeout`, `/merchant/employees`, `/merchant/marketing`, `/merchant/integrations` (all minimal page.tsx files removed).

---

## 2. Gap Analysis vs Toast Web

### 2.1 Feature Parity Matrix

| Toast Feature                 | Toast Tab          | lole Status                                     | Priority        |
| ----------------------------- | ------------------ | ----------------------------------------------- | --------------- |
| Weekly KPI dashboard          | Home               | ✅ Command Center built                         | P1              |
| Toast Now mobile companion    | Home               | ❌ No mobile companion link                     | P3              |
| Sales Summary Report          | Reports            | ❌ Stub                                         | P1              |
| Labor / Time Reports          | Reports            | ❌ Stub                                         | P1              |
| Cash Management Reports       | Reports            | ❌ Stub                                         | P2              |
| Payment Reports               | Reports            | ❌ Stub                                         | P2              |
| Tax Reports                   | Reports            | ❌ Stub                                         | P1 (compliance) |
| Export Center (CSV/Excel)     | Reports            | ❌ Stub                                         | P2              |
| Employee list + profiles      | Employees          | ✅ StaffPageClient                              | P1              |
| Jobs & Permissions matrix     | Employees          | ✅ Partial                                      | P1              |
| Time & Attendance             | Employees          | ✅ ScheduleCalendar                             | P1              |
| Tips configuration            | Employees          | ❌ Missing                                      | P2              |
| Earned Wage Access            | Employees          | ❌ N/A (Ethiopian equiv: mobile salary advance) | P3              |
| Payroll Run                   | Payroll            | ❌ Missing entire tab                           | P1              |
| PAYE withholding              | Payroll            | ❌ Missing                                      | P1              |
| Tax Filing (MoR)              | Payroll            | ❌ Missing                                      | P1              |
| Direct Deposit (CBE/Awash)    | Payroll            | ❌ Missing                                      | P2              |
| Menu hierarchy builder        | Menus              | ✅ MenuPageClient                               | P1              |
| Online ordering status toggle | Takeout            | ✅ OnlineOrderingSettingsPanel                  | P1              |
| Delivery radius config        | Takeout            | ✅ Partial                                      | P1              |
| 3rd-party delivery partners   | Takeout            | ✅ DeliveryPartnerHub                           | P1              |
| Hours & schedule overrides    | Takeout            | ❌ Missing                                      | P2              |
| Payment methods config        | Payments           | ❌ Entire tab missing                           | P1              |
| Telebirr / CBE Birr setup     | Payments           | ❌ Missing                                      | P1              |
| Discounts management          | Payments           | ❌ Missing                                      | P1              |
| Tax rate configuration        | Payments           | ❌ Missing (in Financials tab)                  | P1              |
| Tipping configuration         | Payments           | ❌ Missing                                      | P1              |
| Service charges               | Payments           | ❌ Missing                                      | P1              |
| Receipt / ticket setup        | Payments           | ❌ Missing                                      | P1              |
| Loyalty program               | Marketing          | ✅ LoyaltyProgramBuilder                        | P1              |
| Campaign builder (SMS/Telco)  | Marketing          | ✅ CampaignBuilder                              | P1              |
| Guest directory               | Marketing          | ✅ GuestsPageClient (migrate)                   | P1              |
| Floor plan builder            | FOH                | ❌ Missing                                      | P2              |
| Revenue centers               | FOH                | ❌ Missing                                      | P2              |
| Kiosk settings                | FOH                | ❌ (no hardware yet)                            | P3              |
| QR ordering config            | FOH                | ❌ Missing                                      | P2              |
| Dining options config         | Kitchen            | ❌ Missing                                      | P1              |
| Prep stations                 | Kitchen            | ❌ Missing                                      | P2              |
| KDS device config             | Kitchen            | ❌ Missing (KDS app built separately)           | P2              |
| Ticket routing                | Kitchen            | ❌ Missing                                      | P2              |
| Working capital / loans       | Financial Products | ❌ Entire tab missing                           | P3              |
| Integration marketplace       | Integrations       | ⚠️ Stub                                         | P2              |
| API keys / webhooks           | Integrations       | ❌ Missing config UI                            | P2              |
| Hardware shop                 | Shop               | ❌ Missing                                      | P3              |
| Help articles                 | Help               | ✅ HelpPageClient                               | P2              |

---

## 3. New Sidebar Architecture

### 3.1 Structure

```
┌────────────────────────────────────┐
│  [Logo]                            │
│  [Location Switcher ▼]            │
├────────────────────────────────────┤
│  OVERVIEW                          │
│   ○ Home              /merchant    │
│   ○ Reports           /merchant/reports │
├────────────────────────────────────┤
│  OPERATIONS                        │
│   ○ Menus             /merchant/menus   │
│   ○ Takeout & Delivery /merchant/takeout│
│   ○ Front of House    /merchant/foh     │
│   ○ Kitchen           /merchant/kitchen │
├────────────────────────────────────┤
│  PEOPLE & FINANCE                  │
│   ○ Employees         /merchant/employees│
│   ○ Payroll           /merchant/payroll  │
│   ○ Payments          /merchant/payments │
├────────────────────────────────────┤
│  GROWTH                            │
│   ○ Marketing         /merchant/marketing│
├────────────────────────────────────┤
│  PLATFORM                          │
│   ○ Financial Products /merchant/financial│
│   ○ Integrations      /merchant/integrations│
├────────────────────────────────────┤
│  ─────────────────── (divider)     │
│   ○ Shop              /merchant/shop    │
│   ○ Help & Support    /merchant/help    │
│  ─────────────────── (divider)     │
│   ○ Settings          /merchant/setup  │  ← bottom utility
│   ○ [Avatar] Name ▼   (account menu)   │
└────────────────────────────────────┘
```

### 3.2 Icon Map

| Tab                | Lucide Icon       | Route                    |
| ------------------ | ----------------- | ------------------------ |
| Home               | `LayoutGrid`      | `/merchant`              |
| Reports            | `BarChart3`       | `/merchant/reports`      |
| Menus              | `UtensilsCrossed` | `/merchant/menus`        |
| Takeout & Delivery | `ShoppingBag`     | `/merchant/takeout`      |
| Front of House     | `QrCode`          | `/merchant/foh`          |
| Kitchen            | `ChefHat`         | `/merchant/kitchen`      |
| Employees          | `Users`           | `/merchant/employees`    |
| Payroll            | `Wallet`          | `/merchant/payroll`      |
| Payments           | `CreditCard`      | `/merchant/payments`     |
| Marketing          | `Megaphone`       | `/merchant/marketing`    |
| Financial Products | `Landmark`        | `/merchant/financial`    |
| Integrations       | `Plug`            | `/merchant/integrations` |
| Shop               | `Store`           | `/merchant/shop`         |
| Help & Support     | `HelpCircle`      | `/merchant/help`         |
| Settings           | `Settings`        | `/merchant/setup`        |

### 3.3 Route Migrations Required

| Old Route          | New Route                       | Action            |
| ------------------ | ------------------------------- | ----------------- |
| `/merchant/menu`   | `/merchant/menus`               | Rename + redirect |
| `/merchant/team`   | `/merchant/employees`           | Rename + redirect |
| `/merchant/boh`    | `/merchant/kitchen`             | Rename + redirect |
| `/merchant/guests` | Fold into `/merchant/marketing` | Migrate component |
| —                  | `/merchant/payroll`             | Create new        |
| —                  | `/merchant/payments`            | Create new        |
| —                  | `/merchant/financial`           | Create new        |
| —                  | `/merchant/shop`                | Create new        |

---

## 4. Tab Blueprints

> **Convention:** `[T]` = Text input, `[#]` = Number input, `[DD]` = Dropdown, `[R]` = Radio group, `[CB]` = Checkbox, `[TOG]` = Toggle switch, `[IMG]` = Image upload, `[DATE]` = Date picker, `[TEL]` = Phone input

---

### 4.1 HOME

**Route:** `/merchant`
**Purpose:** Real-time command center overview — the operational nerve center
**Current State:** ✅ Built (`MerchantDashboardClient.tsx`)

#### Subtabs / Sections

```
HOME
 ├── Command Center (default view)
 │    ├── HEADER AREA
 │    │    ├── Greeting: "Hello, {restaurantName}" [dynamic]
 │    │    ├── Date display [auto]
 │    │    ├── Sync status badge: IN SYNC / STALE DATA / SYNC FAILED [auto]
 │    │    ├── Last sync timestamp [auto]
 │    │    ├── [BTN] Alert Rules → opens AlertRuleBuilderDrawer
 │    │    └── [BTN] Refresh (manual trigger)
 │    │
 │    ├── METRIC CARDS ROW (4 cards)
 │    │    ├── Orders In Flight [live count]
 │    │    ├── Avg Ticket Time [minutes, live]
 │    │    ├── Active Tables [count + unique today]
 │    │    └── Open Requests [count + payment success %]
 │    │
 │    ├── INCOME TRACKER PANEL
 │    │    ├── Range selector [DD]: Today / Week / Month
 │    │    ├── Gross Sales (ETB) [large display]
 │    │    ├── Delta vs previous period [+/- ETB, colored]
 │    │    └── Revenue Chart [area chart, interactive]
 │    │
 │    ├── ACTIVE ORDERS PANEL
 │    │    ├── Order list (up to 4, live)
 │    │    │    ├── Order label + table number
 │    │    │    ├── Time elapsed
 │    │    │    ├── Status badge (Pending/Preparing/Ready/Served)
 │    │    │    └── [BTN] ... → status actions
 │    │    └── Empty state: "No active orders"
 │    │
 │    └── SERVICE REQUESTS PANEL
 │         ├── Request list (up to 4, live)
 │         │    ├── Request label + table number
 │         │    ├── Time elapsed
 │         │    └── Status badge
 │         └── Empty state: "No pending requests"
 │
 └── Quick Actions (secondary, from static page.tsx)
      ├── [BTN] Manage Menu → /merchant/menus
      ├── [BTN] Daily Reconciliation → /merchant/reports
      ├── [BTN] Open Terminal → POS link
      └── [BTN] Staff Roster → /merchant/employees
```

#### 🇪🇹 Ethiopia Localizations

- Currency display: always "ETB" or "Br." prefix
- Greeting: support Amharic translation toggle in User Preferences
- Geez calendar option: show Ethiopian date alongside Gregorian
- Sync status labels: add Amharic tooltips

#### Missing / Enhancements Needed

- [ ] Add "Quick Setup Checklist" banner for new accounts (Toast pattern)
- [ ] Add lole Now mobile app deep-link card
- [ ] Weekly overview chart (not just today/week/month — add weekly bar chart)
- [ ] Menu performance widget (top 5 items by sales today)

---

### 4.2 REPORTS

**Route:** `/merchant/reports`
**Purpose:** Full analytics and reporting suite
**Current State:** ❌ Deleted (rebuilding from scratch)

#### Subtabs

```
REPORTS
 ├── Sales
 │    ├── Summary Report
 │    │    ├── Date range picker [DATE range]
 │    │    ├── Net Sales (ETB)
 │    │    ├── Gross Sales (ETB)
 │    │    ├── Tax Collected (ETB)
 │    │    ├── Service Charges (ETB)
 │    │    ├── Discounts Applied (ETB)
 │    │    ├── Voids (ETB)
 │    │    ├── Refunds (ETB)
 │    │    ├── Guest Count
 │    │    ├── Order Count
 │    │    └── Average Order Value (ETB)
 │    │
 │    ├── Itemized Sales
 │    │    ├── Date range [DATE range]
 │    │    ├── Table (sortable): Item | Category | Qty Sold | Gross | Net | Tax
 │    │    ├── Filter by Category [DD]
 │    │    └── [BTN] Export CSV
 │    │
 │    ├── Hourly Sales
 │    │    ├── Date range [DATE range]
 │    │    ├── Hour-by-hour chart [bar]
 │    │    └── Peak hour indicator
 │    │
 │    ├── Product Mix
 │    │    ├── Top sellers table
 │    │    ├── Category breakdown (pie chart)
 │    │    └── Bottom performers list
 │    │
 │    ├── Discounts Report
 │    │    ├── Discount name | Type | # Applied | Total ETB
 │    │    └── Filter by discount type [DD]
 │    │
 │    ├── Voids Report
 │    │    ├── Void reason | # Voids | ETB voided | Employee
 │    │    └── Filter by employee [DD]
 │    │
 │    └── Order Source Report
 │         ├── Dine-in | Takeout | Delivery | Online
 │         └── Revenue by source (bar chart)
 │
 ├── Labor
 │    ├── Time Entries
 │    │    ├── Date range [DATE range]
 │    │    ├── Table: Employee | Job | Clock In | Clock Out | Hours | Wage
 │    │    ├── Filter by employee [DD]
 │    │    └── [BTN] Export CSV
 │    │
 │    ├── Labor Summary
 │    │    ├── Total hours worked
 │    │    ├── Total labor cost (ETB)
 │    │    ├── Labor cost % of sales
 │    │    └── Overtime hours
 │    │
 │    ├── Overtime Alerts
 │    │    └── Employees nearing/exceeding overtime threshold
 │    │
 │    └── Tip Summary
 │         ├── Total tips collected (ETB)
 │         ├── Per-employee tip totals
 │         └── Tip pool distribution report
 │
 ├── Cash Management
 │    ├── Cash Drawer Summary
 │    │    ├── Opening float
 │    │    ├── Cash in (sales)
 │    │    ├── Cash out (payouts/refunds)
 │    │    └── Closing balance
 │    │
 │    ├── Payout Report
 │    │    ├── Payout reason | Amount (ETB) | Employee | Timestamp
 │    │    └── [TOG] Show only unapproved payouts
 │    │
 │    └── Z-Report (End-of-Day)
 │         ├── Net sales by payment method
 │         ├── Tax breakdown by type
 │         ├── Void/discount/refund summary
 │         └── [BTN] Print Z-Report (Amharic + English)
 │
 ├── Payments
 │    ├── Payment Method Breakdown
 │    │    ├── Cash | Telebirr | CBE Birr | Card | Other [each: count + ETB]
 │    │    └── Period filter [DD]
 │    │
 │    └── Transaction Detail
 │         ├── Date | Time | Order # | Method | Amount | Status
 │         ├── Filter by method [DD]
 │         └── [BTN] Export
 │
 ├── Tax & Service Charges
 │    ├── VAT Collected Report
 │    │    ├── Taxable sales
 │    │    ├── VAT @ 15% (ETB)
 │    │    ├── VAT-exempt sales
 │    │    └── [BTN] Export for MoR filing
 │    │
 │    ├── MAT Check Report 🇪🇹
 │    │    ├── Annual turnover (ETB)
 │    │    ├── 2.5% MAT threshold
 │    │    ├── Income tax liability
 │    │    └── MAT applicable: Yes / No
 │    │
 │    └── Service Charge Report
 │         └── Service charge collected by type (ETB)
 │
 ├── Menu & Modifiers
 │    ├── Item Performance
 │    │    ├── Units sold | Revenue | Avg price
 │    │    └── Sort by: Revenue / Units / Margin
 │    │
 │    └── Category Mix
 │         └── Revenue share by menu category (donut chart)
 │
 ├── Guest Data
 │    ├── Visit Frequency
 │    │    ├── New vs returning guests
 │    │    └── Return rate %
 │    │
 │    └── Loyalty Report
 │         ├── Points issued | Points redeemed
 │         ├── Active loyalty members
 │         └── Redemption rate %
 │
 └── Export Center
      ├── [BTN] Schedule Report → email delivery form
      │    ├── Report type [DD]
      │    ├── Frequency [DD]: Daily / Weekly / Monthly
      │    ├── Recipients [T] (email addresses, comma-separated)
      │    └── [BTN] Save Schedule
      └── [BTN] Export All → CSV / Excel selection
```

#### 🇪🇹 Ethiopia Localizations

- All monetary values: ETB (Ethiopian Birr)
- VAT report labeled "VAT (15%)" with MoR filing reference codes
- MAT report is unique to Ethiopia — not in Toast
- Z-Report: option to print in Amharic
- Date formats: support both Gregorian and Ethiopian calendar (Ethiopic)
- PAYE summary: monthly withholding totals per employee

---

### 4.3 EMPLOYEES

**Route:** `/merchant/employees` (renamed from `/merchant/team`)
**Purpose:** Full employee lifecycle management
**Current State:** ❌ Deleted (rebuilding from scratch)

#### Subtabs

```
EMPLOYEES
 ├── Team Management
 │    ├── Employee List
 │    │    ├── Search [T]
 │    │    ├── Filter by Job/Role [DD]
 │    │    ├── Filter by Status [DD]: Active / Inactive
 │    │    └── Table: Photo | Name | Job | Phone | Status | Actions
 │    │
 │    ├── Add Employee → Employee Profile Form
 │    │    ├── PERSONAL INFO SECTION
 │    │    │    ├── First Name [T] *required
 │    │    │    ├── Last Name [T] *required
 │    │    │    ├── Middle Name / Father's Name [T] 🇪🇹 (Ethiopian naming)
 │    │    │    ├── Phone Number [TEL] *required (Ethiopian: +251...)
 │    │    │    ├── Email [T]
 │    │    │    ├── Date of Birth [DATE]
 │    │    │    ├── Gender [DD]: Male / Female
 │    │    │    ├── National ID / Kebele ID [T] 🇪🇹
 │    │    │    ├── Sub-city / Woreda [DD] 🇪🇹
 │    │    │    └── Profile Photo [IMG]
 │    │    │
 │    │    ├── ACCOUNT INFORMATION SECTION
 │    │    │    ├── POS Access Code [#] (4–6 digit PIN)
 │    │    │    ├── [TOG] Invite to Create Web Account
 │    │    │    └── Web Role [DD]: Owner / Admin / Manager / Staff (if invite on)
 │    │    │
 │    │    ├── EMPLOYMENT DETAILS SECTION 🇪🇹
 │    │    │    ├── Job Assignment [DD] (from Jobs list)
 │    │    │    ├── Employment Type [R]: Permanent / Contract / Daily
 │    │    │    ├── Start Date [DATE]
 │    │    │    ├── Base Wage [#] (ETB/month or ETB/day)
 │    │    │    ├── Wage Type [R]: Monthly / Daily / Hourly
 │    │    │    ├── [TOG] Include in Pension (POESSA 7%/11%)
 │    │    │    └── Bank Account for Payroll [T]
 │    │    │         ├── Bank Name [DD]: CBE / Awash / Amhara / Dashen / Other
 │    │    │         └── Account Number [T]
 │    │    │
 │    │    ├── PERMISSIONS SECTION
 │    │    │    ├── [CB matrix] POS permissions (granular)
 │    │    │    └── [CB matrix] Dashboard permissions
 │    │    │
 │    │    └── [BTN] Save Employee
 │    │
 │    └── Employee Profile (edit view)
 │         └── Same form as Add, + Employment History panel
 │
 ├── Jobs
 │    ├── Job List (table: Job Name | Tipped | Default Wage | # Employees)
 │    ├── Add Job
 │    │    ├── Job Name [T] *required
 │    │    ├── [TOG] Tipped Job (enables tip tracking)
 │    │    ├── Default Wage [#] (ETB)
 │    │    ├── Wage Type [DD]: Monthly / Daily / Hourly
 │    │    ├── POS Access Level [DD]: No Access / Basic / Manager
 │    │    └── [CB list] Web Dashboard permissions per module
 │    │
 │    └── Job Settings
 │         ├── [TOG] Tipped / Non-tipped
 │         ├── Default wage [#]
 │         ├── POS access level [DD]
 │         └── Web Setup permissions [CB matrix]
 │
 ├── Time & Attendance
 │    ├── Clock-In Records
 │    │    ├── Date range [DATE range]
 │    │    ├── Filter by Employee [DD]
 │    │    └── Table: Employee | Date | Clock In | Clock Out | Break | Net Hours
 │    │
 │    ├── Edit Timesheets
 │    │    ├── Select Employee [DD]
 │    │    ├── Select Date [DATE]
 │    │    └── Edit In/Out times [TIME pickers]
 │    │
 │    ├── Break Configuration
 │    │    ├── Paid break duration [#] minutes
 │    │    ├── Unpaid break duration [#] minutes
 │    │    └── [TOG] Require break after N hours [#]
 │    │
 │    └── Overtime Rules 🇪🇹
 │         ├── Daily overtime threshold [#] hours (Ethiopian Labour Law: >8hrs/day)
 │         ├── Weekly overtime threshold [#] hours (>48hrs/week standard)
 │         ├── Overtime rate multiplier [#] (e.g., 1.25x)
 │         └── Holiday pay rate multiplier [#]
 │
 └── Tips
      ├── Tip Configuration
      │    ├── [TOG] Enable tip tracking
      │    ├── Suggested tip amounts [#] [#] [#] (3 presets, % each)
      │    ├── [TOG] Allow custom tip amount
      │    └── Tip on [R]: Pre-tax / Post-tax amount
      │
      ├── Tip Pool Rules
      │    ├── [R] Pooling Mode: No pooling / Full pool / Percentage split
      │    ├── Pool contribution % [#] (if percentage split)
      │    └── Pool distribution rules [CB list by job type]
      │
      └── Claimed Tips
           ├── [TOG] Require staff to claim tips at end of shift
           └── Minimum claimed tip amount [#] ETB
```

#### 🇪🇹 Ethiopia Localizations

- **Naming convention**: First Name + Father's Name (not surname) — critical field
- **National ID**: Ethiopian national Fayda ID / Kebele ID field
- **Address**: Sub-city + Woreda structure (Addis Ababa administrative structure)
- **Pension**: POESSA (Private Organizations Employees' Social Security Agency) — employee 7%, employer 11%
- **Labour Law**: Ethiopian Labour Proclamation No. 1156/2019 — >8hrs/day = OT, public holidays list per Ethiopian calendar
- **Bank**: CBE, Awash Bank, Amhara Bank, Dashen Bank, Bank of Abyssinia, Zemen Bank
- **Phone**: +251 prefix, 9-digit format

---

### 4.4 PAYROLL

**Route:** `/merchant/payroll`
**Current State:** ❌ Missing entire tab
**Purpose:** Ethiopian payroll: PAYE calculation, pension remittance, MoR filings

```
PAYROLL
 ├── Payroll Dashboard
 │    ├── Current Period: [Month Year] [DD]
 │    ├── Status badge: Draft / Submitted / Paid
 │    ├── Summary cards:
 │    │    ├── Gross Payroll (ETB)
 │    │    ├── PAYE Withheld (ETB)
 │    │    ├── Pension Deducted — Employee 7% (ETB)
 │    │    ├── Pension Due — Employer 11% (ETB)
 │    │    └── Net Payroll (ETB)
 │    ├── [BTN] Run Payroll
 │    └── [BTN] View Pay History
 │
 ├── Run Payroll (wizard)
 │    ├── STEP 1: Review Pay Period
 │    │    ├── Period [DATE range]
 │    │    ├── Working days in period [#] (auto-calculated)
 │    │    ├── Public holidays this period [list] 🇪🇹 (Ethiopian holidays)
 │    │    └── [BTN] Next
 │    │
 │    ├── STEP 2: Review Timesheets
 │    │    ├── Table: Employee | Hours | OT Hours | Days Absent | Adjustments
 │    │    ├── [BTN] Edit timesheet (per row)
 │    │    └── [BTN] Next
 │    │
 │    ├── STEP 3: Preview Calculations
 │    │    ├── Table per employee:
 │    │    │    ├── Name
 │    │    │    ├── Gross Wage (ETB)
 │    │    │    ├── Allowances (ETB)
 │    │    │    ├── Taxable Income (ETB)
 │    │    │    ├── PAYE Withheld (ETB) [auto-calculated]
 │    │    │    ├── Pension Employee 7% (ETB)
 │    │    │    ├── Other Deductions (ETB)
 │    │    │    └── Net Pay (ETB)
 │    │    └── [BTN] Confirm & Submit
 │    │
 │    └── STEP 4: Confirm
 │         ├── Payroll summary totals
 │         ├── [TOG] Generate payslips (PDF per employee)
 │         ├── [TOG] Send payslips via SMS/Email
 │         └── [BTN] Finalize Payroll
 │
 ├── Team (Payroll Profiles)
 │    ├── Employee list with payroll data
 │    │    ├── Employment type [DD]
 │    │    ├── Gross salary [#] ETB
 │    │    ├── Bank account for payment [T]
 │    │    │    └── Bank Name [DD]: CBE / Awash / Amhara / Dashen / Other
 │    │    ├── [TOG] Include in pension
 │    │    └── Allowances configuration
 │    │         ├── Transport allowance [#] ETB (tax-exempt up to threshold)
 │    │         ├── Housing allowance [#] ETB
 │    │         └── Meal allowance [#] ETB
 │    │
 │    └── Payroll History (per employee)
 │         └── Table: Period | Gross | PAYE | Pension | Net | Status
 │
 ├── Tax Center 🇪🇹
 │    ├── PAYE Summary
 │    │    ├── Month selector [DD]
 │    │    ├── Total PAYE withheld (ETB)
 │    │    ├── MoR Remittance deadline: 8th of following month
 │    │    ├── Status: Submitted / Pending / Overdue
 │    │    └── [BTN] Download MoR Remittance Report
 │    │
 │    ├── Pension Remittance (POESSA)
 │    │    ├── Employee contributions (7%) total (ETB)
 │    │    ├── Employer contributions (11%) total (ETB)
 │    │    ├── Combined total (ETB)
 │    │    └── [BTN] Download POESSA Report
 │    │
 │    └── Annual Tax Summary
 │         ├── Year selector [DD]
 │         ├── Total PAYE for year
 │         ├── Total pension for year
 │         └── [BTN] Export Annual Summary PDF
 │
 └── Settings
      ├── Pay Schedule [DD]: Monthly (default for Ethiopia) / Bi-monthly
      ├── Fiscal Year [R]: Ethiopian EFY (Jul–Jun) / Gregorian
      ├── Payroll Contact Name [T]
      ├── Payroll Contact Phone [TEL]
      ├── TIN Number [T] 🇪🇹 (for MoR remittance forms)
      └── PAYE Tax Brackets (read-only reference table) 🇪🇹
           ├── 0 – 2,000 ETB → 0%
           ├── 2,001 – 4,000 ETB → 15%
           ├── 4,001 – 7,000 ETB → 20%
           ├── 7,001 – 10,000 ETB → 25%
           ├── 10,001 – 14,000 ETB → 30%
           └── > 14,000 ETB → 35%
```

#### 🇪🇹 Ethiopia Localizations

- **PAYE brackets**: 2025 Income Tax Amendment No. 1395/2025 (in effect July 2025)
- **Pension**: POESSA — employee 7%, employer 11% mandatory
- **MoR remittance**: due 8th–10th of following month
- **Ethiopian Fiscal Year (EFY)**: Meskerem 1 to Pagume 5/6 (approx Sep 11 – Sep 10)
- **Ethiopian public holidays** to auto-mark: Ethiopian Christmas (Jan 7/Gena), Epiphany (Jan 19/Timkat), Adwa Victory (Mar 2), Good Friday/Easter (Fasika), Labor Day (May 1), Patriots Victory (May 5), Downfall of Derg (May 28), Meskel (Sep 27), Eid al-Fitr, Eid al-Adha, Ethiopian New Year (Sep 11/Enkutatash)
- **No W-2/1099**: Ethiopia uses different forms — annual tax certificate issued by employer
- **Allowances**: transport allowance has ETB 600/month tax-exempt threshold

---

### 4.5 MENUS

**Route:** `/merchant/menus` (renamed from `/merchant/menu`)
**Current State:** ❌ Deleted (rebuilding from scratch)

**Purpose:** Full menu hierarchy management and publishing

```
MENUS
 ├── Menu Manager (primary editor)
 │    ├── Menu List (top-level)
 │    │    ├── [BTN] + Create Menu
 │    │    └── Menu card: Name | Active/Inactive | Items count | Actions
 │    │
 │    ├── Menu Detail
 │    │    ├── Menu Name [T]
 │    │    ├── Description [T]
 │    │    ├── [TOG] Active
 │    │    ├── Availability Schedule
 │    │    │    ├── Days of week [CB each]
 │    │    │    └── Time range [TIME - TIME]
 │    │    ├── Visibility [CB]: POS / Online Ordering / Kiosk / QR
 │    │    └── [BTN] + Add Menu Group
 │    │
 │    ├── Menu Group
 │    │    ├── Group Name [T]
 │    │    ├── Description [T]
 │    │    ├── Sort Order [#]
 │    │    └── [BTN] + Add Item
 │    │
 │    └── Menu Item
 │         ├── BASIC INFO
 │         │    ├── Item Name [T] *required
 │         │    ├── Item Name (Amharic) [T] 🇪🇹
 │         │    ├── Description [T]
 │         │    ├── Description (Amharic) [T] 🇪🇹
 │         │    ├── Price [#] ETB *required
 │         │    ├── Item Image [IMG]
 │         │    └── GUID / SKU [T] (read-only, auto-generated)
 │         │
 │         ├── DIETARY & ALLERGENS 🇪🇹
 │         │    ├── Calories [#]
 │         │    ├── Allergen Flags [CB multi]:
 │         │    │    Gluten / Dairy / Nuts / Eggs / Fish / Soy / Sesame / Wheat
 │         │    ├── Dietary Tags [CB multi]:
 │         │    │    Halal / Vegetarian / Vegan / Fasting (Tsom) 🇪🇹 / Kosher
 │         │    └── Spice Level [DD]: None / Mild / Medium / Spicy / Ethiopian Spicy 🇪🇹
 │         │
 │         ├── AVAILABILITY
 │         │    ├── [TOG] Out of Stock
 │         │    ├── Visibility [CB]: POS / Online / Kiosk / QR Code
 │         │    └── Time-specific availability [DATE/TIME range]
 │         │
 │         ├── TAX & PRICING
 │         │    ├── [TOG] VAT Inclusive (price includes 15% VAT)
 │         │    ├── Revenue Center Override [DD]
 │         │    └── Prep Time [#] seconds (for online ordering)
 │         │
 │         └── MODIFIERS
 │              └── Modifier Group Assignment [multi-select lookup]
 │
 ├── Modifier Groups
 │    ├── Modifier Group List
 │    ├── Add Modifier Group
 │    │    ├── Group Name [T]
 │    │    ├── Group Name (Amharic) [T] 🇪🇹
 │    │    ├── [R] Required / Optional
 │    │    ├── Min Selections [#]
 │    │    ├── Max Selections [#]
 │    │    └── Modifiers list (add/remove/price each)
 │    │         ├── Modifier Name [T]
 │    │         ├── Modifier Name (Amharic) [T] 🇪🇹
 │    │         └── Price [#] ETB (0 = no upcharge)
 │    │
 │    └── Modifier Pricing
 │         └── Price override by modifier [#] ETB
 │
 ├── Bulk Edit
 │    ├── Select items [CB mass selection]
 │    ├── [BTN] Bulk Price Update → set new price or % change
 │    ├── [BTN] Bulk Availability → toggle out-of-stock
 │    ├── [BTN] Bulk Category Move
 │    └── [BTN] Bulk VAT Toggle
 │
 ├── Menu Configuration
 │    ├── Pricing Rules
 │    │    ├── [TOG] Time-based pricing (happy hour)
 │    │    ├── Time range [TIME - TIME]
 │    │    └── Price modifier [#] %
 │    │
 │    └── Online Ordering Menu Sync
 │         ├── [TOG] Auto-sync POS menu to online ordering
 │         └── Last synced: [timestamp]
 │
 └── Publish Changes
      ├── Staged changes count [badge]
      ├── Changes summary (list of pending edits)
      ├── [BTN] Publish to POS
      ├── [BTN] Publish to Online Ordering
      └── [BTN] Publish All
```

#### 🇪🇹 Ethiopia Localizations

- **Amharic item names**: critical for KDS display and Amharic receipts
- **Fasting (Tsom) tag**: Ethiopian Orthodox fasting is major cultural practice — fasting menu items (no meat/dairy on Wed/Fri + full Lent season) must be flaggable
- **Halal**: significant Muslim population, Halal certification flag important
- **Spice level**: "Ethiopian Spicy" as a distinct tier above "Spicy" for berbere-based dishes
- **Currency**: ETB always, with option to show in USD for international customers

---

### 4.6 TAKEOUT & DELIVERY

**Route:** `/merchant/takeout`
**Current State:** ❌ Deleted (rebuilding from scratch)

```
TAKEOUT & DELIVERY
 ├── Online Ordering Dashboard
 │    ├── STATUS CONTROL
 │    │    ├── [TOG] Online Ordering: ON / Snoozed / OFF
 │    │    ├── Snooze duration [DD]: 15min / 30min / 45min / 1hr / Until manual open
 │    │    ├── [TOG] Snooze delivery only (keep takeout active)
 │    │    ├── Add Delay [#] minutes (0–120, 5-min steps)
 │    │    └── Current quote time display: Takeout: Xmin / Delivery: Ymin
 │    │
 │    └── TODAY'S STATS
 │         ├── Online orders today [#]
 │         ├── Revenue from online (ETB)
 │         └── Avg online order value (ETB)
 │
 ├── Availability Settings
 │    ├── TAKEOUT
 │    │    ├── [TOG] Takeout available
 │    │    ├── Takeout quote time [#] minutes
 │    │    ├── Minimum order amount [#] ETB
 │    │    └── Order Approval [R]: Auto-approve / Manual review
 │    │
 │    ├── DELIVERY
 │    │    ├── [TOG] Delivery available
 │    │    ├── Delivery quote time [#] minutes
 │    │    ├── Minimum order amount [#] ETB
 │    │    ├── Delivery fee [#] ETB (flat)
 │    │    ├── Free delivery above [#] ETB (threshold)
 │    │    ├── Delivery radius [#] km 🇪🇹 (km not miles)
 │    │    └── Delivery zones (map with radius around restaurant)
 │    │
 │    ├── CURBSIDE
 │    │    ├── [TOG] Curbside pickup available
 │    │    └── [TOG] Require customer vehicle info
 │    │
 │    └── SCHEDULED ORDERS
 │         ├── [TOG] Allow future orders
 │         ├── Max future order days [#] (1–30)
 │         └── Auto-send to kitchen [DD]: Immediately / X minutes before pickup
 │
 ├── Orders Hub
 │    ├── Order queue board (Kanban)
 │    │    ├── Incoming column
 │    │    ├── Preparing column
 │    │    └── Ready for Pickup/Delivery column
 │    │
 │    └── Order Ready Notifications
 │         ├── [TOG] SMS notification when order ready
 │         ├── SMS template [T] (Amharic + English) 🇪🇹
 │         └── [TOG] Mark KDS-fulfilled orders as ready automatically
 │
 ├── Branding & Customization
 │    ├── Restaurant Logo [IMG]
 │    ├── Banner Image [IMG]
 │    ├── Brand Color [color picker]
 │    ├── Restaurant Description [T] (front-facing)
 │    ├── Description (Amharic) [T] 🇪🇹
 │    ├── [TOG] Show popular items section
 │    ├── [TOG] Show location map
 │    └── Social Media Links
 │         ├── Telegram [T] link 🇪🇹 (primary channel in Ethiopia)
 │         ├── Instagram [T] link
 │         ├── Facebook [T] link
 │         ├── TikTok [T] link
 │         └── Website [T] link
 │
 ├── Delivery Partners 🇪🇹
 │    ├── FIRST-PARTY DELIVERY
 │    │    ├── [TOG] Own delivery fleet
 │    │    └── Delivery staff management link
 │    │
 │    ├── GLOVO ETHIOPIA 🇪🇹
 │    │    ├── [TOG] Glovo integration active
 │    │    ├── Glovo Partner ID [T]
 │    │    ├── API Key [T] (masked)
 │    │    ├── [TOG] Accept Glovo orders automatically
 │    │    └── Commission rate display [read-only]
 │    │
 │    ├── CHEETAH DELIVERY 🇪🇹
 │    │    ├── [TOG] Cheetah integration active
 │    │    ├── Merchant ID [T]
 │    │    └── API Key [T] (masked)
 │    │
 │    ├── YENE DELIVERY 🇪🇹
 │    │    ├── [TOG] Yene integration active
 │    │    └── Partner credentials [T]
 │    │
 │    └── TELEGRAM BOT ORDERING 🇪🇹
 │         ├── [TOG] Telegram bot active
 │         ├── Bot username [T]
 │         ├── Bot token [T] (masked)
 │         └── [BTN] Test bot connection
 │
 └── Hours
      ├── Online Ordering Hours (by dining option)
      │    ├── Takeout hours: Mon–Sun [TIME - TIME per day]
      │    └── Delivery hours: Mon–Sun [TIME - TIME per day]
      │
      └── Schedule Overrides
           ├── [BTN] + Add Override
           │    ├── Date [DATE]
           │    ├── Applies to [DD]: Takeout / Delivery / All
           │    ├── [R] Closed all day / Custom hours
           │    └── Custom TIME range
           └── Holiday Overrides list
```

#### 🇪🇹 Ethiopia Localizations

- **Delivery radius in km** (not miles)
- **Delivery partners**: Glovo (launched Addis Ababa), Cheetah, Yene Delivery — not UberEats/DoorDash/Grubhub
- **Telegram ordering**: extremely popular channel in Ethiopia for restaurant orders
- **SMS notifications**: use local SMS providers (AfricasTalking, Ethio Telecom SMS gateway)
- **Social media**: Telegram > Instagram > Facebook for Ethiopian restaurant marketing
- **Payment on delivery**: cash on delivery still very common — toggle needed

---

### 4.7 PAYMENTS

**Route:** `/merchant/payments`
**Current State:** ❌ Entire tab missing
**Purpose:** Payment methods, discounts, taxes, service charges, tipping, receipts

```
PAYMENTS
 ├── Payment Methods
 │    ├── CASH
 │    │    ├── [TOG] Accept cash payments
 │    │    ├── Opening float [#] ETB
 │    │    └── [TOG] Require cash drawer count at end of day
 │    │
 │    ├── TELEBIRR 🇪🇹
 │    │    ├── [TOG] Accept Telebirr
 │    │    ├── Merchant shortcode [T]
 │    │    ├── API secret [T] (masked)
 │    │    └── [BTN] Test connection
 │    │
 │    ├── CBE BIRR 🇈🇹
 │    │    ├── [TOG] Accept CBE Birr
 │    │    ├── Merchant account number [T]
 │    │    └── API credentials [T]
 │    │
 │    ├── AWASH BANK MOBILE 🇪🇹
 │    │    ├── [TOG] Accept Awash Pay
 │    │    └── Merchant ID [T]
 │    │
 │    ├── SANTIMPAY 🇪🇹
 │    │    ├── [TOG] Accept SantimPay
 │    │    ├── Merchant ID [T]
 │    │    └── API Key [T]
 │    │
 │    ├── QR CODE (Generic) 🇪🇹
 │    │    ├── [TOG] Accept QR payments
 │    │    ├── [BTN] Generate merchant QR code
 │    │    └── [BTN] Download / Print QR
 │    │
 │    ├── CARD (POS Terminal)
 │    │    ├── [TOG] Accept card payments
 │    │    ├── Terminal provider [DD]: CBE POS / Awash POS / Amhara QR / Other
 │    │    └── Terminal ID [T]
 │    │
 │    └── CUSTOM PAYMENT TYPE
 │         ├── [BTN] + Add Custom
 │         │    ├── Name [T] (e.g., "House Account")
 │         │    ├── [TOG] Require manager approval
 │         │    └── [TOG] Allows partial payment
 │         └── Custom types list
 │
 ├── Checks & Receipt Setup
 │    ├── GUEST RECEIPT SETUP
 │    │    ├── Header text [T] (restaurant name auto)
 │    │    ├── Footer text / Thank-you message [T]
 │    │    ├── Footer (Amharic) [T] 🇪🇹
 │    │    ├── Logo [IMG]
 │    │    ├── Show on receipt: [TOG toggles]
 │    │    │    ├── Server name
 │    │    │    ├── Table number
 │    │    │    ├── Order number
 │    │    │    ├── Itemized modifiers
 │    │    │    ├── VAT breakdown (required for VAT compliance) 🇪🇹
 │    │    │    └── TIN number (required by MoR) 🇪🇹
 │    │    └── Print language [R]: English / Amharic / Both 🇪🇹
 │    │
 │    ├── DIGITAL RECEIPTS
 │    │    ├── [TOG] Enable digital receipts
 │    │    ├── Send via [CB]: SMS / Telegram / Email / None 🇪🇹
 │    │    ├── [TOG] Digital signature on receipt
 │    │    └── [TOG] Show suggested tip on digital receipt
 │    │
 │    └── PRINTER & CASH DRAWER CONFIG
 │         ├── Printer list (discovered on network)
 │         ├── Receipt printer assignment per terminal [DD]
 │         └── [TOG] Open cash drawer on cash payment
 │
 ├── Discounts
 │    ├── Discount List (table: Name | Type | Amount | Applies to | Active)
 │    ├── Add Discount
 │    │    ├── Discount Name [T]
 │    │    ├── Discount Name (Amharic) [T] 🇪🇹
 │    │    ├── Discount Type [R]: Percentage / Fixed Amount ETB / Comp (100% off)
 │    │    ├── Amount / Percentage [#]
 │    │    ├── Apply Level [R]: Item level / Check level
 │    │    ├── [TOG] Require manager approval
 │    │    ├── [TOG] Require reason code
 │    │    ├── Availability [CB]: POS / Online / QR Code
 │    │    ├── [TOG] Open discount (staff can enter any amount)
 │    │    └── Discount cap [#] ETB (max value)
 │    │
 │    └── Reason Codes
 │         ├── Reason list (table: Code | Description)
 │         └── [BTN] + Add Reason Code
 │              ├── Code [T] (short code)
 │              └── Description [T]
 │
 ├── Voids & Refunds
 │    ├── Void Reasons
 │    │    ├── Void reason list
 │    │    └── [BTN] + Add void reason [T]
 │    │
 │    └── Refund Rules
 │         ├── [TOG] Allow full refunds
 │         ├── [TOG] Allow partial refunds
 │         ├── Refund window [#] days
 │         └── [TOG] Require manager approval for refunds
 │
 ├── Service Charges
 │    ├── Service Charge List
 │    ├── Add Service Charge
 │    │    ├── Name [T]
 │    │    ├── Name (Amharic) [T] 🇪🇹
 │    │    ├── Amount Type [R]: Percentage / Fixed ETB
 │    │    ├── Amount [#]
 │    │    ├── [R] Auto-applied / Manual
 │    │    ├── Applied to [CB]: Dine-in / Takeout / Delivery
 │    │    ├── [TOG] Taxable service charge
 │    │    └── Revenue Center Assignment [DD]
 │    │
 │    └── Delivery service charge (separate config)
 │
 ├── Tipping
 │    ├── [TOG] Enable tips
 │    ├── Suggested tip presets [#]% [#]% [#]% (3 slots)
 │    ├── [TOG] No-tip option
 │    ├── Tip on [R]: Pre-tax / Post-tax
 │    ├── [TOG] Prompt for tip on digital receipt
 │    └── [TOG] Prompt for tip on QR payment
 │
 ├── Taxes
 │    ├── STANDARD VAT 🇪🇹
 │    │    ├── [TOG] VAT registered
 │    │    ├── VAT rate [#] % (default 15%, pre-filled)
 │    │    ├── Tax Name [T] (default: "VAT")
 │    │    ├── TIN for receipts [T]
 │    │    ├── [TOG] Display VAT on receipt
 │    │    ├── [TOG] Prices inclusive of VAT
 │    │    └── [R] Round on: Check level / Item level
 │    │
 │    ├── ADDITIONAL TAX RATES
 │    │    ├── [BTN] + Add Tax Rate
 │    │    │    ├── Tax Name [T]
 │    │    │    ├── Tax Rate [#] %
 │    │    │    ├── Tax Type [R]: Percentage / Fixed / Compound
 │    │    │    ├── [TOG] Inclusive tax
 │    │    │    └── Apply to [CB]: Dine-in / Takeout / Delivery / All
 │    │    └── Tax group list
 │    │
 │    ├── TAX EXEMPTIONS
 │    │    ├── [TOG] Enable tax exemptions
 │    │    └── Exempt items/categories list
 │    │
 │    └── REVENUE CENTER TAX OVERRIDE
 │         └── Tax rate per revenue center [DD]
 │
 └── Processing Settings
      ├── [TOG] Offline payment mode (stores transactions when connectivity drops)
      ├── Batch close time [TIME picker]
      └── Pre-authorization [TOG] (for large tabs, e.g., hotel accounts)
```

#### 🇪🇹 Ethiopia Localizations

- **No credit card processing** (Stripe/Square not available) — replace with local ETB wallets
- **Telebirr**: Ethio Telecom's mobile money (dominant, ~40M users)
- **CBE Birr**: Commercial Bank of Ethiopia mobile banking
- **SantimPay**: major fintech payment aggregator with loyalty features
- **VAT**: 15% mandatory for businesses >2M ETB/year turnover
- **TIN on receipts**: legally required under MoR regulations
- **Cash on delivery**: very common — toggle for delivery orders
- **Receipt language**: Amharic legally accepted + preferred for most customers

---

### 4.8 MARKETING

**Route:** `/merchant/marketing`
**Current State:** ⚠️ `LoyaltyProgramBuilder.tsx` + `CampaignBuilder.tsx` + `GuestsPageClient.tsx` (to migrate here)

```
MARKETING
 ├── Loyalty Program
 │    ├── SETUP
 │    │    ├── [TOG] Enable loyalty program
 │    │    ├── Program name [T]
 │    │    ├── Program name (Amharic) [T] 🇪🇹
 │    │    ├── Points currency name [T] (e.g., "Stars", "Points", "Niqat" 🇪🇹)
 │    │    └── [IMG] Program logo / badge
 │    │
 │    ├── POINT ACCUMULATION RULES
 │    │    ├── Points per ETB spent [#] (e.g., 1 point per 10 ETB)
 │    │    ├── Minimum order to earn [#] ETB
 │    │    ├── [TOG] Double points on birthdays
 │    │    └── Bonus points for [CB]: First visit / Referral / Specific items
 │    │
 │    ├── REDEMPTION RULES
 │    │    ├── ETB value per point [#] (e.g., 100 points = 10 ETB)
 │    │    ├── Minimum points to redeem [#]
 │    │    └── [TOG] Partial redemption allowed
 │    │
 │    ├── MEMBER MANAGEMENT
 │    │    ├── Member list (searchable)
 │    │    ├── Filter by points tier [DD]
 │    │    ├── [BTN] Add member manually
 │    │    ├── [BTN] Import members (CSV)
 │    │    └── Member profile:
 │    │         ├── Name, phone, email
 │    │         ├── Points balance
 │    │         ├── Tier status
 │    │         └── Visit history
 │    │
 │    ├── TIERS (optional)
 │    │    ├── [TOG] Enable tiered loyalty
 │    │    └── Tier list: Bronze / Silver / Gold (customizable names + thresholds)
 │    │
 │    └── ANALYTICS
 │         ├── Active members [#]
 │         ├── Points issued this month [#]
 │         ├── Points redeemed [#]
 │         ├── Redemption rate [%]
 │         └── Top loyal customers list
 │
 ├── SMS & Telegram Campaigns 🇪🇹
 │    ├── CAMPAIGN LIST
 │    │    ├── Campaigns table: Name | Channel | Sent | Opens | Status
 │    │    └── [BTN] + Create Campaign
 │    │
 │    ├── CAMPAIGN BUILDER
 │    │    ├── Campaign Name [T]
 │    │    ├── Channel [CB]: SMS / Telegram / Email
 │    │    ├── Message [T] (text area, Amharic supported) 🇪🇹
 │    │    ├── Character count [live counter]
 │    │    ├── Audience Segment [DD]:
 │    │    │    All customers / Loyal members / First-time / Inactive 30+ days
 │    │    ├── Send [R]: Now / Schedule
 │    │    ├── Schedule date/time [DATE + TIME] (if scheduled)
 │    │    ├── [BTN] Preview
 │    │    └── [BTN] Send / Schedule
 │    │
 │    └── AUTOMATION FLOWS
 │         ├── [TOG] Welcome message (after first order)
 │         ├── [TOG] Birthday message (on birthday)
 │         ├── [TOG] Win-back message (inactive 30 days)
 │         └── [TOG] Points milestone message
 │
 ├── Promotions & Promo Codes
 │    ├── Promo code list
 │    ├── [BTN] + Create Promo Code
 │    │    ├── Code [T] (e.g., "WELCOME20")
 │    │    ├── Discount link [DD] → Discounts list
 │    │    ├── [TOG] Single use per customer
 │    │    ├── Total usage limit [#]
 │    │    ├── Valid from [DATE] to [DATE]
 │    │    └── Channels [CB]: Online / QR / POS
 │    │
 │    └── Promo analytics: Usage count | Revenue attributed
 │
 ├── Surveys & Feedback
 │    ├── [TOG] Enable post-order survey
 │    ├── Survey channel [CB]: SMS / Telegram / QR code on receipt 🇪🇹
 │    ├── Survey questions (up to 5) [T each]
 │    ├── Rating type [R]: Stars / Emoji / NPS Score
 │    └── Response analytics: Avg rating | NPS score | Comments feed
 │
 ├── Guest Directory (migrated from /merchant/guests)
 │    ├── Guest list (searchable)
 │    │    ├── Search by name / phone / email [T]
 │    │    └── Table: Name | Phone | Visits | Last visit | Total spent | Tags
 │    │
 │    ├── Guest Profile (drawer)
 │    │    ├── Personal info
 │    │    ├── Visit history
 │    │    ├── Order history
 │    │    ├── Loyalty points
 │    │    ├── Notes [T] (free-form)
 │    │    └── Tags [T multi]
 │    │
 │    └── [BTN] Export guest list (CSV)
 │
 ├── Restaurant Info (public-facing)
 │    ├── Restaurant Name [T]
 │    ├── Restaurant Name (Amharic) [T] 🇪🇹
 │    ├── Tagline [T]
 │    ├── Restaurant Image (square, min 400×400px) [IMG]
 │    ├── Banner Image (min 1200px wide) [IMG]
 │    ├── Description [T]
 │    ├── Description (Amharic) [T] 🇪🇹
 │    ├── Social Media Links (Telegram, Instagram, Facebook, TikTok) 🇪🇹
 │    └── lole page URL (read-only, auto-generated)
 │
 └── Hours & Services
      ├── Weekly Schedule
      │    └── Mon–Sun: [TOG open] + [TIME open] – [TIME close]
      └── Service Type Toggles
           ├── [TOG] Dine-in
           ├── [TOG] Takeout
           ├── [TOG] Delivery
           └── [TOG] Catering
```

#### 🇪🇹 Ethiopia Localizations

- **Telegram first**: Ethiopia's #1 messaging app — Telegram bots/channels primary campaign channel
- **SMS**: Africa's Talking or Ethio Telecom SMS gateway
- **Email**: lower penetration — secondary channel
- **Loyalty point name**: allow Amharic name (e.g., "ነጥብ" = "neqit" = points)
- **Fasting campaigns**: auto-trigger "Fasting Menu available" during Tsom (Lent) season
- **Ethiopian holidays**: auto-suggest campaign timing around Enkutatash, Timkat, etc.

---

### 4.9 FRONT OF HOUSE

**Route:** `/merchant/foh`
**Current State:** ⚠️ Stub (`FOH TablesPageClient.tsx` + `TableGrid.tsx` built separately)

```
FRONT OF HOUSE
 ├── Tables & Sections
 │    ├── Floor Plan Builder
 │    │    ├── Section tabs: [+ Add Section]
 │    │    ├── Canvas area (drag-and-drop table placement)
 │    │    ├── Table shapes: [Square] [Round] [Rectangle] [Bar stool]
 │    │    ├── Table properties:
 │    │    │    ├── Table name/number [T]
 │    │    │    ├── Seats [#]
 │    │    │    └── Section assignment [DD]
 │    │    └── [BTN] Save Floor Plan
 │    │
 │    └── Section–Server Assignment
 │         ├── Section [DD] → Assigned staff [DD]
 │         └── Shift-based assignment [optional]
 │
 ├── Order Screen Setup
 │    ├── UI OPTIONS
 │    │    ├── POS mode [DD]: Table Service / Quick Order
 │    │    ├── Max future order days [#]
 │    │    └── Report configuration: Z-Report sections [CB]
 │    │
 │    ├── Modifying Items
 │    │    └── [TOG] Allow change dining option after order placed
 │    │
 │    └── Check Actions
 │         ├── [TOG] Allow split checks
 │         ├── [TOG] Allow transfer to another table
 │         └── [TOG] Require reason for void
 │
 ├── Mobile Dining Solutions
 │    ├── QR CODE ORDERING 🇪🇹
 │    │    ├── [TOG] QR ordering active
 │    │    ├── QR URL prefix [T]
 │    │    ├── [BTN] Generate QR codes (per table)
 │    │    ├── [BTN] Download all QR codes (ZIP)
 │    │    ├── [BTN] Print QR sheet
 │    │    ├── [TOG] Payment via QR (Telebirr/CBE embedded)
 │    │    └── Custom QR ordering landing page branding
 │    │
 │    └── KIOSK SETUP (future hardware)
 │         ├── [TOG] Kiosk active
 │         └── Kiosk settings (grayed out until hardware connected)
 │
 ├── Revenue Centers
 │    ├── Revenue Center List
 │    ├── [BTN] + Add Revenue Center
 │    │    ├── Name [T] (e.g., "Dining Room", "Terrace", "Bar")
 │    │    ├── Menu Assignment [DD]
 │    │    ├── Tax rate assignment [DD]
 │    │    └── Printer assignment [DD]
 │    └── Revenue Center detail (edit same fields)
 │
 └── Guest Messaging
      ├── PRE-SHIFT NOTES
      │    ├── [BTN] + Add Note
      │    ├── Note [T] (visible on POS at clock-in)
      │    └── Auto-expire [DD]: End of shift / Tomorrow / Keep indefinitely
      │
      └── BROADCAST TO STAFF
           ├── Message [T] (push to all active POS sessions)
           └── [BTN] Broadcast Now
```

#### 🇪🇹 Ethiopia Localizations

- **QR ordering**: very high adoption in Ethiopia — primary non-POS interface
- **Floor plans**: terrace/outdoor seating very common in Addis restaurants
- **Payment at QR**: Telebirr/CBE Birr embedded payment in QR flow

---

### 4.10 KITCHEN

**Route:** `/merchant/kitchen` (renamed from `/merchant/boh`)
**Current State:** ⚠️ Stub (KDS app built separately as `/kds` route)

```
KITCHEN
 ├── Dining Options
 │    ├── BUILT-IN OPTIONS
 │    │    ├── Dine In [TOG active] — behavior: table number + server
 │    │    ├── Takeout [TOG active] — behavior: requires customer name
 │    │    ├── Curbside [TOG active] — behavior: takeout + vehicle info
 │    │    └── Delivery [TOG active] — behavior: requires address
 │    │
 │    └── CUSTOM DINING OPTIONS
 │         ├── [BTN] + Add Custom
 │         │    ├── Name [T]
 │         │    ├── Name (Amharic) [T] 🇪🇹
 │         │    ├── Behavior [R]: Dine In / Takeout / Delivery
 │         │    └── [TOG] Allow future orders
 │         └── Custom options list (reorder drag)
 │
 ├── Prep Stations
 │    ├── Prep Station List (table: Name | Printer | KDS | Mode | Active)
 │    ├── [BTN] + Add Prep Station
 │    │    ├── Station Name [T] (e.g., "Grill", "Cold Kitchen", "Pastry")
 │    │    ├── Station Name (Amharic) [T] 🇪🇹
 │    │    ├── Printer Assignment [DD] (connected printers)
 │    │    ├── KDS Assignment [DD] (connected KDS screens)
 │    │    ├── Routing Mode [R]: Print only / Display only / Both
 │    │    ├── [TOG] Route all items to this station
 │    │    └── Item routing rules (select specific items/categories)
 │    │
 │    └── Item → Prep Station Routing
 │         ├── Per menu item: assigned prep station [DD]
 │         └── Per category: default prep station [DD]
 │
 ├── Printer Tickets & KDS
 │    ├── TICKET SETUP
 │    │    ├── Ticket header [T]
 │    │    ├── Print language [R]: Amharic / English / Both 🇪🇹
 │    │    ├── Font size [DD]: Small / Medium / Large
 │    │    ├── [TOG] Print item modifiers
 │    │    ├── [TOG] Print customer name
 │    │    └── [TOG] Print dining option
 │    │
 │    ├── KDS DEVICE CONFIGURATION
 │    │    ├── KDS Device list (linked to /kds app)
 │    │    ├── Per device:
 │    │    │    ├── Device Name [T]
 │    │    │    ├── [TOG] Expediter mode (shows all stations' orders)
 │    │    │    ├── [TOG] Individual item fulfillment
 │    │    │    ├── Fulfillment behavior [DD]: Mark item done / Mark order done
 │    │    │    └── Screen assignment [DD] → prep station
 │    │    └── [BTN] + Provision new KDS device
 │    │
 │    └── KDS DISPLAY SETTINGS
 │         ├── Alert thresholds:
 │         │    ├── Warning time [#] minutes (ticket turns yellow)
 │         │    └── Critical time [#] minutes (ticket turns red)
 │         ├── Color coding rules [custom per dining option]
 │         └── [TOG] Sound alert on new order
 │
 └── Course Firing 🇪🇹
      ├── [TOG] Enable course-based firing
      ├── Courses: Starter / Main / Dessert (add/remove)
      └── [TOG] Auto-fire next course after previous is marked done
```

#### 🇪🇹 Ethiopia Localizations

- **Amharic on KDS**: kitchen staff often more comfortable in Amharic
- **Ticket printing in Amharic**: Epson printers support Ethiopic script via font loading
- **Custom dining options**: "Tsom menu" (fasting order) as a dining option flag
- **Offline resilience**: kitchen continues to function without internet (KDS local mode)
- **Prep station names in Amharic**: e.g., "ማብሰያ" (cooking station)

---

### 4.11 FINANCIAL PRODUCTS

**Route:** `/merchant/financial`
**Current State:** ❌ Missing
**Purpose:** Access to financial services tailored for Ethiopian restaurant businesses

```
FINANCIAL PRODUCTS
 ├── Working Capital Loans 🇪🇹
 │    ├── ELIGIBILITY BANNER
 │    │    ├── Calculated from: GMV (Gross Merchandise Value) last 6 months
 │    │    ├── Eligibility status: Eligible / Not yet eligible
 │    │    └── Eligibility requirements (bullet list)
 │    │
 │    ├── LOAN OFFERS (if eligible)
 │    │    ├── Offer amount (ETB)
 │    │    ├── Repayment rate (% of daily sales)
 │    │    ├── Estimated repayment period
 │    │    └── [BTN] Apply Now → external bank/fintech link
 │    │
 │    └── REPAYMENT DASHBOARD (if active loan)
 │         ├── Amount borrowed (ETB)
 │         ├── Amount repaid (ETB)
 │         ├── Balance remaining (ETB)
 │         └── Daily deduction rate
 │
 ├── Business Bank Account 🇪🇹
 │    ├── CONNECTED BANK ACCOUNTS
 │    │    ├── Account list (bank name + last 4 digits)
 │    │    └── [BTN] + Link Bank Account
 │    │
 │    └── PAYOUT SETTINGS
 │         ├── Primary payout account [DD] (from connected accounts)
 │         └── Payout schedule [DD]: Daily / Weekly / Monthly
 │
 └── Instant Payout 🇪🇹
      ├── [TOG] Enable instant settlement
      ├── Settle to [DD]: Telebirr / CBE Birr / Bank account
      ├── Minimum payout threshold [#] ETB
      └── Payout history table: Date | Amount | Destination | Status
```

#### 🇪🇹 Ethiopia Localizations

- **Working capital**: partner with Ethio Telecom (Telebirr Merchant Loans), DBE (Development Bank of Ethiopia), or local microfinance
- **No Toast Capital equivalent**: build as a marketplace linking to Ethiopian lenders
- **CBE/Awash**: primary bank settlement accounts
- **Instant settlement**: Telebirr for same-day settlement common in Ethiopia

---

### 4.12 INTEGRATIONS

**Route:** `/merchant/integrations`
**Current State:** ⚠️ Stub

```
INTEGRATIONS
 ├── Integration Marketplace
 │    ├── Search integrations [T]
 │    ├── Filter by Category [DD]
 │    │    ├── Accounting
 │    │    ├── Delivery & Ordering
 │    │    ├── Payments
 │    │    ├── Loyalty & CRM
 │    │    ├── Inventory
 │    │    └── Communication
 │    │
 │    ├── Integration cards (grid):
 │    │    ├── [Logo] Name | Category | Status: Connected/Available | [BTN] Connect
 │    │    └── Click → Integration detail page
 │    │
 │    └── CONNECTED INTEGRATIONS tab
 │         └── Active integrations list (manage/disconnect)
 │
 ├── Ethiopian Payment Integrations 🇈🇹
 │    ├── Telebirr [status + config]
 │    ├── CBE Birr [status + config]
 │    ├── SantimPay [status + config]
 │    ├── Awash Pay [status + config]
 │    └── Amhara Bank QR [status + config]
 │
 ├── Delivery Partner Integrations 🇪🇹
 │    ├── Glovo Ethiopia
 │    ├── Cheetah Delivery
 │    └── Yene Delivery
 │
 ├── Communication Integrations 🇪🇹
 │    ├── Africa's Talking (SMS)
 │    ├── Ethio Telecom SMS Gateway
 │    └── Telegram Bot API
 │
 ├── Accounting Integrations
 │    ├── QuickBooks Online (for international-facing businesses)
 │    ├── Xero
 │    └── Custom CSV export for Ethiopian accountants
 │
 ├── Inventory Integrations
 │    └── [Future]: Local inventory software partners
 │
 └── API / Webhooks
      ├── API KEYS
      │    ├── Active keys list (name + last 4 chars of key)
      │    ├── [BTN] Generate New API Key
      │    └── Key scopes [CB]: Orders / Menu / Employees / Reports
      │
      └── WEBHOOKS
           ├── Webhook endpoints list
           ├── [BTN] + Add Endpoint
           │    ├── URL [T]
           │    ├── Events [CB multi]:
           │    │    order.created / order.status_changed / payment.completed /
           │    │    table.opened / table.closed / menu.published
           │    └── [BTN] Test webhook
           └── Webhook delivery log
```

#### 🇪🇹 Integrations Priority Order

1. Telebirr, CBE Birr, SantimPay (payments — critical)
2. Glovo, Cheetah (delivery — operational)
3. Africa's Talking / Ethio Telecom SMS (campaigns)
4. Telegram Bot API (ordering + campaigns)
5. QuickBooks/Xero (accounting — larger restaurants)

---

### 4.13 SHOP

**Route:** `/merchant/shop`
**Current State:** ❌ Missing
**Purpose:** Hardware and software subscriptions marketplace

```
SHOP
 ├── Software & Subscriptions
 │    ├── lole Loyalty [card: price + subscribe]
 │    ├── lole Marketing (SMS/Telegram campaigns) [card]
 │    ├── lole Payroll [card]
 │    ├── lole Reservations (coming soon) [card]
 │    ├── lole Websites (coming soon) [card]
 │    └── API Access / Developer Plan [card]
 │
 ├── POS Hardware
 │    ├── Android Tablet POS [product card]
 │    │    ├── Image
 │    │    ├── Specs
 │    │    ├── Price (ETB)
 │    │    └── [BTN] Order / Request demo
 │    ├── Receipt Printer (Epson TM-T82) [product card]
 │    ├── Cash Drawer [product card]
 │    ├── KDS Screen [product card]
 │    └── QR Code Stand / Menu Holder [product card]
 │
 ├── Accessories
 │    ├── Bluetooth printer [card]
 │    ├── Card reader terminal [card]
 │    └── Network switch / router backup [card]
 │
 └── Checkout Flow
      ├── Cart summary
      ├── Shipping address (must match restaurant address)
      ├── Payment: [R] Bank transfer / Telebirr / CBE Birr
      └── [BTN] Complete Order
```

---

### 4.14 HELP & SUPPORT

**Route:** `/merchant/help`
**Current State:** ✅ `HelpPageClient.tsx` (12KB) — exists

```
HELP & SUPPORT
 ├── Search Knowledge Base [T] + [BTN] Search
 │
 ├── Getting Started
 │    ├── Quick Start Guide (link)
 │    ├── Onboarding checklist progress
 │    └── Video tutorials (YouTube / local hosted)
 │
 ├── Help by Topic (mirrors sidebar tabs)
 │    ├── Menus → menu help articles
 │    ├── Employees → staff help articles
 │    ├── Payments → payments help articles
 │    └── [all tabs listed]
 │
 ├── Contact Support
 │    ├── [BTN] Start Telegram Chat 🇪🇹 (primary support channel)
 │    ├── [BTN] WhatsApp Support
 │    ├── [BTN] Phone Call: +251-XXX-XXXX
 │    ├── Support hours: 8AM–8PM EAT, 7 days/week
 │    └── [BTN] Submit a ticket (form)
 │
 ├── Community (Telegram group link) 🇪🇹
 │    └── "lole Restaurant Partners" community group
 │
 └── Release Notes
      └── Latest updates feed
```

#### 🇪🇹 Ethiopia Localizations

- **Telegram support**: primary support channel (not live chat widget)
- **Phone support**: local Ethiopian number
- **Language**: full Amharic help content eventually
- **Community**: Telegram group (not forum — Ethiopian restaurants use Telegram heavily)

---

## 5. Settings Page Restructure

> **Current location**: `/merchant/setup` (bottom utility link in sidebar)
> **Structure**: Tabbed panel (not a sidebar tab)

### 5.1 Restructured Settings Tabs

The current 6 tabs → rebuilt as 7 tabs:

```
SETTINGS (/merchant/setup)
 ├── [TAB 1] Business Info       (exists, enhance)
 ├── [TAB 2] Restaurant Profile  (NEW — split from Business Info)
 ├── [TAB 3] Financials          (exists, revamp for Ethiopia)
 ├── [TAB 4] Locations           (exists, enhance with sub-city fields)
 ├── [TAB 5] Security            (exists, enhance with Telebirr 2FA)
 ├── [TAB 6] Devices             (NEW — POS/KDS hardware management)
 └── [TAB 7] Modules             (exists, reorder to match new sidebar)
```

### 5.2 TAB 1: Business Info (Enhanced)

**Fields to add / change:**

| Field                        | Type                                                  | Action                               |
| ---------------------------- | ----------------------------------------------------- | ------------------------------------ |
| Business Legal Name          | [T]                                                   | ADD (different from trading name)    |
| TIN Number                   | [T]                                                   | ADD — critical for MoR compliance 🇪🇹 |
| Tax Registration Type        | [DD]: VAT-registered / Non-registered                 | ADD                                  |
| VAT Registration Certificate | [IMG upload]                                          | ADD                                  |
| Business License Number      | [T]                                                   | ADD 🇪🇹                               |
| License Expiry Date          | [DATE]                                                | ADD 🇪🇹                               |
| EFDA Food Safety Cert #      | [T]                                                   | ADD (Ethiopian Food & Drug Admin) 🇪🇹 |
| Commercial Registration #    | [T]                                                   | ADD 🇪🇹                               |
| Business Type                | [DD]: Sole Prop / PLC / Share Company                 | ADD 🇪🇹                               |
| Sub-city                     | [DD] (Addis Ababa sub-cities)                         | ADD 🇪🇹                               |
| Woreda                       | [DD]                                                  | ADD 🇪🇹                               |
| Kebele                       | [T]                                                   | ADD 🇪🇹                               |
| Cuisine Type                 | [DD multi]: Ethiopian / International / Fusion / etc. | ADD                                  |
| Seating Capacity             | [#]                                                   | ADD                                  |
| Currency                     | ETB (read-only)                                       | KEEP                                 |

### 5.3 TAB 2: Restaurant Profile (NEW — split from Business Info)

| Field                     | Type                                                | Notes                     |
| ------------------------- | --------------------------------------------------- | ------------------------- |
| Restaurant Name (English) | [T]                                                 |                           |
| Restaurant Name (Amharic) | [T] 🇪🇹                                              | Required for lole app     |
| Tagline                   | [T]                                                 |                           |
| Logo                      | [IMG]                                               | min 400×400px             |
| Banner Image              | [IMG]                                               | min 1200px wide           |
| Description (English)     | [T area]                                            |                           |
| Description (Amharic)     | [T area] 🇪🇹                                         |                           |
| Operating Hours           | schedule builder                                    | Mon–Sun                   |
| Service Types             | [TOG each]: Dine-in / Takeout / Delivery / Catering |                           |
| Social Media              | Telegram / Instagram / Facebook / TikTok / Website  |                           |
| Public order page URL     | [read-only]                                         |                           |
| Location on map           | [map picker]                                        | Google Maps/OpenStreetMap |

### 5.4 TAB 3: Financials (Revamp)

**Current state**: Has VAT, TOT, bank, fiscal year
**Required changes:**

| Change | Description                                                             |
| ------ | ----------------------------------------------------------------------- |
| REMOVE | TOT (Turnover Tax) — repealed as of 2025                                |
| ADD    | MAT (Minimum Alternative Tax) 2.5% toggle + threshold ETB 2M            |
| UPDATE | PAYE brackets to 2025 amendment (6 bands, tax-free threshold 2,000 ETB) |
| ADD    | POESSA pension rates: employee 7% / employer 11%                        |
| ADD    | Advance income tax (quarterly payments config)                          |
| ADD    | MoR filing schedule (monthly PAYE, annual income tax)                   |
| UPDATE | Fiscal year: "Ethiopian EFY (Meskerem–Pagume)" as default option        |
| ADD    | Withholding Tax (WHT) on purchases from suppliers (2%)                  |
| ADD    | Bank settlement accounts (primary + backup)                             |

### 5.5 TAB 4: Locations (Enhanced)

**Add fields:**

- Sub-city [DD] (14 sub-cities of Addis Ababa + other cities)
- Woreda [DD] (populated based on sub-city)
- Kebele [T]
- Location type [DD]: Main branch / Branch / Kiosk / Cloud kitchen
- Location phone [TEL]
- Google Maps Place ID [T] (for accurate map pin)
- [TOG] Currently operating (quick temporary close)

### 5.6 TAB 5: Security (Enhanced)

| Addition                                 | Notes                            |
| ---------------------------------------- | -------------------------------- |
| Telebirr-linked 2FA [TOG] 🇪🇹             | Verify via Telebirr OTP          |
| App lock PIN [#]                         | 4-digit quick-lock for dashboard |
| Session timeout [DD]                     | 15min / 30min / 1hr / 4hrs       |
| Active sessions list                     | show + [BTN] Revoke all          |
| Login activity log                       | IP, device, time                 |
| [TOG] Require MFA for payroll access     | Mirrors Toast pattern            |
| [TOG] Require MFA for financial products | Mirrors Toast pattern            |

### 5.7 TAB 6: Devices (NEW)

```
DEVICES
 ├── POS Terminals
 │    ├── Device list: Name | Type | Last seen | Status
 │    ├── [BTN] + Provision New Device
 │    │    ├── Device name [T]
 │    │    ├── Device type [DD]: Android Tablet / iPad / Desktop
 │    │    ├── Mode [DD]: Table Service / Quick Order / Takeout / KDS / Payment
 │    │    ├── Revenue Center [DD]
 │    │    └── Pairing code [auto-generated]
 │    │
 │    └── Per device settings:
 │         ├── Default dining option [DD]
 │         ├── Receipt printer [DD]
 │         ├── [TOG] Open cash drawer on payment
 │         ├── [TOG] Allow cash payments
 │         ├── [TOG] Show suggested tip
 │         └── [TOG] Offline mode enabled
 │
 ├── KDS Screens
 │    └── Links to Kitchen → KDS config
 │
 └── Printers
      ├── Printer list: Name | Type | IP | Status
      ├── [BTN] + Add Printer
      │    ├── Printer name [T]
      │    ├── Type [R]: USB / Network / Bluetooth
      │    ├── IP Address [T] (if network)
      │    └── [BTN] Test print
      └── Assign printer to: Receipt / Kitchen ticket / Labels
```

### 5.8 TAB 7: Modules (Reordered)

Match the new sidebar order:

| Module              | Toggle    | Description                  |
| ------------------- | --------- | ---------------------------- |
| Reports             | always on | —                            |
| Employees           | always on | —                            |
| Payroll             | [TOG]     | Enable payroll processing    |
| Takeout & Delivery  | [TOG]     | Enable online ordering       |
| Payments            | always on | —                            |
| Marketing / Loyalty | [TOG]     | Enable loyalty + campaigns   |
| Front of House      | [TOG]     | Enable floor plan + QR       |
| Kitchen / KDS       | [TOG]     | Enable KDS routing           |
| Financial Products  | [TOG]     | Enable loan/banking features |
| Integrations        | always on | —                            |
| Shop                | [TOG]     | Enable hardware shop         |

---

## 6. Ethiopia Localization Reference

### 6.1 Currency & Numbers

| Context       | Format                          |
| ------------- | ------------------------------- |
| Display       | ETB 14,500 or Br. 14,500        |
| Large numbers | 1,500,000 ETB (comma separator) |
| Decimals      | ETB 145.50 (2 decimal places)   |
| Zero          | ETB 0.00                        |
| Input fields  | ETB prefix inside input         |

### 6.2 Date & Calendar

| Context            | Format                                                |
| ------------------ | ----------------------------------------------------- |
| Gregorian date     | DD/MM/YYYY (not US MM/DD)                             |
| Ethiopian date     | GC 2025 = EFY 2017                                    |
| Ethiopian New Year | September 11 (or 12 in leap year) = Meskerem 1        |
| Week starts        | Monday (not Sunday)                                   |
| EFY fiscal year    | Meskerem 1 to Pagume 5 (Jul/Aug to Jul/Aug Gregorian) |
| Display option     | Show both calendars in date pickers                   |

### 6.3 Tax Reference (2025/2026)

| Tax                  | Rate             | Notes                                       |
| -------------------- | ---------------- | ------------------------------------------- |
| VAT                  | 15%              | Mandatory if annual revenue > ETB 2,000,000 |
| MAT                  | 2.5% of turnover | Applies if income tax < 2.5% of turnover    |
| Corporate Income Tax | 30%              | Annual                                      |
| WHT on purchases     | 2%               | Withheld from supplier payments             |
| PAYE bracket 1       | 0%               | 0 – 2,000 ETB/month                         |
| PAYE bracket 2       | 15%              | 2,001 – 4,000 ETB/month                     |
| PAYE bracket 3       | 20%              | 4,001 – 7,000 ETB/month                     |
| PAYE bracket 4       | 25%              | 7,001 – 10,000 ETB/month                    |
| PAYE bracket 5       | 30%              | 10,001 – 14,000 ETB/month                   |
| PAYE bracket 6       | 35%              | > 14,000 ETB/month                          |
| Pension (employee)   | 7%               | POESSA, on gross salary                     |
| Pension (employer)   | 11%              | POESSA                                      |
| OT rate              | ×1.25            | After 8hrs/day or 48hrs/week                |

### 6.4 Payment Providers

| Provider         | Type               | Coverage                    |
| ---------------- | ------------------ | --------------------------- |
| Telebirr         | Mobile money       | 40M+ users, Ethio Telecom   |
| CBE Birr         | Mobile banking     | Commercial Bank of Ethiopia |
| Awash Pay        | Mobile banking     | Awash Bank                  |
| SantimPay        | Payment aggregator | Multi-bank QR + loyalty     |
| Amhara Bank QR   | QR payment         | Aba QR app                  |
| Dashen Amole     | Mobile banking     | Dashen Bank                 |
| Cash             | Still dominant     | In-person payments          |
| Card (local POS) | Credit/debit       | Via bank POS terminals      |

### 6.5 Delivery Partners

| Partner           | Type                  | Integration Priority |
| ----------------- | --------------------- | -------------------- |
| Glovo Ethiopia    | 3rd-party marketplace | P1                   |
| Cheetah Delivery  | Local Ethiopian       | P1                   |
| Yene Delivery     | Local Ethiopian       | P2                   |
| First-party fleet | Own riders            | P1                   |
| Telegram orders   | Self-managed          | P1 (bot integration) |

### 6.6 Communication Channels (Priority Order)

1. **Telegram** (primary — 70%+ Ethiopian restaurants use it for orders)
2. **SMS** via Africa's Talking or Ethio Telecom gateway
3. **Phone call** (in-person/call center support)
4. **Email** (lower adoption — secondary)
5. **WhatsApp** (growing but behind Telegram)

### 6.7 Ethiopian Public Holidays (Auto-Calendar)

| Holiday                         | Gregorian Approx.    | Calendar Type      |
| ------------------------------- | -------------------- | ------------------ |
| Ethiopian Christmas (Gena)      | Jan 7                | Both               |
| Epiphany (Timkat)               | Jan 19               | Both               |
| Adwa Victory Day                | Mar 2                | Gregorian          |
| Good Friday (Siklet)            | Variable (Easter -2) | Ethiopian Orthodox |
| Easter (Fasika)                 | Variable             | Ethiopian Orthodox |
| Labor Day                       | May 1                | Gregorian          |
| Patriots' Victory Day           | May 5                | Gregorian          |
| Downfall of Derg                | May 28               | Gregorian          |
| Eid al-Fitr                     | Variable             | Islamic lunar      |
| Ethiopian New Year (Enkutatash) | Sep 11               | EFY Meskerem 1     |
| Meskel                          | Sep 27               | Ethiopian Orthodox |
| Eid al-Adha                     | Variable             | Islamic lunar      |
| Prophet's Birthday (Mawlid)     | Variable             | Islamic lunar      |

### 6.8 Amharic UI Requirements

| Feature                        | Priority              |
| ------------------------------ | --------------------- |
| Menu item names in Amharic     | P1 — KDS + receipts   |
| Modifier names in Amharic      | P1 — KDS display      |
| Receipt footer in Amharic      | P1 — customer-facing  |
| KDS order display in Amharic   | P2                    |
| Dashboard UI in Amharic        | P3 (full translation) |
| Employee names in Amharic      | P2                    |
| Dining option names in Amharic | P2                    |
| Campaign messages in Amharic   | P1 — legal context    |

### 6.9 Address Structure (Ethiopia)

```
Ethiopian address format:
  Region: [DD] Addis Ababa / Oromia / Amhara / SNNP / Tigray / etc.
  Sub-city (Addis only): [DD]
    Addis Ketema / Akaki Kaliti / Arada / Bole / Gullele /
    Kirkos / Kolfe Keranio / Lideta / Nifas Silk-Lafto / Yeka
  Woreda: [DD] 1–XX (based on sub-city)
  Kebele: [T]
  House/Building number: [T]
  Landmark: [T] (critical — most navigation uses landmarks)
  Google Maps link: [T] or [map picker]
```

---

## 7. Implementation Roadmap

### Phase 1 — Sidebar Restructure (1–2 days)

> **Goal**: New sidebar matches user's 14-tab specification exactly

- [ ] Rename `/merchant/menu` → `/merchant/menus` + redirect
- [ ] Rename `/merchant/team` → `/merchant/employees` + redirect
- [ ] Rename `/merchant/boh` → `/merchant/kitchen` + redirect
- [ ] Update `Sidebar.tsx` — new groupings, icons, sections, routes
- [ ] Create stub pages: `/merchant/payroll`, `/merchant/payments`, `/merchant/financial`, `/merchant/shop`
- [ ] Move Guests tab from sidebar into Marketing

### Phase 2 — Missing Core Tabs (Stub → Functional)

**Priority order:**

| Tab                                      | Effort           | Priority |
| ---------------------------------------- | ---------------- | -------- |
| Payments                                 | High             | P0       |
| Kitchen (Dining options + Prep stations) | Medium           | P0       |
| Reports (Sales + Labor + Tax)            | High             | P0       |
| Payroll                                  | High             | P1       |
| FOH (Floor plan + Revenue centers)       | Medium           | P1       |
| Financial Products                       | Low (thin shell) | P2       |
| Shop                                     | Low (thin shell) | P3       |

### Phase 3 — Settings Rebuild

- [ ] Split Business Info → Business Info + Restaurant Profile tabs
- [ ] Remove TOT from Financials; add MAT + POESSA
- [ ] Update PAYE brackets to 2025 amendment
- [ ] Add Devices tab
- [ ] Enhance Security tab (Telebirr 2FA, session management)
- [ ] Add all Ethiopian compliance fields (TIN, license #, EFDA cert)
- [ ] Add sub-city/woreda/kebele address fields

### Phase 4 — Localization Pass

- [ ] Amharic fields on all menu items + modifiers
- [ ] Amharic receipt templates
- [ ] Ethiopian public holidays auto-calendar
- [ ] Ethiopian date picker (Ethiopic calendar overlay)
- [ ] Telebirr/CBE Birr payment method config fields
- [ ] Ethiopian delivery partner configs (Glovo, Cheetah)

### Phase 5 — Advanced Features

- [ ] Full Payroll Run wizard with PAYE auto-calculation
- [ ] MoR tax report export
- [ ] Telegram bot ordering integration
- [ ] Floor plan drag-and-drop builder
- [ ] Integration marketplace with Ethiopian partners
- [ ] Financial Products (working capital eligibility)

---

## Appendix A — File-Level Change Summary

| File                                              | Action                | Notes                         |
| ------------------------------------------------- | --------------------- | ----------------------------- |
| `src/components/merchant/Sidebar.tsx`             | MODIFY                | New sections + routes + icons |
| `src/app/(dashboard)/merchant/menu/`              | RENAME → `menus/`     | + redirect                    |
| `src/app/(dashboard)/merchant/team/`              | RENAME → `employees/` | + redirect                    |
| `src/app/(dashboard)/merchant/boh/`               | RENAME → `kitchen/`   | + redirect                    |
| `src/app/(dashboard)/merchant/payroll/page.tsx`   | CREATE                | New stub                      |
| `src/app/(dashboard)/merchant/payments/page.tsx`  | CREATE                | New stub                      |
| `src/app/(dashboard)/merchant/financial/page.tsx` | CREATE                | New stub                      |
| `src/app/(dashboard)/merchant/shop/page.tsx`      | CREATE                | New stub                      |
| `src/components/merchant/SetupPageClient.tsx`     | MODIFY                | Add 2 tabs, reorder           |
| `src/components/merchant/BusinessInfoTab.tsx`     | MODIFY                | Ethiopian fields              |
| `src/components/merchant/FinancialsTab.tsx`       | MODIFY                | Remove TOT, add MAT/POESSA    |

---

_Research Sources: Platform_Dashboard_Audit.md (Toast Web April 2026) | Ethiopian VAT/Tax: EY Africa, PwC, MoR | PAYE: Income Tax Amendment No. 1395/2025 | Payroll: POESSA framework | Payments: Telebirr, CBE, SantimPay | Delivery: Glovo Ethiopia | Compliance: Commercial Code 1243/2021, MoTRI_
