# Gebeta Settings Module — Comprehensive Audit & Roadmap

**Date**: 2026-04-17
**Auditor**: Antigravity
**Scope**: `/merchant/setup` — All 7 sub-tabs + SetupPageClient shell
**Frameworks**: Platform_Dashboard_Audit.md, Toast Parity Analysis, ET Market Localization

---

## Part 1 — Structural Audit of Current Implementation

### Shell: `SetupPageClient.tsx`

| Check                              | Status          | Finding                                                                            |
| ---------------------------------- | --------------- | ---------------------------------------------------------------------------------- |
| 7-tab navigation renders           | ✅              | Tabs render correctly                                                              |
| All tab components imported        | ❌ **CRITICAL** | `IntegrationsTab` is **built but not wired** — not in `TABS[]` array, not rendered |
| Active tab state                   | ✅              | `useState('business')` works                                                       |
| Save button functionality          | ❌ **CRITICAL** | `onClick` missing — button is decorative, saves nothing                            |
| Form state management              | ❌ **CRITICAL** | Zero cross-tab state — every tab is a pure display component                       |
| Merchant data is dynamic           | ❌              | "Cafe Lucia", "#EMP07" hardcoded — no Supabase query                               |
| Responsive layout                  | ✅              | `px-10` with `overflow-x-auto` on tab bar                                          |
| `Integrations` icon import (`Zap`) | ✅              | Imported but unused in TABS                                                        |

> [!CAUTION]
> **`IntegrationsTab` is completely invisible to users.** The component exists at `src/components/merchant/IntegrationsTab.tsx` (249 lines, the most complete tab in the system) but is not registered in `TABS[]` and never rendered. This is a P0 wiring bug.

---

### Tab 1: `BusinessInfoTab.tsx`

| Section                         | Status | Issues                                |
| ------------------------------- | ------ | ------------------------------------- |
| Legal Entity (TIN, name)        | ✅ UI  | All hardcoded, no DB binding          |
| Tax Registration Type           | ⚠️     | `ModernSelect` now imports correctly  |
| Entity Type dropdown            | ⚠️     | Options present but no save           |
| Registered Address              | ✅ UI  | Sub-city/Woreda/Kebele fields present |
| Compliance Documents            | ✅ UI  | Upload buttons non-functional         |
| `Info` icon imported but unused | ⚠️     | Dead import                           |
| `BadgeCheck` import             | ✅     | Used in header                        |

**Missing vs Toast:**

- Account owner contact info (separate from legal entity)
- Registered email / phone for the business account
- Timezone configuration
- Receipt header/footer configuration
- Currency display format (ETB vs USD display)

---

### Tab 2: `RestaurantProfileTab.tsx`

| Section                                           | Status | Issues                                                 |
| ------------------------------------------------- | ------ | ------------------------------------------------------ |
| Logo / Banner upload                              | ⚠️     | UI only, `<input type="file">` missing                 |
| Trading name (EN + AM)                            | ✅ UI  | Both fields present, good ET localization              |
| Tagline + bilingual description                   | ✅ UI  | Present                                                |
| Operating hours (7 days)                          | ⚠️     | All show "08:00 AM – 10:00 PM" hardcoded, no edit flow |
| "Bulk Edit" hours button                          | ❌     | Non-functional                                         |
| Service types (Dine-in/Takeout/Delivery/Catering) | ⚠️     | Toggle state not persisted                             |
| Social: Telegram channel                          | ✅     | Good ET localization                                   |
| Social: Instagram                                 | ✅     | Present                                                |

**Missing vs Toast / ET needs:**

- Google Maps / Waze location pin
- TikTok link (massively popular in ET)
- WhatsApp Business number
- Cuisine type tags / category
- Seating capacity
- Amenities (WiFi, Parking, AC, etc.)
- Holiday / special hours overrides
- Delivery radius configuration
- Min order amount for delivery
- Prep time estimates (displayed to customers)

---

### Tab 3: `FinancialsTab.tsx`

| Section                                | Status | Issues                                                                  |
| -------------------------------------- | ------ | ----------------------------------------------------------------------- |
| VAT rate stat card                     | ⚠️     | **JS Bug**: duplicate `bg` key in object literal (second shadows first) |
| Bank accounts list                     | ✅ UI  | CBE + Awash shown, toggle non-functional                                |
| "Add Account" CTA                      | ❌     | No modal/form                                                           |
| Fiscal Year Calendar dropdown          | ✅ UI  | EFY option present — good                                               |
| Income Tax Frequency toggle            | ⚠️     | Client-only state, no persistence                                       |
| MAT toggle                             | ✅ UI  | Present with correct ET description                                     |
| WHT toggle                             | ✅ UI  | Present                                                                 |
| POESSA toggle                          | ✅ UI  | Present                                                                 |
| `Wallet`, `CreditCard` imported unused | ⚠️     | Dead imports                                                            |

**Missing vs Toast / ET needs:**

- VAT rate configuration field (locked at 15% but should display MoR source)
- TOT (Turnover Tax) configuration for non-VAT registered
- Service charge / cover charge configuration
- Tip configuration (suggested %, custom, no-tip option)
- Split payment rules
- Cash discount program
- Gift card / voucher program settings
- Surcharge rules (card surcharge disclosure as per NBE)
- Withholding tax rate display (2% on purchase, 30% on imports)
- ERCA fiscal receipt prefix/series configuration
- Bank settlement schedule (T+0, T+1, T+2)
- Foreign currency acceptance (USD menu pricing)

---

### Tab 4: `LocationsTab.tsx`

| Section                            | Status | Issues                        |
| ---------------------------------- | ------ | ----------------------------- |
| Location cards                     | ✅ UI  | 2 sample locations            |
| Enable/disable toggle per location | ⚠️     | UI only, no state persistence |
| Address (sub-city/woreda/kebele)   | ✅     | Present                       |
| Phone number                       | ✅     | Present                       |
| "Configure Hardware" CTA           | ❌     | Non-functional (no routing)   |
| "Branch Menu" CTA                  | ❌     | Non-functional (no routing)   |
| "New Location" CTA                 | ❌     | No modal/form                 |
| Merchant Network Overview          | ✅     | Informational only            |

**Missing vs Toast / ET needs:**

- Location-specific operating hours override
- Location-specific tax configuration (different sub-city rates)
- Location-specific payment methods
- Branch manager assignment
- Branch-level KDS routing
- Location-specific receipt header
- Intra-branch transfer settings
- Branch performance dashboard link

---

### Tab 5: `SecurityTab.tsx`

| Section                        | Status     | Issues                                     |
| ------------------------------ | ---------- | ------------------------------------------ |
| MFA (Telebirr-linked)          | ✅ UI      | Present, good ET localization              |
| "Change Telebirr Number"       | ❌         | Non-functional                             |
| Dashboard PIN (4-digit)        | ❌         | "Set PIN" button non-functional            |
| Session Timeout `ModernSelect` | ❌ **BUG** | `options={[  ]}` — **EMPTY OPTIONS ARRAY** |
| Logged-in Devices list         | ✅ UI      | 2 sample sessions                          |
| "Log out of all devices"       | ❌         | Non-functional                             |
| Per-device logout button       | ❌         | Non-functional                             |

> [!WARNING]
> `SecurityTab` line 69: `<ModernSelect options={[  ]} />` — The session timeout dropdown renders with zero options. This is a content bug that must be fixed.

**Missing vs Toast / ET needs:**

- Role-based permission management (who can void orders, apply discounts, etc.)
- IP allowlist / geo-restriction (block non-ET IPs)
- Audit log / activity log viewer
- Password change flow
- Connected app OAuth revocation
- Fayda ID verification status for control persons
- Login history with device fingerprinting
- SSO configuration (for larger chains)

---

### Tab 6: `DevicesTab.tsx`

| Section                                   | Status         | Issues                                           |
| ----------------------------------------- | -------------- | ------------------------------------------------ |
| Hardware summary cards (POS/KDS/Printers) | ✅ UI          | Counts hardcoded                                 |
| POS Terminal list with status             | ✅ UI          | 4 sample devices                                 |
| "Provision New Device" CTA                | ❌             | Non-functional                                   |
| Device settings gear button               | ❌             | Non-functional                                   |
| Network Printers list                     | ✅ UI          | 2 sample printers                                |
| "Print Test" button                       | ❌             | Non-functional                                   |
| **KDS Screens section**                   | ❌ **MISSING** | Audit spec lists KDS but no section in component |
| KDS count shown in header card            | ✅             | Shown as summary but no detail list              |

**Missing vs Toast / ET needs:**

- KDS screen detail list with station routing rules
- Printer routing rules (which items print where)
- Receipt paper size configuration (58mm vs 80mm — common in ET)
- Cash drawer assignment per terminal
- Offline mode configuration
- Device software version / update management
- Receipt template preview
- Barcode scanner pairing
- Customer display (pole display) configuration

---

### Tab 7: `ModulesTab.tsx`

| Section                                                          | Status | Issues                            |
| ---------------------------------------------------------------- | ------ | --------------------------------- |
| 11 module cards rendered                                         | ✅     | All present                       |
| Core modules locked (Reports, Employees, Payments, Integrations) | ✅     | Lock UI works                     |
| Add-on toggles                                                   | ⚠️     | Client state only, no persistence |
| "Learn More" links                                               | ❌     | No href / no-op                   |
| Plan badge ("Premium Plan")                                      | ✅     | Hardcoded                         |

**Missing vs Toast / ET needs:**

- Module pricing/upgrade prompts for locked add-ons
- Version history / changelog per module
- Per-location module enable/disable
- Beta program opt-in flow
- Module dependency warnings (e.g., "Payroll requires Employees")
- Usage statistics per module
- Waitlist join flow for Financial Products

---

### Tab 8: `IntegrationsTab.tsx` (**INVISIBLE — NOT WIRED**)

| Section                               | Status          | Issues                      |
| ------------------------------------- | --------------- | --------------------------- |
| Integration cards (6 ET integrations) | ✅              | Most complete tab in system |
| Connect/Disconnect toggle             | ✅              | Actual React state!         |
| Sync now button                       | ✅              | UI present                  |
| Status bar (connected count)          | ✅              | Dynamic                     |
| Category grouping                     | ✅              | Works                       |
| Document checklist download           | ✅              | Functional (blob download)  |
| **Registered in SetupPageClient**     | ❌ **CRITICAL** | **NOT IN `TABS[]`**         |

---

## Part 2 — Toast POS Settings Architecture Analysis

Based on comprehensive knowledge of Toast's merchant dashboard (toasttab.com), their Settings/Accounts section is organized into these areas:

### Toast Settings Information Architecture

```
Toast Admin > Account
├── Restaurant Info
│   ├── General (name, address, phone, timezone)
│   ├── Dining Options (dine-in, takeout, delivery, drive-thru)
│   ├── Receipt Settings (logo, header/footer text, numbering)
│   └── Website & Online Presence
│
├── Users & Permissions
│   ├── User Management (invite, deactivate)
│   ├── Job Roles with Granular Permissions
│   ├── PIN Management
│   └── Time Clock Rules
│
├── Payments
│   ├── Payment Methods (card brands, cash, gift)
│   ├── Tip Configuration (%, flat, no-tip)
│   ├── Surcharges & Service Charges
│   ├── Split Check Rules
│   ├── Cash Discount Program
│   ├── Refund Policy
│   └── Currency Display
│
├── Notifications & Alerts
│   ├── Email Alerts (daily summary, error alerts)
│   ├── Guest Receipt (email/SMS receipt)
│   └── Staff Alerts
│
├── Hardware & Devices
│   ├── POS Terminal Provisioning
│   ├── KDS Configuration (stations, routing, display time)
│   ├── Printer Setup (routing, paper size, templates)
│   ├── Cash Drawer Assignment
│   ├── Customer Display Setup
│   └── Offline Mode Settings
│
├── Integrations (Toast Ecosystem)
│   ├── Toast Payroll & Team Management
│   ├── Toast Marketing & Loyalty
│   ├── Third-party Marketplace (100+ apps)
│   └── API / Webhook Configuration
│
├── Billing & Subscription
│   ├── Current Plan & Usage
│   ├── Payment Method on File
│   ├── Invoice History
│   └── Add-on Module Management
│
└── Multi-Location
    ├── Location List
    ├── Group-level vs Location-level Config
    ├── Menu Assignment per Location
    └── Cross-location Reporting
```

---

## Part 3 — Gap Analysis: Gebeta vs Toast

### Priority Matrix

| Feature Area                | Toast       | Gebeta                   | Gap Severity | ET Relevance       |
| --------------------------- | ----------- | ------------------------ | ------------ | ------------------ |
| Form persistence / Save     | ✅ Full     | ❌ None                  | 🔴 P0        | Critical           |
| Integrations tab wiring     | ✅ Full     | ❌ Not wired             | 🔴 P0        | Critical           |
| Session timeout options     | ✅ Full     | ❌ Empty dropdown        | 🔴 P0        | High               |
| Dynamic merchant data       | ✅ DB-bound | ❌ Hardcoded             | 🔴 P0        | Critical           |
| Tip configuration           | ✅ Full     | ❌ Missing               | 🔴 P0        | High               |
| KDS station routing rules   | ✅ Full     | ⚠️ Header only           | 🟠 P1        | High               |
| Printer routing templates   | ✅ Full     | ❌ Missing               | 🟠 P1        | High               |
| User roles & permissions    | ✅ Full     | ❌ Missing from Settings | 🟠 P1        | Critical           |
| Receipt template config     | ✅ Full     | ❌ Missing               | 🟠 P1        | High (ERCA format) |
| Billing / plan management   | ✅ Full     | ❌ Missing               | 🟠 P1        | Medium             |
| Notification / alert config | ✅ Full     | ❌ Missing               | 🟠 P1        | Medium             |
| Split check rules           | ✅ Full     | ❌ Missing               | 🟠 P1        | Medium             |
| Surcharge configuration     | ✅ Full     | ❌ Missing               | 🟠 P1        | Medium (NBE)       |
| Operating hours edit flow   | ✅ Full     | ⚠️ UI only               | 🟡 P2        | High               |
| Location-specific overrides | ✅ Full     | ❌ Missing               | 🟡 P2        | High               |
| API key management          | ✅ Full     | ❌ Missing               | 🟡 P2        | Medium             |
| Amenities / tags            | ✅ Full     | ❌ Missing               | 🟡 P2        | Medium             |
| Module pricing prompts      | ✅ Full     | ❌ Missing               | 🟡 P2        | Low                |

---

## Part 4 — Localized Ethiopian Settings Architecture (Target State)

This is the recommended target architecture for Gebeta's Settings module, optimized for the Ethiopian market:

```
Gebeta Admin > Settings (/merchant/setup)
│
├── [Tab 1] Business Info 🇪🇹
│   ├── Legal Entity (TIN, trade/business license, entity type)
│   ├── Control Person (owner details, Fayda ID verification)
│   ├── Registered Address (Region/Sub-city/Woreda/Kebele)
│   ├── Compliance Documents (VAT cert, EFDA, trade license)
│   └── Account Contact (email, phone for platform communications)
│
├── [Tab 2] Restaurant Profile
│   ├── Branding (logo, banner — stored in Supabase Storage)
│   ├── Identity (EN + AM name, tagline, cuisine tags)
│   ├── Description (bilingual EN + AM)
│   ├── Online Presence (Telegram [primary ET], TikTok, Instagram)
│   ├── Operating Hours (per-day with holiday overrides, EFY calendar)
│   ├── Service Types (Dine-in / Takeout / Delivery / Catering)
│   ├── Location & Seating (coordinates, capacity, amenities)
│   └── Prep Times (delivery/takeout ETA shown to customers)
│
├── [Tab 3] Financials & Tax
│   ├── Tax Regime (VAT 15% / TOT 2%/10% selector + MoR registration #)
│   ├── Tax Compliance Toggles (MAT, WHT, POESSA with rates)
│   ├── ERCA Fiscal Receipt Config (prefix, series, signing cert status)
│   ├── Fiscal Calendar (EFY vs Gregorian)
│   ├── Reporting Frequency (Monthly / Quarterly)
│   ├── Settlement Bank Accounts (CBE primary + secondary)
│   ├── Payment Methods & Tip Rules
│   ├── Surcharge / Service Charge Config (NBE disclosure)
│   └── Split Check Rules
│
├── [Tab 4] Payments 🇪🇹  ← NEW TAB
│   ├── Accepted Payment Methods (Telebirr, CBE Birr, EthSwitch, Cash, Card)
│   ├── Tip Configuration (0% / 5% / 10% / 15% / Custom)
│   ├── Cash Discount Program
│   ├── Gift Card / Voucher Rules
│   ├── Split Check Rules
│   └── Refund Authorization Rules
│
├── [Tab 5] Locations
│   ├── Branch cards (add/edit/disable)
│   ├── Per-branch: address, phone, hours override
│   ├── Per-branch: hardware assignment
│   ├── Per-branch: menu assignment
│   ├── Per-branch: manager assignment
│   └── Network Overview (shared legal + tax)
│
├── [Tab 6] Security
│   ├── MFA (Telebirr OTP — primary ET auth channel)
│   ├── Dashboard PIN (4-digit, per-user)
│   ├── Session Timeout (5min / 15min / 30min / 1hr / Never)
│   ├── Role Permissions Matrix (link to Employees section)
│   ├── Fayda ID Verification Status (AML/KYC for control persons)
│   ├── Active Sessions with device fingerprint + geo
│   ├── Login History (last 30 days)
│   └── IP Allowlist (optional, enterprise)
│
├── [Tab 7] Devices & Hardware
│   ├── Summary (POS / KDS / Printers / Scanners counts)
│   ├── POS Terminals (provision, configure, offline mode)
│   ├── KDS Screens (stations, routing rules, display timeout)
│   ├── Receipt Printers (routing: kitchen/customer, paper: 58/80mm)
│   ├── Cash Drawers (assignment to terminal)
│   ├── Receipt Templates (ERCA-compliant header, footer, logo)
│   └── Network Scanner Pairing
│
├── [Tab 8] Integrations 🇪🇹  ← FIX WIRING (component exists)
│   ├── Status Bar (connected / needs setup / errors)
│   ├── Local Connectors (EthSwitch, SIGTAS/MoR, ERCA e-Tax)
│   ├── Mobile Money (Telebirr, CBE Birr, Amole, HelloCash)
│   ├── Payment Processing (Chapa, Stripe for USD)
│   ├── Identity & Compliance (Fayda NIDP)
│   ├── Delivery Partners (Ride, YeneDelivery, Glovo ET)
│   ├── Accounting (QuickET, local accounting software)
│   └── API Keys & Webhook Config
│
├── [Tab 9] Notifications  ← NEW TAB
│   ├── Alert Types (new order, low stock, payment failure, daily summary)
│   ├── SMS Alerts via Telebirr/Ethio Telecom
│   ├── Email Alerts
│   ├── In-app Notifications
│   └── Guest Receipt (SMS / email toggle)
│
└── [Tab 10] Modules & Billing  ← SPLIT from current Modules
    ├── Subscription Plan (current tier + usage)
    ├── Module Feature Flags (enable/disable add-ons)
    ├── Module dependencies / upgrade prompts
    ├── Invoice History (ETB + USD)
    └── Waitlist / Beta Programs
```

---

## Part 5 — Prioritized Implementation Roadmap

### 🔴 P0 — Blockers (Must fix before any new features)

| #       | Task                                                                | File(s)               | Effort   |
| ------- | ------------------------------------------------------------------- | --------------------- | -------- |
| ✅ P0-1 | Wire `IntegrationsTab` into `SetupPageClient` TABS array            | `SetupPageClient.tsx` | 5min     |
| ✅ P0-2 | Fix empty `options` in `SecurityTab` session timeout                | `SecurityTab.tsx`     | 15min    |
| ✅ P0-3 | Fix duplicate `bg` key in `FinancialsTab` stat object               | `FinancialsTab.tsx`   | 5min     |
| ⬜ P0-4 | Connect merchant data from Supabase (replace hardcoded)             | All tabs              | 2-3 days |
| ⬜ P0-5 | Implement tab-level form state + Save action (server action or API) | All tabs              | 3-4 days |

### 🟠 P1 — High Impact (Phase 4 sprint targets)

| #       | Task                                                                  | Effort |
| ------- | --------------------------------------------------------------------- | ------ |
| ✅ P1-1 | KDS station section in DevicesTab                                     | 1 day  |
| ✅ P1-2 | Printer routing rules + receipt template config                       | 2 days |
| ✅ P1-3 | Tip configuration section in Financials/new Payments tab              | 1 day  |
| ✅ P1-4 | Operating hours edit flow (click-to-edit per day + holiday overrides) | 2 days |
| ✅ P1-5 | ERCA fiscal receipt config section                                    | 1 day  |
| ✅ P1-6 | Active session logout (real Supabase auth.signOut)                    | 1 day  |
| ✅ P1-7 | Fayda ID verification status display                                  | 1 day  |
| ✅ P1-8 | Billing / plan management tab                                         | 3 days |

### 🟡 P2 — Completeness (Phase 5)

| #       | Task                                                         | Effort |
| ------- | ------------------------------------------------------------ | ------ |
| ✅ P2-1 | New Payments tab (tips, surcharges, split check, gift cards) | 2 days |
| ✅ P2-2 | New Notifications tab (SMS/email alert config)               | 2 days |
| ✅ P2-3 | Location-specific overrides (hours, menus, hardware)         | 3 days |
| ✅ P2-4 | API key management + webhook config in Integrations          | 2 days |
| ✅ P2-5 | Add TikTok + WhatsApp to Restaurant Profile presence         | 30min  |
| ✅ P2-6 | Amenities/seating/cuisine tags in Restaurant Profile         | 1 day  |
| ✅ P2-7 | Module dependency warnings + upgrade prompts                 | 1 day  |

---

## Part 6 — Immediate Quick Fixes (< 1 hour total)

These can be applied right now with no architectural changes:

- [x]   1. **Wire IntegrationsTab** → Add to `TABS[]` in `SetupPageClient.tsx`
- [x]   2. **Fix session timeout options** → Populate `ModernSelect` in `SecurityTab`
- [x]   3. **Fix JS bug** → Remove duplicate `bg` key in `FinancialsTab`
- [x]   4. **Remove dead imports** → `Info` in BusinessInfoTab, `Wallet`+`CreditCard` in FinancialsTab
- [x]   5. **Fix KDS section** → Add device list section in `DevicesTab`

---

## Summary Scorecard

| Dimension                   | Score | Notes                                                       |
| --------------------------- | ----- | ----------------------------------------------------------- |
| **Structural completeness** | 6/10  | 7 tabs rendered, Integrations invisible                     |
| **Feature depth**           | 4/10  | All display-only, no persistence                            |
| **Toast parity**            | 4/10  | ~40% of Toast settings surface covered                      |
| **ET localization**         | 8/10  | Strong: EFY, Telebirr MFA, ERCA, ET addresses               |
| **Code quality**            | 6/10  | Missing imports fixed; duplicate key + empty options remain |
| **Data layer**              | 1/10  | 100% hardcoded, no Supabase queries                         |
| **Overall readiness**       | 4/10  | Solid UI skeleton, needs data + persistence                 |
