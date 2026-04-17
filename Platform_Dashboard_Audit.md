# Gebeta Platform Dashboard Audit (Post-Re-architecture)

**Date**: 2026-04-17
**Status**: 🛠 Under Reconstruction (Phase 3 Completed)

## Current Architecture State

The legacy merchant dashboard layout has been replaced with a high-performance, Toast-inspired 14-tab architecture. This redesign focuses on restaurant operational efficiency, multi-location scaling, and deep Ethiopian localization.

### 1. Navigation Sidebar (Re-architected)

| Slot | Label              | Route                    | Status                       |
| ---- | ------------------ | ------------------------ | ---------------------------- |
| 1    | Home               | `/merchant`              | ✅ Active (Operational)      |
| 2    | Reports            | `/merchant/reports`      | 🚧 Stub (Phase 4)            |
| 3    | Menus              | `/merchant/menus`        | 🚧 Stub (Phase 4)            |
| 4    | Takeout & Delivery | `/merchant/takeout`      | 🚧 Stub (Phase 4)            |
| 5    | Front of House     | `/merchant/foh`          | 🚧 Stub (Phase 4)            |
| 6    | Kitchen            | `/merchant/kitchen`      | 🚧 Stub (Phase 4)            |
| 7    | Employees          | `/merchant/employees`    | 🚧 Stub (Phase 4)            |
| 8    | Payroll            | `/merchant/payroll`      | 🚧 Stub (Phase 4)            |
| 9    | Payments           | `/merchant/payments`     | 🚧 Stub (Phase 4)            |
| 10   | Marketing          | `/merchant/marketing`    | 🚧 Stub (Phase 4)            |
| 11   | Financial Products | `/merchant/financial`    | 🚧 Stub (Phase 4)            |
| 12   | Integrations       | `/merchant/integrations` | 🚧 Stub (Phase 4)            |
| 13   | Shop (Hardware)    | `/merchant/shop`         | 🚧 Stub (Phase 4)            |
| 14   | Settings           | `/merchant/setup`        | ✅ Active (Custom Component) |

### 2. Settings Re-architecture (Status: ✅ Completed)

The settings module (Slot 14) has been rebuilt with a 7-tab system localized for the Ethiopian market:

1.  **Business Info**: TIN registration, Ledger details, Regional addresses (Sub-cities/Woredas).
2.  **Restaurant Profile**: Amharic/English branding, Trading names, Operating hours.
3.  **Financials**: Ethiopian-specific tax rules (VAT 15%, MAT 2.5%, POESSA 11/7%), Settlement bank accounts.
4.  **Locations**: Multi-unit management with branch-specific hardware/menu links.
5.  **Security**: Telebirr-linked MFA, POS PIN management, Session security.
6.  **Devices**: Provisioning for POS Terminals, KDS Screens, and Network Printers.
7.  **Modules**: Feature flags for all 11 platform add-ons.

## North-Star Alignment

- **Toast Parity**: Matches Toast's information architecture (Overview -> Operations -> People -> Growth -> Platform).
- **Addis Localized**: Addresses unique Ethiopian needs (Amharic support, Telebirr integration, EFY calendar).
- **Clean Slate**: Legacy "feature-creep" components removed; stubs ready for high-reliability implementation.

## Next Steps (Phase 4)

- [ ] Implement robust **Reports** with revenue/labor heatmaps.
- [ ] Build **Menus** (Toast Menu Builder parity).
- [ ] Connect **Payroll** to EFY tax bands.
- [ ] Complete **Devices** provisioning logic.
