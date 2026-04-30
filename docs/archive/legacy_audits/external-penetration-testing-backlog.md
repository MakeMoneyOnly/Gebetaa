# External Penetration Testing - Backlog Documentation

**Status**: Backlog (P3-11)  
**Type**: External Security Assessment  
**Priority**: P3 - Requires external resources  
**Created**: 2026-03-20  
**Target**: Pre-production / Production

---

## 1. Executive Summary

External penetration testing requires specialized third-party resources with independent security expertise and cannot be completed internally. This document outlines the scope, requirements, and planning considerations for engaging an external security firm to conduct comprehensive penetration testing of the lole restaurant operating system.

### Why External Testing is Required

| Reason                           | Description                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| **Independent Perspective**      | External testers bring fresh perspectives and are not biased by internal assumptions |
| **Specialized Expertise**        | Third-party firms employ certified professionals with specialized skills             |
| **Compliance Requirements**      | Many compliance frameworks (PCI-DSS, SOC 2) require independent testing              |
| **Real-world Attack Simulation** | External testers simulate actual threat actors                                       |
| ** Liability & Certification**   | Some certifications require documented external penetration tests                    |

---

## 2. Testing Scope & Boundary

### 2.1 In-Scope Systems

| Category            | Systems/Components                  | Description                             |
| ------------------- | ----------------------------------- | --------------------------------------- |
| **Web Application** | Merchant Dashboard (`/dashboard/*`) | POS management interface                |
| **Web Application** | Guest Ordering (`/guest/*`)         | Customer-facing order interface         |
| **Web Application** | KDS Display (`/kds/*`)              | Kitchen display system                  |
| **API**             | Public REST API                     | All endpoints under `/api/*`            |
| **API**             | GraphQL Subgraphs                   | Menu, Orders, Payments, Staff subgraphs |
| **Authentication**  | Supabase Auth                       | User authentication flows               |
| **Payment**         | Payment Integration APIs            | Telebirr, Chapa, Cash payment flows     |
| **Third-Party**     | Delivery Partner Integrations       | External delivery webhooks              |

### 2.2 Out of Scope

| Category                        | Reason                              |
| ------------------------------- | ----------------------------------- |
| Internal network infrastructure | Managed separately                  |
| Employee workstations           | IT policy scope                     |
| Source code review              | Covered by internal security review |
| Social engineering              | Requires separate engagement        |
| Physical security               | Requires on-site assessment         |
| Denial of Service testing       | Can impact production availability  |

### 2.3 Environment

- **Preferred**: Staging environment mirroring production
- **Alternative**: Production with strict rules of engagement
- **Data**: Test data only (no real customer data)

---

## 3. Systems & APIs to Be Tested

### 3.1 Primary Attack Surfaces

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Penetration Test                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Merchant    │  │   Guest      │  │     KDS      │          │
│  │  Dashboard   │  │  Ordering    │  │   Display    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           ▼                                      │
│                  ┌────────────────┐                             │
│                  │   Next.js App   │                             │
│                  │   (Public API)  │                             │
│                  └────────┬───────┘                             │
│                           │                                      │
│         ┌─────────────────┼─────────────────┐                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Supabase    │  │   Payment   │  │  Webhook    │            │
│  │ Auth/DB     │  │   Gateway   │  │  Endpoints  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 API Endpoints to Test

| Endpoint Category | Examples                                | Risk Level |
| ----------------- | --------------------------------------- | ---------- |
| Authentication    | `/api/auth/*`, `/api/staff/*`           | Critical   |
| Orders            | `/api/orders/*`, `/api/guest/session/*` | High       |
| Payments          | `/api/payments/*`, `/api/gift-cards/*`  | Critical   |
| Menu              | `/api/menu/*`, `/api/subgraphs/menu/*`  | Medium     |
| Staff             | `/api/staff/*`, `/api/devices/*`        | High       |
| Guest             | `/api/guest/*`                          | High       |
| Webhooks          | Delivery partner callbacks              | High       |

---

## 4. Compliance Requirements

### 4.1 Standards to Apply

| Standard                      | Application                           | Priority    |
| ----------------------------- | ------------------------------------- | ----------- |
| **OWASP Top 10 (2021)**       | Web application vulnerabilities       | Required    |
| **OWASP API Security Top 10** | API-specific vulnerabilities          | Required    |
| **NIST SP 800-53**            | Security controls framework           | Recommended |
| **PCI-DSS 4.0**               | Payment card handling (if applicable) | Conditional |
| **ISO 27001**                 | Information security management       | Reference   |

### 4.2 OWASP Top 10 (2021) Coverage

| Category                             | Testing Focus                                        |
| ------------------------------------ | ---------------------------------------------------- |
| A01:2021 - Broken Access Control     | Authorization bypass, IDOR, privilege escalation     |
| A02:2021 - Cryptographic Failures    | Data encryption, sensitive data exposure             |
| A03:2021 - Injection                 | SQL injection, XSS, command injection                |
| A04:2021 - Insecure Design           | Business logic flaws, authentication flows           |
| A05:2021 - Security Misconfiguration | CORS, error handling, debug mode                     |
| A06:2021 - Vulnerable Components     | Dependency vulnerabilities, outdated libraries       |
| A07:2021 - Auth Failures             | Session management, MFA bypass, password reset flaws |
| A08:2021 - Data Integrity Failures   | Deserialization, CI/CD vulnerabilities               |
| A09:2021 - Logging Failures          | Insufficient logging, missing monitoring             |
| A10:2021 - SSRF                      | Server-side request forgery                          |

### 4.3 OWASP API Security Top 10 Coverage

| Priority         | API Vulnerability                               |
| ---------------- | ----------------------------------------------- |
| API1:2023        | Broken Object Level Authorization               |
| API2:2023        | Broken Authentication                           |
| API3:2023        | Broken Object Property Level Authorization      |
| API4:2023 - 2023 | Unrestricted Resource Consumption               |
| API5:2023        | Broken Function Level Authorization             |
| API6:2023 - 2023 | Unrestricted Access to Sensitive Business Flows |
| API7:2023        | Server-Side Request Forgery                     |
| API8:2023        | Security Misconfiguration                       |
| API9:2023        | Improper Inventory Management                   |
| API10:2023       | Unsafe Consumption of APIs                      |

---

## 5. Testing Type & Methodology

### 5.1 Testing Types

| Type          | Description                                   | Duration    |
| ------------- | --------------------------------------------- | ----------- |
| **Black Box** | No prior knowledge, external perspective only | Standard    |
| **Gray Box**  | Limited knowledge (API docs, architecture)    | Recommended |
| **White Box** | Full access to source code                    | Optional    |

**Recommended**: Gray Box testing with API documentation provided.

### 5.2 Testing Phases

```
┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│  Phase 1   │   │  Phase 2   │   │  Phase 3   │   │  Phase 4   │
│  Recon &   │──▶│  Vuln      │──▶│  Exploita- │──▶│  Reporting │
│  Discovery │   │  Scanning  │   │  tion      │   │  & Review  │
└────────────┘   └────────────┘   └────────────┘   └────────────┘
   1-2 days        2-3 days         3-5 days        2-3 days
```

| Phase                      | Activities                                             | Days |
| -------------------------- | ------------------------------------------------------ | ---- |
| **Reconnaissance**         | OSINT, subdomain enumeration, service discovery        | 1-2  |
| **Vulnerability Scanning** | Automated scanning, manual enumeration                 | 2-3  |
| **Exploitation**           | Proof-of-concept development, privilege escalation     | 3-5  |
| **Reporting**              | Documentation, remediation guidance, executive summary | 2-3  |

---

## 6. Timeline & Budget Considerations

### 6.1 Suggested Timeline

| Milestone               | Duration  | Notes                                    |
| ----------------------- | --------- | ---------------------------------------- |
| **Vendor Selection**    | 2-3 weeks | RFP, quotes, evaluation                  |
| **Contract & NDA**      | 1-2 weeks | Legal review, scope confirmation         |
| **Kickoff & Scoping**   | 1 week    | Rules of engagement, access provisioning |
| **Testing Execution**   | 2-3 weeks | Main testing phase                       |
| **Report Review**       | 1 week    | Internal review, clarification           |
| **Remediation Support** | 2-4 weeks | Optional retesting                       |

**Total Duration**: 8-15 weeks from initiation to completion

### 6.2 Budget Range Estimates

| Scope                | Low Estimate | High Estimate | Notes                  |
| -------------------- | ------------ | ------------- | ---------------------- |
| **Full Application** | $15,000      | $40,000       | Complete web + API     |
| **API-Focused**      | $8,000       | $20,000       | REST + GraphQL APIs    |
| **Web Application**  | $10,000      | $25,000       | Web frontend only      |
| **Retesting**        | $3,000       | $8,000        | Follow-up verification |

**Note**: Prices are estimates and vary by vendor, region, and scope complexity. Ethiopian/African vendors may offer competitive rates.

### 6.3 Factors Affecting Cost

- Number of environments (staging + production)
- API complexity and endpoint count
- Authentication mechanism complexity
- Third-party integrations
- Urgency/rush fees
- Report depth and remediation support

---

## 7. Recommended Vendors (Optional)

### 7.1 International Firms

| Vendor          | Specialty     | Certifications    | Notes                  |
| --------------- | ------------- | ----------------- | ---------------------- |
| **NCC Group**   | Full-spectrum | OSCP, OSCE, CREST | Global leader          |
| **CrowdStrike** | Cloud-native  | GPEN, OSCP        | Modern approach        |
| **Secureworks** | Enterprise    | CISSP, OSCP       | Large enterprise focus |
| **Bishop Fox**  | Continuous    | OSCP, OSCE        | Cosmos platform        |
| **Trend Micro** | Cloud/App     | Multiple          | Global presence        |

### 7.2 Regional/African Vendors

| Vendor         | Region      | Notes                           |
| -------------- | ----------- | ------------------------------- |
| **Serianu**    | East Africa | Kenya-based, regional expertise |
| **CyberSol**   | Ethiopia    | Local presence                  |
| **Securenets** | Africa      | Continental coverage            |

### 7.3 Selection Criteria

- Relevant industry experience (SaaS, FinTech, hospitality)
- Certifications (OSCP, CREST, CISSP)
- References from similar organizations
- Clear communication and reporting
- Compliance with local data protection laws

---

## 8. Rules of Engagement

### 8.1 Testing Boundaries

- [ ] No DoS/DDoS testing without explicit approval
- [ ] No physical security testing
- [ ] No social engineering attacks
- [ ] No testing on production during peak hours (define maintenance windows)
- [ ] All test data must be sanitized before testing
- [ ] Immediate escalation for critical findings

### 8.2 Access Requirements

| Requirement        | Description                                |
| ------------------ | ------------------------------------------ |
| Test Accounts      | Non-production accounts with various roles |
| API Documentation  | OpenAPI specs, GraphQL schema              |
| Architecture Docs  | System diagrams, data flows                |
| Access Windows     | Defined testing timeframes                 |
| Emergency Contacts | 24/7 contact for issues                    |

### 8.3 Deliverables Expected

1. **Executive Summary** - High-level findings for leadership
2. **Technical Report** - Detailed vulnerability documentation
3. **Remediation Guide** - Step-by-step fix recommendations
4. **Risk Ratings** - CVSS scores, severity classifications
5. **Proof of Concept** - Reproduction steps for findings

---

## 9. Pre-Testing Checklist

### 9.1 Internal Preparation

- [ ] Complete internal security review first
- [ ] Document all public-facing assets
- [ ] Ensure staging environment is current
- [ ] Prepare test accounts with appropriate permissions
- [ ] Review and update incident response contacts
- [ ] Notify hosting providers (Vercel, Supabase) of testing

### 9.2 Documentation to Provide

- [ ] System architecture diagram
- [ ] API documentation (OpenAPI/GraphQL)
- [ ] Authentication flow documentation
- [ ] List of third-party integrations
- [ ] Current security configurations
- [ ] Previous penetration test results (if any)

---

## 10. Post-Testing Process

### 10.1 Remediation Workflow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Critical  │    │    High     │    │   Medium    │    │    Low      │
│   24-48hrs  │    │   1 week    │    │  2-4 weeks  │    │  Next sprint│
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 10.2 Verification

- [ ] Retesting by penetration test vendor (optional)
- [ ] Internal verification of fixes
- [ ] Update risk register
- [ ] Document lessons learned

---

## 11. Backlog Item Details

| Field                | Value                             |
| -------------------- | --------------------------------- |
| **ID**               | P3-11                             |
| **Title**            | External Penetration Testing      |
| **Type**             | Security Assessment               |
| **Priority**         | P3 - Backlog                      |
| **Estimated Effort** | 8-15 weeks                        |
| **Estimated Cost**   | $15,000 - $40,000                 |
| **Dependencies**     | Budget approval, Vendor selection |
| **Blocking**         | None                              |
| **Required For**     | SOC 2 Type II, PCI-DSS compliance |

---

## 12. Approval & Sign-Off

| Role               | Name | Date | Signature |
| ------------------ | ---- | ---- | --------- |
| Security Lead      |      |      |           |
| Engineering Lead   |      |      |           |
| Finance/Budget     |      |      |           |
| CTO/VP Engineering |      |      |           |

---

_Last Updated: 2026-03-20_  
_Document Owner: Security Team_  
_Next Review: Upon budget approval_
