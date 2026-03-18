# Gebeta Restaurant OS - Toast Feature Implementation Tasks

> **Document Status:** Task Tracking & Implementation Roadmap  
> **Last Updated:** March 17, 2026  
> **Context:** Ethiopia-focused Restaurant OS (Toast for Addis Ababa)

---

## Overview

This document tracks feature implementation status compared to Toast Platform, adapted for Ethiopian market requirements. Features not relevant to Ethiopia have been excluded.

### Implementation Status Summary

| Status         | Count | Description                             |
| -------------- | ----- | --------------------------------------- |
| ✅ COMPLETE    | 45+   | Fully implemented in production         |
| 🔄 IN PROGRESS | 4     | Currently being developed               |
| ⚠️ PARTIAL     | 5     | Partially implemented, needs completion |
| ❌ NOT STARTED | 8     | Not yet implemented                     |

---

## ✅ COMPLETED FEATURES (Ready for Production)

### 1. POS & Restaurant Operations

| Feature             | Status      | Implementation Notes                                                         |
| ------------------- | ----------- | ---------------------------------------------------------------------------- |
| Cloud-based POS     | ✅ Complete | Next.js PWA with offline support                                             |
| Order Management    | ✅ Complete | Full order lifecycle                                                         |
| Menu Management     | ✅ Complete | Real-time menu updates, categories                                           |
| Modifier Management | ✅ Complete | Full modifier support                                                        |
| Open Tickets        | ✅ Complete | Table session management                                                     |
| Multi-Device Sync   | ✅ Complete | Supabase Realtime                                                            |
| Refunds             | ✅ Complete | Full and partial refunds                                                     |
| Course Firing       | ✅ Complete | `fire_mode`, `current_course` fields; `/api/orders/:id/course-fire` endpoint |
| Split Check         | ✅ Complete | Split order endpoint exists                                                  |
| Happy Hour Pricing  | ✅ Complete | `happy_hour_schedules` table, `/api/happy-hour` endpoints                    |

### 2. Kitchen Display System (KDS)

| Feature            | Status      | Implementation Notes                                            |
| ------------------ | ----------- | --------------------------------------------------------------- |
| Station Routing    | ✅ Complete | Kitchen, Bar, Dessert, Coffee                                   |
| Expeditor View     | ✅ Complete | Cross-station consolidation                                     |
| Item Status        | ✅ Complete | queued, in_progress, on_hold, ready                             |
| SLA Timers         | ✅ Complete | Color-coded urgency, pulse animations                           |
| Bump Bar           | ✅ Complete | 1-9 select, S/H/R actions                                       |
| Audio Alerts       | ✅ Complete | With quiet hours support                                        |
| Modifier Styling   | ✅ Complete | Semantic red/green styling                                      |
| Prep Summary       | ✅ Complete | Toggle sidebar                                                  |
| Connected Stations | ✅ Complete | `connected_stations` + KDS multi-station fan-out                |
| Recall             | ✅ Complete | Full recall support                                             |
| Offline Mode       | ✅ Complete | PowerSync + localStorage fallback, `offlineQueue.ts`            |
| Printer Fallback   | ✅ Complete | `printer_jobs` table, `printerFallback.ts`, offline print queue |

### 3. Online Ordering

| Feature            | Status      | Implementation Notes                   |
| ------------------ | ----------- | -------------------------------------- |
| Online Ordering    | ✅ Complete | Guest ordering flow                    |
| Order & Pay        | ✅ Complete | QR-based ordering                      |
| Menu Sync          | ✅ Complete | Same database                          |
| Push Notifications | ✅ Complete | SMS via Africa's Talking, Push via FCM |
| Order Tracker      | ✅ Complete | Tracker page                           |

### 4. Loyalty & Marketing

| Feature            | Status      | Implementation Notes                  |
| ------------------ | ----------- | ------------------------------------- |
| Points Program     | ✅ Complete | Full loyalty accounts system          |
| Guest Profiles     | ✅ Complete | Preferences, visit history            |
| Gift Cards         | ✅ Complete | `/api/gift-cards` endpoints           |
| Campaigns          | ✅ Complete | SMS/Email campaign management         |
| Campaign Analytics | ✅ Complete | Delivery tracking, conversion metrics |

### 5. Payment Processing

| Feature              | Status      | Implementation Notes            |
| -------------------- | ----------- | ------------------------------- |
| Chapa Integration    | ✅ Complete | Ethiopian payment gateway       |
| Telebirr Integration | ✅ Complete | Ethiopian mobile money          |
| Cash Management      | ✅ Complete | Basic tracking                  |
| Tip on Device        | ✅ Complete | Tip suggestions, custom amounts |

### 6. Delivery Services

| Feature                  | Status      | Implementation Notes                        |
| ------------------------ | ----------- | ------------------------------------------- |
| First-Party Delivery     | ✅ Complete | Driver dispatch, Fidel Delivery integration |
| Delivery Partners        | ✅ Complete | Beu, Zmall, Deliver Addis, Esoora webhooks  |
| Order Normalization      | ✅ Complete | `deliveryOrderNormalizer.ts`                |
| Delivery Fee Calculation | ✅ Complete | Distance-based fees                         |
| Delivery Tracking        | ✅ Complete | Real-time driver status                     |
| Driver Management        | ✅ Complete | Dispatch, tracking, status updates          |

### 7. Team Management

| Feature             | Status      | Implementation Notes                           |
| ------------------- | ----------- | ---------------------------------------------- |
| Employee Management | ✅ Complete | Full staff management                          |
| Tip Pooling         | ✅ Complete | `tip_pools`, `tip_pool_shares`, allocation API |
| Scheduling          | ✅ Complete | Basic schedule support                         |
| Time Clock          | ✅ Complete | Basic time entries                             |
| Onboarding          | ✅ Complete | Basic invite flow                              |

### 8. Table Management

| Feature             | Status      | Implementation Notes                                                |
| ------------------- | ----------- | ------------------------------------------------------------------- |
| Floor Plan          | ✅ Complete | Interactive floor plan                                              |
| Table Status        | ✅ Complete | Available, occupied, dirty, reserved                                |
| Waitlist Management | ✅ Complete | Digital waitlist (no SMS notifications - not relevant for Ethiopia) |
| Reservations        | ✅ Complete | Online booking                                                      |
| Server Rotation     | ✅ Complete | Fair table assignment                                               |

---

## 🔄 IN PROGRESS (Currently Being Developed)

### 1. KDS Features

| Feature       | Progress | Notes                                            |
| ------------- | -------- | ------------------------------------------------ |
| Visual Alerts | 70%      | Flash animations, needs more prominence          |
| Grid View     | 60%      | Compact multi-ticket view, fire timer UI pending |

### 2. Reporting

| Feature          | Progress | Notes               |
| ---------------- | -------- | ------------------- |
| Labor Reports    | 60%      | Basic time tracking |
| Menu Performance | 70%      | Basic analytics     |
| Guest Analytics  | 70%      | Basic guest data    |
| Export Options   | 70%      | Basic export        |
| Comparison Views | 70%      | Basic comparisons   |

---

## ⚠️ PARTIAL (Needs Completion)

### 1. POS & Operations

| Feature             | Status     | Gap                             | Priority |
| ------------------- | ---------- | ------------------------------- | -------- |
| Quick Keys          | ⚠️ Partial | Basic grid, needs customization | P2       |
| Discount Management | ⚠️ Partial | No comp tracking                | P2       |
| Cash Management     | ⚠️ Partial | Basic tracking only             | P2       |
| Price Overrides     | ⚠️ Partial | Needs audit trail               | P1       |

---

## ❌ NOT STARTED (Implementation Required)

### P0 - Critical (Immediate Action)

| Feature                 | Description                  | Implementation Approach                   |
| ----------------------- | ---------------------------- | ----------------------------------------- |
| SMS Order Notifications | Order status updates via SMS | Use existing Africa's Talking integration |

### P1 - High Priority

| Feature             | Description               | Implementation Approach                  |
| ------------------- | ------------------------- | ---------------------------------------- |
| Visit-Based Rewards | Rewards after N visits    | Add to existing loyalty system           |
| Tiered Loyalty      | Bronze/Silver/Gold levels | Add tier logic to loyalty                |
| Birthday Rewards    | Automated birthday offers | Add trigger automation                   |
| Email Campaigns     | Automated email marketing | Add email service integration            |
| SMS Marketing       | Text message campaigns    | Already have SMS infrastructure - expand |
| Custom Reports      | Build your own reports    | Report builder UI                        |
| Scheduled Reports   | Auto-email reports        | Cron + email delivery                    |
| Menu Engineering    | Star/Dog/Puzzle matrix    | Profit + popularity calculation          |

### P2 - Medium Priority

| Feature             | Description              | Implementation Approach       |
| ------------------- | ------------------------ | ----------------------------- |
| Delivery Zones      | Geographic boundaries    | Add zone management           |
| Upsell Intelligence | Smart recommendations    | Rule-based engine (see below) |
| Guest Menu Pages    | Mobile menu enhancements | See below                     |

---

## 🆕 Upsell Intelligence Engine

### Types to Implement (No AI/ML):

| Type               | Description                             | Implementation                |
| ------------------ | --------------------------------------- | ----------------------------- |
| **Complementary**  | Items that go together (fries + burger) | Manual configuration per item |
| **Popular**        | Most ordered items globally             | Track order frequency         |
| **Category-based** | Items from same category                | Simple category matching      |
| **Personalized**   | Based on guest order history            | Track guest preferences       |

### Database Changes:

```sql
-- Add upsell configuration per item
ALTER TABLE menu_items ADD COLUMN upsell_tags text[];
ALTER TABLE menu_items ADD COLUMN complementary_items uuid[];

-- Track recommendation effectiveness
CREATE TABLE upsell_analytics (
  id uuid PRIMARY KEY,
  guest_id uuid,
  item_viewed uuid,
  recommended_items uuid[],
  clicked_item uuid,
  added_to_cart boolean,
  order_id uuid,
  created_at timestamptz
);
```

### API Endpoint:

```typescript
// GET /api/menu/items/:id/upsell?guest_id=&cart_items=[]
// Returns: { recommendations: Array<{ item, reason }> }
```

### Frontend Integration:

- Wire up existing `DishRecommendations` component to API
- Remove hardcoded fallback data

---

## 🆕 Guest Menu Pages (Hamburger Menu)

### Pages to Add:

| Page        | Description              | Priority |
| ----------- | ------------------------ | -------- |
| 📍 Location | Map + restaurant address | P0       |
| 🕐 Hours    | Opening hours            | P0       |
| 📞 Contact  | Phone number             | P0       |
| ⭐ About Us | Restaurant story         | P1       |

### Implementation:

- Add to existing Hamburger Menu in Guest Menu
- All pages mobile-responsive (like current Guest Menu)
- No landing page needed

---

## Ethiopia-Specific Considerations

### Payment Methods (Primary)

| Method     | Status      | Notes                             |
| ---------- | ----------- | --------------------------------- |
| Chapa      | ✅ Complete | Primary card/bank gateway         |
| Telebirr   | ✅ Complete | Ethiopian mobile money (dominant) |
| Cash       | ✅ Complete | Always supported as fallback      |
| Gift Cards | ✅ Complete | Implemented                       |

### Excluded Features (Not Relevant for Ethiopia)

| Feature                       | Reason                                 |
| ----------------------------- | -------------------------------------- |
| Google Pay / Apple Pay        | Not widely adopted - use Telebirr      |
| DoorDash / UberEats / Grubhub | Not available in Ethiopia              |
| Google Integration            | Limited in Ethiopia                    |
| Contactless Payments          | Limited card infrastructure            |
| Payroll Processing            | Not a priority                         |
| Forecasting                   | Not a priority                         |
| Labor Optimization            | Not a priority                         |
| HR Toolkit                    | Not a priority                         |
| Inventory Management          | Not a priority                         |
| Waitlist SMS Notifications    | Not relevant - restaurants rarely full |

---

## Implementation Roadmap

### Phase 1: Q2 2026 (Core Operations)

- [ ] Complete KDS Visual Alerts enhancement
- [ ] Complete KDS Grid View with fire timers
- [ ] Complete Price Overrides with audit trail
- [ ] Complete Discount comp tracking

### Phase 2: Q3 2026 (Growth Features)

- [ ] Visit-Based Rewards
- [ ] Tiered Loyalty
- [ ] Upsell Intelligence Engine (Rule-based)
- [ ] Guest Menu Pages (Location, Hours, Contact, About)

### Phase 3: Q4 2026 (Advanced Features)

- [ ] Menu Engineering Matrix
- [ ] Custom Reports Builder
- [ ] Scheduled Reports

---

## Database Schema Reference

Key tables for implemented features:

- `orders` - `fire_mode`, `current_course`, `happy_hour_schedule_id`
- `menu_items` - `connected_stations`
- `tip_pools`, `tip_pool_shares`, `tip_allocations`
- `loyalty_accounts`, `loyalty_programs`, `loyalty_transactions`
- `gift_cards`, `gift_card_transactions`
- `campaigns`, `campaign_deliveries`
- `happy_hour_schedules`
- `delivery_partners`, `external_orders`
- `printer_jobs`
- `notification_queue`, `notification_logs`

---

## API Reference

Implemented endpoints:

- `POST /api/orders/:id/course-fire` - Course firing
- `GET/POST /api/tip-pools` - Tip pooling
- `POST /api/tip-pools/allocate` - Tip allocation
- `GET/POST /api/happy-hour` - Happy hour scheduling
- `GET/POST /api/loyalty/programs` - Loyalty programs
- `POST /api/loyalty/accounts/:id/adjust` - Loyalty adjustments
- `GET/POST /api/gift-cards` - Gift cards
- `POST /api/gift-cards/:id/redeem` - Gift card redemption
- `GET/POST /api/campaigns` - Marketing campaigns
- `POST /api/channels/delivery/connect` - Delivery partner connection
- `GET /api/channels/delivery/orders` - External orders
- `POST /api/delivery/fee` - Delivery fee calculation

---

## Next Steps

1. **Review Partial Implementations** - Validate what's blocking completion
2. **Prioritize P0 Features** - Address SMS Order Notifications
3. **Update ToastFeatureAudit.md** - Reflect actual implementation status
4. **Create Implementation Tickets** - Break down P0/P1 features into actionable tasks
