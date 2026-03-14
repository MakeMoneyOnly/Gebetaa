# Gebeta Documentation Hub

Welcome to the Gebeta Restaurant Operating System documentation. This hub provides comprehensive documentation for developers, product managers, and operators.

---

## 📚 Quick Navigation

### 🎯 Getting Started

| Document                                            | Description                                         |
| --------------------------------------------------- | --------------------------------------------------- |
| [../README.md](../README.md)                        | Project overview and quick start                    |
| [../Tasks.md](../Tasks.md)                          | Execution tasks derived from Engineering Foundation |
| [TOAST_FEATURE_AUDIT.md](../TOAST_FEATURE_AUDIT.md) | Detailed Toast feature comparison                   |

### 📦 Engineering Foundation (Primary)

The Engineering Foundation documents are the **authoritative source of truth** for all platform decisions:

| Document                                                                                                                     | Description                                                      |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [1/Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md](1/Engineering%20Foundation/0.%20ENTERPRISE_MASTER_BLUEPRINT.md) | Master blueprint - Toast comparison, 12 domains, scale targets   |
| [1/Engineering Foundation/1. PRD.md](1/Engineering%20Foundation/1.%20PRD.md)                                                 | Product Requirements Document - features, users, success metrics |
| [1/Engineering Foundation/2. Tech_Stack.md](1/Engineering%20Foundation/2.%20Tech_Stack.md)                                   | Technology stack decisions with pricing and rationale            |
| [1/Engineering Foundation/3. System_Architecure.md](1/Engineering%20Foundation/3.%20System_Architecure.md)                   | System architecture, domain model, event flows                   |
| [1/Engineering Foundation/4. Database_Schema.md](1/Engineering%20Foundation/4.%20Database_Schema.md)                         | Database schema with RLS, indexes, conventions                   |
| [1/Engineering Foundation/5. API_Design_Guide.md](1/Engineering%20Foundation/5.%20API_Design_Guide.md)                       | GraphQL conventions, error handling, subgraph schemas            |
| [1/Engineering Foundation/6. ENGINEERING_RUNOOK.md](1/Engineering%20Foundation/6.%20ENGINEERING_RUNOOK.md)                   | Engineering Runbook - deployment, monitoring, incidents          |

### 📏 Standards & Conventions

| Document                                                       | Description                                 |
| -------------------------------------------------------------- | ------------------------------------------- |
| [STANDARDS/coding-standards.md](STANDARDS/coding-standards.md) | General coding standards                    |
| [../AGENTS.md](../AGENTS.md)                                   | Agent-specific rules for Gebeta development |

### 🚀 Operations

| Document                                                                                                 | Description                            |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| [OPERATIONS/database/backup-restore.md](OPERATIONS/database/backup-restore.md)                           | Database backup and restore procedures |
| [OPERATIONS/monitoring/api-reliability-dashboard.md](OPERATIONS/monitoring/api-reliability-dashboard.md) | Monitoring and alerting                |

### 📋 API References

| Document                                                                   | Description                  |
| -------------------------------------------------------------------------- | ---------------------------- |
| [api/kds-printer-webhook-contract.md](api/kds-printer-webhook-contract.md) | KDS printer webhook contract |
| [api/template.md](api/template.md)                                         | API documentation template   |

### 📝 Implementation Notes

| Document                           | Description                                                     |
| ---------------------------------- | --------------------------------------------------------------- |
| [implementation/](implementation/) | Implementation-specific notes, migration logs, advisor findings |

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                           # This file
├── 1/Engineering Foundation/          # PRIMARY AUTHORITATIVE DOCS
│   ├── 0. ENTERPRISE_MASTER_BLUEPRINT.md
│   ├── 1. PRD.md
│   ├── 2. Tech_Stack.md
│   ├── 3. System_Architecure.md
│   ├── 4. Database_Schema.md
│   ├── 5. API_Design_Guide.md
│   └── 6. ENGINEERING_RUNOOK.md
├── api/                                # API contracts
│   ├── kds-printer-webhook-contract.md
│   └── template.md
├── implementation/                     # Implementation notes
│   ├── advisor-unused-index-batching-2026-03-03.md
│   ├── fk-protected-keep-list-2026-03-03.md
│   ├── incident-triage-rubric.md
│   ├── p0-release-readiness-and-rollback.md
│   ├── performance-slos.md
│   └── ...
├── OPERATIONS/
│   ├── database/
│   │   └── backup-restore.md
│   └── monitoring/
│       └── api-reliability-dashboard.md
└── STANDARDS/
    └── coding-standards.md
```

---

## 🤖 AI Agent Context

For AI assistants working on this codebase, refer to:

- [../.clinerules](../.clinerules) - Cline AI rules
- [../.cursorrules](../.cursorrules) - Cursor AI rules
- [../AGENTS.md](../AGENTS.md) - Gebeta-specific agent rules

---

## 📝 Contributing to Documentation

1. Keep documents up-to-date with code changes
2. Use clear, concise language
3. Include code examples where helpful
4. Follow the existing document structure
5. When updating technical docs, ensure Engineering Foundation docs are updated first

---

## 📋 Document Review Schedule

| Category               | Review Cycle                |
| ---------------------- | --------------------------- |
| Engineering Foundation | As needed (source of truth) |
| Standards              | Quarterly                   |
| Operations             | Quarterly                   |
| Implementation         | As needed                   |

---

**Last Updated:** March 6, 2026
