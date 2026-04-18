# Lole Rebrand Task Tracker

Status: Active  
Program start: 2026-03-27  
Canonical brand: `Lole`

## Program Goal

Rebrand the entire platform around the landing page design language so every Lole surface feels like the same company while preserving enterprise-grade usability for restaurant operations.

## Working Rules

- Implement in phases, not all at once
- Do not restyle screens ad hoc
- Move shared styles into tokens and primitives first
- Product usability beats visual novelty on operational surfaces
- Any touched scope must remove legacy `lole` branding where safe

## Current Phase

Phase 3: Shared shell and navigation

## Task Status Legend

- `todo`
- `in_progress`
- `blocked`
- `done`

## Phase 0: Foundations

| ID    | Task                                                           | Status | Deliverable                                           |
| ----- | -------------------------------------------------------------- | ------ | ----------------------------------------------------- |
| P0-01 | Create root-level design-system foundation doc                 | todo   | `LOLE_DESIGN_SYSTEM_FOUNDATION.md`                    |
| P0-02 | Create root-level rebrand execution tracker                    | todo   | `LOLE_REBRAND_TASKS.md`                               |
| P0-03 | Lock canonical brand name, casing, tone, and expression levels | todo   | Foundation doc sections completed                     |
| P0-04 | Audit landing page and extract first-pass visual language      | todo   | Audit section in foundation doc                       |
| P0-05 | Inventory current shared primitives and styling drift          | todo   | Component inventory and drift notes in foundation doc |
| P0-06 | Identify legacy `lole` / `LoLe` naming to retire over time     | todo   | Rebrand cleanup backlog                               |

## Phase 1: Token Infrastructure

| ID    | Task                                                                                      | Status | Deliverable                                 |
| ----- | ----------------------------------------------------------------------------------------- | ------ | ------------------------------------------- |
| P1-01 | Replace mixed global palette with canonical Lole semantic tokens                          | todo   | Refactored `src/app/globals.css`            |
| P1-02 | Simplify root typography and align app-wide font roles                                    | todo   | Updated `src/app/layout.tsx` and token docs |
| P1-03 | Define semantic state tokens for success, warning, danger, info, offline, syncing, urgent | todo   | Token map implemented in CSS                |
| P1-04 | Define spacing, radius, shadow, border, and motion tokens                                 | todo   | Token layer implemented                     |
| P1-05 | Remove conflicting or duplicate legacy token names                                        | todo   | Clean token namespace                       |
| P1-06 | Update theme helpers to use the new token system                                          | todo   | Shared theme utilities aligned              |

Acceptance criteria:

- No new shared UI code uses raw brand hex values
- The token layer supports marketing and product surfaces
- Focus and state styles remain accessible

## Phase 2: Shared Primitive System

| ID    | Task                                                                 | Status | Deliverable                  |
| ----- | -------------------------------------------------------------------- | ------ | ---------------------------- |
| P2-01 | Rebuild button variants around Lole tokens                           | todo   | Canonical button API         |
| P2-02 | Rebuild inputs, textareas, and selects                               | todo   | Canonical field primitives   |
| P2-03 | Rebuild card and panel primitives                                    | todo   | Standard surface hierarchy   |
| P2-04 | Build badge and status-chip primitives                               | todo   | Shared semantic badges       |
| P2-05 | Standardize tables and row patterns                                  | todo   | Canonical data table base    |
| P2-06 | Standardize tabs and segmented controls                              | todo   | Shared navigation primitives |
| P2-07 | Standardize drawers, modals, popovers, and dropdowns                 | todo   | Overlay system               |
| P2-08 | Standardize toast, banner, empty, loading, error, and offline states | todo   | Feedback state library       |

Acceptance criteria:

- Shared primitives cover the most repeated UI patterns
- Product screens can stop hand-rolling button/card/input styles
- Mobile touch targets remain compliant

## Phase 3: Shared Shell And Navigation

| ID    | Task                                            | Status | Deliverable                   |
| ----- | ----------------------------------------------- | ------ | ----------------------------- |
| P3-01 | Rebrand dashboard shell                         | todo   | Updated dashboard layout      |
| P3-02 | Standardize page-header pattern                 | todo   | Shared page-header component  |
| P3-03 | Rebrand sidebar, right rail, and command shell  | todo   | Unified authenticated shell   |
| P3-04 | Rebrand mobile bottom navigation                | todo   | Mobile nav system             |
| P3-05 | Align auth and public utility layouts with Lole | todo   | Auth/public shell consistency |

Acceptance criteria:

- Authenticated screens feel like one product family
- Navigation is consistent across desktop and mobile
- The shell is recognizably Lole even before module-specific content loads

## Phase 4: Product Pattern Library

| ID    | Task                                                     | Status | Deliverable                |
| ----- | -------------------------------------------------------- | ------ | -------------------------- |
| P4-01 | Define dashboard analytics card and chart frame patterns | done   | Analytics pattern set      |
| P4-02 | Define order ticket and order-detail patterns            | done   | Orders pattern set         |
| P4-03 | Define KDS urgency, fire, and SLA states                 | done   | KDS state pattern set      |
| P4-04 | Define table, floor, and session patterns                | todo   | Tables/session pattern set |
| P4-05 | Define payment, split-check, retry, and refund patterns  | todo   | Payment pattern set        |
| P4-06 | Define offline, syncing, and printer-fallback patterns   | todo   | Reliability state patterns |
| P4-07 | Define receipt and invoice surfaces                      | todo   | Finance output patterns    |

Acceptance criteria:

- High-risk restaurant workflows have explicit visual rules
- Semantic states are standardized, not improvised
- Offline resilience is visible and reassuring

## Phase 5: Rollout By Surface

### 5A. Dashboard Overview

| ID     | Task                                           | Status | Deliverable              |
| ------ | ---------------------------------------------- | ------ | ------------------------ |
| P5A-01 | Rebrand merchant dashboard overview            | todo   | Updated overview screens |
| P5A-02 | Standardize analytics loading and empty states | todo   | Consistent overview UX   |

### 5B. Highest-Traffic Flows

| ID     | Task                        | Status | Deliverable                |
| ------ | --------------------------- | ------ | -------------------------- |
| P5B-01 | Rebrand orders flows        | todo   | Orders list/detail screens |
| P5B-02 | Rebrand tables and sessions | todo   | Tables operational flows   |
| P5B-03 | Rebrand payments flows      | todo   | Payment flows              |
| P5B-04 | Rebrand KDS                 | todo   | Kitchen operational flows  |

### 5C. Remaining Modules

| ID     | Task                                                 | Status | Deliverable               |
| ------ | ---------------------------------------------------- | ------ | ------------------------- |
| P5C-01 | Rebrand guests surfaces                              | todo   | Guest management screens  |
| P5C-02 | Rebrand loyalty surfaces                             | todo   | Loyalty/gift-card screens |
| P5C-03 | Rebrand inventory surfaces                           | todo   | Inventory screens         |
| P5C-04 | Rebrand marketing/campaign surfaces                  | todo   | Reach/campaign screens    |
| P5C-05 | Rebrand finance/help/settings/public support screens | todo   | Remaining modules aligned |

Acceptance criteria:

- Rebrand is rolled out in dependency order
- Highest-traffic workflows are prioritized before edge modules
- No page is restyled before its primitives are ready

## Phase 6: Rebrand Cleanup

| ID    | Task                                                        | Status | Deliverable                   |
| ----- | ----------------------------------------------------------- | ------ | ----------------------------- |
| P6-01 | Replace `lole` product-facing metadata and copy with `Lole` | todo   | Updated copy in touched scope |
| P6-02 | Replace legacy logo/icon references                         | todo   | Canonical asset usage         |
| P6-03 | Review docs and public-facing pages for brand consistency   | todo   | Rebrand cleanup pass          |
| P6-04 | Review emails, receipts, invoices, and legal/support pages  | todo   | Company-wide consistency      |

Acceptance criteria:

- No mixed brand naming remains in completed surfaces
- Public copy reads like one company

## Phase 7: Governance And Quality

| ID    | Task                                                       | Status | Deliverable                |
| ----- | ---------------------------------------------------------- | ------ | -------------------------- |
| P7-01 | Add design-system usage rules to engineering workflow      | todo   | Documented rules           |
| P7-02 | Add visual QA checklist for new UI work                    | todo   | QA checklist               |
| P7-03 | Add component adoption checklist for PR review             | todo   | Review rubric              |
| P7-04 | Add regression coverage for critical rebranded surfaces    | todo   | Updated tests              |
| P7-05 | Create design reference gallery or examples page if needed | todo   | Internal reference surface |

Acceptance criteria:

- New UI work cannot drift back to arbitrary styling
- Reviewers can reject non-system UI changes consistently
- Critical paths remain tested during the rollout

## Asset Backlog For Design

| ID   | Asset                                                     | Status | Notes                                |
| ---- | --------------------------------------------------------- | ------ | ------------------------------------ |
| A-01 | Canonical Lole logo pack                                  | todo   | Light, dark, mono, lockups           |
| A-02 | Favicon and app icon set                                  | todo   | Browser, PWA, social                 |
| A-03 | Approved product palette                                  | todo   | Include semantic states              |
| A-04 | Typography approval                                       | todo   | Confirm primary UI stack             |
| A-05 | Icon guidance                                             | todo   | Lucide-only or custom extensions     |
| A-06 | Chart styling guidance                                    | todo   | Data-viz language                    |
| A-07 | Photography direction/source set                          | todo   | Real Ethiopian hospitality imagery   |
| A-08 | Illustration direction                                    | todo   | Empty states, onboarding, explainers |
| A-09 | High-fidelity mocks for dashboard/POS/KDS/payments/tables | todo   | Needed before later rollout phases   |

## Immediate Next Tasks

1. Finish `P3-05` by aligning auth and public utility layouts with Lole
2. Start Phase 4 with dashboard analytics and operational pattern rules
3. Keep `P1-05` and `P1-06` pending until legacy aliases can be safely removed
4. Continue adopting `PageHeader` and feedback-state components across existing screens
