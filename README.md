# lole - Restaurant Operating System for Ethiopia

<div align="center">

![lole Logo](public/Logo.gif)

**"Toast for Addis Ababa"**

A comprehensive, offline-first restaurant operating system built for Ethiopia.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

</div>

---

## 🎯 Overview

lole is an enterprise-grade restaurant operating system designed specifically for the Ethiopian market. It provides restaurants in Addis Ababa with modern tools to manage orders, payments, staff, and guests - all optimized for local conditions like intermittent internet and mobile-first users.

### Key Features

- 🍽️ **QR Code Ordering** - Guests scan, browse, and order from their phones
- 👨‍🍳 **Kitchen Display System (KDS)** - Real-time order management for kitchen staff
- 📊 **Merchant Dashboard** - Complete command center for restaurant operations
- 💳 **Local Payments** - Chapa and cash support
- 📴 **Offline-First** - Works reliably during internet outages
- 🇪🇹 **Ethiopia-Native** - Built for Addis Ababa's unique needs

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account
- Redis (optional, for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/MakeMoneyOnly/lole.git
cd lole

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HMAC_SECRET_KEY=your_hmac_secret
DATABASE_URL=postgresql://...pooler...              # app-safe default lane
DATABASE_DIRECT_URL=postgresql://...direct...      # infra-only lane

# Optional (payments)
CHAPA_SECRET_KEY=your_chapa_secret
CHAPA_PUBLIC_KEY=your_chapa_public_key

# Optional (production)
REDIS_URL=your_redis_url
```

### Database Lanes

- `DATABASE_URL` is the app-safe pooler lane. Use it for request or compute traffic.
- `DATABASE_DIRECT_URL` is the infra-only direct lane. Use it for migrations, CI, admin scripts, and PowerSync replication.
- Supabase JS clients in this repo keep using `NEXT_PUBLIC_SUPABASE_URL` + publishable/service keys, so most app code does not touch raw Postgres URLs.
- PowerSync client bootstrap is wired, but end-to-end Supabase replication is still blocked in current dev environment until direct logical replication and `powersync` publication are live. See [docs/01-foundation/powersync-supabase-dev-status.md](docs/01-foundation/powersync-supabase-dev-status.md).

---

## 📁 Project Structure

```
lole/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Merchant dashboard routes
│   │   ├── (guest)/            # Guest ordering routes
│   │   ├── (kds)/              # Kitchen display system
│   │   ├── (marketing)/        # Public marketing pages
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components
│   │   ├── auth/               # Authentication components
│   │   └── merchant/           # Merchant-specific components
│   ├── features/               # Feature modules (FSD)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and services
│   │   ├── security/           # Security utilities
│   │   ├── services/           # Business logic
│   │   ├── supabase/           # Supabase client
│   │   └── validators/         # Zod schemas
│   └── types/                  # TypeScript definitions
├── supabase/
│   └── migrations/             # Database migrations
├── docs/                       # Documentation
│   ├── 01-foundation/          # Architecture, PRD, tech stack
│   ├── 02-security/            # Security standards
│   ├── 03-product/            # Product documentation
│   ├── 04-operations/          # Operational guides
│   ├── 05-infrastructure/     # Infrastructure docs
│   ├── 06-integrations/       # Integration guides
│   ├── 07-audits/             # Compliance audits
│   ├── 09-runbooks/           # Incident runbooks
│   ├── api/                   # API endpoint reference
│   └── implementation/        # Implementation guides
├── e2e/                        # E2E tests
└── scripts/                    # Utility scripts
```

---

## 🛠️ Tech Stack

| Layer         | Technology                                         |
| ------------- | -------------------------------------------------- |
| **Frontend**  | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend**   | Next.js API Routes, Supabase Edge Functions        |
| **Database**  | Supabase (PostgreSQL 15), Redis                    |
| **Auth**      | Supabase Auth with Row-Level Security              |
| **State**     | Zustand, TanStack Query, Dexie.js (offline)        |
| **Real-time** | Supabase Realtime (WebSocket)                      |
| **Payments**  | Chapa                                              |
| **Testing**   | Vitest, Playwright                                 |
| **CI/CD**     | GitHub Actions, Vercel                             |

---

## 📚 Documentation

> **⚠️ Start Here:** For the authoritative platform blueprint, technical decisions, and architecture, see [Architecture](docs/01-foundation/architecture.md)

### Foundation (Primary)

- [Architecture](docs/01-foundation/architecture.md) — Master blueprint, Toast comparison, 12 laws
- [Product Requirements](docs/01-foundation/product-requirements.md) — Feature requirements
- [Tech Stack](docs/01-foundation/tech-stack.md) — Technology decisions
- [System Architecture](docs/01-foundation/system-architecture.md) — Architecture diagrams
- [Database Schema](docs/01-foundation/database-schema.md) — Schema reference
- [API Design Guide](docs/01-foundation/api-design.md) — API conventions
- [Engineering Runbook](docs/01-foundation/engineering-runbook.md) — Operations & deployment

### Execution

- [Tasks](Tasks.md) — Sprint-based task list derived from Engineering Foundation

### Reference

- [Security](docs/02-security/) — Security standards and audits
- [Product](docs/03-product/) — Product documentation
- [Operations](docs/04-operations/) — Operational runbooks
- [Infrastructure](docs/05-infrastructure/) — Infrastructure docs
- [Integrations](docs/06-integrations/) — Integration guides
- [Audits](docs/07-audits/) — Feature and compliance audits
- [Runbooks](docs/09-runbooks/) — Incident and operational runbooks
- [API](docs/api/) — API endpoint reference
- [Implementation](docs/implementation/) — Implementation guides and audits
- [Toast Feature Audit](TOAST_FEATURE_AUDIT.md) — Detailed Toast feature comparison

---

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run all quality gates
pnpm validate
```

### Coverage Targets

- Lines: 80%
- Functions: 80%
- Statements: 80%
- Branches: 70%

---

## 🔐 Security

lole is built with security-first principles:

- ✅ Row-Level Security (RLS) for multi-tenant isolation
- ✅ HMAC signing for guest sessions
- ✅ Rate limiting on all endpoints
- ✅ CSRF protection for mutations
- ✅ Input validation with Zod
- ✅ Audit logging for all data changes

See [Security Standards](docs/STANDARDS/security-standards.md) for details.

---

## 🇪🇹 Ethiopia-Specific Features

### Payment Integration

- **Chapa** - Hosted checkout with bank and card payment support
- **Cash** - Always supported as fallback

### Connectivity Resilience

- Offline-first architecture with local queuing
- Automatic sync when connectivity returns
- Visual sync status indicators

### Localization

- Full Amharic support (coming soon)
- ETB (Ethiopian Birr) currency formatting
- DD/MM/YYYY date format

---

## 📦 NPM Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server

# Quality
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript check
pnpm test             # Run unit tests
pnpm test:coverage    # Run tests with coverage
pnpm test:e2e         # Run E2E tests
pnpm validate         # Run all quality gates

# Database
pnpm db:generate      # Generate migration
pnpm db:push          # Push migrations to Supabase
pnpm db:reset         # Reset database

# Utilities
pnpm format           # Format code with Prettier
pnpm clean            # Clean build artifacts
```

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Create a feature branch: `feat/description`
2. Make your changes following our [coding standards](docs/STANDARDS/)
3. Write tests for new functionality
4. Submit a pull request

### Commit Convention

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: api, kds, guest, merchant, auth, db
```

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/MakeMoneyOnly/lole/issues)
- **Email**: support@lole.et

---

## 🗺️ Roadmap

See [Tasks.md](Tasks.md) for the complete execution roadmap and [AUDIT.md](AUDIT.md) for the North Star document.

### Current Phase: P1 - Enterprise Readiness

- ✅ P0: Security hardening completed
- ✅ P0: CI/CD pipeline implemented
- ✅ P0: Real-time KDS with Supabase
- 🚧 P1: Observability stack
- 🚧 P1: Payment integrations

---

<div align="center">

**Built with ❤️ in Addis Ababa, Ethiopia**

</div>
