# Documentation Coverage Audit

> LOW-011: Audit of existing documentation and gaps. Last updated: 2026-04-09.

## Current Documentation Inventory

### 01-foundation/ (8 files)
| File | Description |
|------|-------------|
| `architecture.md` | System architecture overview |
| `api-design.md` | API design principles and patterns |
| `database-schema.md` | Database schema documentation |
| `engineering-runbook.md` | Engineering operational runbook |
| `payments-direction.md/Direction.md` | Payments architecture direction |
| `product-requirements.md` | Product requirements document |
| `system-architecture.md` | Detailed system architecture |
| `tech-stack.md` | Technology stack decisions |

### 02-security/ (6 files)
| File | Description |
|------|-------------|
| `data-privacy.md` | Data privacy policy and practices |
| `data-retention-policy.md` | Data retention rules and schedules |
| `dependency-management.md` | Dependency security management |
| `erca-compliance.md` | ERCA (Ethiopian tax) compliance |
| `privacy-policy.md` | User privacy policy |
| `security-endpoint-checklist.md` | Security checklist for API endpoints |
| `security-policy.md` | Organization security policy |

### 03-product/ (5 files)
| File | Description |
|------|-------------|
| `competitive-analysis.md` | Competitive landscape analysis |
| `feature-flags.md` | Feature flag system design |
| `go-to-market.md` | Go-to-market strategy |
| `platform-fee-model.md` | Platform fee structure |
| `roadmap.md` | Product roadmap |

### 04-operations/ (5 files)
| File | Description |
|------|-------------|
| `backup-restore.md` | Backup and restore procedures |
| `onboarding.md` | Merchant onboarding process |
| `support-playbook.md` | Customer support playbook |
| `training.md` | Staff training materials |
| `weekly-delivery-review.md` | Weekly delivery review process |

### 05-infrastructure/ (4 files)
| File | Description |
|------|-------------|
| `capacity-planning.md` | Infrastructure capacity planning |
| `disaster-recovery.md` | Disaster recovery procedures |
| `monitoring/monitoring-dashboards.md` | Monitoring dashboard configurations |
| `monitoring/api-reliability-dashboard.md` | API reliability dashboard setup |
| `testing-strategy.md` | Testing strategy and approach |

### 06-integrations/ (2 files)
| File | Description |
|------|-------------|
| `developer-api.md` | Developer API documentation |
| `delivery-partners.md` | Delivery partner integrations |

### 07-audits/ (10 files)
| File | Description |
|------|-------------|
| `AUDIT_REMEDIATION_TASKS.md` | Audit remediation tracking |
| `PRE-PRODUCTION-AUDIT-REPORT-2026-03-23.md` | Pre-production audit report |
| `comprehensive-skills-audit-report.md` | Comprehensive skills audit |
| `framework-best-practices-audit.md` | Framework best practices audit |
| `frontend-design-skills-audit-report.md` | Frontend design audit |
| `platform-audit-2026-03.md` | Platform audit March 2026 |
| `platform-grade-a-plus-tasks.md` | Platform A+ grade tasks |
| `security-skills-audit-report.md` | Security skills audit |
| `external-penetration-testing-backlog.md` | External pen test backlog |
| `archive/` | Archived audit reports |

### 08-reports/ (15 files)
| File | Description |
|------|-------------|
| `connection-pooling.md` | Connection pooling analysis |
| `enterprise-hybrid-rendering-pattern.md` | Hybrid rendering patterns |
| `risk-register.md` | Risk register |
| `archive/archive_tasks.md` | Archived tasks |
| `database/security-advisor-remediation-2026-04-08.md` | Security advisor fixes |
| `database/database-infrastructure-audit-report-2026-03-23.md` | DB infrastructure audit |
| `database/stage5-evidence-window-sql-bundle-2026-03-03.md` | Stage 5 SQL evidence |
| `database/postgres-supabase-stage-execution-log-2026-03-03.md` | Stage execution log |
| `database/postgres-supabase-remediation-stages-2026-03-03.md` | Remediation stages |
| `database/fk-protected-keep-list-2026-03-03.md` | FK protected keep list |
| `database/advisor-unused-index-batching-2026-03-03.md` | Unused index batching |
| `graphql/service-extraction-readiness.md` | GraphQL service extraction |
| `graphql/apollo-router-deployment.md` | Apollo Router deployment |
| `graphql/graphql-federation-migration.md` | GraphQL federation migration |
| `graphql/apollo-graphos-publishing.md` | Apollo GraphOS publishing |
| `performance/performance-slos.md` | Performance SLOs |
| `performance/observability-setup.md` | Observability setup |
| `performance/p2-peak-flow-load-tests.md` | Peak flow load tests |
| `rollout/p0-release-readiness-and-rollback.md` | P0 release readiness |
| `rollout/p0-pilot-rollout-feature-flags.md` | P0 pilot rollout flags |
| `rollout/p0-pilot-feedback-and-critical-patches.md` | P0 pilot feedback |
| `rollout/p1-controlled-rollout-by-cohort.md` | P1 cohort rollout |
| `rollout/p2-progressive-rollout-and-rollback-safeguards.md` | P2 progressive rollout |
| `rollout/release-cadence.md` | Release cadence |
| `rollout/CRITICAL_IMPLEMENTATION_STRATEGY.md` | Critical implementation strategy |

### 09-runbooks/ (5 files)
| File | Description |
|------|-------------|
| `database-migrations.md` | Database migration runbook |
| `incident-triage-rubric.md` | Incident triage rubric |
| `kds-printer-failures.md` | KDS printer failure runbook |
| `payment-gateway-outages.md` | Payment gateway outage runbook |
| `telebirr-chapa-integration.md` | Telebirr/Chapa integration runbook |
| `erca-integration.md` | ERCA integration runbook |

### 10-reference/ (5 files)
| File | Description |
|------|-------------|
| `coding-standards.md` | Coding standards reference |
| `graphql-federation-architecture.md` | GraphQL federation architecture |
| `kds-printer-webhook-contract.md` | KDS printer webhook contract |
| `owners.md` | Code owners reference |
| `database-erd.md` | Database ERD (this audit) |
| `amharic-translation-audit.md` | Amharic translation audit (this audit) |

### implementation/ (8 files)
| File | Description |
|------|-------------|
| `chaos-engineering.md` | Chaos engineering plan |
| `csrf-coverage-audit.md` | CSRF coverage audit |
| `HIGH-004-migration-drift-remediation.md` | Migration drift remediation |
| `HIGH-005-006-sync-conflict-resolution.md` | Sync conflict resolution |
| `HIGH-013-019-021-database-performance-optimization.md` | DB perf optimization |
| `HIGH-013-intentional-select-star.md` | Intentional SELECT * rationale |
| `load-testing.md` | Load testing documentation |
| `rollback-procedures.md` | Rollback procedures |

### api/ (2 files)
| File | Description |
|------|-------------|
| `endpoints.md` | API endpoint documentation |
| `template.md` | API doc template |

### Root (3 files)
| File | Description |
|------|-------------|
| `README.md` | Documentation index |
| `REMAINING_FEATURE_TASKS.md` | Remaining feature tasks |
| `p2-lazy-load-threejs-components.md` | Three.js lazy loading |

---

## Known Gaps

### 1. Broken Path Reference in AGENTS.md

**Issue**: `AGENTS.md` references `docs/implementation/p0-release-readiness-and-rollback.md` but the actual file is located at `docs/08-reports/rollout/p0-release-readiness-and-rollback.md`.

**Impact**: Engineers following AGENTS.md will not find the document at the expected path.

**Fix**: Update AGENTS.md to reference `docs/08-reports/rollout/p0-release-readiness-and-rollback.md`.

### 2. Broken Internal Link in connection-pooling.md

**Issue**: `docs/08-reports/connection-pooling.md` links to a non-existent `health-check-api.md`.

**Impact**: Dead link prevents engineers from understanding the health check API contract.

**Fix**: Either create `docs/api/health-check-api.md` or update the link to point to an existing health endpoint reference.

### 3. Non-Existent Health Endpoints in Runbooks

**Issue**: Runbooks reference health endpoints that do not exist in the API:
- `/api/health/payments`
- `/api/health/realtime`
- `/api/health/kds`

**Impact**: On-call engineers cannot verify service health during incidents.

**Fix**: Either implement these health endpoints or update runbooks to use existing monitoring approaches (e.g., Supabase health check, system_health table queries).

### 4. No Changelog/Versioning for Most Docs

**Issue**: Most documentation files lack version information, last-updated dates, or changelog sections. Only audit reports include dates in filenames.

**Impact**: Engineers cannot determine if documentation is current or stale.

**Fix**: Add `Last updated:` metadata to all doc files. Consider a `docs/changelog.md` for tracking documentation changes.

### 5. No Load Testing Results Stored

**Issue**: `docs/implementation/load-testing.md` and `docs/08-reports/performance/p2-peak-flow-load-tests.md` describe load testing methodology but do not contain actual test results.

**Impact**: No baseline for performance regression detection. SLO compliance cannot be verified.

**Fix**: Store load test results in `docs/08-reports/performance/` with dated filenames (e.g., `load-test-results-2026-04-09.md`).

### 6. Missing API Documentation for Health Endpoints

**Issue**: `docs/api/endpoints.md` does not document health check endpoints.

**Fix**: Add health check endpoint documentation to the API docs.

### 7. Missing Security Incident Response Runbook

**Issue**: There is no dedicated security incident response runbook. `docs/09-runbooks/incident-triage-rubric.md` covers general incidents but not security-specific procedures.

**Fix**: Create `docs/09-runbooks/security-incident-response.md`.

### 8. Missing Guest-Facing Documentation

**Issue**: No documentation exists for the guest-facing menu/ordering experience (QR code flow, guest menu session lifecycle).

**Fix**: Create `docs/03-product/guest-menu-session-flow.md`.

---

## Recommended Documentation Additions

### P0 - Critical (Blocks P0 release)

| Priority | Document | Path | Rationale |
|----------|----------|------|-----------|
| P0 | Health Check API Reference | `docs/api/health-check-api.md` | Referenced by runbooks, does not exist |
| P0 | Fix AGENTS.md path reference | `AGENTS.md` | Broken path to release readiness doc |
| P0 | Fix connection-pooling.md link | `docs/08-reports/connection-pooling.md` | Dead link to health-check-api |

### P1 - High (Needed for P1 rollout)

| Priority | Document | Path | Rationale |
|----------|----------|------|-----------|
| P1 | Security Incident Response | `docs/09-runbooks/security-incident-response.md` | No security runbook exists |
| P1 | Guest Menu Session Flow | `docs/03-product/guest-menu-session-flow.md` | Core product flow undocumented |
| P1 | Realtime Sync Architecture | `docs/01-foundation/realtime-sync.md` | Critical offline-first feature |
| P1 | Load Test Results Template | `docs/08-reports/performance/load-test-results-template.md` | No results stored |
| P1 | Feature Flag Registry | `docs/03-product/feature-flag-registry.md` | No flag inventory |

### P2 - Medium (Improves operational maturity)

| Priority | Document | Path | Rationale |
|----------|----------|------|-----------|
| P2 | Documentation Changelog | `docs/changelog.md` | No versioning on most docs |
| P2 | Amharic Translation Guide | `docs/04-operations/amharic-translation-guide.md` | Process for maintaining Amharic |
| P2 | Database Migration Playbook | `docs/09-runbooks/migration-playbook.md` | Step-by-step migration guide |
| P2 | Monitoring Alert Response | `docs/09-runbooks/alert-response.md` | Alert rule response procedures |
| P2 | On-Call Handbook | `docs/04-operations/on-call-handbook.md` | On-call procedures and expectations |
| P2 | ERCA Submission Runbook | Expand existing `docs/09-runbooks/erca-integration.md` | Add submission troubleshooting |

### P3 - Low (Nice to have)

| Priority | Document | Path | Rationale |
|----------|----------|------|-----------|
| P3 | Architecture Decision Records | `docs/01-foundation/adr/` | Formalize architecture decisions |
| P3 | API Versioning Strategy | `docs/api/versioning.md` | API evolution strategy |
| P3 | Component Library Docs | `docs/10-reference/component-library.md` | Shared UI component documentation |
| P3 | Developer Onboarding Guide | `docs/04-operations/developer-onboarding.md` | New developer setup guide |
| P3 | Performance Regression Dashboard | `docs/05-infrastructure/perf-dashboard.md` | Automated perf tracking |
