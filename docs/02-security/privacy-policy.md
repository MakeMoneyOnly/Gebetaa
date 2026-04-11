# Gebeta Privacy Policy

**Effective Date: April 2026**

**Gebeta Technologies PLC · Addis Ababa, Ethiopia**

---

## Introduction

Gebeta Technologies PLC ("Gebeta," "we," "us," or "our") provides a restaurant management platform used by restaurant operators and their guests in Ethiopia. This privacy policy explains what personal information we collect, how we use it, how we protect it, and what rights you have.

This policy applies to:

- **Restaurant operators** — owners, managers, and staff who use Gebeta's merchant platform to run their restaurant
- **Guests** — people who order food or drinks at restaurants using Gebeta's QR code menu or guest app

If you have questions about this policy, contact us at **privacy@gebeta.app**.

---

## Information We Collect

### From Restaurant Operators

When you sign up for Gebeta and run your restaurant, we collect:

| Information                         | Why We Need It                                          |
| ----------------------------------- | ------------------------------------------------------- |
| Business name (English and Amharic) | Display on receipts, QR menu, and ERCA invoices         |
| Business address                    | Printed on receipts and tax invoices                    |
| Owner name and email                | Account authentication and end-of-day reports           |
| Owner phone number (optional)       | Account recovery and urgent notifications               |
| Owner Telegram ID (optional)        | End-of-day report delivery                              |
| Tax Identification Number (TIN)     | Required for ERCA e-invoicing if you are VAT-registered |
| VAT Registration Number             | Required for ERCA e-invoicing if you are VAT-registered |
| Staff names and PINs                | Point-of-sale access and audit trail                    |
| Menu items, prices, and categories  | Menu display and order processing                       |
| Usage data                          | Improving our platform and providing support            |

### From Guests

**When you scan a QR code to order (no account):**

| Information                                  | Why We Need It                                 |
| -------------------------------------------- | ---------------------------------------------- |
| A device fingerprint (hashed, one-way)       | To associate your orders during a single visit |
| Order details (items, quantities, amounts)   | To prepare and deliver your order              |
| Payment method (not card or account details) | To process your payment                        |

**When you create a guest account:**

| Information                       | Why We Need It                              |
| --------------------------------- | ------------------------------------------- |
| Your name                         | Display on your profile and receipts        |
| Your email                        | Account authentication and notifications    |
| Your phone number                 | Account recovery and order updates          |
| Order history                     | Loyalty points and personal recommendations |
| Loyalty points and spending total | Loyalty program benefits                    |
| Business TIN (optional)           | VAT invoicing for business meals            |

### What We Do NOT Collect

We want to be clear about what we **never** collect from anyone:

- **No advertising tracking** — no remarketing pixels, no ad networks, no cross-site tracking
- **No biometric data** — no fingerprints, face scans, or voice prints
- **No GPS location tracking** — we never track where you are
- **No social media data** — no Facebook, Google, or TikTok SDKs on any Gebeta page
- **No raw payment card numbers** — payments are processed by licensed providers (Chapa, Telebirr); card numbers never touch our servers
- **No children's data** — our platform is designed for adults; we do not knowingly collect data from anyone under 18

---

## How We Use Your Information

### For Restaurant Operators

We use your information to:

- Provide and maintain your Gebeta restaurant management account
- Process orders, payments, and end-of-day reports
- Submit tax invoices to ERCA on your behalf (if you are VAT-registered)
- Send you operational notifications (via Telegram, email, or in-app alerts)
- Improve our platform based on how it is used
- Provide customer support when you contact us

### For Guests

We use your information to:

- Display the restaurant menu when you scan a QR code
- Process and track your food and drink orders
- Process your payment through our licensed payment partners
- Provide loyalty program benefits (if you have an account)
- Send you order status updates (if you have an account and opt in)

### We Do Not

- Sell, rent, or trade your personal data to anyone
- Use your data for advertising or marketing unless you explicitly opt in
- Share individual restaurant data with other restaurants
- Use your data for any purpose beyond what is described in this policy

---

## Data Storage and Security

### Where Your Data Is Stored

Your data is stored on **Supabase**, which runs on **Amazon Web Services (AWS)** infrastructure. All data is processed and stored within data centers that meet international security standards.

### How We Protect Your Data

- **Encrypted in transit** — all connections between your device and our servers use TLS 1.2 or higher
- **Encrypted at rest** — all database storage uses AES-256 encryption
- **Row-level security** — every restaurant's data is isolated. Restaurant A cannot access Restaurant B's data under any circumstances
- **Role-based access** — staff members only see the data their role requires (e.g., kitchen staff see orders, not financial reports)
- **No shared credentials** — every user has their own account or PIN
- **Payment keys stored separately** — payment API keys are stored in encrypted server-side environment variables, never in the database or in client-side code

### How Long We Keep Your Data

See the [Data Retention](#data-retention) section below.

---

## Data Sharing

We share data only with parties necessary to provide our service:

| Who                                                    | What They Receive                                                              | Why                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Chapa**                                              | Payment amount and order reference                                             | To process your payment (Chapa handles the card or account details) |
| **Telebirr (Ethio Telecom)**                           | Payment amount and order reference                                             | To process your payment                                             |
| **Delivery partners** (when enabled by the restaurant) | Menu items and order status — no guest personal data                           | To fulfill delivery orders                                          |
| **ERCA** (Ethiopian Revenue and Customs Authority)     | Tax invoice data (TIN, items, VAT amounts) for VAT-registered restaurants only | Legal obligation under Ethiopian tax law                            |
| **Supabase** (our database provider)                   | All data (as our cloud database host)                                          | They process data on our behalf under a Data Processing Agreement   |
| **Cloudflare** (our security and CDN provider)         | IP addresses and request metadata                                              | To protect against attacks and serve content quickly                |

**We never sell your data.** Our business is paid subscriptions from restaurants — not selling personal information.

---

## Data Retention

We keep your data only as long as needed:

| Data Type                                      | How Long We Keep It                          | Why                                               |
| ---------------------------------------------- | -------------------------------------------- | ------------------------------------------------- |
| Financial records (orders, payments, invoices) | **7 years**                                  | Required by ERCA (Ethiopian tax law)              |
| Order history (operational)                    | **2 years**                                  | For analytics and dispute resolution              |
| Staff records                                  | **2 years** after staff member leaves        | Reference under Ethiopian Labour Proclamation     |
| Guest accounts (with login)                    | **Until you request deletion, plus 30 days** | Your right to delete your account                 |
| Anonymous guest fingerprints                   | **90 days**, then anonymized                 | Minimum needed to associate orders during a visit |
| Authentication audit logs                      | **1 year**                                   | Security compliance                               |

After these periods, data is either deleted or anonymized so it can no longer identify you. Financial records required by ERCA are kept for the full 7-year period even if you close your account, as required by law.

---

## Your Rights

### For Guests

If you have a Gebeta guest account, you have the right to:

- **Access your data** — request a copy of all personal data we hold about you
- **Correct your data** — update your name, phone number, or email in your profile at any time
- **Delete your account** — request full account deletion. Your personal profile will be removed within 30 days. Note: order and payment records required by ERCA will be retained for 7 years but anonymized (your name and contact details removed)
- **Export your data** — receive your order history and loyalty transactions in JSON or CSV format
- **Withdraw consent** — opt out of non-essential communications at any time

To exercise any of these rights, email **privacy@gebeta.app**. We will respond within **14 business days**.

### For Restaurant Operators

As a restaurant operator, you additionally have the right to:

- **Export all your data** — download your complete menu, orders, payments, and financial records in CSV format from the merchant dashboard at any time
- **Close your account** — upon closure, all operational data (menu, staff, settings) is deleted within 30 days. Financial records required by ERCA are retained for 7 years. A full data export is provided before deletion
- **Control staff data** — you manage all staff records within your restaurant. Staff members may request their own data by contacting you

---

## Cookies and Tracking

### What We Use

- **Essential cookies only** — these are required to keep you logged in and maintain your session (e.g., your Supabase auth token)
- **Service improvement analytics** — we use minimal analytics to understand how our platform performs and to fix issues. This data is aggregated and does not identify individuals

### What We Do NOT Use

- No advertising cookies
- No third-party tracking pixels
- No cross-site tracking
- No social media tracking

---

## Data Breach Notification

If a data breach occurs that affects your personal data:

1. We assess the breach internally within **24 hours** of discovery
2. Affected restaurant operators are notified within **72 hours** via email and Telegram
3. The notification will include:
    - What data was affected
    - When the breach is estimated to have occurred
    - What action Gebeta has taken
    - What action you should take (e.g., reset your password)
4. We notify relevant Ethiopian authorities if legally required

---

## Changes to This Policy

We may update this policy from time to time. For material changes:

- We provide **30 days' advance notice** before the new policy takes effect
- Restaurant operators are notified via email and an in-app notification
- The updated policy is published on this page with a new effective date

We encourage you to review this policy periodically.

---

## Contact

For any privacy-related questions, requests, or concerns:

- **Email:** privacy@gebeta.app
- **Data deletion requests:** privacy@gebeta.app (subject: "Data Deletion Request")
- **Data export requests:** privacy@gebeta.app (subject: "Data Export Request")
- **Response time:** 14 business days for all privacy requests

**Gebeta Technologies PLC**
Addis Ababa, Ethiopia

---

## Legal Reference

This policy is informed by and consistent with:

- **Computer Crime Proclamation No. 958/2016** — Ethiopian law prohibiting unauthorized access to computer systems and data
- **Electronic Transactions Proclamation No. 1072/2018** — Ethiopian law governing electronic payments and digital records
- **ERCA Proclamation No. 983/2016** — Ethiopian tax law requiring VAT-registered businesses to maintain transaction records for 7 years
- **NBE Directives on Digital Payments** — National Bank of Ethiopia requirements for payment processing

---

## Changelog

| Version | Date       | Change                        |
| ------- | ---------- | ----------------------------- |
| 1.0     | April 2026 | Initial public privacy policy |

---

_Gebeta Privacy Policy v1.0 · April 2026_
