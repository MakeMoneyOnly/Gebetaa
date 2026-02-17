# Gebeta Documentation Hub

Welcome to the Gebeta Restaurant Operating System documentation. This hub provides comprehensive documentation for developers, product managers, and operators.

---

## 📚 Quick Navigation

### 🎯 Getting Started
| Document | Description |
|----------|-------------|
| [../README.md](../README.md) | Project overview and quick start |
| [../AUDIT.md](../AUDIT.md) | North Star document and execution checklist |
| [../Tasks.md](../Tasks.md) | Current roadmap and task tracking |

### 📦 Product Documentation
| Document | Description |
|----------|-------------|
| [PRODUCT/product-requirements-document.md](PRODUCT/product-requirements-document.md) | Full PRD with features and specifications |

### 🔧 Technical Documentation
| Document | Description |
|----------|-------------|
| [TECHNICAL/tech-stack.md](TECHNICAL/tech-stack.md) | Technology stack decisions |
| [TECHNICAL/api/](TECHNICAL/api/) | API reference documentation |
| [TECHNICAL/database/](TECHNICAL/database/) | Database schema and migrations |
| [TECHNICAL/system-design/](TECHNICAL/system-design/) | Architecture and design patterns |

### 📏 Standards & Conventions
| Document | Description |
|----------|-------------|
| [STANDARDS/coding-standards.md](STANDARDS/coding-standards.md) | General coding standards |
| [STANDARDS/typescript-conventions.md](STANDARDS/typescript-conventions.md) | TypeScript specific conventions |
| [STANDARDS/api-conventions.md](STANDARDS/api-conventions.md) | API design conventions |
| [STANDARDS/database-conventions.md](STANDARDS/database-conventions.md) | Database conventions |
| [STANDARDS/testing-standards.md](STANDARDS/testing-standards.md) | Testing requirements |

### 🚀 Operations
| Document | Description |
|----------|-------------|
| [OPERATIONS/runbooks/](OPERATIONS/runbooks/) | Incident response runbooks |
| [OPERATIONS/deployment/](OPERATIONS/deployment/) | Deployment guides |
| [OPERATIONS/monitoring/](OPERATIONS/monitoring/) | Monitoring and alerting |

### 👨‍💻 Development
| Document | Description |
|----------|-------------|
| [DEVELOPMENT/getting-started.md](DEVELOPMENT/getting-started.md) | Developer onboarding |
| [DEVELOPMENT/environment-setup.md](DEVELOPMENT/environment-setup.md) | Local environment setup |

---

## 🗂️ Documentation Structure

```
docs/
├── README.md                           # This file
├── PRODUCT/                            # Product documentation
│   └── product-requirements-document.md
├── TECHNICAL/                          # Technical documentation
│   ├── tech-stack.md
│   ├── system-design/
│   │   ├── multi-tenancy.md
│   │   ├── offline-first.md
│   │   └── realtime-subscriptions.md
│   ├── database/
│   │   ├── schema-reference.md
│   │   └── migration-guide.md
│   ├── api/
│   │   └── api-reference.md
│   └── integrations/
│       ├── telebirr.md
│       └── chapa.md
├── STANDARDS/                          # Coding standards
│   ├── coding-standards.md
│   ├── typescript-conventions.md
│   ├── api-conventions.md
│   ├── database-conventions.md
│   └── testing-standards.md
├── OPERATIONS/                         # Operational docs
│   ├── runbooks/
│   ├── deployment/
│   └── monitoring/
├── DEVELOPMENT/                        # Developer guides
│   └── getting-started.md
└── COMPLIANCE/                         # Compliance docs
    └── gdpr-compliance.md
```

---

## 🤖 AI Agent Context

For AI assistants working on this codebase, refer to:
- [../.clinerules](../.clinerules) - Cline AI rules
- [../.cursorrules](../.cursorrules) - Cursor AI rules

---

## 📝 Contributing to Documentation

1. Keep documents up-to-date with code changes
2. Use clear, concise language
3. Include code examples where helpful
4. Follow the existing document structure

---

## 📋 Document Review Schedule

| Category | Review Cycle |
|----------|--------------|
| PRODUCT | Quarterly |
| TECHNICAL | Monthly |
| STANDARDS | Quarterly |
| OPERATIONS | Monthly |
| DEVELOPMENT | As needed |

---

**Last Updated:** February 17, 2026