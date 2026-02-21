# Gebeta - Restaurant Operating System for Ethiopia

<div align="center">

![Gebeta Logo](public/Logo.gif)

**"Toast for Addis Ababa"**

A comprehensive, offline-first restaurant operating system built for Ethiopia.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)](LICENSE)

</div>

---

## 🎯 Overview

Gebeta is an enterprise-grade restaurant operating system designed specifically for the Ethiopian market. It provides restaurants in Addis Ababa with modern tools to manage orders, payments, staff, and guests - all optimized for local conditions like intermittent internet and mobile-first users.

### Key Features

- 🍽️ **QR Code Ordering** - Guests scan, browse, and order from their phones
- 👨‍🍳 **Kitchen Display System (KDS)** - Real-time order management for kitchen staff
- 📊 **Merchant Dashboard** - Complete command center for restaurant operations
- 💳 **Local Payments** - Telebirr, Chapa, and cash support
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
git clone https://github.com/MakeMoneyOnly/Gebetaa.git
cd Gebetaa

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

# Optional (payments)
TELEBIRR_APP_ID=your_telebirr_app_id
TELEBIRR_APP_KEY=your_telebirr_app_key
CHAPA_SECRET_KEY=your_chapa_secret
CHAPA_PUBLIC_KEY=your_chapa_public_key

# Optional (production)
REDIS_URL=your_redis_url
```

---

## 📁 Project Structure

```
Gebetaa/
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
│   ├── PRODUCT/                # Product documentation
│   ├── TECHNICAL/              # Technical documentation
│   ├── STANDARDS/              # Coding standards
│   └── OPERATIONS/             # Operational runbooks
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
| **Payments**  | Telebirr, Chapa                                    |
| **Testing**   | Vitest, Playwright                                 |
| **CI/CD**     | GitHub Actions, Vercel                             |

---

## 📚 Documentation

### For Developers

- [Getting Started](docs/DEVELOPMENT/getting-started.md)
- [Tech Stack](docs/TECHNICAL/tech-stack.md)
- [API Reference](docs/TECHNICAL/api/)
- [Coding Standards](docs/STANDARDS/)

### For Product

- [Product Requirements](docs/PRODUCT/product-requirements-document.md)
- [Roadmap](Tasks.md)
- [AUDIT.md](AUDIT.md) - North Star document

### For Operations

- [Runbooks](docs/OPERATIONS/runbooks/)
- [Deployment Guide](docs/OPERATIONS/deployment/)

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

Gebeta is built with security-first principles:

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

- **Telebirr** - QR-based mobile money payments
- **Chapa** - Card and bank transfer payments
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
- **Issues**: [GitHub Issues](https://github.com/MakeMoneyOnly/Gebetaa/issues)
- **Email**: support@gebeta.et

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
