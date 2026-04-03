# Enterprise Mobile Shell Tasks

## Scope

Upgrade Gebeta's existing PWA and device tooling into an enterprise-grade Android device platform for POS, waiter, KDS, and kiosk deployments without breaking the current design language, tenant isolation, or offline-first guarantees.

## Skills Used

- `supabase-postgres-best-practices`
- `nextjs-best-practices`
- `api-patterns`
- `frontend-design`

## Current-State Audit

### Reuse

- `public.hardware_devices` already exists and is tenant-scoped with RLS.
- Device-authenticated routes already exist via `x-device-token` and `getScopedDeviceContext`.
- Terminal, waiter, and KDS routes already exist and can become profile targets instead of being replaced.
- Offline queue foundations already exist in `src/lib/sync/powersync-config.ts` and `src/lib/sync/printerFallback.ts`.
- ERCA submission scaffolding already exists in `src/app/api/jobs/erca/submit/route.ts`.

### Legacy Gaps To Replace

- Pairing is still a 4-digit code in `src/app/api/devices/provision/route.ts`, `src/app/api/devices/pair/route.ts`, and `src/app/(guest)/[slug]/setup/page.tsx`.
- Pairing stores device credentials in `sessionStorage`, which is not suitable for enterprise hardware continuity.
- Device setup still depends on manual setup URLs and a browser-style onboarding flow.
- Printer behavior is webhook/log based for KDS and does not yet support native silent printing or stored printer identity.
- Fleet management and MoR fiscalization are not modeled as first-class device or transaction workflows.
- `src/app/(pos)/waiter/page.old-logic.tsx` is a legacy surface and should remain deprecated while new profile-based routing becomes authoritative.

### Design Constraints

- Reuse the existing Gebeta tokens, button styles, surfaces, motion patterns, and landing-page visual tone.
- Do not invent a new device UI language; device onboarding and management screens must feel native to the current marketing and merchant surfaces.

## Delivery Rules

- All schema work goes through `supabase/migrations`.
- New APIs must validate input, enforce tenant scope, and preserve auditability.
- New device UI must stay mobile-first and align with the current design system.
- Feature replacements should be additive first, then legacy paths should be deprecated or removed once the replacement is wired.

## Phase Checklist

### Phase 0: Foundation Audit and Tracking

- [x] Audit current provisioning, device auth, printing, terminal, KDS, and fiscal code paths
- [x] Create tracked implementation plan document
- [x] Record final legacy removal list after replacement contracts are merged

### Phase 1: Hardened Mobile Shell

- [x] Add Capacitor project scaffolding and scripts
- [x] Add native capability abstraction layer for device info, preferences, printer discovery, and silent print
- [x] Add ESC/POS encoder service for receipts and fiscal QR payloads
- [x] Add silent print orchestration triggered by successful transaction completion
- [x] Preserve web fallback behavior when native capabilities are unavailable

### Phase 2: Enterprise Provisioning

- [x] Expand hardware device schema for enterprise pairing and assigned profile metadata
- [x] Replace 4-digit pairing with 6-character alphanumeric pairing codes
- [x] Add `POST /v1/devices/pair` compatible server contract
- [x] Add device handshake payload with stable hardware identity and app metadata
- [x] Persist paired printer identity in native preferences abstraction
- [x] Replace manual browser setup screen with enterprise welcome/pairing UI

### Phase 3: Multi-Mode UI

- [x] Add canonical device profiles: `cashier`, `waiter`, `kds`, `kiosk`
- [x] Map paired device profile to route boot behavior
- [x] Add a single device shell that renders the correct mode entry point
- [x] Preserve existing waiter, terminal, and KDS UX while bringing them under shared device-shell state
- [x] Add kiosk boot flow aligned with current brand/UI system

### Phase 4: Fleet Management

- [x] Add Esper configuration/env contract
- [x] Add internal ops actions for remote reboot and wipe
- [x] Store fleet action audit history
- [x] Add OTA/update status modeling for managed devices
- [x] Expose remote management state in an internal/admin fleet surface

### Phase 5: Ethiopia Fiscal Compliance

- [x] Replace stub-only fiscal flow with a reusable MoR client abstraction
- [x] Require fiscalization before final print when online
- [x] Add fiscal receipt template fields and QR payload
- [x] Add offline fiscal queue storage and sync retry logic
- [x] Add pending-fiscalization receipt warnings for allowed offline scenarios

## Initial File Targets

- `supabase/migrations/*`
- `src/lib/devices/*`
- `src/lib/mobile/*`
- `src/lib/printer/*`
- `src/lib/fiscal/*`
- `src/app/api/devices/*`
- `src/app/api/v1/devices/pair/route.ts`
- `src/app/(guest)/[slug]/setup/page.tsx`
- `src/components/merchant/ProvisionDeviceModal.tsx`
- `src/app/(terminal)/terminal/page.tsx`
- `src/app/(pos)/waiter/page.tsx`
- `src/app/(kds)/kds/page.tsx`

## Notes

- Capacitor core/device/preferences packages are now installed locally, and the Android project has been created and synced successfully.
- Capacitor now uses a branded `native-shell/` bootstrap bundle because `.next` is not a valid Capacitor web asset directory.
- ESC/POS has been moved from deprecated `esc-pos-encoder` to `@point-of-sale/receipt-printer-encoder`.
- Apollo Server is now on the supported v5 line with the matching `@as-integrations/next` update and refreshed lockfile.
- Supabase CLI now has a repo-local wrapper (`pnpm supabase:cli`) that avoids the local Docker config warning.
- Targeted tests passed for device config, pairing helpers, ESC/POS encoding, and device provisioning routes.
- Existing dirty worktree files are treated as user-owned and must not be reverted.

## Final Legacy Removal List

- Remove merchant-facing fleet management controls and keep Esper operations in internal agency-admin tooling only.
- Remove standalone device-session boot logic from route-specific pages in favor of the shared managed-device session layer.
- Remove browser-only receipt completion behavior that allowed online transactions to print before live fiscalization succeeded.
- Remove reliance on implicit OTA state in loose metadata alone once the formal `hardware_devices` OTA columns are present everywhere.
- Keep `src/app/(pos)/waiter/page.old-logic.tsx` deprecated and avoid routing new device traffic through it.
