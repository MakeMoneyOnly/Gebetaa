## 🔍 Toast Web Navigation Audit vs. Your Current Dashboard

---

### YOUR CURRENT NAV (8 tabs) vs. TOAST WEB (12 tabs)

---

### 1. 📊 Dashboard → **KEEP + EXPAND** `[✅ Implemented]`

**Your version:** Basic summary.
**Toast has:** Net Sales, Labor Cost %, Guest Count KPIs, Top Selling Item, week-over-week comparison (vs. prior week, same week last year), Quick Actions tile, hourly sales breakdown, and a live online ordering on/off toggle. Refreshes hourly.

**Action:** Keep the tab, but make it a real operations command center with live metrics and toggles.

**Status:** Tab exists at `/merchant` with command center components (LiveKPICard, CommandCenterHeader, AttentionQueuePanel, AlertRuleBuilderDrawer). Sub-feature expansion ongoing.

---

### 2. 📦 Orders → **REMOVE** `[⚠️ Partial]`

Toast has no standalone "Orders" tab in the left nav. Order data lives inside **Reports → Sales**, and live kitchen orders live on the POS terminal — not in the web dashboard.

**Action:** Remove this tab entirely. Redistribute into Reports (historical) and Takeout & Delivery (order channel config).

**Status:** Removed from desktop sidebar, but still present in MobileBottomNav (`/merchant/orders`). OrdersPageClient and OrdersKanbanBoard components exist.

---

### 3. 🍽 Menu → **KEEP + MASSIVELY EXPAND** `[✅ Implemented]`

**Your version:** Basic menu management.
**Toast has a full "Menus" section with:**

- **Menu Builder** (drag-and-drop, new UX)
- **Menu Manager** (classic full-hierarchy view)
- Items View (browse all items across all menus)
- Modifier Groups
- Pricing strategies: Base / Size / Location-specific / Menu-specific
- Channel Visibility (toggle per menu: in-store, online, 3rd party per partner like DoorDash vs. Uber Eats separately)
- Bulk Management & Advanced Properties (mass editing)
- POS Layout View (preview how menu looks on terminal)
- **Publish Changes** (changes don't go live until you publish — critical workflow)

**Action:** Keep the tab, rename to "Menus", build out all sub-sections especially the publish/staging workflow and channel visibility.

**Status:** Renamed to "Menus" in desktop sidebar (`/merchant/menu`). MenuPageClient and MenuGridEditor components exist. Sub-features (publish workflow, channel visibility, bulk management) still need expansion.

---

### 4. 🪑 Tables & QR → **RENAME TO "Front of House" + EXPAND** `[✅ Implemented]`

**Your version:** Table layout + QR codes.
**Toast's "Front of House" covers:**

- Tables & Sections (floor plan editor)
- Revenue Centers (segment sales by area)
- Dining Options (Dine-In / Takeout / Delivery behaviors)
- POS Terminal Setup & Configuration
- Kiosk Setup (self-order)
- **Toast Tables™** — full reservations & waitlist management
- **Mobile Dining Solutions** — this is where QR / Mobile Order & Pay® lives
- Receipt Settings (header, footer, branding)
- Service Charges & Auto-Gratuity rules

**Action:** Rename to "Front of House." Move QR into the Mobile Dining Solutions sub-section. Add Floor Plans, Revenue Centers, Device config, Kiosks, and Reservations.

**Status:** Renamed to "Front of House" in desktop sidebar (`/merchant/foh`). TablesPageClient, TableGrid, TableSessionDrawer components exist. Sub-features (Revenue Centers, Kiosks, Reservations, Device config) still need expansion.

---

### 5. 👨‍🍳 Back of House → **ADD (entirely missing from your nav)** `[✅ Implemented]`

Toast has a dedicated Back of House section covering:

- Kitchen Display System (KDS) setup and screen configuration
- Kitchen Printer configuration
- Routing Rules (which menu items go to which prep station / printer)
- Prep Stations setup
- Basic Inventory Management (item-level tracking, 86 items)
- Integration point for xtraCHEF / CrunchTime for deeper costing

**Action:** Add this section entirely. Every restaurant operator needs KDS routing and printer config.

**Status:** Added as nav tab in desktop sidebar (`/merchant/boh`). KdsReliabilityPanel component exists. Sub-features (Kitchen Printer config, Routing Rules, Prep Stations, Inventory) still need expansion.

---

### 6. 🛵 Channels → **RENAME TO "Takeout & Delivery" + EXPAND** `[✅ Implemented]`

Your "Channels" partially maps to this, but Toast's version is much more structured:

- **Online Ordering** — enable/disable, approval mode (auto vs. manual), order confirmation emails
- Delivery Setup — your own drivers vs. Toast Delivery Services
- Ordering Hours (separate from restaurant operating hours)
- **Third-Party Ordering** — manage DoorDash, Grubhub, Uber Eats menus + visibility
- Revenue Center mapping for online orders
- Delivery Zones & Fees
- Curbside Pickup settings
- **Catering & Events** module

**Action:** Rename "Channels" to "Takeout & Delivery." Build out all the sub-sections, especially the 3rd party ordering config and catering.

**Status:** Renamed to "Takeout & Delivery" in desktop sidebar (`/merchant/takeout`). ChannelsPageClient, OnlineOrderingSettingsPanel, DeliveryPartnerHub, ChannelHealthBoard components exist. Sub-features (Catering, Delivery Zones, Curbside) still need expansion.

---

### 7. 👷 Team → **ADD (entirely missing)** `[✅ Implemented]`

This is a major gap. Toast's "Team" section is where you manage all human operations:

- Employee Profiles (add, edit, hire, terminate)
- Jobs & Pay Rates
- **POS Access Codes & Role Permissions**
- Scheduling (create and manage shifts, view coverage gaps)
- **Tips Manager** (configure tip pooling rules, nightly closeout automation)
- **Toast Payroll** (run payroll, approve timesheets, manage direct deposit)
- Time Entry Management (view/edit clock-in/out records)
- Employee Onboarding (W-4, direct deposit, SSN collection via MyToast)

**Action:** Add this section. It also absorbs the employee permissions piece from your current "Access & Devices."

**Status:** Added as nav tab in desktop sidebar (`/merchant/team`). StaffPageClient, StaffTable, StaffGrid, RolePermissionDrawer, InviteStaffModal, AddPinStaffModal, TimeClockPanel components exist. Sub-features (Scheduling, Tips Manager, Payroll) still need expansion.

---

### 8. 👥 Guests → **KEEP + EXPAND** `[✅ Implemented]`

The name is right, but Toast's version is far deeper:

- Guest Profiles (full history: visits, spend, preferences, order history)
- **Toast Loyalty™** — full program setup (points, tiers, rewards, signup pages)
- **Gift Cards** — physical and digital, reporting
- Guestbook (feeds from Toast Tables® reservations)
- Feedback & Reviews summary

**Action:** Keep the tab. Add Loyalty program setup, Gift Cards, and profile depth.

**Status:** Tab exists in desktop sidebar (`/merchant/guests`). GuestsPageClient, GuestProfileDrawer, GuestDirectory, LoyaltyProgramBuilder components exist. Sub-features (Gift Cards, Guestbook, Feedback) still need expansion.

---

### 9. 📣 Marketing → **ADD (entirely missing)** `[✅ Implemented]`

Toast has a dedicated Marketing section:

- **Email Marketing** — campaigns with AI writing assistant
- **SMS Campaigns**
- Automated Campaigns (win-back, birthday, lapsed customer)
- Promotions & Offers (discounts, promo codes)
- **Advertising** — run Meta and Google ads directly from Toast
- Campaign Performance Analytics
- **Website Builder** (Toast Websites — AI-generated, auto-syncs with POS menu)

**Action:** Add this section entirely. It's one of Toast's biggest merchant value-adds.

**Status:** Added as nav tab in desktop sidebar (`/merchant/marketing`). CampaignBuilder component exists. Sub-features (Email/SMS campaigns, Advertising, Website Builder, Promotions) still need expansion.

---

### 10. 🔐 Access & Devices → **SPLIT AND DISSOLVE** `[⚠️ Partial]`

This shouldn't be a top-level tab in Toast's model. Split it:

- **Employee access codes & POS roles** → move into **Team**
- **Device setup (terminals, handhelds, KDS, printers)** → move into **Front of House** and **Back of House**
- **Toast Web admin user permissions** → move into **Restaurant Setup**

**Action:** Remove this tab. Distribute its contents across three other sections.

**Status:** No longer a standalone top-level tab in desktop sidebar. Device/access functionality partially absorbed: employee roles moved to Team (RolePermissionDrawer), device provisioning exists (ProvisionDeviceModal in setup). Full dissolution to Front of House and Back of House still needed.

---

### 11. 📈 Analytics → **RENAME TO "Reports" + EXPAND** `[✅ Implemented]`

**Your version:** Basic analytics.
**Toast's "Reports" is the most feature-rich section:**

- **Sales Reports** — Overview, By Item, By Category, By Revenue Center, By Server, By Day Part
- **Labor Reports** — Labor Summary, Cost Breakdown, Time Entry Management, Employee Productivity
- **Payment Reports** — Cash, Credit Card, Voids, Refunds, Discounts & Comps, Exceptions
- Guest Info & Guest Count
- Menu Performance (item mix, top sellers)
- Exceptions Report (manager overrides, comps with employee accountability)
- Downloadable reports (CSV/PDF)
- **Weekly Reporting Dashboard** with year-over-year comparisons

**Action:** Rename to "Reports." Significantly expand with all sub-report categories. This should be your richest section.

**Status:** Renamed to "Reports" in desktop sidebar (`/merchant/reports`). AnalyticsPageClient, RevenueChart, SalesPerformanceChart components exist. Sub-report categories (Labor, Payments, Exceptions, Menu Performance) still need expansion.

---

### 12. 🔌 Integrations → **ADD (entirely missing)** `[✅ Implemented]`

- Browse & Purchase Integrations (200+ partners in a marketplace)
- Manage Active Integrations
- 3rd Party Delivery (DoorDash, Grubhub, Uber Eats)
- Accounting integrations (QuickBooks, Restaurant365)
- Inventory (xtraCHEF, CrunchTime)
- Scheduling (Sling, HotSchedules)
- API Credentials & Webhooks configuration

**Action:** Add this section. Critical for any platform competing with Toast.

**Status:** Added as nav tab in desktop sidebar (`/merchant/integrations`). Sub-features (Marketplace, Active Integrations, API/Webhooks config) still need expansion.

---

### 13. ⚙️ Restaurant Setup → **ADD (entirely missing)** `[⚠️ Partial]`

Toast calls this "Toast Account" and it's the settings/config layer:

- Restaurant Info (name, address, hours, logo, contact)
- Payment Processing (card brands, tipping, cash)
- Tax Rates & Tax Configuration
- Toast Web User Roles & Admin Permissions
- **Publish Config** (publish menu/config changes to one or multiple locations)
- Multi-Location Management
- Payroll Settings
- Notifications & Alerts

**Action:** Add this section. Every merchant needs a place to set up their restaurant basics and manage publishing.

**Status:** Exists as bottom-section "Settings" link (`/merchant/setup`) with SetupPageClient, BusinessInfoTab, and LocationSwitcher components. Not yet a full top-level "Restaurant Setup" section with all sub-features (Payment Processing, Tax Config, Multi-Location, Publish Config).

---

### 14. 🛒 Shop → **ADD** `[❌ Missing]`

Toast lets merchants purchase hardware and upgrades directly from the dashboard. Useful for growth-oriented operators.

**Status:** No page or component exists. Entirely unimplemented.

---

## 🗺 Your Final Nav Blueprint (in Toast's exact order)

| #   | Tab                       | Sub-Sections                                                                 |
| --- | ------------------------- | ---------------------------------------------------------------------------- |
| 1   | 📊 **Dashboard**          | KPIs, Live Sales, Quick Actions, Online Ordering Toggle                      |
| 2   | 📈 **Reports**            | Sales, Labor, Payments, Guest Info, Menu Performance, Exceptions             |
| 3   | 🍽 **Menus**              | Builder, Manager, Items, Modifiers, Pricing, Channel Visibility, Publish     |
| 4   | 🪑 **Front of House**     | Tables & Sections, Revenue Centers, Devices, Kiosks, Reservations, QR/Mobile |
| 5   | 👨‍🍳 **Back of House**      | KDS, Kitchen Printers, Routing, Prep Stations, Inventory                     |
| 6   | 🛵 **Takeout & Delivery** | Online Ordering, Delivery, 3rd Party, Curbside, Catering & Events            |
| 7   | 👷 **Team**               | Employees, Jobs & Pay, Scheduling, Tips Manager, Payroll, Time Entries       |
| 8   | 👥 **Guests**             | Profiles, Loyalty, Gift Cards, Guestbook, Feedback                           |
| 9   | 📣 **Marketing**          | Email, SMS, Automated Campaigns, Promotions, Advertising, Website            |
| 10  | 🔌 **Integrations**       | Marketplace, Active Integrations, API/Webhooks                               |
| 11  | ⚙️ **Restaurant Setup**   | Restaurant Info, Payments, Taxes, User Roles, Multi-Location, Publish Config |
| 12  | 🛒 **Shop**               | Hardware, Supplies, Plan Upgrades                                            |

---

**Quick scoreboard:** You have 8 tabs. Toast has 12. You're keeping 2 as-is, renaming/restructuring 4, removing 2, and need to build 6 completely net-new sections. The biggest gaps are **Team/Labor, Marketing, Back of House, Integrations, and Restaurant Setup** — together those represent the majority of where restaurants actually spend their time in Toast Web.

**Implementation progress:** Desktop sidebar now has 10 nav items matching the Toast blueprint (8 of 12 tabs ✅ implemented, 2 ⚠️ partial, 1 ❌ missing). Mobile nav still uses legacy 8-tab structure. Remaining gaps: Shop tab, full Restaurant Setup elevation, and sub-feature depth across all tabs.
