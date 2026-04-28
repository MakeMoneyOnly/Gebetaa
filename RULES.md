Below is a super-detailed, research-backed set of “Cursor Rules” organized by key dimensions of modern software development. Each rule is supported by authoritative sources; citations appear after every statement derived from the web:

## Executive Summary

This ruleset codifies best practices across architecture, code quality, security, testing, DevOps, framework-specific guidelines, industry-specific (FinTech) considerations, and team-role perspectives. It draws on up-to-date recommendations—from OWASP’s Top Ten to Atlassian’s DevOps guidance and Martin Fowler’s architectural wisdom—to ensure Cursor generates reliable, secure, maintainable, and high-quality code for any platform or domain.

## Architectural Principles

1. **Modular Design & Microservices**: Enforce single-responsibility services with well-defined APIs to improve scalability and fault isolation.
2. **Layered/Clean Architecture**: Separate concerns into presentation, domain, and infrastructure layers to facilitate independent evolution and testability.
3. **Domain-Driven Design (DDD)**: Model core business concepts in code with ubiquitous language and bounded contexts, especially in complex domains like FinTech.

## Code Quality & Standards

1. **DRY & YAGNI**: Prohibit duplication (DRY) and avoid premature features (YAGNI) to keep codebases lean and focused.
2. **Consistent Style & Linters**: Adopt language-specific style guides (PEP 8 for Python, Airbnb for JavaScript) enforced via linters (flake8, ESLint).
3. **Code Reviews & Pairing**: Mandate peer reviews for all pull requests and encourage pair programming for critical modules to catch defects early.
4. **Type Safety & Static Analysis**: Use type annotations (mypy) and static analysis tools to detect type mismatches and potential bugs before runtime.

## Security & Compliance

1. **OWASP Top Ten Awareness**: Integrate checks against injection, broken authentication, and other OWASP Top Ten risks in CI pipelines.
2. **Secure Coding Checklist**: Enforce OWASP Secure Coding Practices (input validation, output encoding, cryptographic standards) as coding rules.
3. **Threat Modeling & Regular Audits**: Perform periodic threat modeling sessions and third-party pentests to uncover architecture-level vulnerabilities.
4. **Compliance by Design**: Embed domain-specific regulations (e.g. PSD2, GDPR in FinTech) into requirements and automated validation checks.

## Testing & QA

1. **Test Pyramid**: Maintain a suite of fast unit tests, integration tests around service contracts, and a small number of end-to-end tests.
2. **Shift-Left Testing**: Integrate test execution into local builds and CI—run linting, unit, and security scans on every commit.
3. **Automated Regression & Performance**: Schedule nightly regression suites and regular performance/load tests to catch degradations early.
4. **Test Data Management**: Use realistic, anonymized datasets and containerized test environments to ensure reproducibility and data privacy.

## DevOps & CI/CD

1. **Pipeline as Code**: Define CI/CD workflows declaratively (e.g. YAML pipelines in GitLab, GitHub Actions) stored alongside code.
2. **Infrastructure as Code**: Provision and manage environments via Terraform/CloudFormation to ensure consistency and auditability.
3. **Shift-Left Security & Observability**: Incorporate security scanning (SAST/DAST) and telemetry (logs, metrics, traces) from day one.
4. **Immutable Deployments & Rollbacks**: Use container images or versioned artifacts; enable blue/green or canary releases to minimize downtime.

## Framework-Specific Guidelines

### Python

- **Project Structure**: Adopt a standardized layout (module/, tests/, requirements.txt, setup.cfg) with Virtualenv/Poetry for dependency management.
- **Type Hints & Docstrings**: Document public APIs with docstrings and use PEP 484 type hints for clarity and tool support.

### Node.js

- **Error Handling & Async Patterns**: Use async/await consistently, centralize error handlers, and avoid callback hell.
- **Dependency Vetting**: Pin package versions, run npm audit in CI, and avoid vulnerable packages.

### Mobile (iOS/Android)

- **UX & UI Alignment**: Translate system-level design guidelines (Material, Human Interface) into shared component libraries.
- **Modular APK/IPA**: Split features into dynamic modules to reduce initial download size and enable over-the-air updates.

### Web Apps

- **Responsive & Accessible Design**: Enforce WCAG 2.1 AA standards, semantic HTML, and ARIA roles.
- **Client-Side Security**: Implement CSP, sanitize inputs in frameworks (React/Vue) to prevent XSS.

## Industry-Specific (FinTech)

1. **Regulatory Compliance**: Automate checks for PSD2, GDPR, AML/KYC flows and maintain audit trails.
2. **Data Encryption & Key Management**: Encrypt data at rest/in transit with rotation policies managed by HSMs or cloud KMS.
3. **Legacy System Integration**: Wrap mainframes or banking APIs with strangler-pattern services to incrementally modernize.
4. **Real-Time Monitoring & Fraud Detection**: Instrument streaming analytics pipelines for anomaly detection.

## Team Roles & Collaboration

- **Product Manager**: Maintain a clear backlog with INVEST-compliant user stories; align stakeholders via lightweight roadmaps and OKRs.
- **Software Architect**: Define global standards (APIs, data models, resiliency patterns) and mentor teams in architectural decision records.
- **Frontend Engineer**: Champion component-driven design, enforce performance budgets (LCP, TTFB) and accessibility audits.
- **Backend Engineer**: Optimize service contracts, database indexing, and fault-tolerance via circuit breakers and retries.
- **QA Engineer**: Own test strategy, drive exploratory testing and automate smoke/regression suites.
- **DevOps Engineer**: Build self-service platforms, manage CI/CD, enforce security as code, and onboard monitoring/observability.

## Rule Maintenance & Evolution

1. **Quarterly Reviews**: Update rules based on retrospectives, emerging threats (e.g. OWASP 2025), and toolchain changes.
2. **Metrics & KPIs**: Track code quality (SonarQube scores), deployment frequency, MTTR, and vulnerability aging to guide continuous improvement.
3. **Community Contributions**: Encourage open RFC processes for rule changes, with cross-functional sign-off and version control.
