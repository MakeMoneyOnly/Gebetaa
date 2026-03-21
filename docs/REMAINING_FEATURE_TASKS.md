# Remaining Feature Implementation Tasks

> **Last Updated:** March 20, 2026  
> **Goal:** Achieve 100% feature parity across all categories

---

## Executive Summary

This document tracks all remaining features needed to achieve 100% implementation across all categories. Features are prioritized by business impact and implementation effort.

### Current Status

| Category              | Current | Target | Remaining Tasks |
| --------------------- | ------- | ------ | --------------- |
| POS & Operations      | 93%     | 100%   | 1               |
| KDS                   | 94%     | 100%   | 1               |
| Online Ordering       | 67%     | 100%   | 4               |
| Loyalty & Marketing   | 88%     | 100%   | 1               |
| Payment Processing    | 67%     | 100%   | 2               |
| Delivery Services     | 75%     | 100%   | 2               |
| Team Management       | 80%     | 100%   | 2               |
| Table Management      | 88%     | 100%   | 1               |
| Reporting & Analytics | 83%     | 100%   | 2               |

---

## P0 - Critical (Immediate Priority)

### 1. POS & Operations (93% → 100%)

#### TASK-POS-001: Price Overrides with Audit Trail

**Status:** ❌ Not Started  
**Priority:** P0  
**Effort:** Medium (2-3 days)

**Description:**
Allow staff to manually adjust item prices with mandatory reason codes and full audit trail.

**Requirements:**

- [ ] Add `price_overrides` table with columns:
    - `id`, `order_item_id`, `original_price`, `new_price`, `reason_code`, `staff_id`, `created_at`
- [ ] Create reason codes enum: `manager_discount`, `complimentary`, `price_error`, `customer_complaint`, `other`
- [ ] Implement API endpoint: `POST /api/orders/:orderId/items/:itemId/override-price`
- [ ] Add UI in POS for price override modal
- [ ] Log all overrides to `audit_logs` table
- [ ] Add permission check: only managers can override

**Files to Create/Modify:**

- `supabase/migrations/YYYYMMDD_price_overrides.sql`
- `src/app/api/orders/[orderId]/items/[itemId]/override-price/route.ts`
- `src/components/pos/PriceOverrideModal.tsx`
- `src/lib/services/priceOverrideService.ts`

---

### 2. KDS (94% → 100%)

#### TASK-KDS-001: Fire by Prep Time

**Status:** ❌ Not Started  
**Priority:** P0  
**Effort:** Medium (2-3 days)

**Description:**
Automatically calculate when items should fire based on their prep duration to complete together.

**Requirements:**

- [ ] Add `prep_time_minutes` column to `menu_items` table
- [ ] Create prep time calculation service
- [ ] Implement "smart fire" algorithm that calculates optimal fire times
- [ ] Add visual indicator showing calculated fire time on KDS
- [ ] Create API endpoint: `POST /api/orders/:id/calculate-fire-times`
- [ ] Add KDS setting to enable/disable auto-fire by prep time

**Files to Create/Modify:**

- `supabase/migrations/YYYYMMDD_prep_time.sql`
- `src/lib/kds/prepTimeCalculator.ts`
- `src/app/api/orders/[orderId]/calculate-fire-times/route.ts`
- `src/components/kds/FireTimeIndicator.tsx`

---

### 3. Online Ordering (67% → 100%)

#### TASK-ONLINE-001 Native Mobile App

**Status:** ❌ Not Started  
**Priority:** P2  
**Effort:** High (10-14 days)

**Description:**
Create branded iOS/Android app for loyalty and ordering using React Native or Expo.

**Requirements:**

- [ ] Set up Expo project
- [ ] Implement push notification support
- [ ] Add deep linking to menu
- [ ] Integrate with existing API
- [ ] Create app store deployment pipeline

**Files to Create:**

- `mobile/` (new directory)
- `mobile/app/`
- `mobile/App.tsx`

#### TASK-ONLINE-004: Enhanced Upsells

**Status:** ⚠️ Partial  
**Priority:** P1  
**Effort:** Low (1-2 days)

**Description:**
Enhance the existing upsell API with more recommendation types and better UI integration.

**Requirements:**

- [ ] Add "frequently bought together" recommendations
- [ ] Implement category-based recommendations
- [ ] Add personalized recommendations based on guest history
- [ ] Create upsell analytics dashboard
- [ ] Wire up `DishRecommendations` component to live API

**Files to Modify:**

- `src/app/api/menu/items/[itemId]/upsell/route.ts`
- `src/components/menu/DishRecommendations.tsx`
- `src/lib/services/upsellService.ts`

---

### 4. Loyalty & Marketing (88% → 100%)

#### TASK-LOYALTY-001: Email/SMS Marketing Campaigns

**Status:** ❌ Not Started  
**Priority:** P1  
**Effort:** Medium (3-4 days)

**Description:**
Implement automated email and SMS marketing campaigns with templates and triggers.

**Requirements:**

- [ ] Integrate with email service (Resend or SendGrid)
- [ ] Create email template system
- [ ] Implement campaign triggers: win-back, birthday, new guest
- [ ] Add SMS campaign support via Africa's Talking
- [ ] Create campaign analytics and tracking
- [ ] Add unsubscribe management

**Files to Create/Modify:**

- `src/lib/services/emailService.ts`
- `src/lib/services/marketingCampaignService.ts`
- `src/app/api/campaigns/[id]/send/route.ts`
- `src/components/marketing/CampaignBuilder.tsx`

---

### 5 Delivery Services (75% → 100%)

#### TASK-DELIVERY-001: Third-Party Delivery Aggregator

**Status:** ❌ Not Started  
**Priority:** P1  
**Effort:** High (5-7 days)

**Description:**
Build delivery aggregator integration for Ethiopian delivery platforms.

**Requirements:**

- [ ] Create unified delivery partner interface
- [ ] Implement menu sync to all platforms
- [ ] Build order injection into POS
- [ ] Add order consolidation view
- [ ] Implement status sync between platforms

**Files to Create/Modify:**

- `src/lib/delivery/aggregator.ts`
- `src/app/api/delivery/aggregator/orders/route.ts`
- `src/components/delivery/AggregatorDashboard.tsx`

#### TASK-DELIVERY-002: Real-Time Driver Tracking

**Status:** ⚠️ Partial  
**Priority:** P1  
**Effort:** Medium (3-4 days)

**Description:**
Enhance delivery tracking with real-time GPS updates and guest tracking view.

**Requirements:**

- [ ] Implement driver location updates via WebSocket
- [ ] Create guest tracking page with live map
- [ ] Add ETA calculation based on traffic
- [ ] Implement delivery notifications
- [ ] Add driver mobile app tracking component

**Files to Create/Modify:**

- `src/lib/delivery/trackingService.ts`
- `src/app/(guest)/[slug]/track/[orderId]/page.tsx`
- `src/components/delivery/LiveTrackingMap.tsx`

---

### 7 Reporting & Analytics (83% → 100%)

#### TASK-REPORT-002: Scheduled Reports

**Status:** ❌ Not Started  
**Priority:** P1  
**Effort:** Medium (2-3 days)

**Description:**
Automatically generate and email reports on schedule.

**Requirements:**

- [ ] Create scheduled reports table
- [ ] Implement cron job for report generation
- [ ] Add email delivery integration
- [ ] Support PDF and CSV export formats
- [ ] Add report scheduling UI

**Files to Create:**

- `supabase/migrations/YYYYMMDD_scheduled_reports.sql`
- `src/lib/services/scheduledReportsService.ts`
- `src/app/api/reports/scheduled/route.ts`
- `src/components/reports/ScheduleReportModal.tsx`

---

## P1 - High Priority (Next Quarter)

### Additional Features

#### TASK-MULTI-001: Centralized Menu Management

**Status:** ❌ Not Started  
**Priority:** P1  
**Effort:** Medium (3-4 days)

**Description:**
Push menu changes to all locations from one place.

**Files to Create:**

- `src/lib/services/centralizedMenuService.ts`

---

**Document Owner:** Engineering Team  
**Review Cycle:** Weekly  
**Next Review:** March 27, 2026
