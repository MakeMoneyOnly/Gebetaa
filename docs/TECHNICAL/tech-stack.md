# Gebeta - Technology Stack Documentation

**Version:** 1.0.0  
**Last Updated:** February 17, 2026  
**Owner:** Engineering Team  
**Status:** Active

---

## 1. Overview

This document defines the technology stack for Gebeta, a restaurant operating system built for Addis Ababa, Ethiopia. Our technology choices prioritize reliability, developer experience, and suitability for the Ethiopian market context.

### Key Principles

- **Offline-First**: Must work reliably with intermittent connectivity
- **Mobile-First**: Optimized for mobile devices (primary user device)
- **Developer Experience**: Fast iteration, strong tooling
- **Cost-Effective**: Sustainable for Ethiopian restaurant economics
- **Scalable**: Support growth from 1 to 10,000+ restaurants

---

## 2. Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
│  Next.js 16 • React 19 • TypeScript 5 • Tailwind CSS 4      │
├─────────────────────────────────────────────────────────────┤
│                        STATE                                  │
│  Zustand • TanStack Query • Dexie.js (IndexedDB)            │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                                │
│  Next.js API Routes • Server Actions • Supabase Edge funcs  │
├─────────────────────────────────────────────────────────────┤
│                        DATABASE                               │
│  Supabase (PostgreSQL 15) • Redis (ioredis)                 │
├─────────────────────────────────────────────────────────────┤
│                     REAL-TIME                                 │
│  Supabase Realtime • WebSocket                               │
├─────────────────────────────────────────────────────────────┤
│                     INFRASTRUCTURE                            │
│  Vercel • Supabase Cloud • GitHub Actions                    │
├─────────────────────────────────────────────────────────────┤
│                     PAYMENTS                                  │
│  Telebirr API • Chapa API                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Stack

### 3.1 Framework: Next.js 16 (App Router)

**Rationale:**

- React Server Components for performance
- Built-in API routes (no separate backend needed initially)
- Excellent Vercel integration
- Strong TypeScript support
- PWA support via next-pwa

**Configuration:**

```typescript
// next.config.ts
const config = {
    reactStrictMode: true,
    experimental: {
        turbo: { enabled: true },
    },
    images: {
        formats: ['image/avif', 'image/webp'],
    },
};
```

### 3.2 UI Library: React 19

**Rationale:**

- Latest React features (use hook, transitions)
- Excellent ecosystem
- Strong TypeScript integration
- Component-based architecture

**Key Libraries:**

- `react` - Core library
- `react-dom` - DOM rendering
- `@types/react` - TypeScript definitions

### 3.3 Language: TypeScript 5

**Rationale:**

- Type safety reduces bugs
- Excellent IDE support
- Self-documenting code
- Better refactoring

**Configuration:**

```json
{
    "compilerOptions": {
        "target": "ES2022",
        "lib": ["dom", "dom.iterable", "esnext"],
        "strict": true,
        "noEmit": true,
        "esModuleInterop": true,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": true,
        "isolatedModules": true,
        "jsx": "preserve",
        "incremental": true,
        "paths": {
            "@/*": ["./src/*"]
        }
    }
}
```

### 3.4 Styling: Tailwind CSS 4

**Rationale:**

- Utility-first CSS for rapid development
- Excellent for responsive design
- Small production bundle
- Design token integration

**Configuration:**

```typescript
// tailwind.config.ts
const config = {
    theme: {
        extend: {
            colors: {
                // Gebeta brand colors
                brand: {
                    primary: '#FF6B35',
                    secondary: '#2D3436',
                    accent: '#00B894',
                },
            },
        },
    },
};
```

### 3.5 Component Library

**Headless Primitives:**

- `@radix-ui/react-dialog` - Accessible dialogs
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-select` - Select inputs
- `@radix-ui/react-toast` - Toast notifications

**Custom Components:**

- Located in `src/components/ui/`
- Built on top of Radix primitives
- Styled with Tailwind CSS

### 3.6 Animation

**Libraries:**

- `framer-motion` - Layout animations, gestures
- `lenis` - Smooth scrolling

**Usage:**

- Page transitions
- Micro-interactions
- Loading states

---

## 4. State Management

### 4.1 Server State: TanStack Query v5

**Rationale:**

- Automatic caching and refetching
- Optimistic updates
- Offline support
- Request deduplication

**Usage:**

```typescript
// Fetching data
const { data, isLoading } = useQuery({
    queryKey: ['orders', restaurantId],
    queryFn: () => fetchOrders(restaurantId),
});

// Mutations
const mutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => queryClient.invalidateQueries(['orders']),
});
```

### 4.2 Client State: Zustand

**Rationale:**

- Minimal boilerplate
- No providers needed
- TypeScript-first
- Persist middleware

**Usage:**

```typescript
// src/context/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
    persist<CartState>(
        (set, get) => ({
            items: [],
            addItem: item =>
                set(state => ({
                    items: [...state.items, item],
                })),
        }),
        { name: 'gebeta-cart' }
    )
);
```

### 4.3 Offline Storage: Dexie.js

**Rationale:**

- IndexedDB wrapper with TypeScript support
- Easy schema management
- Live queries
- Sync capabilities

**Usage:**

```typescript
// src/lib/offline-db.ts
import Dexie from 'dexie';

export class GebetaDB extends Dexie {
    orders!: Table<Order>;
    menuItems!: Table<MenuItem>;

    constructor() {
        super('GebetaDB');
        this.version(1).stores({
            orders: 'id, restaurantId, status, createdAt',
            menuItems: 'id, restaurantId, categoryId',
        });
    }
}
```

---

## 5. Backend Stack

### 5.1 API Layer: Next.js API Routes

**Rationale:**

- Unified codebase with frontend
- Serverless deployment
- Edge runtime support

**Structure:**

```
src/app/api/
├── orders/
│   └── route.ts           # GET, POST /api/orders
├── menu/
│   └── route.ts           # GET, POST /api/menu
├── kds/
│   └── orders/
│       └── [orderId]/
│           └── route.ts   # PATCH /api/kds/orders/:id
└── health/
    └── route.ts           # GET /api/health
```

### 5.2 Server Actions

**Rationale:**

- Progressive enhancement
- Type-safe mutations
- No API client needed

**Usage:**

```typescript
// src/app/actions.ts
'use server';

export async function createOrder(data: OrderInput) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    return await db.orders.create({
        ...data,
        restaurantId: session.restaurantId,
    });
}
```

---

## 6. Database Stack

### 6.1 Primary Database: Supabase (PostgreSQL 15)

**Rationale:**

- Managed PostgreSQL with excellent tooling
- Built-in authentication
- Real-time subscriptions
- Row-Level Security (RLS)
- Storage for images/files

**Key Features Used:**

- Multi-tenant data isolation via RLS
- Real-time subscriptions for KDS
- Postgres functions for complex queries
- Triggers for audit logging

**Connection:**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 6.2 Caching Layer: Redis (ioredis)

**Rationale:**

- Session storage
- Rate limiting
- Real-time presence
- Temporary data caching

**Usage:**

```typescript
// src/lib/redis.ts
import Redis from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL);

// Session storage
await redis.set(`session:${sessionId}`, JSON.stringify(session), 'EX', 1800);

// Rate limiting
const count = await redis.incr(`ratelimit:${ip}`);
await redis.expire(`ratelimit:${ip}`, 60);
```

---

## 7. Real-Time Layer

### 7.1 Supabase Realtime

**Rationale:**

- Built into Supabase
- PostgreSQL replication
- WebSocket-based
- Channel-based subscriptions

**Usage:**

```typescript
// Subscribe to order changes
const channel = supabase
    .channel('orders-changes')
    .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`,
        },
        payload => {
            console.log('Order changed:', payload);
        }
    )
    .subscribe();
```

---

## 8. Infrastructure

### 8.1 Hosting: Vercel

**Rationale:**

- Optimized for Next.js
- Edge functions
- Automatic deployments
- Preview deployments
- Built-in analytics

**Configuration:**

```json
// vercel.json
{
    "regions": ["iad1"],
    "functions": {
        "src/app/api/**/*.ts": {
            "memory": 1024,
            "maxDuration": 10
        }
    }
}
```

### 8.2 CI/CD: GitHub Actions

**Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
    lint:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: pnpm/action-setup@v2
            - run: pnpm install
            - run: pnpm lint

    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: pnpm/action-setup@v2
            - run: pnpm install
            - run: pnpm test:coverage

    deploy:
        needs: [lint, test]
        runs-on: ubuntu-latest
        steps:
            - uses: vercel/deploy@v1
```

---

## 9. Payment Integrations

### 9.1 Telebirr

**API Documentation:** https://www.ethiotelecom.et/telebirr/

**Integration Points:**

- QR code generation for payments
- Payment status verification
- Webhook for payment confirmation

**Configuration:**

```typescript
// src/lib/payments/telebirr.ts
export const telebirrConfig = {
    appId: process.env.TELEBIRR_APP_ID,
    appKey: process.env.TELEBIRR_APP_KEY,
    publicKey: process.env.TELEBIRR_PUBLIC_KEY,
    baseUrl: 'https://api.telebirr.com',
};
```

### 9.2 Chapa

**API Documentation:** https://developer.chapa.co/

**Integration Points:**

- Payment link generation
- Card payment processing
- Settlement tracking

**Configuration:**

```typescript
// src/lib/payments/chapa.ts
export const chapaConfig = {
    secretKey: process.env.CHAPA_SECRET_KEY,
    publicKey: process.env.CHAPA_PUBLIC_KEY,
    baseUrl: 'https://api.chapa.co/v1',
};
```

---

## 10. Development Tools

### 10.1 Package Manager: pnpm

**Rationale:**

- Fast installs
- Efficient disk space usage
- Strict dependency resolution
- Workspace support

**Configuration:**

```yaml
# pnpm-workspace.yaml
packages:
    - 'src/*'
    - 'docs'
```

### 10.2 Testing

**Unit Testing:**

- Vitest (fast, Vite-native)
- @testing-library/react
- @vitest/coverage-v8

**E2E Testing:**

- Playwright
- Cross-browser testing

**Configuration:**

```typescript
// vitest.config.ts
export default defineConfig({
    test: {
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            thresholds: {
                lines: 80,
                functions: 80,
                statements: 80,
                branches: 70,
            },
        },
    },
});
```

### 10.3 Code Quality

**Linting:**

- ESLint 9
- eslint-config-next

**Formatting:**

- Prettier
- prettier-plugin-tailwindcss

**Type Checking:**

- TypeScript strict mode
- No `any` types

---

## 11. Security Stack

### 11.1 Authentication

**Provider:** Supabase Auth

**Features:**

- Email/password authentication
- Magic link (passwordless)
- OAuth providers (Google)
- Session management

### 11.2 Authorization

**Mechanism:** Row-Level Security (RLS)

**Implementation:**

```sql
-- Enable RLS on all tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their restaurant's orders
CREATE POLICY "restaurant_orders" ON orders
  FOR ALL TO authenticated
  USING (restaurant_id IN (
    SELECT restaurant_id FROM restaurant_staff
    WHERE user_id = auth.uid() AND is_active = true
  ));
```

### 11.3 API Security

- Rate limiting (Redis-backed)
- CSRF protection for Server Actions
- Input validation (Zod)
- HMAC signing for guest sessions

---

## 12. Monitoring & Observability

### 12.1 Error Tracking

- Sentry for error capture
- Source maps for debugging

### 12.2 Analytics

- Vercel Analytics
- Custom event tracking

### 12.3 Logging

- Structured logging (pino)
- Supabase logs

---

## 13. Architecture Decision Records (ADRs)

### ADR-001: Offline-First Architecture

- **Decision:** Use Dexie.js (IndexedDB) for offline data storage
- **Rationale:** Critical for Ethiopian internet conditions
- **Consequences:** Need sync strategy, conflict resolution

### ADR-002: Multi-Tenancy via RLS

- **Decision:** Use PostgreSQL Row-Level Security for tenant isolation
- **Rationale:** Database-level security is more reliable than app-level
- **Consequences:** Careful policy design required

### ADR-003: Next.js for Full Stack

- **Decision:** Use Next.js for both frontend and backend
- **Rationale:** Unified codebase, serverless deployment
- **Consequences:** May need separate services for complex workloads

---

## 14. Dependency Matrix

### Production Dependencies

| Package               | Version  | Purpose      |
| --------------------- | -------- | ------------ |
| next                  | ^16.1.6  | Framework    |
| react                 | 19.2.3   | UI library   |
| typescript            | ^5       | Type system  |
| @supabase/supabase-js | ^2.90.1  | Backend      |
| @supabase/ssr         | ^0.8.0   | SSR support  |
| @tanstack/react-query | ^5.90.20 | Server state |
| zustand               | ^5.0.11  | Client state |
| dexie                 | ^4.2.1   | IndexedDB    |
| ioredis               | ^5.9.3   | Redis client |
| zod                   | ^4.3.6   | Validation   |
| framer-motion         | ^12.34.0 | Animation    |
| tailwindcss           | ^4       | Styling      |

### Development Dependencies

| Package          | Version | Purpose      |
| ---------------- | ------- | ------------ |
| vitest           | ^4.0.18 | Unit testing |
| @playwright/test | ^1.58.2 | E2E testing  |
| eslint           | ^9      | Linting      |
| prettier         | ^3.8.1  | Formatting   |

---

## 15. Upgrade Strategy

### Version Policy

- **Major versions:** Plan and schedule upgrades
- **Minor versions:** Update within 1 week of release
- **Patch versions:** Update immediately for security fixes

### Breaking Changes

1. Review changelog
2. Test in staging
3. Update code
4. Deploy with rollback plan

---

**Document Owner:** Engineering Team  
**Review Cycle:** Quarterly  
**Next Review:** May 2026
