# Changelog

All notable changes to the Gebeta Restaurant Operating System project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - 2026-02-17

#### Project Organization & Developer Experience
- **MAJOR**: Complete codebase reorganization for enterprise-grade structure
- **MAJOR**: Created comprehensive documentation hub at `docs/`
- **MAJOR**: Added AI agent context files for improved developer experience

#### Documentation
- `README.md` - Comprehensive project entry point with quick start guide
- `docs/README.md` - Documentation hub with navigation
- `docs/PRODUCT/product-requirements-document.md` - Full PRD with features and specifications
- `docs/TECHNICAL/tech-stack.md` - Complete technology stack documentation
- `docs/STANDARDS/coding-standards.md` - Coding standards and conventions

#### AI Agent Context Files
- `.clinerules` - Cline AI rules for context-aware assistance
- `.cursorrules` - Cursor AI rules for IDE integration

#### Developer Tooling
- Updated `.gitignore` with comprehensive ignore patterns
- Created `docs/` folder structure:
  - `docs/PRODUCT/` - Product documentation
  - `docs/TECHNICAL/` - Technical documentation
  - `docs/STANDARDS/` - Coding standards
  - `docs/OPERATIONS/` - Operational runbooks
  - `docs/DEVELOPMENT/` - Developer guides
  - `docs/COMPLIANCE/` - Compliance documentation
  - `docs/historical/` - Historical documentation

### Changed
- Consolidated scattered documentation into organized structure
- Removed redundant SDLC folder (was duplicate of docs)
- Removed cloned repositories from SKILLS folder (kept enterprise/)
- Removed empty/generated directories (infrastructure/, playwright-report/, test-results/)

### Removed
- `SDLC/` folder - Redundant with docs/ structure
- `SKILLS/agent-skills-main/` - External clone
- `SKILLS/anthropics-skills/` - External clone
- `SKILLS/awesome-cursorrules-main/` - External clone
- `SKILLS/claude-code-skills-main/` - External clone
- `SKILLS/superpowers-main/` - External clone
- `SKILLS/vibe-coding-ai-rules-main/` - External clone
- `SKILLS/backend-dev/` - External clone
- `SKILLS/brand-designer/` - External clone
- `SKILLS/design-system-engineer/` - External clone
- `SKILLS/devops-sre/` - External clone
- `SKILLS/frontend-dev/` - External clone
- `SKILLS/maintenance-scaler/` - External clone
- `SKILLS/ops-runbooks/` - External clone
- `SKILLS/orchestration/` - External clone
- `SKILLS/product-planner/` - External clone
- `SKILLS/qa-auto/` - External clone
- `SKILLS/security-gate/` - External clone
- `SKILLS/ux-researcher/` - External clone
- `SKILLS/ENTERPRISE_SKILLS_COMPLETION_SUMMARY.md` - Moved to docs
- `SKILLS/RESTAURANT.md` - Redundant
- `infrastructure/` - Empty directory
- `playwright-report/` - Generated files
- `test-results/` - Generated files

---

## [0.1.0] - 2026-02-14

### Added
- P0 Security Hardening complete
- Row-Level Security (RLS) policies on all tables
- HMAC signing for guest sessions
- Rate limiting with Redis
- CSRF protection
- Audit logging infrastructure

### Added - Infrastructure
- CI/CD pipeline with GitHub Actions
- Automated testing with Vitest
- E2E testing setup with Playwright
- Lighthouse CI integration

### Added - Core Features
- Kitchen Display System (KDS) with real-time updates
- Guest ordering via QR codes
- Merchant dashboard foundation
- Menu management basics
- Order management basics

### Added - Database
- Initial schema migrations
- Performance indexes
- Role resolution RPC functions
- Real-time subscriptions setup

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| Unreleased | 2026-02-17 | Codebase reorganization, documentation hub |
| 0.1.0 | 2026-02-14 | P0 Security hardening complete |
| 0.0.1 | 2026-01-26 | Initial project setup |

---

## Upcoming Milestones

### [0.2.0] - P1 Enterprise Readiness
- Observability stack (Sentry, logging)
- Payment integrations (Telebirr, Chapa)
- Staff management features
- Analytics dashboard

### [0.3.0] - P2 Production Ready
- Inventory management
- Loyalty programs
- Multi-location support
- Advanced reporting

---

**Last Updated:** February 17, 2026