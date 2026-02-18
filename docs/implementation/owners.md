# Implementation Owners Matrix

Last updated: 2026-02-17
Scope: Merchant command center roadmap execution

## Core Domains

| Domain | Primary Owner | Secondary Owner | Responsibilities |
|---|---|---|---|
| Product Strategy | Product Lead | CTO | Prioritization, scope control, acceptance criteria |
| Merchant UX | Design Lead | Product Lead | IA, interaction models, usability validation |
| Frontend Platform | Frontend Lead | Fullstack Lead | Dashboard shell, component architecture, performance |
| API and Services | Backend Lead | Fullstack Lead | Endpoint design, validation, authz, idempotency |
| Database and Migrations | Data/Platform Lead | Backend Lead | Schema changes, RLS policies, indexing, migration safety |
| Realtime and Queues | Platform Lead | Backend Lead | Event pipelines, fan-out reliability, retry/dead-letter |
| Security | Security Lead | Backend Lead | Threat modeling, access control, secrets handling |
| QA and Release | QA Lead | Product Lead | Test strategy, regression coverage, release signoff |
| DevOps and Observability | DevOps Lead | Platform Lead | SLO dashboards, alerting, incident response |
| Localization and Payments | Integrations Lead | Product Lead | Ethiopia rails adapters, EN/AM localization |

## Decision Rights

- Product scope changes: Product Lead + CTO
- Breaking schema/API changes: Backend Lead + Data/Platform Lead
- Security exceptions: Security Lead approval required
- Production release go/no-go: QA Lead + CTO
