# Gebeta - Product Requirements Document (PRD)

**Version:** 1.0.0  
**Last Updated:** February 17, 2026  
**Owner:** Product Team  
**Status:** Active

---

## 1. Executive Summary

Gebeta is a comprehensive restaurant operating system designed for Addis Ababa, Ethiopia. Our mission is to become "Toast for Ethiopia" - providing restaurants with a modern, reliable, and affordable platform to manage orders, payments, staff, and guests.

### Key Differentiators

- **Built for Ethiopia**: Native support for Telebirr, Chapa, and local business practices
- **Offline-First**: Reliable operation during intermittent connectivity
- **Mobile-First**: Optimized for the mobile-first Ethiopian market
- **Affordable**: Pricing designed for local restaurant economics
- **Bilingual**: Full Amharic and English support

---

## 2. Problem Statement

### Current Challenges for Addis Ababa Restaurants

1. **Manual Order Management**
    - Paper-based ordering leading to errors and delays
    - No real-time communication between front-of-house and kitchen
    - Lost orders and billing disputes

2. **Payment Fragmentation**
    - No unified system for cash, Telebirr, and card payments
    - Manual reconciliation causing revenue leakage
    - Limited access to digital payment acceptance

3. **Poor Guest Experience**
    - Long wait times for ordering and billing
    - No menu visibility or customization options
    - Inconsistent service quality

4. **Operational Blind Spots**
    - No visibility into sales performance
    - Cannot track inventory or food costs
    - Staff performance unmeasured

5. **Global Solutions Don't Fit**
    - International POS systems are too expensive
    - Don't support local payment methods
    - Require reliable internet (unavailable)
    - No local language support

---

## 3. Target Market

### Primary Market

- **Restaurants in Addis Ababa** (5,000+ potential customers)
- Focus on mid-tier and upscale establishments first
- Cafes, bistros, and full-service restaurants

### Secondary Market

- Hotels with restaurant operations
- Food courts and multi-vendor locations
- Catering companies

### Customer Segments

| Segment         | Description                        | Key Needs                           |
| --------------- | ---------------------------------- | ----------------------------------- |
| Single Location | Independent restaurants            | Easy setup, affordable pricing      |
| Multi-Location  | Chain restaurants (2-10 locations) | Centralized management, reporting   |
| Enterprise      | Large chains (10+ locations)       | Custom integrations, SLA guarantees |

---

## 4. Competitive Analysis

### Global Competitors

| Feature            | Toast   | Square | GloriaFood | Gebeta |
| ------------------ | ------- | ------ | ---------- | ------ |
| Price for Ethiopia | ❌ $$$$ | ❌ $$$ | ❌ $$      | ✅ $   |
| Telebirr Support   | ❌      | ❌     | ❌         | ✅     |
| Chapa Support      | ❌      | ❌     | ❌         | ✅     |
| Offline-First      | ⚠️      | ⚠️     | ❌         | ✅     |
| Amharic Support    | ❌      | ❌     | ❌         | ✅     |
| Local Support      | ❌      | ❌     | ❌         | ✅     |

### Local Competitors

- Paper-based systems (primary competition)
- Basic digital POS systems (limited features)
- WhatsApp-based ordering (no integration)

---

## 5. Product Vision & Strategy

### Vision Statement

> "Every restaurant in Addis Ababa operates efficiently, profitably, and delivers exceptional guest experiences through Gebeta."

### Strategy Phases

#### Phase 1: Foundation (Current)

- Core order management
- Kitchen Display System (KDS)
- QR-based guest ordering
- Basic analytics

#### Phase 2: Growth

- Payment integrations (Telebirr, Chapa)
- Staff management
- Loyalty programs
- Multi-location support

#### Phase 3: Scale

- Inventory management
- Advanced analytics
- Integration marketplace
- Enterprise features

---

## 6. Core Features

### 6.1 Guest Experience (QR Web Link)

#### Feature: QR Code Ordering

- **Description**: Guests scan QR code at table to view menu and order
- **User Story**: As a guest, I want to browse the menu and order from my phone so I don't wait for a waiter
- **Acceptance Criteria**:
    - QR code links to restaurant-specific menu
    - Table number automatically detected
    - Menu available in Amharic and English
    - Order confirmation sent to guest
- **Priority**: P0 (MVP)

#### Feature: Order Status Tracking

- **Description**: Real-time updates on order progress
- **User Story**: As a guest, I want to know when my food is ready
- **Acceptance Criteria**:
    - Status stages: Received → Preparing → Ready → Served
    - Push notification when ready
    - Visual progress indicator
- **Priority**: P0 (MVP)

#### Feature: Service Requests

- **Description**: Request waiter, bill, or assistance
- **User Story**: As a guest, I want to call a waiter without waving
- **Acceptance Criteria**:
    - "Call Waiter" button
    - "Request Bill" button
    - Staff notification with table number
- **Priority**: P0 (MVP)

### 6.2 Kitchen Display System (KDS)

#### Feature: Order Queue

- **Description**: Real-time order display for kitchen staff
- **User Story**: As a kitchen staff, I want to see all orders in one place
- **Acceptance Criteria**:
    - Orders appear instantly when placed
    - Audio/visual alert for new orders
    - Order details clearly displayed
- **Priority**: P0 (MVP)

#### Feature: Order Acknowledgment

- **Description**: Kitchen acknowledges and starts preparing orders
- **User Story**: As a kitchen staff, I want to mark orders as in-progress
- **Acceptance Criteria**:
    - One-tap acknowledgment
    - Status syncs to guest app
    - Timer starts for SLA tracking
- **Priority**: P0 (MVP)

#### Feature: Station Routing

- **Description**: Orders routed to correct station (bar, kitchen, etc.)
- **User Story**: As a kitchen manager, I want drink orders going to the bar
- **Acceptance Criteria**:
    - Items tagged with station
    - Orders filtered by station
    - Cross-station coordination
- **Priority**: P1 (V2)

### 6.3 Merchant Dashboard

#### Feature: Command Center

- **Description**: Real-time overview of restaurant operations
- **User Story**: As a manager, I want to see everything happening now
- **Acceptance Criteria**:
    - Active orders count
    - Table occupancy
    - Staff on duty
    - Revenue today
    - Alerts and issues
- **Priority**: P0 (MVP)

#### Feature: Order Management

- **Description**: View, modify, and manage all orders
- **User Story**: As a manager, I want to handle any order issues
- **Acceptance Criteria**:
    - View all orders (active, completed, cancelled)
    - Modify order items
    - Apply discounts
    - Cancel with reason
    - Refund processing
- **Priority**: P0 (MVP)

#### Feature: Menu Management

- **Description**: Create and manage menu items
- **User Story**: As a manager, I want to update my menu easily
- **Acceptance Criteria**:
    - Add/edit/delete items
    - Organize into categories
    - Set prices and availability
    - Upload photos
    - Schedule availability
- **Priority**: P0 (MVP)

#### Feature: Table Management

- **Description**: Configure tables and generate QR codes
- **User Story**: As a manager, I want to set up my floor plan
- **Acceptance Criteria**:
    - Add/edit tables
    - Assign zones/sections
    - Generate QR codes
    - Print QR codes in bulk
- **Priority**: P0 (MVP)

#### Feature: Staff Management

- **Description**: Manage staff accounts and permissions
- **User Story**: As an owner, I want to control who can access what
- **Acceptance Criteria**:
    - Invite staff via email/phone
    - Assign roles (owner, manager, waiter, kitchen)
    - Set permissions per role
    - Track staff activity
- **Priority**: P1 (V2)

#### Feature: Analytics Dashboard

- **Description**: Sales and performance analytics
- **User Story**: As an owner, I want to understand my business performance
- **Acceptance Criteria**:
    - Daily/weekly/monthly revenue
    - Top-selling items
    - Peak hours analysis
    - Average order value
    - Export to CSV
- **Priority**: P1 (V2)

### 6.4 Payments

#### Feature: Telebirr Integration

- **Description**: Accept Telebirr payments
- **User Story**: As a merchant, I want to accept mobile money
- **Acceptance Criteria**:
    - Generate payment QR
    - Verify payment status
    - Auto-reconcile with orders
- **Priority**: P1 (V2)

#### Feature: Chapa Integration

- **Description**: Accept card payments via Chapa
- **User Story**: As a merchant, I want to accept card payments
- **Acceptance Criteria**:
    - Payment link generation
    - Card payment processing
    - Settlement tracking
- **Priority**: P1 (V2)

### 6.5 Loyalty & Marketing

#### Feature: Loyalty Program

- **Description**: Points-based loyalty for guests
- **User Story**: As a merchant, I want to reward returning guests
- **Acceptance Criteria**:
    - Points earned per spend
    - Points redemption
    - Tier levels (Bronze, Silver, Gold)
- **Priority**: P2 (V3)

#### Feature: Gift Cards

- **Description**: Sell and redeem gift cards
- **User Story**: As a merchant, I want to sell gift cards
- **Acceptance Criteria**:
    - Create gift cards
    - Check balance
    - Redeem at checkout
- **Priority**: P2 (V3)

#### Feature: SMS Marketing

- **Description**: Send promotions to guests
- **User Story**: As a merchant, I want to notify guests about specials
- **Acceptance Criteria**:
    - Guest segmentation
    - Campaign creation
    - Delivery tracking
- **Priority**: P2 (V3)

### 6.6 Enterprise Features

#### Feature: Multi-Location

- **Description**: Manage multiple restaurants
- **User Story**: As a chain owner, I want one dashboard for all locations
- **Acceptance Criteria**:
    - Location switcher
    - Cross-location reporting
    - Centralized menu management
- **Priority**: P2 (V3)

#### Feature: Inventory Management

- **Description**: Track ingredients and stock
- **User Story**: As a manager, I want to know when to reorder
- **Acceptance Criteria**:
    - Stock counts
    - Low-stock alerts
    - Cost tracking
- **Priority**: P2 (V3)

---

## 7. Technical Requirements

### 7.1 Performance Requirements

| Metric             | Target             | Measurement     |
| ------------------ | ------------------ | --------------- |
| Page Load Time     | < 2s               | Lighthouse      |
| Order Submission   | < 500ms            | Server response |
| KDS Order Display  | < 1s               | Real-time sync  |
| Offline Capability | Full core features | PWA audit       |

### 7.2 Reliability Requirements

| Metric        | Target  | Measurement           |
| ------------- | ------- | --------------------- |
| Uptime        | 99.9%   | Monthly average       |
| Data Loss     | 0%      | Transaction integrity |
| Recovery Time | < 15min | DR test               |

### 7.3 Security Requirements

- All data encrypted in transit (TLS 1.3)
- All data encrypted at rest (AES-256)
- Multi-tenant data isolation (RLS)
- Audit logging for all mutations
- Regular security audits

---

## 8. User Personas

### Primary Personas

#### Persona: Ato Tesfaye (Restaurant Owner)

- **Age**: 45
- **Role**: Owner of 2 mid-tier restaurants
- **Goals**: Increase revenue, reduce waste, track staff
- **Pain Points**: Paper-based systems, theft, no visibility
- **Tech Comfort**: Moderate (uses smartphone)

#### Persona: Sara (Restaurant Manager)

- **Age**: 32
- **Role**: Manager at upscale bistro
- **Goals**: Smooth operations, happy guests
- **Pain Points**: Miscommunication, long wait times
- **Tech Comfort**: High (power user)

#### Persona: Daniel (Kitchen Staff)

- **Age**: 28
- **Role**: Line cook at busy cafe
- **Goals**: Clear orders, no mistakes
- **Pain Points**: Illegible handwritten tickets
- **Tech Comfort**: Moderate

#### Persona: Meki (Guest)

- **Age**: 35
- **Role**: Business professional
- **Goals**: Quick service, quality food
- **Pain Points**: Long waits, wrong orders
- **Tech Comfort**: High (early adopter)

---

## 9. Success Metrics

### Key Performance Indicators (KPIs)

| KPI                | Target (Year 1) | Measurement      |
| ------------------ | --------------- | ---------------- |
| Active Restaurants | 500             | Monthly active   |
| Orders Processed   | 1M+             | Monthly volume   |
| Payment Volume     | 100M+ ETB       | Monthly GMV      |
| Guest Satisfaction | 4.5+            | In-app rating    |
| Merchant NPS       | 50+             | Quarterly survey |

### Product Metrics

| Metric                | Target  | Measurement           |
| --------------------- | ------- | --------------------- |
| Order Completion Rate | 99%     | Completed / Placed    |
| Average Order Time    | < 5 min | Submission to served  |
| KDS Acknowledgment    | < 30s   | Kitchen response time |
| App Crash Rate        | < 0.1%  | Crashlytics           |

---

## 10. Go-to-Market Strategy

### Pricing Model

| Plan         | Price (ETB/month) | Features                         |
| ------------ | ----------------- | -------------------------------- |
| Starter      | Free              | 1 terminal, basic features       |
| Professional | 2,500             | Unlimited terminals, payments    |
| Enterprise   | 7,500+            | Multi-location, priority support |

### Launch Strategy

1. **Pilot Phase** (Months 1-3)
    - 10 pilot restaurants
    - Close feedback loop
    - Iterate on features

2. **Early Adopter** (Months 4-6)
    - 50 restaurants
    - Referral program
    - Local press coverage

3. **Growth Phase** (Months 7-12)
    - 500 restaurants
    - Partnership with Telebirr
    - Sales team expansion

---

## 11. Risk Assessment

### Technical Risks

| Risk                 | Likelihood | Impact   | Mitigation                 |
| -------------------- | ---------- | -------- | -------------------------- |
| Internet instability | High       | High     | Offline-first architecture |
| Payment API changes  | Medium     | High     | Abstraction layer          |
| Data breach          | Low        | Critical | Security-first design      |

### Business Risks

| Risk                   | Likelihood | Impact | Mitigation         |
| ---------------------- | ---------- | ------ | ------------------ |
| Slow adoption          | Medium     | High   | Strong onboarding  |
| Competitor entry       | Medium     | Medium | Local advantage    |
| Payment partner issues | Medium     | High   | Multiple providers |

---

## 12. Appendix

### References

- Toast POS: https://pos.toasttab.com/
- GloriaFood: https://www.gloriafood.com/
- Ethiopian Restaurant Market Research 2025

### Document History

| Version | Date       | Author       | Changes     |
| ------- | ---------- | ------------ | ----------- |
| 1.0.0   | 2026-02-17 | Product Team | Initial PRD |

---

**Document Owner:** Product Team  
**Review Cycle:** Quarterly  
**Next Review:** May 2026
