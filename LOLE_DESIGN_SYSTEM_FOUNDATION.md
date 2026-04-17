# Lole Design System Foundation

Status: Draft v0.1  
Owner: Product + Design + Engineering  
Last updated: 2026-03-27

## Purpose

This document is the source of truth for the Lole rebrand and platform-wide design system rollout.

It exists to turn the current landing page aesthetic into a governed, reusable design system that can be applied across:

- marketing
- merchant dashboard
- POS
- KDS
- guest ordering
- auth/settings/public support surfaces

This is not a mood board. It is the operating spec for building a branded company, not a collection of nice-looking pages.

## Source Of Truth

Visual inputs, in order:

1. [src/app/page.tsx](src/app/page.tsx) as the current visual source of truth for the rebrand
2. [Brand.md](Brand.md) for company vision, mission, positioning, and messaging only
3. Existing shared primitives in [src/components/ui/Button.tsx](src/components/ui/Button.tsx), [src/components/ui/Card.tsx](src/components/ui/Card.tsx), and [src/components/ui/Input.tsx](src/components/ui/Input.tsx)
4. Existing global token layer in [src/app/globals.css](src/app/globals.css)

Important:

- Canonical brand name is `Lole`
- Legacy names `Gebeta`, `Gebetaa`, and stylistic casing `LoLe` must be retired from product-facing surfaces
- [Brand.md](Brand.md) is a legacy strategic document and must not be used as a visual source for colors, typography, layout, motion, or component styling
- The current landing page visual direction is the only visual source of truth for the rebrand
- The strategic parts of [Brand.md](Brand.md) remain useful and should be preserved where they align

## Task 1: Brand Lock

Before touching the full platform, the brand must be fixed.

### Canonical Brand Decision

- Brand name: `Lole`
- Category: restaurant operating system
- Market: Ethiopia-first, starting with Addis Ababa
- Product promise: one operating system for orders, tables, kitchens, payments, guests, and growth
- Strategic benchmark: Toast-grade reliability, adapted for Ethiopia

### Brand Promise

Lole runs the restaurant with calm, modern, infrastructure-grade reliability.

The brand should communicate:

- operational control
- premium clarity
- speed without chaos
- local confidence
- modernity without startup gimmicks

### Audience

Primary:

- restaurant owners
- general managers
- operations managers

Secondary:

- cashiers
- servers
- hosts
- kitchen staff
- finance/admin staff

The system must feel premium to owners and effortless to staff.

### Personality

Lole is:

- precise
- modern
- calm
- premium
- decisive
- warm enough for hospitality

Lole is not:

- playful
- noisy
- over-animated
- hyper-corporate
- generic SaaS
- a consumer social app

### Voice

Write like a trusted operator:

- direct
- clear
- confident
- specific
- respectful

Do not write like:

- a junior startup
- a hype-driven AI product
- a fintech landing page
- a trendy design portfolio

### Brand Expression Model

The same brand must express itself differently depending on the screen type.

#### 1. Marketing Expression

Use when selling the company.

- bold typography
- cinematic composition
- atmospheric backgrounds
- stronger contrast
- more visual drama
- selective motion

#### 2. Product Command Expression

Use for dashboard and owner-facing control surfaces.

- premium but restrained
- denser information layout
- cleaner surface hierarchy
- reduced decorative treatment
- emphasis on readability and control

#### 3. Operational Expression

Use for POS, KDS, and high-speed staff workflows.

- fastest to scan
- highest clarity
- highest state contrast
- minimal decorative motion
- large touch targets
- zero ambiguity

## Landing Page Audit

The landing page already contains the rebrand direction. It is not yet a system, but it does establish the visual language we should extract.

### What Works

1. The palette feels intentional.
   The page relies on warm light neutrals, dark roasted browns, acid-lime accents, and a hot ember gradient. It feels more ownable than the current dashboard grays.

2. The typography has authority.
   Large headings use tight tracking and compressed line-height. This makes the brand feel confident and editorial rather than template-based.

3. The radii and spacing feel premium.
   The page consistently uses soft rounded corners and generous whitespace, especially on large cards and section containers.

4. Accent usage is disciplined.
   The lime accent is used as a call-to-action and highlight color rather than a background color everywhere.

5. Motion is selective.
   The page uses movement to reveal hierarchy and product energy, not constant micro-animation noise.

6. It already hints at a product family.
   Product modules are presented consistently enough to evolve into reusable feature-card patterns and product marketing blocks.

### What Does Not Translate Directly Into Product UI

1. The landing page is too bespoke.
   Many values are hard-coded inline and repeated, which is fine for a marketing page but not acceptable for platform-wide reuse.

2. Large offsets and asymmetry need systemization.
   Repeated `translate-x-[125px]` and custom one-off dimensions create personality, but they need governed layout rules before reuse.

3. The page uses beauty-first cards.
   Dashboard, POS, and KDS need task-first patterns, denser layouts, and clearer state logic.

4. Some color choices are atmospheric rather than semantic.
   Product UI needs clear success, warning, destructive, syncing, offline, and urgent state colors, not just brand colors.

5. The brand doc and landing page diverge.
   [Brand.md](Brand.md) describes a green-led identity, while the current landing page is lime, espresso, mist, and ember. That conflict would cause drift if we do not explicitly resolve it here.

### Current Gaps In The Application

The app shell and shared components do not yet inherit the landing-page aesthetic consistently.

Observed gaps:

- `Lole` is not the canonical name everywhere yet
- the root layout still carries `Gebeta` metadata in [src/app/layout.tsx](src/app/layout.tsx)
- the global token layer in [src/app/globals.css](src/app/globals.css) mixes multiple unrelated palettes
- shared primitives exist, but many product screens still use raw one-off Tailwind classes
- dashboard surfaces use inconsistent gray palettes, radii, borders, and shadows
- product surfaces do not yet feel visually related to the marketing site

## Token Map

These tokens are the first-pass semantic system derived from the landing page. They should replace raw hex usage over time.

### 1. Color Tokens

#### Brand Core

- `--color-brand-canvas`: `#F5F5F3`
- `--color-brand-canvas-alt`: `#F4F3EF`
- `--color-brand-accent`: `#DDF853`
- `--color-brand-accent-hover`: `#CBE346`
- `--color-brand-ink`: `#17120B`
- `--color-brand-ink-strong`: `#170B05`
- `--color-brand-surface-dark`: `#292723`
- `--color-brand-surface-dark-hover`: `#3D3A34`
- `--color-brand-neutral`: `#8A887A`
- `--color-brand-neutral-soft`: `#888884`
- `--color-brand-ember`: `#E34105`
- `--color-brand-ember-deep`: `#481A05`
- `--color-brand-ink-alt`: `#1C1917`

#### Gradient Tokens

- `--gradient-brand-hero-dark`: `linear-gradient(135deg, #170B05 0%, #481A05 55%, #E34105 100%)`
- `--gradient-brand-panel-dark`: dark neutral-to-roast system for footer, CTA, and premium feature sections

#### Text Tokens

- `--color-text-primary`: brand ink on light surfaces
- `--color-text-secondary`: softened neutral for supporting copy
- `--color-text-inverse`: white on dark surfaces
- `--color-text-inverse-muted`: white at reduced opacity on dark surfaces

#### Surface Tokens

- `--color-surface-page`: default product page background
- `--color-surface-raised`: elevated card background
- `--color-surface-muted`: soft muted panel background
- `--color-surface-dark`: dark shell/background surface
- `--color-surface-overlay`: translucent overlays and glass treatments

#### State Tokens

These must exist independently from brand accents.

- `--color-state-success`
- `--color-state-success-bg`
- `--color-state-warning`
- `--color-state-warning-bg`
- `--color-state-danger`
- `--color-state-danger-bg`
- `--color-state-info`
- `--color-state-info-bg`
- `--color-state-offline`
- `--color-state-offline-bg`
- `--color-state-syncing`
- `--color-state-syncing-bg`
- `--color-state-urgent`
- `--color-state-urgent-bg`

Proposed product semantics:

- success: order sent, payment captured, sync completed
- warning: delayed course, pending reconciliation, low stock
- danger: failed payment, void, destructive action, hard error
- info: neutral status, onboarding guidance, analytics compare
- offline: queued locally, disconnected but safe
- syncing: in-progress state between offline and persisted
- urgent: KDS SLA breach, delayed table, payment risk

### 2. Typography Tokens

#### Canonical UI Font

- Primary UI font: `Inter`
- Secondary support font: `Manrope` may remain temporarily only where replacement is risky
- Decorative/editorial fonts: none in product UI by default

Decision:

- Marketing and product should converge on `Inter` as the primary system font
- Existing multi-font setup in [src/app/layout.tsx](src/app/layout.tsx) should be simplified during implementation

#### Type Roles

- `--font-size-display-1`: 64px desktop / 40px tablet / 32px mobile
- `--font-size-display-2`: 48px desktop / 36px tablet / 28px mobile
- `--font-size-heading-1`: 34px
- `--font-size-heading-2`: 24px
- `--font-size-heading-3`: 20px
- `--font-size-body-lg`: 18px
- `--font-size-body`: 15px or 16px depending on surface density
- `--font-size-body-sm`: 14px
- `--font-size-caption`: 12px
- `--font-size-micro`: 11px

#### Tracking Rules

- display headings: `-0.07em` default
- section headings: between `-0.03em` and `-0.07em`
- body text: normal
- labels and chips: slight positive tracking only when needed

#### Line Height Rules

- display: `0.95` to `1.05`
- headings: `1.0` to `1.2`
- body: `1.5` to `1.7`
- dense operational labels: `1.2` to `1.4`

### 3. Spacing Tokens

Use an 8px major rhythm with 4px sub-steps.

- `4`
- `8`
- `12`
- `16`
- `20`
- `24`
- `32`
- `40`
- `48`
- `64`
- `80`
- `96`
- `128`

Rules:

- marketing sections: 64 to 96 vertical spacing
- dashboard blocks: 24 to 32
- POS/KDS clusters: 12 to 24
- only primitives may define spacing recipes; screens should compose them

### 4. Radius Tokens

- `--radius-xs`: 6px
- `--radius-sm`: 12px
- `--radius-md`: 16px
- `--radius-lg`: 20px
- `--radius-xl`: 24px
- `--radius-2xl`: 32px
- `--radius-pill`: 999px

Rules:

- chips and compact controls: `xs`
- inputs and standard buttons: `sm` or `md`
- cards and drawers: `lg` or `xl`
- marketing feature cards: `xl` or `2xl`

### 5. Shadow Tokens

- `--shadow-soft`: subtle card elevation
- `--shadow-medium`: default hover or raised panel
- `--shadow-strong`: modal, drawer, high-elevation feature card
- `--shadow-dark-glow`: limited use on dark surfaces

Rules:

- use shadows for elevation, not heavy borders
- product UI should be calmer than the marketing page
- dark shell surfaces need tighter, lower-bloom shadow values

### 6. Border And Ring Tokens

- default border: low-contrast, warm-neutral line
- focus ring: brand accent or high-contrast state ring depending on context
- destructive ring: red state ring
- selected state: accent fill plus subtle outline

Rules:

- focus styling must remain WCAG visible
- operational surfaces may need darker and stronger rings than marketing surfaces

### 7. Motion Tokens

#### Durations

- `--motion-fast`: 120ms
- `--motion-standard`: 180ms
- `--motion-emphasis`: 240ms
- `--motion-panel`: 320ms
- `--motion-scene`: 500ms

#### Easings

- `--ease-enter`: ease-out
- `--ease-exit`: ease-in
- `--ease-standard`: ease-in-out

Rules:

- dashboard uses restrained motion
- POS and KDS avoid decorative motion
- marketing can use staggered reveal and richer transitions
- motion should explain state change or draw attention, never decorate for its own sake

### 8. Grid And Container Tokens

#### Marketing

- page max width: 1440px
- content max width: 1200px
- reading width: 680px
- large card lanes: governed sizes instead of custom per-section widths

#### Product

- dense dashboard content width: 1280px
- analytics wide mode: 1440px when necessary
- form/settings width: 720px to 960px

### 9. Semantic Density Rules

Visual density must vary by product type:

- marketing: spacious
- dashboard: medium density
- POS: compact touch-first
- KDS: highly scannable, high-contrast, minimal chrome

## Component Inventory

The design system needs a governed inventory, not ad hoc components.

### Foundations

- tokens
- typography styles
- icon rules
- motion rules
- illustration/photo direction

### Primitives

- button
- icon button
- input
- textarea
- select
- checkbox
- radio
- switch
- badge
- chip
- divider
- avatar
- tooltip

### Surfaces

- card
- panel
- sheet
- drawer
- modal
- popover
- dropdown menu
- toast
- inline banner

### Navigation

- app shell
- sidebar
- top bar
- mobile bottom nav
- breadcrumb
- tabs
- stepper
- command bar

### Data Display

- stat card
- metric tile
- table
- list row
- empty state
- loading skeleton
- error state
- offline state
- sync status indicator
- chart frame

### Product Patterns

- order ticket
- KDS lane
- table card
- session drawer
- payment split panel
- receipt preview
- printer status panel
- loyalty account summary
- guest profile summary

### Current Starting Inventory In Code

Existing reusable code we can evolve:

- [src/components/ui/Button.tsx](src/components/ui/Button.tsx)
- [src/components/ui/Card.tsx](src/components/ui/Card.tsx)
- [src/components/ui/Input.tsx](src/components/ui/Input.tsx)
- [src/components/ui/Modal.tsx](src/components/ui/Modal.tsx)
- [src/components/ui/Table.tsx](src/components/ui/Table.tsx)
- [src/components/ui/Toast.tsx](src/components/ui/Toast.tsx)

These should become canonical primitives. Screens should stop hand-rolling replacements.

## App-Shell Rules

The shell is the company experience. If the shell looks generic, the company looks generic.

### Shared Rules

- All authenticated surfaces must feel like Lole immediately
- Navigation, spacing, typography, elevation, and page headers must be standardized
- App shell should use the same brand family as marketing, but at lower visual intensity

### Dashboard Shell

- calmer than marketing
- premium neutral backgrounds
- restrained use of accent lime
- one clear page title zone
- consistent content paddings
- consistent panel elevations
- fixed navigation behavior across desktop/mobile

### POS Shell

- touch-first targets
- strong contrast
- persistent primary actions
- very limited decorative styling
- fast feedback for selections, modifiers, and payment state

### KDS Shell

- prioritize urgency and readability over brand flourish
- dark or high-contrast background acceptable if contrast improves scanning
- urgent and delayed states must be unmistakable
- animation only for new-ticket arrival or state transition, never ambient motion

### Guest Shell

- closer to marketing in warmth
- simpler navigation
- strong trust cues around payment and order status
- mobile-first always

## Screen-Type Rules

### Marketing Screens

- may use gradients, oversized type, editorial layouts, asymmetry, and stronger visual narrative
- must still rely on the same tokens and primitives

### Dashboard Screens

- focus on overview, metrics, trends, exceptions, and actionability
- visual hierarchy through spacing and typography, not color noise
- charts and tables must share a unified frame style

### POS Screens

- action density over visual storytelling
- one dominant action zone at a time
- no tiny controls
- color cannot be the only way to indicate item selection or order status

### KDS Screens

- urgency hierarchy is the design
- time, course state, fire state, and station state must dominate
- use minimal copy and maximal scan clarity

### Tables And Sessions

- states must be visible at a glance
- availability, occupied, reserved, cleaning, and inactive states need canonical colors and labels
- session drawer and floor grid should share one pattern language

### Payments

- split checks, multi-method payment, retry, refund, pending verification, and offline recovery states require exact patterns
- payment states must feel trustworthy and auditable

### Offline / Sync / Printer

- offline confidence is part of the brand
- product must reassure users when work is locally safe
- queued, syncing, synced, printer disconnected, and retrying states need dedicated components, not ad hoc alerts

## Migration Order

This rollout should happen in phases.

### Phase 0: Foundations

- lock brand name and casing
- publish this spec
- create task tracker
- define first-pass tokens

### Phase 1: Token Infrastructure

- clean [src/app/globals.css](src/app/globals.css)
- establish canonical semantic tokens
- align root typography in [src/app/layout.tsx](src/app/layout.tsx)
- remove conflicting legacy color tokens

### Phase 2: Shared Primitives

- buttons
- inputs
- cards
- badges
- tabs
- modal/drawer
- table
- toast
- empty/loading/error/offline states

### Phase 3: Shared Shell

- dashboard shell
- mobile bottom nav
- page header
- section framing
- sidebar/right-rail styling

### Phase 4: High-Traffic Product Surfaces

- dashboard overview
- orders
- tables/sessions
- payments
- KDS

### Phase 5: Remaining Modules

- guests
- loyalty
- inventory
- marketing tools
- settings/help/public pages

### Phase 6: Governance

- component adoption rules
- lint/documentation checks
- visual QA checklist
- story/reference gallery for future development

## Do / Don’t Examples

### Brand Application

Do:

- use semantic tokens
- reuse primitives
- keep the accent lime reserved for priority actions and selected highlights
- use warm neutrals for page rhythm
- keep product surfaces calmer than marketing

Do not:

- paste landing-page gradients onto every dashboard card
- invent new hex colors inside feature screens
- add one-off radii per page
- use arbitrary shadows without token backing
- mix `Gebeta`, `Gebetaa`, `LoLe`, and `Lole`

### Typography

Do:

- use strong heading hierarchy
- keep display tracking tight
- use concise copy

Do not:

- mix multiple unrelated fonts in one surface
- use tiny low-contrast text on operational screens
- rely on all caps everywhere

### Product Screens

Do:

- prioritize clarity, state visibility, and speed
- show offline and syncing states with confidence
- make risky actions explicit

Do not:

- sacrifice readability for aesthetic flourishes
- hide status in subtle color changes only
- animate busy staff surfaces excessively

## Governance Rules

To stop visual drift:

1. No new shared component may introduce raw brand hex values if a semantic token exists.
2. No product page may create a new button, card, or form style if a system primitive can be extended.
3. New screens must declare which shell type they belong to: marketing, dashboard, POS, KDS, guest, or public utility.
4. All product states must use canonical semantic states.
5. Rebrand work must remove legacy `Gebeta` naming in the changed scope.

## Assets Needed From Design

To finish the system at a professional level, design should provide:

1. Canonical logo pack for `Lole`
2. App icon and favicon set
3. Approved wordmark lockups
4. Color palette approval, including semantic state colors
5. Typography approval and licensing confirmation
6. Icon direction if anything beyond Lucide is required
7. Chart style guidance
8. Photography direction and source set
9. Illustration guidance for onboarding and empty states
10. High-fidelity mocks for dashboard, POS, KDS, payments, and tables

## Immediate Next Deliverables

1. Convert this first-pass spec into actual token definitions in code
2. Refactor the root theme layer around `Lole`
3. Rebuild the core primitives against the token system
4. Apply the new shell to the dashboard before touching every module
