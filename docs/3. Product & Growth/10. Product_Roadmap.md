# ገበጣ Gebeta — Product Roadmap

**Version 1.0 · March 2026 · Confidential**

> The Sprint execution plan lives in the Master Blueprint (Section 18). This document answers the higher-order question: **what does Gebeta become, and by when?** It is the document you read when you need to remember why you are building what you are building.

---

## The Three Horizons

```
HORIZON 1 — SURVIVE (Now → Month 12)
  Become the best POS in Addis Ababa.
  Land 200 restaurants. Prove the unit economics.
  Everything in this horizon is about the single restaurant operator.

HORIZON 2 — SCALE (Month 13 → 30)
  Become the operating system for Ethiopian restaurants.
  Multi-location. Delivery network. Loyalty flywheel. Revenue expands into transactions.

HORIZON 3 — DOMINATE (Month 30 → 60)
  Expand to East Africa. Become the data layer for the industry.
  Financial services for restaurants: working capital, insurance, B2B marketplace.
  Platform play — third parties build on Gebeta.
```

---

## Current State Snapshot (March 2026)

**What is built and working:**

| Surface                                                                  | Status                             |
| ------------------------------------------------------------------------ | ---------------------------------- |
| Waiter POS (orders, modifiers, split bills, table mgmt, PIN login)       | ✅ Production-ready                |
| KDS — 5 stations (Kitchen, Bar, Coffee, Dessert, Expeditor)              | ✅ Production-ready                |
| Guest QR ordering — HMAC-signed, anonymous + loyalty enrollment          | ✅ Production-ready                |
| Guest order tracker — real-time Supabase subscriptions                   | ✅ Production-ready                |
| Merchant dashboard — 14 routes (analytics, finance, inventory, channels) | ✅ Production-ready                |
| Chapa + Telebirr payments — initiation + verify                          | ⚠️ Partial — no webhooks           |
| Loyalty system                                                           | ⚠️ Schema complete — not wired     |
| Delivery channels (BEU, Deliver Addis, Zmall, Esoora)                    | ⚠️ Schema complete — API not built |

**What is blocking the first paid restaurant:**

1. No payment webhooks → every digital payment requires manual staff confirmation
2. No Amharic UI → staff in Addis cannot use the POS fluently
3. No production monitoring → first outages will be invisible
4. Money stored as `DECIMAL` not `INTEGER` santim → receipt rounding errors

---

## Horizon 1 — Survive (Now → Month 12)

### Phase 1 — Foundation (Month 1–2) · Master Blueprint Sprints 1–4

**Theme: Make the existing platform trustworthy enough to run a real restaurant.**

All Phase 1 work is invisible to restaurant owners. It is the engineering beneath the floor. Without it, the platform cannot be trusted with live revenue.

| Milestone              | User-visible change                                                             | Sprints |
| ---------------------- | ------------------------------------------------------------------------------- | ------- |
| Payment webhooks       | Digital payments auto-confirm. No manual staff action required.                 | 1       |
| Amharic UI             | POS, KDS, dashboard default to አማርኛ. Staff use the product fluently.            | 2       |
| Santim migration       | Zero rounding errors on any receipt. Financial reports are exact to the santim. | 1       |
| Sentry + Better Uptime | Production issues visible in seconds. Telegram alerts within 2 min of outage.   | 1       |
| Redis event bus        | Orders, payments, loyalty, inventory all connected. No isolated islands.        | 3       |
| PowerSync offline      | POS and KDS survive 24h power/network outage without data loss or conflicts.    | 4       |

**Phase 1 success criteria:**

- 5 pilot restaurants live
- Zero payment errors requiring manual resolution over any 7-day period
- POS rated "easy to use" by 4/5 waitstaff in Amharic user testing session
- Zero cross-tenant data issues in Sentry

---

### Phase 2 — Product Completeness (Month 3–4) · Sprints 5–6

**Theme: Close every gap between what Gebeta has and what a restaurant actually needs daily.**

| Feature                       | Why it cannot wait                                                                                                                  | Sprint  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **Discount engine**           | Every restaurant runs happy hour, staff meals, loyalty discounts. Without discounts the POS is incomplete for any serious operator. | 5       |
| **Modifier table migration**  | Required-field enforcement stops wrong orders reaching the kitchen. Amharic modifier names on bilingual receipts.                   | 5       |
| **Loyalty points wired**      | The splash-screen enrollment is wasted if points never credit. Schema exists — just needs to fire on `order.completed`.             | 3       |
| **Telebirr on waiter POS UI** | Backend complete since day one. 40M+ Telebirr users in Ethiopia. The POS must offer it as a tappable payment option.                | 1 (add) |
| **GraphQL Federation**        | Typed API contract required before any delivery partner integration. Apollo Studio breaking-change protection.                      | 5–6     |

**New feature shipping in Phase 2 — Staff Broadcast:**

- Waiter → Kitchen: "Table A3 — 2 guests have nut allergy"
- Manager → all staff: "ቡድን ስብሰባ 10 ደቂቃ ውስጥ" (Team meeting in 10 min)
- Kitchen → Expeditor: all items for order #042 ready for assembly

**Phase 2 success criteria:**

- 25 active restaurants
- Discount engine adopted by >60% of restaurants within 30 days of launch
- Loyalty enrollment rate >20% of dine-in guests (authenticated orders)
- GraphQL schema published — BEU and Deliver Addis given integration credentials

---

### Phase 3 — Infrastructure & Monetisation (Month 4–5) · Sprints 7–8

**Theme: Harden everything before growth. 25 restaurants is the moment — not 200.**

| Milestone               | Impact                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| Cloudflare WAF live     | Every restaurant protected from DDoS, SQL injection, credential stuffing          |
| TimescaleDB enabled     | Analytics queries stay fast regardless of restaurant size or date range           |
| ERCA integration live   | VAT-registered restaurants auto-submit e-invoices. **Enterprise sales unlocked.** |
| Subscription model live | Free → Pro (1,200 ETB) → Business (3,500 ETB) → Enterprise. First revenue.        |
| EOD Telegram reports    | Every owner gets a daily P&L summary at 10PM Addis time                           |
| GitHub Actions CI/CD    | Every push to main deploys automatically. No manual steps.                        |

**Revenue milestone:** First Pro subscriptions. Target: 15 of 25 restaurants upgrade. MRR: ~18,000 ETB.

---

### Phase 4 — Growth Engine (Month 6–12)

**Theme: Everything that drives acquisition, retention, and expansion velocity.**

| Feature                         | Description                                                              | Business case                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Gebeta Now Alpha**            | iOS/Android manager app — live revenue, quick actions, staff view        | Owners check their phone constantly. This is the product they demo to other owners.            |
| **Referral programme**          | Restaurant A refers Restaurant B → both get 2 months Pro free            | Ethiopian market is relationship-driven. CAC drops to near zero via word of mouth.             |
| **Multi-location Beta**         | Owners with 2–3 locations get unified dashboard + consolidated reporting | Unlocks hotel groups and small chains for Enterprise plan. Average revenue 3× single-location. |
| **CBE Birr integration**        | 4th payment method (Commercial Bank of Ethiopia, 25M+ account holders)   | Covers remaining payment gap from high-value corporate diners                                  |
| **Inventory → Purchase Orders** | Low stock alert → one-tap draft PO to supplier                           | Closes the inventory loop. Currently stops at alerting.                                        |
| **Guest loyalty PWA**           | Guests see points balance, tier, visit history, reward options           | Drives repeat visits. The core loyalty value proposition.                                      |
| **Kitchen analytics**           | Avg prep time per item, station bottlenecks, busiest hours by station    | Premium analytical feature — primary justification for Pro upgrade for kitchen managers        |
| **Kiosk mode + MDM guide**      | Lock POS tablet into fullscreen PWA kiosk for chains                     | Required for hotel and fast-food chain deployment                                              |

**Phase 4 success criteria (Month 12):**

- **200 active restaurants**
- **MRR: 200,000 ETB/month** (~$3,600 USD at ~50% Pro penetration)
- **Monthly churn: <5%**
- **NPS: >45**
- Gebeta Now Alpha live with 50 restaurant owners
- ERCA active for all VAT-registered restaurants on platform

---

## Horizon 2 — Scale (Month 13–30)

**Theme: From the best POS in Addis to the operating system for Ethiopian restaurants.**

### The Platform Expansion Arc

```
Today (Month 0):     Restaurant pays Gebeta for POS subscription (ETB 1,200/mo)
Month 13 (Gebeta Pay): Restaurant processes payments through Gebeta (1.5% fee)
Month 18 (Capital):  Restaurant borrows working capital against Gebeta revenue data
Month 20 (Analytics Pro): Restaurant pays for competitive intelligence
Month 24 (East Africa): Restaurant in Nairobi onboards — same platform, KES + M-Pesa
```

At each stage, **switching cost increases and revenue per restaurant compounds**.

---

### Initiative 1 — Gebeta Pay (Month 13–18)

Move from integrating third-party payment providers to operating Gebeta's own payment product in partnership with a licensed Ethiopian Payment System Operator (PSO).

**Why this matters:**

- Chapa charges 2.49% + fees. Gebeta can offer 1.5% and still capture margin.
- Payment data stays inside Gebeta → richer analytics → better lending risk model
- Instant settlement to restaurant account (vs. T+2 with Chapa)
- This is precisely how Square became a $40B company from a $10 dongle

**What is needed:**

- Partnership with a licensed Ethiopian PSO (likely CBE or a licensed fintech)
- NBE approval for payment aggregation (or partnership structure that avoids this requirement)
- `gebeta_pay` as new `payment.provider` enum value — all existing infrastructure reuses

**Revenue model:** 1.5% of GMV processed through Gebeta Pay. At 200 restaurants × 150,000 ETB/month GMV = 450,000 ETB/month in payment volume → 6,750 ETB/month additional revenue from payment fees alone.

---

### Initiative 2 — Delivery Network Hub (Month 15–20)

Not a competing delivery company. A neutral aggregation layer that benefits restaurants, delivery partners, and Gebeta simultaneously.

**The problem today:** A restaurant with BEU, Deliver Addis, Zmall, and Esoora has 4 tablets, 4 logins, 4 sets of order notifications, and 4 menu update workflows.

**Gebeta's solution:** One Channels hub screen where all delivery orders arrive in Gebeta's unified queue alongside dine-in. One menu update propagates to all connected partners. One reporting dashboard shows dine-in vs. delivery revenue side by side.

**Revenue model:** ETB 8–15 per delivery order processed through Gebeta. At 200 restaurants × 15 delivery orders/day = 3,000 orders/day → 24,000–45,000 ETB/day in delivery processing revenue.

**Delivery partner value prop:** Faster restaurant onboarding (Gebeta's 200 restaurants join the delivery partner's network automatically). Reduced integration cost (one Gebeta webhook, not per-restaurant technical work).

---

### Initiative 3 — Gebeta Capital (Month 18–24)

Restaurant working capital loans underwritten by Gebeta transaction data.

**The insight:** Traditional banks cannot lend to most Ethiopian restaurants because they have no verifiable financial history. Gebeta has 12–18 months of daily revenue data, split by payment method, with trend analysis. This is a better risk signal than any bank statement.

**Product:** Revenue-based advance. Restaurant receives lump sum. Repayment is automatic — a fixed percentage of each day's POS revenue until the advance plus a flat fee is repaid.

**Example:** A restaurant averaging 45,000 ETB/week for 6 months receives a 200,000 ETB advance. Gebeta automatically withholds 15% of daily POS revenue until 220,000 ETB (advance + 10% flat fee) is repaid. ~6 week repayment at average revenue.

**Regulatory path:** Partnership with a licensed Ethiopian microfinance institution (MFI). Gebeta provides the risk model and origination. MFI provides the licensed lending entity and capital. Revenue split: 60/40 Gebeta/MFI.

**Why this creates lock-in:** A restaurant with an outstanding Gebeta Capital advance cannot switch POS providers — repayment runs through Gebeta's revenue stream. This is the same mechanism that makes Toast's payment processing sticky.

---

### Initiative 4 — Gebeta Analytics Pro (Month 20–26)

Upgrade from operational analytics (what happened?) to strategic intelligence (what should I do?).

| Feature                     | Description                                                                                     | Price point           |
| --------------------------- | ----------------------------------------------------------------------------------------------- | --------------------- |
| **Industry benchmarking**   | "Your avg ticket time (28 min) vs. similar Addis restaurants (avg 19 min)"                      | Business plan feature |
| **Demand forecasting**      | "Based on your last 8 Meskel holidays, prepare for 220 covers on April 17"                      | Business plan feature |
| **Menu optimisation**       | "Your Tibs sells 80/day but costs more to make than your Kitfo. Consider repricing."            | Business plan feature |
| **Seasonal insights**       | Meskel, Timkat, Ramadan, Ethiopian Christmas impact quantified for your restaurant specifically | Business plan feature |
| **Competitor intelligence** | Anonymised aggregate pricing data — "Macchiatos on Bole Road: ETB 95–130. You're at ETB 80."    | Enterprise feature    |

These features are only possible because Gebeta has aggregate data across hundreds of restaurants. A single-restaurant analytics tool cannot do this. Network effects create a moat.

---

### Initiative 5 — East Africa Expansion (Month 24–30)

The platform is already multi-currency by design (`currency_code` on payments, `timezone` per restaurant). The architecture supports regional deployment.

**Expansion sequence:**

| Market                  | Trigger                                    | Payment                      | Language                    | VAT equivalent |
| ----------------------- | ------------------------------------------ | ---------------------------- | --------------------------- | -------------- |
| Nairobi, Kenya          | 200 ETH restaurants, proven unit economics | M-Pesa (Safaricom) + Visa    | Swahili + English           | KRA iTax       |
| Dar es Salaam, Tanzania | Nairobi profitable                         | M-Pesa (Vodacom) + Tigo Pesa | Swahili + English           | TRA EFDMS      |
| Kampala, Uganda         | Tanzania live                              | MTN MoMo + Airtel Money      | English (+ Luganda Phase 2) | URA EFRIS      |

**What does NOT change per market:** Database schema, GraphQL API, POS/KDS PWA codebase, subscription model, loyalty system, analytics engine.

**What changes per market:** i18n strings (language), payment provider integrations, VAT/tax compliance module, currency formatting, local sales team.

---

## Horizon 3 — Dominate (Month 30–60)

This horizon is directional. Specifics depend on Horizon 2 results.

| Initiative                    | Description                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gebeta Platform API**       | Public API for accountants, HR systems, food suppliers, loyalty aggregators to build on Gebeta data. Platform revenue via API calls.                                              |
| **Gebeta B2B Marketplace**    | Connect restaurants with verified food suppliers. Gebeta takes a 2–3% transaction fee on every supplier order.                                                                    |
| **Ghost Kitchen Management**  | As dark kitchens grow in Addis and Nairobi, a kitchen-optimised version for multi-brand ghost kitchen operators.                                                                  |
| **Gebeta Insurance**          | Revenue protection insurance underwritten by transaction history. Claim on fire damage? Gebeta's 18 months of revenue data is the proof.                                          |
| **Series B / Strategic Exit** | At 2,000+ restaurants across 3+ countries, Gebeta becomes an acquisition target for Lightspeed, Toast International, or a major East African fintech (Flutterwave, Chipper Cash). |

---

## Feature Freeze Policy

- No new features deploy to production on Friday, Saturday, or Sunday
- Payment-affecting features require a 48h staged rollout (Feature Flags doc)
- Breaking database migrations require a 2-week forward-compatibility window
- The Master Blueprint sprint sequence is the queue — nothing jumps it without a documented trade-off decision

## What We Are Explicitly Not Building (Horizons 1 & 2)

| Feature                                  | Reason                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------- |
| Native iOS/Android POS app               | PWA on any Android tablet beats native. No Play Store dependency, instant updates.     |
| Proprietary hardware                     | Ethiopian restaurants cannot afford $600/terminal. Any Mercato tablet is our terminal. |
| Table reservations (dine-in pre-booking) | Ethiopian restaurants are almost exclusively walk-in. Phase 3 at earliest.             |
| Payroll and HR system                    | Too far from core. Partner with HR tools via API.                                      |
| Self-service kiosk UI                    | High hardware cost, low relevance for current market. Phase 3.                         |
| Voice ordering (Amharic)                 | Amharic voice recognition not yet reliable enough for kitchen use. Phase 3.            |

---

## Roadmap at a Glance

```
Now → Month 2    Foundation      Webhooks · Amharic · Santim · Monitoring · Offline (PowerSync)
Month 3–4        Completeness    Discounts · Modifiers · Loyalty · GraphQL · CBE Birr
Month 4–5        Infrastructure  Cloudflare · TimescaleDB · ERCA · Subscriptions · CI/CD
Month 6–12       Growth Engine   Gebeta Now · Multi-location · Referral · Kitchen Analytics
Month 13–18      Gebeta Pay      Own payment product · 1.5% processing fee · Instant settlement
Month 15–20      Delivery Hub    Unified delivery aggregation · Per-order revenue model
Month 18–24      Gebeta Capital  Revenue-based working capital · MFI partnership
Month 20–26      Analytics Pro   Benchmarking · Forecasting · Menu optimisation
Month 24–30      East Africa     Kenya → Tanzania → Uganda · M-Pesa · Swahili i18n
Month 30–60      Platform        Open API · B2B marketplace · Insurance · Series B
```

---

_Gebeta Product Roadmap v1.0 · March 2026 · Confidential_
