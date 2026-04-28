---
colors:
    primary: '#DDF853'
    secondary: '#1A1C1E'
    neutral: '#F7F5F2'
    surface: '#FFFFFF'
    on-surface: '#1A1C1E'
    error: '#EF4444'

typography:
    headline:
        fontFamily: Inter
        fontWeight: 700
        letterSpacing: '-0.04em'
    body:
        fontFamily: Inter
        fontWeight: 400
        letterSpacing: '-0.04em'
    label:
        fontFamily: Inter
        fontWeight: 600
        fontSize: '12px'
        letterSpacing: '-0.04em'

spacing:
    base: '16px'
    xs: '4px'
    sm: '8px'
    md: '16px'
    lg: '32px'
    xl: '64px'

rounded:
    sm: '4px'
    md: '8px'
    lg: '12px'
    xl: '24px'
    full: '32px'
---

# Lole Enterprise Design System

"Toast for Addis Ababa" — High-density, premium restaurant operating system.

## Colors

The palette is anchored by **Lole Lime** (#DDF853), a high-visibility accent used for primary actions and status indicators.
Secondary elements use a deep off-black (#1A1C1E) to establish authority and professional weight.

- **Primary:** Lole Lime (#DDF853). Used for main buttons, active states, and "Alive" indicators.
- **Secondary:** Deep Carbon (#1A1C1E). Used for typography, icons, and high-contrast containers.
- **Surface:** Pure White (#FFFFFF). Content sits on clean, white cards to emphasize information density without clutter.

## Typography

Strict reliance on **Inter** with consistent negative tracking to create a "tight", engineered look.

- **Headlines:** Bold (700) with -0.04em tracking.
- **Body:** Regular (400) or Medium (500) for UI labels.
- **Metadata:** Semibold (600) at 10-12px for technical data.

## Layout & Spacing

A strict **8px grid** maintains rhythm.

- **Containment:** Related items grouped in cards with `rounded-3xl` (24px).
- **Density:** High information density for merchant workflows, balanced by generous external margins (px-10).

## Shapes

Shapes utilize **generous corner radii** to feel modern and approachable.

- **Large Containers:** 24px (3xl).
- **Interactive Elements:** 12px (lg) for buttons and inputs.

## Components

- **Metric Cards:** Split-half design with light gray (#F7F5F2) footers.
- **Enterprise Card Style:** `rounded-3xl`, `bg-white`, `border border-gray-100`, `shadow-none`, `p-8`.
- **Card Footers:** Full-width edge-to-edge buttons (`bg-gray-50`, `border-t`, `rounded-b-3xl`).
- **Navigation:** Underline-based tabs with black active indicators.
- **Buttons:** 11px or 14px font height, bold, 12px radius.

## Do's and Don'ts

- **Do** use Lole Lime for "Online" or "Active" status.
- **Don't** use generic blue or red unless for specific system errors.
- **Do** keep typography tracking at -0.04em for all headers.
- **Don't** use drop shadows; rely on 1px `border-gray-100` for containment.
- **Do** use edge-to-edge footers for secondary card actions.
