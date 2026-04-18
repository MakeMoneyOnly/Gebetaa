# WCAG 2.1 AA Accessibility Audit

## Overview

This document tracks the WCAG 2.1 AA compliance status for lole, a restaurant operating system designed for use in Addis Ababa, Ethiopia.

## Audit Scope

### Target Standard

WCAG 2.1 Level AA (EN 301 549 / Section 508 alignment)

### Key User Personas

1. **Restaurant Manager** - Desktop/tablet user, may have low vision
2. **Kitchen Staff** - High-stress environment, touch-heavy, may wear gloves
3. **Wait Staff** - Mobile user, one-handed operation, noisy environment
4. **Guest** - Customer-facing kiosk, diverse abilities

## Codebase Accessibility Inventory

### Existing Infrastructure

| Component               | Location                                                        | Status                                                |
| ----------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| SkipLink                | `src/components/ui/SkipLink.tsx`                                | Implemented, used in root layout                      |
| FocusTrap               | `src/components/ui/FocusTrap.tsx` + `src/hooks/useFocusTrap.ts` | Implemented with tests                                |
| useReducedMotion        | `src/hooks/useReducedMotion.ts`                                 | Implemented with tests                                |
| Input aria support      | `src/components/ui/Input.tsx`                                   | aria-invalid, aria-describedby passthrough            |
| Button aria enforcement | `src/components/ui/Button.tsx`                                  | MED-016: aria-label required for icon-only buttons    |
| Pagination              | `src/components/ui/Pagination.tsx`                              | Full ARIA: navigation role, page labels, current      |
| GuestProfileDrawer      | `src/components/merchant/GuestProfileDrawer.tsx`                | role="dialog", aria-modal, aria-labelledby, aria-live |
| OnlineOrderingToggle    | `src/components/merchant/OnlineOrderingSettingsPanel.tsx`       | role="switch", aria-checked                           |
| MobileBottomNav         | `src/components/merchant/MobileBottomNav.tsx`                   | aria-label on nav                                     |
| ChannelHealthBoard      | `src/components/merchant/ChannelHealthBoard.tsx`                | role="alert"                                          |
| GuestDirectory          | `src/components/merchant/GuestDirectory.tsx`                    | aria-label on search, profile links                   |
| CommandBarShell         | `src/components/merchant/CommandBarShell.tsx`                   | autoFocus, keyboard handling                          |
| ExpeditorBoard (KDS)    | `src/features/kds/components/ExpeditorBoard.tsx`                | Keyboard event listeners                              |

### Testing Infrastructure

| Tool                      | Location                                       | Status                                                       |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| @axe-core/playwright      | `e2e/accessibility.spec.ts`                    | Full e2e suite: guest, merchant, KDS, interactive components |
| @testing-library/jest-dom | `vitest.setup.ts`                              | Configured for unit tests                                    |
| useFocusTrap tests        | `src/hooks/useFocusTrap.test.ts`               | Unit tests for focus trap                                    |
| useReducedMotion tests    | `src/hooks/__tests__/useReducedMotion.test.ts` | Unit tests for reduced motion                                |

### Layout Coverage

| Layout                                       | Skip-to-Content    | Main ID        | tabIndex      |
| -------------------------------------------- | ------------------ | -------------- | ------------- |
| Root (`src/app/layout.tsx`)                  | SkipLink component | `main-content` | tabIndex={-1} |
| Dashboard (`src/app/(dashboard)/layout.tsx`) | -                  | -              | tabIndex={-1} |
| KDS (`src/app/(kds)/layout.tsx`)             | Skip link comment  | -              | tabIndex={-1} |
| Guest (`src/app/(guest)/layout.tsx`)         | Skip link comment  | `main-content` | tabIndex={-1} |

## Audit Results by WCAG Principle

### Principle 1: Perceivable

| Criterion                     | Level | Status     | Notes                                                                    |
| ----------------------------- | ----- | ---------- | ------------------------------------------------------------------------ |
| 1.1.1 Non-text Content        | A     | ✅ Pass    | Images have alt text throughout; decorative images use alt=""            |
| 1.3.1 Info and Relationships  | A     | ✅ Pass    | Semantic HTML used; form labels present; ARIA roles on custom components |
| 1.3.2 Meaningful Sequence     | A     | ✅ Pass    | DOM order matches visual order                                           |
| 1.4.1 Use of Color            | A     | ✅ Pass    | Color not sole indicator; status uses text + icon                        |
| 1.4.3 Contrast (Minimum)      | AA    | ⚠️ Partial | e2e contrast test exists; secondary/gray text needs manual review        |
| 1.4.11 Non-text Contrast      | AA    | ⚠️ Partial | Form borders and disabled states need contrast review                    |
| 1.4.13 Content on Hover/Focus | AA    | ✅ Pass    | No persistent hover-only content                                         |

### Principle 2: Operable

| Criterion              | Level | Status     | Notes                                                                                                                     |
| ---------------------- | ----- | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| 2.1.1 Keyboard         | A     | ⚠️ Partial | Main flows keyboard-accessible; KDS ExpeditorBoard has keyboard listeners; some touch-only targets lack keyboard fallback |
| 2.1.2 No Keyboard Trap | A     | ✅ Pass    | FocusTrap component is explicit and escapable (Escape key)                                                                |
| 2.4.1 Bypass Blocks    | A     | ✅ Pass    | SkipLink component in root layout; skip links in KDS and guest layouts                                                    |
| 2.4.3 Focus Order      | A     | ✅ Pass    | Logical tab order; tabIndex={-1} only on main content containers                                                          |
| 2.4.7 Focus Visible    | AA    | ⚠️ Partial | Focus ring styles present on SkipLink and standard elements; custom components may need explicit focus styles             |
| 2.5.5 Target Size      | AAA   | ⚠️ Partial | Most touch targets adequate; mobile KDS view needs 44px minimum audit                                                     |

### Principle 3: Understandable

| Criterion                  | Level | Status  | Notes                                                      |
| -------------------------- | ----- | ------- | ---------------------------------------------------------- |
| 3.1.1 Language of Page     | A     | ✅ Pass | `lang="en"` set on `<html>` in root layout                 |
| 3.2.2 On Input             | A     | ✅ Pass | No unexpected context changes; form submissions explicit   |
| 3.3.1 Error Identification | A     | ✅ Pass | Input component supports aria-invalid and aria-describedby |
| 3.3.2 Labels/Instructions  | A     | ✅ Pass | Form labels present; search inputs have aria-label         |

### Principle 4: Robust

| Criterion             | Level | Status     | Notes                                                                                                                               |
| --------------------- | ----- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 4.1.1 Parsing         | A     | ✅ Pass    | Valid HTML via React/Next.js rendering                                                                                              |
| 4.1.2 Name/Role/Value | A     | ⚠️ Partial | Custom components (switches, dialogs) have ARIA roles; some icon-only buttons may lack labels outside the enforced Button component |

## Outstanding Issues

### Critical (Must Fix)

1. Audit all icon-only buttons outside `<Button>` component for aria-labels (e.g., direct `<button>` elements in KDS views)
2. Verify keyboard navigation for all KDS queue actions (bump, recall, delay)
3. Add aria-live regions for dynamic order status changes on KDS and merchant dashboard

### High Priority (Should Fix)

1. Review color contrast for secondary text (gray on white backgrounds)
2. Add explicit focus indicators for custom interactive components that override default styles
3. Ensure all form error states use aria-describedby with error message IDs
4. Verify non-text contrast (form borders, icons, disabled states) meets 3:1 ratio

### Medium Priority (Nice to Have)

1. Expand screen reader announcements for real-time updates (order counts, timer changes)
2. Add `prefers-reduced-motion` support to remaining animation-heavy components (useReducedMotion hook exists but not universally applied)
3. Improve touch target sizes on mobile KDS view to 44px minimum
4. Add accessible names to all iframe embeds if any are added
5. Consider adding a high-contrast theme variant

## Testing Tools

### Automated Testing

- `@axe-core/playwright` - e2e accessibility audits in `e2e/accessibility.spec.ts`
- `@testing-library/jest-dom` - DOM assertion matchers for unit tests
- `useFocusTrap` tests - `src/hooks/useFocusTrap.test.ts`
- `useReducedMotion` tests - `src/hooks/__tests__/useReducedMotion.test.ts`

### Manual Testing

- NVDA/JAWS screen reader testing
- Keyboard-only navigation testing across all primary flows
- Voice Control testing (iOS/macOS)
- High contrast mode testing
- Mobile touch target measurement

## Remediation Plan

| Issue                             | Priority | Sprint  | Assignee |
| --------------------------------- | -------- | ------- | -------- |
| Icon-only button aria-label audit | Critical | Current | —        |
| KDS keyboard navigation           | Critical | Current | —        |
| Dynamic content aria-live         | Critical | Current | —        |
| Color contrast review             | High     | Next    | —        |
| Focus indicator audit             | High     | Next    | —        |
| Form error aria-describedby       | High     | Next    | —        |
| Non-text contrast review          | High     | Next    | —        |
| Screen reader announcements       | Medium   | Backlog | —        |
| Reduced motion universal adoption | Medium   | Backlog | —        |
| Mobile touch target audit         | Medium   | Backlog | —        |
