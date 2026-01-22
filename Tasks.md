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

**Files Created:** `src/hooks/useOnlineStatus.ts`, `src/components/OfflineBanner.tsx`, `public/manifest.json`  
**Files Modified:** `vite.config.ts`, `package.json`

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

## 1.5 Multi-Restaurant Architecture (Agency Model)

### Folder Structure Setup
- [ ] Create `restaurants/` folder structure:
  ```
  restaurants/
  ├── cafe-lucia/
  │   ├── config.json
  │   ├── menu.json
  │   ├── stations.json
  │   └── assets/
  └── skylight-hotel/
      ├── config.json
      ├── menu.json
      ├── stations.json
      └── assets/
  ```

### Configuration Files
- [ ] Create `restaurants/{restaurant-slug}/config.json` template
- [ ] Create `restaurants/{restaurant-slug}/stations.json` template:
  ```json
  {
    "kitchen": {
      "telegram_chat_id": "-100123456789",
      "enabled": true
    },
    "bar": {
      "telegram_chat_id": "-100987654321",
      "enabled": true
    },
    "dessert": {
      "telegram_chat_id": "-100555555555",
      "enabled": false
    },
    "coffee": {
      "telegram_chat_id": "-100666666666",
      "enabled": true
    }
  }
  ```

### Dynamic Restaurant Loading
- [x] Create `src/lib/restaurantLoader.ts` - Load restaurant config by slug
- [x] Update routing to support `/restaurant-slug` paths
- [x] Update `src/App.tsx` to detect restaurant from URL
- [x] Test multi-restaurant routing

**Files Created:** `restaurants/` folder structure, `src/lib/restaurantLoader.ts`  
**Files Modified:** `src/App.tsx`, routing configuration

---

## 1.6 Database Architecture (PostgreSQL + Google Sheets Dual)

### PostgreSQL Setup
- [ ] Design database schema:
  - [ ] `restaurants` table (id, slug, name, config)
  - [ ] `orders` table (id, restaurant_id, table, order_id, items, total, timestamp)
  - [ ] `order_items` table (id, order_id, dish_id, quantity, price, notes)
  - [ ] `stations` table (id, restaurant_id, name, telegram_chat_id, enabled)

- [ ] Create migration files
- [ ] Set up PostgreSQL connection (environment variables)
- [ ] Create `src/lib/db.ts` - Database connection and queries

### Google Sheets Integration (Keep)
- [ ] Maintain existing Google Sheets logging workflow
- [ ] Add dual-write logic: PostgreSQL + Google Sheets
- [ ] Create sync utility for data consistency

**Files Created:** `src/lib/db.ts`, database migration files  
**Files Modified:** n8n workflows (add PostgreSQL write)

---

## Week 1 Testing Checklist
- [ ] PWA installs and menu loads offline
- [ ] Amharic and English switch correctly
- [ ] Fasting mode filters correctly (manual toggle)
- [ ] Menu data loads with all new fields
- [ ] Multi-restaurant routing works (`/cafe-lucia` vs `/skylight-hotel`)
- [ ] Station configuration loads per restaurant
- [ ] Orders write to both PostgreSQL and Google Sheets

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

## 2.4 Simple Customer Feedback (Internal Only)

### n8n Workflow
- [ ] Create `docs/n8n-workflows/customer-feedback.json`:
  - [ ] Trigger: Order marked complete/paid
  - [ ] Wait 30 minutes (digestion time!)
  - [ ] Send feedback request via Telegram (if phone captured) OR table display
  - [ ] Simple 1-5 star + optional comment
  - [ ] Log response to Google Sheets + PostgreSQL
  - [ ] If negative (<3 stars), alert manager IMMEDIATELY
  - [ ] Internal only - no public review integration

**Files Created:** `docs/n8n-workflows/customer-feedback.json`

---

## 2.5 Station Routing (4 Stations Only)

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

## 2.6 Kitchen Status Buttons (Internal Only)

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
- [ ] Feedback requests send 30 minutes after order

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
- [ ] Pull data from PostgreSQL (primary) + Google Sheets (backup)
- [ ] Generate AI-powered summaries (keep existing OpenRouter integration)
- [ ] Send to owner via Telegram
- [ ] Include: Orders, revenue, popular items, rush periods

**Files Modified:** `docs/n8n-workflow-ar-menu-orders.json` (summary section)

---

## 3.4 Restaurant Onboarding Automation

### Template System
- [ ] Create `scripts/create-restaurant.sh` - Automated restaurant setup script
- [ ] Script should:
  - [ ] Create restaurant folder structure
  - [ ] Copy template config files
  - [ ] Generate stations.json template
  - [ ] Create PostgreSQL restaurant record
  - [ ] Generate QR codes

### Documentation
- [ ] Create `docs/ONBOARDING.md` - Step-by-step onboarding guide
- [ ] Create `docs/RESTAURANT_TEMPLATE.md` - Template structure documentation

**Files Created:** `scripts/create-restaurant.sh`, `docs/ONBOARDING.md`, `docs/RESTAURANT_TEMPLATE.md`

---

## 3.5 Multi-Restaurant n8n Workflow Template

### Master Workflow Template
- [ ] Create `docs/n8n-workflows/master-restaurant-template.json`
- [ ] Design workflow with environment variable placeholders:
  - [ ] `RESTAURANT_SLUG`
  - [ ] `KITCHEN_CHAT_ID`
  - [ ] `BAR_CHAT_ID` (optional)
  - [ ] `DESSERT_CHAT_ID` (optional)
  - [ ] `COFFEE_CHAT_ID` (optional)
  - [ ] `OWNER_CHAT_ID`
  - [ ] `GOOGLE_SHEET_ID`
  - [ ] `POSTGRES_RESTAURANT_ID`

- [ ] Document workflow cloning process
- [ ] Create `docs/N8N_MULTI_RESTAURANT.md` - Multi-restaurant n8n setup guide

**Files Created:** `docs/n8n-workflows/master-restaurant-template.json`, `docs/N8N_MULTI_RESTAURANT.md`

---

## Week 3 Testing Checklist
- [ ] Rush hour alerts trigger at correct threshold
- [ ] Delay escalation alerts after 30/45 minutes
- [ ] End-of-day summaries pull from PostgreSQL correctly
- [ ] Restaurant onboarding script creates all required files
- [ ] Master workflow template clones correctly for new restaurants
- [ ] Multiple restaurants can operate independently

---

# Final Integration & Testing

## End-to-End Testing
- [ ] Complete order flow: Scan QR → Browse → Add to Cart → Submit → Telegram → Sheets + DB
- [ ] Test offline mode: Menu loads offline (no order submission)
- [ ] Test languages: Amharic and English switch correctly
- [ ] Test fasting mode: Manual toggle filters correctly
- [ ] Test station routing: Verify orders go to correct Telegram groups (4 stations)
- [ ] Test multi-restaurant: Switch between restaurants, verify isolation
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
- [ ] Create `docs/DATABASE.md` - PostgreSQL + Google Sheets architecture
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

**Dual Write Pattern:**
- PostgreSQL (primary, for queries, analytics)
- Google Sheets (backup, for restaurant owner familiarity)
- Both updated simultaneously on order submission

---

**Last Updated:** [Date]  
**Current Sprint:** Week 1  
**Next Review:** [Date]
