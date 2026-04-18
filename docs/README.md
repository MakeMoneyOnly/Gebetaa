# lole Restaurant OS - Documentation Index

## Enterprise Documentation Structure

This document describes the standardized documentation organization for the lole Restaurant OS project.

---

## Directory Structure

```
docs/
├── 01-foundation/           # Core architecture & requirements
├── 02-security/             # Security & compliance
├── 03-product/              # Product & business
├── 04-operations/           # Operations & support
├── 05-infrastructure/       # DevOps & infrastructure
├── 06-integrations/         # External integrations
├── 07-audits/               # Audit reports & assessments
├── 08-reports/              # Implementation reports & post-mortems
├── 09-runbooks/             # Operational runbooks
├── 10-reference/            # API specs & coding standards
├── api/                     # API endpoint documentation
├── implementation/          # Implementation guides & procedures
└── README.md                # This file
```

---

## Folder Descriptions

### 01-foundation/

Core architecture and product requirements documents.

- `api-design.md` - API design guidelines
- `architecture.md` - System architecture decisions
- `database-schema.md` - Database schema documentation
- `engineering-runbook.md` - Engineering operational reference
- `payments-direction.md` - Payment strategy and execution plan
- `product-requirements.md` - Product requirements (PRD)
- `system-architecture.md` - System architecture overview
- `tech-stack.md` - Technology stack decisions

### 02-security/

Security policies and compliance documentation.

- `data-privacy.md` - Data privacy policies
- `data-retention-policy.md` - Data retention rules
- `dependency-management.md` - Dependency security management
- `erca-compliance.md` - ERCA compliance documentation
- `privacy-policy.md` - Privacy policy
- `security-endpoint-checklist.md` - Security endpoint checklist
- `security-policy.md` - Security policies

### 03-product/

Product strategy and business documents.

- `competitive-analysis.md` - Competitive landscape analysis
- `feature-flags.md` - Feature flag strategy
- `go-to-market.md` - Go-to-market strategy
- `platform-fee-model.md` - Platform fee model
- `roadmap.md` - Product roadmap

### 04-operations/

Operational procedures and support.

- `backup-restore.md` - Backup and restore procedures
- `onboarding.md` - Restaurant onboarding
- `support-playbook.md` - Support playbooks
- `training.md` - Staff training guides
- `weekly-delivery-review.md` - Weekly delivery review process

### 05-infrastructure/

Infrastructure and reliability documents.

- `capacity-planning.md` - Capacity planning
- `disaster-recovery.md` - Disaster recovery procedures
- `monitoring/` - Monitoring configuration and dashboards
- `testing-strategy.md` - Testing strategy

### 06-integrations/

External integrations and partnerships.

- `delivery-partners.md` - Delivery partner APIs
- `developer-api.md` - Developer partner APIs

### 07-audits/

Audit reports and remediation tracking.

- `archive/` - Archived audit reports
- `AUDIT_REMEDIATION_TASKS.md` - Remediation task tracking
- `comprehensive-skills-audit-report.md` - Comprehensive skills audit
- `external-penetration-testing-backlog.md` - Penetration testing backlog
- `framework-best-practices-audit.md` - Framework best practices audit
- `frontend-design-skills-audit-report.md` - Frontend design skills audit
- `platform-audit-2026-03.md` - March 2026 platform audit
- `platform-grade-a-plus-tasks.md` - A-plus grade tasks
- `PRE-PRODUCTION-AUDIT-REPORT-2026-03-23.md` - Pre-production audit report
- `security-skills-audit-report.md` - Security skills audit

### 08-reports/

Implementation reports and technical analyses.

- `architecture/` - Architecture reports
- `archive/` - Archived reports
- `connection-pooling.md` - Connection pooling analysis
- `database/` - Database reports
- `enterprise-hybrid-rendering-pattern.md` - Hybrid rendering patterns
- `graphql/` - GraphQL reports
- `performance/` - Performance reports
- `risk-register.md` - Risk register
- `rollout/` - Rollout reports

### 09-runbooks/

Operational runbooks for DevOps.

- `backup-and-restore.md` - Backup and restore runbook
- `database-migrations.md` - Database migration procedures
- `erca-integration.md` - ERCA integration runbook
- `incident-response-plan.md` - Incident response procedures
- `incident-triage-rubric.md` - Incident triage rubric
- `kds-printer-failures.md` - KDS and printer failure handling
- `payment-gateway-outages.md` - Payment gateway outage procedures
- `telebirr-chapa-integration.md` - Telebirr/Chapa integration runbook

### 10-reference/

Reference documentation.

- `amharic-translation-audit.md` - Amharic translation audit
- `coding-standards.md` - Coding standards
- `database-erd.md` - Database entity-relationship diagram
- `feature-flags-catalogue.md` - Feature flags catalogue
- `graphql-federation-architecture.md` - GraphQL federation architecture
- `kds-printer-webhook-contract.md` - KDS/printer webhook contract
- `large-files-refactoring-plan.md` - Large files refactoring plan
- `owners.md` - Code/document ownership

### api/

API endpoint documentation.

- `endpoints.md` - API endpoint specifications
- `template.md` - API documentation template

### implementation/

Implementation guides and procedures.

- `accessibility-audit.md` - Accessibility audit findings
- `chaos-engineering.md` - Chaos engineering procedures
- `csrf-coverage-audit.md` - CSRF coverage audit
- `documentation-coverage-audit.md` - Documentation coverage audit
- `erca-integration.md` - ERCA integration implementation
- `HIGH-004-migration-drift-remediation.md` - Migration drift remediation
- `HIGH-005-006-sync-conflict-resolution.md` - Sync conflict resolution
- `HIGH-013-019-021-database-performance-optimization.md` - Database performance optimization
- `HIGH-013-intentional-select-star.md` - Intentional select star remediation
- `load-testing.md` - Load testing procedures
- `monitoring-dashboards.md` - Monitoring dashboard setup
- `performance-slo-validation.md` - Performance SLO validation
- `rollback-procedures.md` - Rollback procedures

---

## Document Naming Conventions

1. **Use descriptive titles**: `security-policy.md` not `sec-pol.md`
2. **Use kebab-case**: All lowercase with hyphens
3. **Include dates for temporal docs**: `audit-2026-03.md`
4. **Use prefixes for ordering**: `01-`, `02-` etc. for folders only

---

## Maintenance

- Review documentation quarterly
- Update audit folder after each audit cycle
- Remove outdated implementation reports after 1 year

---

_Last Updated: 2026-04-16_
