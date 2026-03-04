# Cinematic Landing Page Builder — Gebeta Edition

## Role

Act as a World-Class Senior Creative Technologist and Lead Frontend Engineer specializing in high-fidelity, cinematic landing pages for SaaS platforms. You build "1:1 Pixel Perfect" experiences that feel like digital instruments — every scroll intentional, every animation weighted and professional. Eradicate all generic AI patterns. This prompt is specifically tailored for **Gebeta**, the restaurant operating system for Ethiopia.

---

## Brand Context (Pre-Filled)

### Brand Identity
- **Name:** Gebeta (ገበታ — "feast" or "large plate" in Amharic)
- **Tagline:** "The Operating System for African Restaurants"
- **Mission:** Become "Toast for Ethiopia" — providing restaurants with a modern, reliable, and affordable platform to manage orders, payments, staff, and guests.
- **Market:** Addis Ababa, Ethiopia — targeting 5,000+ restaurants

### Core Value Propositions
1. **Built for Ethiopia** — Native Telebirr, Chapa integration; Amharic & English support; designed for local business practices
2. **Offline-First Reliability** — Full operation during intermittent connectivity; automatic sync when online
3. **Complete Restaurant OS** — QR ordering, KDS, payments, analytics, staff management — one unified platform

### Primary Call-to-Action
- **"Start Free Trial"** (primary) — leads to signup
- **"Book a Demo"** (secondary) — for enterprise prospects

---

## Aesthetic Preset — "Ethiopian Ember" (Custom for Gebeta)

This preset is uniquely crafted for Gebeta, blending Ethiopian cultural warmth with modern SaaS sophistication.

### Identity
A contemporary Ethiopian restaurant meets a Silicon Valley tech showroom. Warm, inviting, yet undeniably cutting-edge. Think: a beautifully lit traditional coffee ceremony reimagined as a digital experience.

### Palette (Derived from Design Tokens)

| Token | Color | Hex | Usage |
|-------|-------|-----|-------|
| **Ember** | Deep Ethiopian Red | `#A81818` | Primary actions, accents, brand moments |
| **Ember Dark** | Darkened Red | `#8B1313` | Hover states, depth |
| **Ember Light** | Soft Red Tint | `#FDF2F2` | Subtle backgrounds, highlights |
| **Charcoal** | Deep Dark | `#111827` | Text, dark sections, footer |
| **Slate** | Muted Dark | `#1F2937` | Secondary text, cards on dark |
| **Cream** | Warm Off-White | `#F9FAFB` | Primary background |
| **Gold** | Ethiopian Gold | `#D4A853` | Premium accents, highlights |
| **Coffee** | Rich Brown | `#5D4037` | Secondary accent, warmth |
| **Success** | Ethiopian Green | `#10B981` | Status indicators, positive states |

### Typography

| Role | Font | Style Notes |
|------|------|-------------|
| **Headings** | `"Plus Jakarta Sans"` | Bold, tight tracking (`-0.02em`), modern tech feel |
| **Drama** | `"Playfair Display"` | Italic, elegant, used for emotional impact statements |
| **Body** | `"Inter"` | Clean, highly readable, 400-600 weight |
| **Data/Mono** | `"JetBrains Mono"` | Technical data, prices, metrics, live feeds |

### Image Mood (Unsplash Keywords)
- Ethiopian coffee ceremony
- Traditional injera and mesob
- Modern African restaurant interiors
- Addis Ababa cityscape at dusk
- Warm ambient lighting
- Chef hands preparing food
- Community dining, shared plates
- Texture: woven bamboo, Ethiopian cotton patterns

### Hero Line Pattern
```
"[Restaurant noun] deserves" (Bold Sans — Plus Jakarta Sans)
"[Aspirational word]." (Massive Serif Italic — Playfair Display Italic)
```

**Examples:**
- "Every restaurant deserves" / "Brilliance."
- "Your kitchen deserves" / "Clarity."
- "Ethiopian dining deserves" / "Innovation."

---

## Fixed Design System (NEVER CHANGE)

These rules apply universally and create the premium feel.

### Visual Texture
- **Noise Overlay:** Implement a global CSS noise overlay using an inline SVG `<feTurbulence>` filter at **0.04 opacity** to eliminate flat digital gradients.
- **Border Radius:** Use `rounded-[2rem]` to `rounded-[3rem]` for all containers. No sharp corners anywhere.
- **Gradients:** Subtle gradient overlays on images — `bg-gradient-to-t from-Charcoal via-Charcoal/60 to-transparent`

### Micro-Interactions
- **Magnetic Buttons:** All buttons must have a subtle `scale(1.03)` on hover with `cubic-bezier(0.25, 0.46, 0.45, 0.94)` easing.
- **Sliding Background:** Buttons use `overflow-hidden` with a sliding background `<span>` layer for color transitions on hover.
- **Lift Effect:** Links and interactive elements get a `translateY(-1px)` lift on hover.
- **Focus States:** Use the design token focus ring — `0 0 0 3px rgba(168,24,24,0.15)` for accessibility.

### Animation Lifecycle
- Use `gsap.context()` within `useEffect` for ALL animations. Return `ctx.revert()` in the cleanup function.
- **Default Easing:** `power3.out` for entrances, `power2.inOut` for morphs.
- **Stagger Values:** `0.08` for text, `0.15` for cards/containers.
- **ScrollTrigger:** Pin sections, trigger animations on scroll entry.

---

## Component Architecture

### A. NAVBAR — "The Floating Ember"

A `fixed` pill-shaped container (`rounded-full`), horizontally centered.

**Morphing Logic:**
- At hero top: Transparent with light text (`text-white`)
- After scrolling past hero: `bg-Cream/80 backdrop-blur-xl` with `text-Charcoal` and a subtle `border border-gray-200`
- Use `IntersectionObserver` or GSAP ScrollTrigger for the transition

**Contents:**
- Logo: "Gebeta" wordmark in Ember (`#A81818`) with optional Amharic subtitle
- Nav links: Features, Pricing, About, Contact
- CTA button: "Start Free Trial" in Ember with hover slide effect

**Mobile:**
- Collapse to hamburger menu with slide-in drawer
- Drawer has dark overlay with `backdrop-blur-sm`

---

### B. HERO SECTION — "The Opening Feast"

**Layout:**
- `100dvh` height
- Full-bleed background image (Ethiopian restaurant or coffee ceremony from Unsplash)
- Heavy gradient overlay: `bg-gradient-to-t from-Charcoal via-Charcoal/70 to-transparent`
- Content positioned at **bottom-left third** using flex + padding

**Typography Structure:**
```
[Small overline] "Restaurant Operating System" — mono, Ember color, tracking-wide
[Main headline - Part 1] "Every restaurant" — Plus Jakarta Sans, bold, white
[Main headline - Part 2] "deserves brilliance." — Playfair Display, italic, massive, Ember accent on "brilliance"
[Subheadline] "From order to payment, manage your entire operation with one powerful platform. Built for Ethiopia."
[CTA Group] Primary: "Start Free Trial" | Secondary: "Watch Demo →"
```

**Animation:**
- GSAP staggered `fade-up` (y: 40 → 0, opacity: 0 → 1)
- Order: overline → headline part 1 → headline part 2 → subheadline → CTAs
- Stagger: 0.15s between elements

**Decorative Elements:**
- Subtle animated particles (like floating ember sparks) using CSS or canvas
- Optional: A subtle Ethiopian pattern overlay at very low opacity (5%)

---

### C. FEATURES — "Interactive Functional Artifacts"

Three cards derived from the value propositions. These must feel like **functional software micro-UIs**, not static marketing cards.

#### Card 1 — "Order Flow Shuffler" (Built for Ethiopia)
**Concept:** 3 overlapping order cards that cycle vertically every 3 seconds with spring-bounce transition.

**Visual:**
- Container: `bg-Cream`, `rounded-[2rem]`, subtle border, drop shadow
- Three stacked cards showing:
  - "Table 5 — 2x Tibs, 1x Injera" — status: "Preparing"
  - "Delivery — 3x Special Firfir" — status: "Ready"
  - "Table 12 — 1x Coffee Ceremony" — status: "New"
- Cards animate with `cubic-bezier(0.34, 1.56, 0.64, 1)` spring bounce
- Ember accent on status badges

**Heading:** "Built for Ethiopia"
**Descriptor:** "Telebirr, Chapa, and local payment methods. Amharic and English. Designed for how Ethiopian restaurants actually work."

---

#### Card 2 — "Live Kitchen Telemetry" (Offline-First)
**Concept:** A monospace live-text feed that types out kitchen events character-by-character with a blinking Ember cursor.

**Visual:**
- Dark container (`bg-Charcoal`) with `rounded-[2rem]`
- Monospace font (JetBrains Mono)
- Live feed showing:
  ```
  [14:32:05] Order #1847 received — Table 8
  [14:32:07] Kitchen acknowledged — ETA 12min
  [14:32:15] Order #1848 received — Delivery
  [14:32:18] Payment confirmed — Telebirr — 450 ETB
  [14:32:22] Order #1847 preparing...
  ```
- Blinking Ember cursor at the end
- "Live Feed" label with pulsing green dot

**Heading:** "Offline-First Reliability"
**Descriptor:** "Keep working even when the internet doesn't. Every order queues locally and syncs automatically when you're back online."

---

#### Card 3 — "Restaurant Command Scheduler" (Complete OS)
**Concept:** A weekly grid (S M T W T F S) where an animated SVG cursor enters, moves to a day cell, clicks (visual `scale(0.95)` press), activates the day (Ember highlight), then moves to a "Save" button before fading out.

**Visual:**
- Container: `bg-Cream`, `rounded-[2rem]`
- Weekly schedule grid showing:
  - Staff shifts
  - Peak hours highlighted
  - Revenue bars per day
- Animated cursor interaction
- Ember accent on active elements

**Heading:** "Complete Restaurant OS"
**Descriptor:** "QR ordering, kitchen display, payments, analytics, and staff management — all in one unified platform."

---

### D. PHILOSOPHY — "The Manifesto"

**Layout:**
- Full-width section with `bg-Charcoal` (dark)
- Parallaxing texture image behind text (Ethiopian coffee beans or woven pattern at 10% opacity)
- Two contrasting statements

**Typography Pattern:**
```
[Neutral, smaller] "Most restaurant software assumes:"
[Neutral list] "Reliable internet. Western payments. English-only menus."

[Massive, Drama Serif Italic] "We built for:"
[Ember accent, massive] "Reality."
```

**Animation:**
- GSAP SplitText-style reveal (word-by-word fade-up)
- Triggered by ScrollTrigger
- Second statement has more dramatic scale and stagger

---

### E. PROTOCOL — "Sticky Stacking Journey"

Three full-screen cards that stack on scroll.

**Stacking Interaction:**
- Using GSAP ScrollTrigger with `pin: true`
- As new card scrolls into view, card underneath scales to `0.9`, blurs to `20px`, fades to `0.5`

**Card 1 — "Scan & Order"**
- Canvas animation: QR code forming from particles
- Step number: `01` (monospace, muted)
- Title: "Guests scan, browse, order"
- Description: "QR codes at every table. Beautiful digital menus in Amharic and English. No app download required."

**Card 2 — "Kitchen Flow"**
- Canvas animation: Order tickets flowing through stations with a scanning horizontal laser-line
- Step number: `02`
- Title: "Kitchen receives, prepares, serves"
- Description: "Real-time kitchen display. Audio alerts. Status tracking. Guests know exactly when their food is ready."

**Card 3 — "Payment & Insights"**
- Canvas animation: Pulsing waveform transforming into upward trending graph
- Step number: `03`
- Title: "Seamless payment, powerful insights"
- Description: "Telebirr, Chapa, card, or cash. Automatic reconciliation. Real-time analytics on sales, peaks, and performance."

---

### F. PRICING / MEMBERSHIP

**Three-tier pricing grid:**

| Tier | Name | Price | Features |
|------|------|-------|----------|
| 1 | Starter | Free | 1 terminal, basic features, community support |
| 2 | Professional | 2,500 ETB/mo | Unlimited terminals, all payments, priority support |
| 3 | Enterprise | 7,500+ ETB/mo | Multi-location, custom integrations, SLA |

**Visual:**
- Cards: `rounded-[2rem]`, `bg-Cream` for outer cards
- **Middle card pops:** `bg-Ember` with white text, Ember CTA button, slightly larger scale or `ring-2 ring-Gold`
- Hover effects on all cards

**Alternative (if pricing doesn't fit):**
- Single large CTA section with "Get Started" button
- Background: subtle Ethiopian pattern at low opacity

---

### G. SOCIAL PROOF — "Trust Signals"

**Layout:**
- Horizontal scroll or grid of logos (placeholder for now: "Trusted by 50+ restaurants in Addis Ababa")
- Stats row: "10,000+ orders processed" | "5M+ ETB in transactions" | "99.9% uptime"
- Optional testimonial cards with Ethiopian names and restaurant types

---

### H. FOOTER — "The Foundation"

**Layout:**
- `bg-Charcoal`, `rounded-t-[4rem]`
- Grid layout:
  - Brand: "Gebeta" wordmark + tagline + Ethiopian pattern accent
  - Product links: Features, Pricing, KDS, Guest Ordering
  - Company: About, Blog, Careers, Contact
  - Legal: Privacy, Terms, Security
  - Language toggle: English | አማርኛ

**Status Indicator:**
- "System Operational" with pulsing green dot
- Monospace label: `All systems normal`

**Bottom Bar:**
- © 2026 Gebeta. Made with ❤️ in Addis Ababa.

---

## Technical Requirements

### Stack
- **Framework:** Next.js 16 (App Router), React 19
- **Styling:** Tailwind CSS v4
- **Animation:** GSAP 3 with ScrollTrigger plugin
- **Icons:** Lucide React
- **Fonts:** Google Fonts via `next/font/google`

### Font Loading
```typescript
import { Plus_Jakarta_Sans, Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-heading',
});

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  style: ['italic'],
  variable: '--font-drama',
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
});
```

### File Structure
```
src/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx          # Landing page
│   └── globals.css           # Tailwind + noise overlay
├── components/
│   └── landing/
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── Features.tsx
│       ├── Philosophy.tsx
│       ├── Protocol.tsx
│       ├── Pricing.tsx
│       ├── SocialProof.tsx
│       └── Footer.tsx
└── lib/
    └── constants/
        └── design-tokens.ts  # Existing tokens
```

### Responsive Design
- Mobile-first approach
- Stack cards vertically on mobile
- Reduce hero font sizes for mobile
- Collapse navbar to hamburger
- Touch-friendly tap targets (44px minimum)

### Accessibility
- WCAG 2.1 AA compliance
- Proper heading hierarchy
- Focus visible states
- Reduced motion support via `prefers-reduced-motion`
- Screen reader friendly

---

## Build Sequence

1. **Setup:** Create component files in `src/components/landing/`
2. **Design Tokens:** Use existing tokens from `src/lib/constants/design-tokens.ts`
3. **Fonts:** Configure Google Fonts in `src/app/layout.tsx`
4. **Navbar:** Build floating navbar with scroll morph
5. **Hero:** Full-bleed image, gradient overlay, animated text
6. **Features:** Three interactive cards with GSAP animations
7. **Philosophy:** Dark section with parallax and text reveal
8. **Protocol:** Sticky stacking cards with canvas animations
9. **Pricing:** Three-tier grid with pop card
10. **Social Proof:** Stats and testimonials
11. **Footer:** Dark footer with status indicator
12. **Polish:** Noise overlay, micro-interactions, responsive testing

---

## Execution Directive

> "Do not build a website; build a digital instrument. Every scroll should feel intentional, every animation should feel weighted and professional. This is Gebeta — the operating system that Ethiopian restaurants deserve. Make it feel like it."

---

## Quick Reference: Design Tokens

```typescript
// From src/lib/constants/design-tokens.ts
colors: {
  primary: {
    DEFAULT: '#A81818',  // Ember
    dark: '#8B1313',
    light: '#FDF2F2',
  },
  neutral: {
    900: '#111827',  // Charcoal
    800: '#1F2937',  // Slate
    50: '#F9FAFB',   // Cream
    0: '#FFFFFF',    // White
  },
  semantic: {
    success: { DEFAULT: '#10B981' },  // Ethiopian Green
  }
}

// Custom additions for landing page
accent: {
  gold: '#D4A853',      // Ethiopian Gold
  coffee: '#5D4037',    // Rich Brown
}
```

---

## Image Sources (Unsplash)

Use these search terms for authentic imagery:
- `ethiopian coffee ceremony`
- `injera traditional food`
- `addis ababa restaurant`
- `african restaurant interior`
- `ethiopian mesob`
- `chef preparing food`
- `restaurant kitchen`
- `community dining ethiopia`

---

**End of Prompt**

This document serves as the complete specification for building Gebeta's cinematic landing page. Follow it precisely to achieve a world-class, premium result that honors both the brand identity and the high-end design principles.