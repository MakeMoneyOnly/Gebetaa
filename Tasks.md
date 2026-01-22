# 📋 Lean Blueprint Implementation - Task Tracker

**Project:** Digital Menu System for Addis Ababa (Agency Model)  
**Timeline:** 3 Weeks (Realistic)  
**Status:** 🟢 Supabase Migration In Progress

---

## 📊 Progress Overview

- **Week 1 (Core Foundation):** 6/8 tasks completed
- **Week 2 (Polish & Intelligence):** 1/6 tasks completed
- **Week 3 (Multi-Restaurant & Scale):** 0/5 tasks completed
- **Supabase Migration:** 2/5 phases completed ✅

**Total Progress:** 7/19 tasks (37%) + Migration Active

---

## 🔄 SUPABASE MIGRATION STATUS

### Phase 1: Database Schema ✅ COMPLETE
- [x] Created `supabase/migrations/001_initial_schema.sql`
- [x] Tables: `restaurants`, `categories`, `items`, `orders`, `stations`, `agency_users`
- [x] Row Level Security (RLS) policies for multi-tenancy
- [x] Triggers for order numbering and timestamps
- [x] Seed data for testing

### Phase 2: Next.js Frontend ✅ COMPLETE
- [x] Initialized `next-ar-menu/` with App Router
- [x] Created `app/[slug]/page.tsx` dynamic routing
- [x] Supabase client (browser + server)
- [x] TypeScript database types
- [x] Migrated contexts (Cart, Language, Fasting)
- [x] Menu components (Header, CategoryTabs, DishCard)
- [x] Cart components (FloatingCartButton, CartDrawer)
- [x] Order API route with webhook forwarding

### Phase 3: n8n Automation 🟡 IN PROGRESS
- [x] Created new workflow: `docs/n8n-workflow-supabase.json`
- [x] Station-based Telegram routing
- [x] "Out of Stock" inline keyboard with callback
- [ ] Deploy workflow to production n8n instance
- [ ] Configure Webhook URL in Next.js env

### Phase 4: Agency Onboarding ✅ COMPLETE
- [x] `/agency-admin/login` - Supabase Auth login
- [x] `/agency-admin/setup` - Protected admin page
- [x] QR code generation (1 to N tables)
- [x] Bulk menu upload feature
- [x] Create new restaurant form

### Phase 5: Security & PWA ⏳ PENDING
- [ ] Verify RLS policies in production
- [ ] Configure PWA caching with next-pwa
- [ ] Test offline menu browsing
- [ ] Rate limiting on n8n endpoints
- [ ] Final security audit

---

## 🎯 Core Principles

**What We're Building:**
- Cleanest ordering + visibility layer in Addis Ababa
- Multi-restaurant agency template system
- Trustworthy, simple, reliable

**What We're NOT Building:**
- ❌ Payment processing
- ❌ Video previews
- ❌ Group ordering
- ❌ Real-time customer status
- ❌ Inventory management
- ❌ Staff performance tracking
- ❌ Loyalty systems
- ❌ AI intelligence
- ❌ Marketing automation
- ❌ Fraud detection dashboards

---

# WEEK 1: Core Foundation

## 🎯 Sprint Goal
Build the essential foundation: Offline menu caching, 2-language support (Amharic + English), manual fasting toggle, station routing (4 stations), and multi-restaurant architecture.

---

## 1.1 Simplified Offline-First PWA

### Setup & Configuration
- [x] Install PWA dependencies: `npm install vite-plugin-pwa workbox-window`
- [x] Update `vite.config.ts` with VitePWA plugin configuration
- [x] Create `public/manifest.json` with branding
- [x] Configure service worker caching strategies (CacheFirst for images, menu data)

### Offline Functionality (Simplified)
- [x] Create `src/hooks/useOnlineStatus.ts` - React hook for connection status
- [x] Create `src/components/OfflineBanner.tsx` - Simple offline indicator
- [ ] Implement menu data caching (no offline order submission)
- [ ] Test offline menu browsing

### Offline Order Sync (Critical for Addis Ababa)
- [ ] Create `src/lib/offlineQueue.ts` - IndexedDB/localStorage queue for pending orders
- [ ] Implement order queue when offline
- [ ] Auto-retry mechanism when connection resumes
- [ ] Show sync status indicator to user
- [ ] Handle duplicate order prevention (deduplication by order ID)
- [ ] Test offline order submission and auto-sync

**Files Created:** `src/hooks/useOnlineStatus.ts`, `src/components/OfflineBanner.tsx`, `public/manifest.json`, `src/lib/offlineQueue.ts`  
**Files Modified:** `vite.config.ts`, `package.json`, `src/components/cart/CartDrawer.tsx`

---

## 1.2 Multi-Language System (Simplified: 2 Languages)

### Language Infrastructure
- [x] Create `src/context/LanguageContext.tsx` with state management
- [x] Implement language persistence (localStorage)
- [x] Create `src/hooks/useTranslation.ts` - Translation hook

### Translation Files
- [x] Create `src/i18n/translations.ts` - Translation loader
- [x] Create `src/i18n/locales/am.json` - Amharic (አማርኛ) translations
- [x] Create `src/i18n/locales/en.json` - English translations
- [x] Create `src/i18n/locales/ar.json` - Arabic (العربية) translations (optional, hotels only)

### UI Components
- [x] Create `src/components/LanguageSwitcher.tsx` with flag icons
- [x] Integrate LanguageSwitcher into `src/components/MenuHeader.tsx`
- [x] Update all components to use `useTranslation()` hook
- [x] Test language switching across all pages

**Files Created:** `src/context/LanguageContext.tsx`, `src/hooks/useTranslation.ts`, `src/i18n/translations.ts`, `src/i18n/locales/am.json`, `src/i18n/locales/en.json`, `src/i18n/locales/ar.json`, `src/components/LanguageSwitcher.tsx`  
**Files Modified:** `src/components/MenuHeader.tsx`, `src/pages/Home.tsx`, `src/pages/Basket.tsx`, `src/pages/Dish.tsx`, all components

---

## 1.3 Manual Fasting Mode Toggle (Simplified)

### Fasting Logic (Manual Only)
- [x] Create `src/context/FastingContext.tsx` with state management
- [x] Simple boolean toggle (no calendar calculations)

### UI Components
- [x] Create `src/components/FastingToggle.tsx` with Orthodox cross icon (☦️)
- [x] Create `src/components/FastingBadge.tsx` - Badge for fasting-friendly items
- [x] Integrate FastingToggle into `src/components/CategoryTabs.tsx`
- [x] Add fasting filter logic to `src/pages/Home.tsx`

**Files Created:** `src/context/FastingContext.tsx`, `src/components/FastingToggle.tsx`, `src/components/FastingBadge.tsx`  
**Files Modified:** `src/components/CategoryTabs.tsx`, `src/pages/Home.tsx`

---

## 1.4 Enhanced Data Models

### Menu Schema Updates
- [x] Update menu schema with new fields:
  - [x] `isFasting` (boolean)
  - [x] `station` (string: "kitchen", "bar", "dessert", "coffee")
  - [ ] `ingredients` (array of strings)
  - [ ] `allergens` (array: "fish", "dairy", "nuts", "gluten", "eggs", "soy")
  - [ ] `popularity` (number 0-100)
  - [ ] `orderCount` (number)
  - [ ] `isChefSpecial` (boolean)
  - [ ] `pairings` (array of dish IDs)
  - [x] `translations` (object with am, en, ar)

- [x] Add fasting category to categories array
- [x] Create sample Ethiopian dishes with translations
- [x] Validate menu schema structure

**Files Modified:** `clients/sample-restaurant/menu/menu.json`

---

## 1.5 Multi-Restaurant Architecture (Database-Driven)

### Restaurant Configuration Storage
- [x] Supabase `restaurants` table with `slug` field (✅ Already implemented)
- [ ] Add `settings` JSONB column to `restaurants` table for Telegram config:
  ```sql
  ALTER TABLE restaurants ADD COLUMN settings JSONB DEFAULT '{}';
  -- Structure: { "telegram_bot_token": "...", "telegram_owner_chat_id": "...", ... }
  ```
- [ ] Create migration: `supabase/migrations/004_add_restaurant_settings.sql`
- [ ] Update restaurant onboarding to store Telegram config in `settings` JSONB

### Dynamic Restaurant Loading
- [x] Create `src/lib/restaurantLoader.ts` - Load restaurant config by slug
- [x] Update routing to support `/restaurant-slug` paths
- [x] Update `src/App.tsx` to detect restaurant from URL
- [x] Test multi-restaurant routing

**Files Created:** `supabase/migrations/004_add_restaurant_settings.sql`  
**Files Modified:** `src/lib/restaurantLoader.ts`, `src/app/agency-admin/setup/AgencySetupClient.tsx`

---

## 1.6 Master Webhook Dispatcher Pattern

### Restaurant Config Lookup in n8n
- [ ] Update n8n workflow to lookup restaurant config from Supabase
- [ ] Add Postgres node after webhook: `SELECT * FROM restaurants WHERE id = $json.restaurant_id`
- [ ] Extract Telegram bot token, chat IDs from `restaurants.settings` JSONB
- [ ] Route orders dynamically based on restaurant config (not hardcoded)
- [ ] Test multi-restaurant routing with different Telegram bots/groups

### n8n Workflow Updates
- [ ] Update `n8n-workflow-supabase.json` to use restaurant config lookup
- [ ] Remove hardcoded Telegram tokens (use dynamic lookup)
- [ ] Add error handling for missing restaurant config
- [ ] Document master webhook pattern in `docs/N8N_ARCHITECTURE.md`

**Files Modified:** `n8n-workflow-supabase.json`  
**Files Created:** `docs/N8N_ARCHITECTURE.md`

---

## 1.7 Kitchen Dashboard (Telegram Mini App) - CRITICAL

### Telegram Mini App Setup
- [ ] Create Telegram Mini App entry point: `src/app/kitchen/[restaurantId]/page.tsx`
- [ ] Configure Mini App in Telegram Bot settings
- [ ] Add Mini App button to kitchen Telegram group (via bot command)

### Kitchen Dashboard Component
- [ ] Create `src/components/kitchen/KitchenDashboard.tsx` - Main dashboard component
- [ ] Create `src/components/kitchen/OrderList.tsx` - List of pending orders
- [ ] Create `src/components/kitchen/OrderCard.tsx` - Individual order display
- [ ] Implement real-time order fetching (polling every 5-10 seconds from Supabase)
- [ ] Add sound alert for new orders (Web Audio API, loud notification sound)
- [ ] Add order status update buttons (Preparing/Ready/Issue)
- [ ] Style for tablet display (large touch targets, clear typography)

### Order Status Updates
- [ ] Create API route: `src/app/api/kitchen/update-status/route.ts`
- [ ] Update order status in Supabase
- [ ] Trigger n8n webhook for status change notifications (optional)
- [ ] Test status updates from Kitchen Dashboard

**Files Created:** `src/app/kitchen/[restaurantId]/page.tsx`, `src/components/kitchen/KitchenDashboard.tsx`, `src/components/kitchen/OrderList.tsx`, `src/components/kitchen/OrderCard.tsx`, `src/app/api/kitchen/update-status/route.ts`  
**Files Modified:** `n8n-workflow-supabase.json` (add status update webhook)

---

## Week 1 Testing Checklist
- [ ] PWA installs and menu loads offline
- [ ] Amharic and English switch correctly
- [ ] Fasting mode filters correctly (manual toggle)
- [ ] Menu data loads with all new fields
- [ ] Multi-restaurant routing works (`/cafe-lucia` vs `/skylight-hotel`)
- [ ] Station configuration loads per restaurant
- [ ] Orders write to Supabase correctly
- [ ] Offline orders queue and sync when connection resumes
- [ ] Master webhook dispatcher routes to correct restaurant Telegram groups
- [ ] Kitchen Dashboard displays pending orders
- [ ] Kitchen Dashboard sound alert plays for new orders
- [ ] Kitchen Dashboard status updates work correctly

---

# WEEK 2: Polish & Intelligence

## 🎯 Sprint Goal
Add rule-based upsells, popularity indicators, ingredient transparency, chef's special, and simple feedback loop.

---

## 2.1 Rule-Based Upsell Intelligence (Not AI)

### Upsell Engine
- [ ] Create `src/lib/upsellRules.ts` - Rule-based recommendation logic
- [ ] Implement "Pairs Well With" (based on pairings data)
- [ ] Implement "Popular Right Now" (from order count data)
- [ ] Implement fasting-day alternatives

### UI Components
- [x] Enhance existing `src/components/UpsellModal.tsx` with new rules
- [ ] Create `src/components/PopularBadge.tsx` - "Most Ordered Today" badge
- [ ] Create `src/components/RecommendationCard.tsx` - "You might also like" card
- [x] Integrate into `src/pages/Home.tsx` and `src/components/DishDetail.tsx`

**Files Created:** `src/lib/upsellRules.ts`, `src/components/PopularBadge.tsx`, `src/components/RecommendationCard.tsx`  
**Files Modified:** `src/components/UpsellModal.tsx`, `src/pages/Home.tsx`, `src/components/DishDetail.tsx`

---

## 2.2 Ingredient Transparency & Allergens

### Components
- [ ] Create `src/components/IngredientList.tsx` - Expandable ingredient display
- [ ] Create `src/components/AllergenIcons.tsx` - Standard allergen icons (🥜 🥛 🐟 🌾 🥚 🫘)
- [ ] Integrate into `src/components/DishDetail.tsx`

**Files Created:** `src/components/IngredientList.tsx`, `src/components/AllergenIcons.tsx`  
**Files Modified:** `src/components/DishDetail.tsx`

---

## 2.3 Chef's Special & Popularity Indicators

### Components
- [ ] Create `src/components/ChefSpecialBanner.tsx` - Featured special dish
- [ ] Enhance `src/components/PopularityBadge.tsx` with order count ("500+ served")
- [ ] Add daily menu logic to `src/pages/Home.tsx`

**Files Created:** `src/components/ChefSpecialBanner.tsx`  
**Files Modified:** `src/components/PopularityBadge.tsx`, `src/pages/Home.tsx`

---

## 2.4 Menu Management Restrictions (Merchant vs Admin)

### Field-Level Permissions
- [ ] Create API route: `src/app/api/menu/update-price/route.ts` - Merchant can update price only
- [ ] Create API route: `src/app/api/menu/update-availability/route.ts` - Merchant can update availability only
- [ ] Create API route: `src/app/api/menu/admin/update-photo/route.ts` - Admin only (block merchants)
- [ ] Create API route: `src/app/api/menu/admin/update-translation/route.ts` - Admin only (block merchants)
- [ ] Add RLS policies to prevent merchant edits to `image_url`, `name_am`, `description_am` fields
- [ ] Create migration: `supabase/migrations/005_menu_edit_restrictions.sql`

### Telegram Mini App for Merchant Menu Editing
- [ ] Create `src/app/merchant/menu/page.tsx` - Merchant menu editing interface
- [ ] Create `src/components/merchant/PriceEditor.tsx` - Price update component
- [ ] Create `src/components/merchant/AvailabilityToggle.tsx` - Availability toggle
- [ ] Integrate with Telegram Mini App (merchant opens via bot command)
- [ ] Add validation: Block photo/translation edits for merchants

**Files Created:** `src/app/api/menu/update-price/route.ts`, `src/app/api/menu/update-availability/route.ts`, `src/app/api/menu/admin/update-photo/route.ts`, `src/app/api/menu/admin/update-translation/route.ts`, `supabase/migrations/005_menu_edit_restrictions.sql`, `src/app/merchant/menu/page.tsx`, `src/components/merchant/PriceEditor.tsx`, `src/components/merchant/AvailabilityToggle.tsx`

---

## 2.5 Audit Logging System

### Database Schema
- [ ] Create `audit_logs` table in Supabase:
  ```sql
  CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id),
    user_id UUID REFERENCES agency_users(id),
    action_type TEXT NOT NULL, -- 'price_update', 'availability_update', 'order_status_change'
    entity_type TEXT NOT NULL, -- 'item', 'order', 'category'
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- [ ] Create migration: `supabase/migrations/006_audit_logs.sql`
- [ ] Add RLS policies for audit log access (admins only)

### Logging Middleware
- [ ] Create `src/lib/auditLogger.ts` - Audit logging utility
- [ ] Log all price changes (who, when, old_value, new_value)
- [ ] Log all menu availability changes
- [ ] Log order lifecycle events (status changes)
- [ ] Integrate audit logging into menu update API routes
- [ ] Integrate audit logging into order status update routes

### Admin Audit View
- [ ] Create `src/app/agency-admin/audit/page.tsx` - Audit log viewing interface
- [ ] Create `src/components/admin/AuditLogTable.tsx` - Display audit logs
- [ ] Add filtering by restaurant, user, action type, date range
- [ ] Add export functionality (CSV/JSON)

**Files Created:** `supabase/migrations/006_audit_logs.sql`, `src/lib/auditLogger.ts`, `src/app/agency-admin/audit/page.tsx`, `src/components/admin/AuditLogTable.tsx`  
**Files Modified:** All menu update API routes, order status update routes

---

## 2.6 Station Routing (4 Stations Only)

### n8n Workflow Updates
- [ ] Update `docs/n8n-workflow-ar-menu-orders.json` with station routing logic
- [ ] Implement 4-station mapping:
  - [ ] 🍳 Kitchen (MANDATORY) - Mains, starters, hot food
  - [ ] 🍹 Bar (Common) - Alcoholic drinks, mocktails, soft drinks
  - [ ] 🍰 Dessert/Pastry (Optional) - Desserts, cakes, ice cream
  - [ ] ☕ Coffee/Juice (Addis-specific) - Coffee, tea, juice

- [ ] Implement item grouping by station in n8n Code node
- [ ] Create separate Telegram messages per station
- [ ] Only send to enabled stations (check stations.json)
- [ ] Test station routing with sample orders

**Files Modified:** `docs/n8n-workflow-ar-menu-orders.json`

---

## 2.7 Kitchen Status Buttons (Internal Only)

### Telegram Inline Buttons (Kitchen Use Only)
- [ ] Add inline keyboard to kitchen Telegram messages:
  - [ ] "🔥 Preparing" button
  - [ ] "✅ Ready" button
  - [ ] "⚠️ Issue" button

- [x] Create n8n Workflow for Order Management
- [ ] Connect n8n Webhook in `CartDrawer.tsx` (Already implemented, needing verification)
- [x] Fix Supabase RLS Recursion (002_fix_rls.sql)
- [x] Restore Premium UI (BottomNav, PromoCarousel, DishCard)
- [ ] Restore Dish Detail Page
- [ ] Update order status in PostgreSQL + Google Sheets on callback
- [ ] **DO NOT** send status updates to customers (internal only)
- [ ] Test status updates end-to-end

**Files Modified:** `docs/n8n-workflow-ar-menu-orders.json`  
**New Workflow:** `docs/n8n-workflows/status-tracking.json`

---

## Week 2 Testing Checklist
- [ ] Upsell suggestions appear based on cart items
- [ ] Popularity badges show accurate counts
- [ ] Allergen icons display properly
- [ ] Chef's special banner displays correctly
- [ ] Orders route to correct station Telegram groups (4 stations)
- [ ] Status buttons update order status (internal only)
- [ ] Merchants can edit prices but not photos/translations
- [ ] Admin can edit photos and translations
- [ ] Audit logs capture all price and availability changes
- [ ] Audit log viewer displays correctly with filters

---

# WEEK 3: Multi-Restaurant & Scale

## 🎯 Sprint Goal
Complete multi-restaurant onboarding system, rush hour alerts, delay escalation, and end-of-day summaries.

---

## 3.1 Rush Hour Alerts (Simplified)

### n8n Workflow
- [ ] Create `docs/n8n-workflows/rush-hour-alerts.json`
- [ ] Count orders in last 30 minutes (per restaurant)
- [ ] If threshold exceeded (>20 orders), alert owner/manager via Telegram
- [ ] Simple threshold alert - no AI suggestions
- [ ] Log rush periods to Google Sheets + PostgreSQL

**Files Created:** `docs/n8n-workflows/rush-hour-alerts.json`

---

## 3.2 Delay Escalation

### n8n Workflow
- [ ] Create `docs/n8n-workflows/delay-escalation.json`
- [ ] Schedule check 30 minutes after order
- [ ] If status not "Served", alert manager
- [ ] Escalate to owner after 45 minutes
- [ ] Send kitchen reminder

**Files Created:** `docs/n8n-workflows/delay-escalation.json`

---

## 3.3 End-of-Day Summaries (Enhanced)

### n8n Workflow Updates
- [ ] Enhance existing daily/weekly/monthly summary workflows
- [ ] Pull data from Supabase (PostgreSQL)
- [ ] Generate AI-powered summaries (keep existing OpenRouter integration)
- [ ] Send to owner via Telegram
- [ ] Include: Orders, revenue, popular items, rush periods

**Files Modified:** `docs/n8n-workflow-ar-menu-orders.json` (summary section)

---

## 3.4 Restaurant Onboarding Automation

### Database-Driven Onboarding
- [ ] Create `scripts/create-restaurant.ts` - Automated restaurant setup script (Node.js)
- [ ] Script should:
  - [ ] Create Supabase restaurant record via API
  - [ ] Create default stations (kitchen, bar, dessert, coffee)
  - [ ] Generate QR codes via API
  - [ ] Setup default Telegram bot configuration in `restaurants.settings` JSONB
  - [ ] Create agency user association

### Documentation
- [ ] Create `docs/ONBOARDING.md` - Step-by-step onboarding guide
- [ ] Create `docs/RESTAURANT_SETUP.md` - Database-driven setup documentation

**Files Created:** `scripts/create-restaurant.ts`, `docs/ONBOARDING.md`, `docs/RESTAURANT_SETUP.md`

---

## 3.5 n8n Queue Mode Deployment

### Queue Mode Setup
- [ ] Deploy n8n in Queue Mode (main + workers) using `infrastructure/n8n/docker-compose.yml`
- [ ] Configure Redis for job queue
- [ ] Scale workers: `docker-compose up -d --scale n8n-worker=3`
- [ ] Test job distribution across workers
- [ ] Monitor queue health and worker performance

### Error Trigger Workflow
- [ ] Create `docs/n8n-workflows/error-trigger.json` - Global error handler
- [ ] Configure Error Trigger to catch all workflow failures
- [ ] Setup admin Telegram bot for error notifications
- [ ] Send error alerts with context (restaurant_id, order_id, error message)
- [ ] Log errors to Supabase `audit_logs` table

### Production Configuration
- [ ] Configure n8n environment variables (database, Redis, encryption key)
- [ ] Setup SSL/TLS for n8n webhook endpoints
- [ ] Configure rate limiting per restaurant
- [ ] Test failover scenarios (worker crashes, Redis disconnection)

**Files Created:** `docs/n8n-workflows/error-trigger.json`, `docs/N8N_QUEUE_MODE.md`  
**Files Modified:** `infrastructure/n8n/docker-compose.yml`

---

## Week 3 Testing Checklist
- [ ] Rush hour alerts trigger at correct threshold
- [ ] Delay escalation alerts after 30/45 minutes
- [ ] End-of-day summaries pull from Supabase correctly
- [ ] Restaurant onboarding script creates database records correctly
- [ ] n8n Queue Mode handles multiple restaurants simultaneously
- [ ] Error Trigger workflow sends notifications to admin bot
- [ ] Multiple restaurants can operate independently
- [ ] Workers scale correctly under load

---

# Final Integration & Testing

## End-to-End Testing
- [ ] Complete order flow: Scan QR → Browse → Add to Cart → Submit → Telegram → Supabase
- [ ] Test offline mode: Menu loads offline, orders queue locally
- [ ] Test offline order sync: Orders auto-submit when connection resumes
- [ ] Test languages: Amharic and English switch correctly
- [ ] Test fasting mode: Manual toggle filters correctly
- [ ] Test station routing: Verify orders go to correct Telegram groups (4 stations)
- [ ] Test Kitchen Dashboard: Orders display, sound alerts work, status updates function
- [ ] Test menu management: Merchants can edit prices/availability, cannot edit photos/translations
- [ ] Test audit logging: All changes are logged correctly
- [ ] Test multi-restaurant: Switch between restaurants, verify isolation
- [ ] Test master webhook: Orders route to correct restaurant Telegram bots/groups
- [ ] Test all n8n workflows: Verify each workflow executes correctly

## Performance Testing
- [ ] PWA loads offline in <3 seconds
- [ ] Language switching is instant
- [ ] AR models load smoothly
- [ ] Order submission completes in <2 seconds
- [ ] Multi-restaurant switching is fast

## Documentation
- [ ] Update `README.md` with multi-restaurant architecture
- [ ] Update `BLUEPRINT.md` with simplified feature set
- [ ] Create `docs/MULTI_RESTAURANT.md` - Agency model documentation
- [ ] Create `docs/DATABASE.md` - Supabase architecture documentation
- [ ] Create `docs/KITCHEN_DASHBOARD.md` - Kitchen Dashboard setup guide
- [ ] Create `docs/MENU_MANAGEMENT.md` - Menu editing restrictions documentation
- [ ] Create `docs/AUDIT_LOGGING.md` - Audit logging system documentation
- [ ] Update all existing docs with simplified features

---

# Architecture Notes

## Multi-Restaurant Structure

```
ar-menu-agency/
├── core/
│   ├── src/                    # Shared React codebase
│   ├── schemas/                # JSON schemas
│   └── n8n/
│       └── master-template.json
├── restaurants/
│   ├── cafe-lucia/
│   │   ├── config.json         # Restaurant config
│   │   ├── menu.json           # Menu data
│   │   ├── stations.json       # Station mapping
│   │   └── assets/             # Images, models
│   └── skylight-hotel/
│       ├── config.json
│       ├── menu.json
│       ├── stations.json
│       └── assets/
└── docs/
```

## Station Mapping (Per Restaurant)

**4 Stations Only:**
1. **🍳 Kitchen** (MANDATORY) - Mains, starters, hot food
2. **🍹 Bar** (Common) - Alcoholic drinks, mocktails, soft drinks  
3. **🍰 Dessert/Pastry** (Optional) - Desserts, cakes, ice cream
4. **☕ Coffee/Juice** (Addis-specific) - Coffee, tea, juice

## Database Architecture

**Single Source of Truth:**
- Supabase (PostgreSQL) - Primary database for all data
- n8n workflows handle analytics and reporting
- No dual-write complexity - simpler, more reliable

---

**Last Updated:** [Date]  
**Current Sprint:** Week 1  
**Next Review:** [Date]
