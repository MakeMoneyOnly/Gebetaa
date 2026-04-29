# Amharic Translation Gap Audit

> LOW-008: Audit of Amharic (am) translation coverage. Last updated: 2026-04-09.

## Current Coverage Summary

| Section    | EN Keys | AM Keys | Coverage | Missing |
| ---------- | ------- | ------- | -------- | ------- |
| nav        | 9       | 9       | 100%     | 0       |
| actions    | 22      | 11      | 50%      | 11      |
| status     | 13      | 12      | 92%      | 1       |
| time       | 11      | 0       | 0%       | 11      |
| currency   | 12      | 7       | 58%      | 5       |
| validation | 8       | 0       | 0%       | 8       |
| errors     | 7       | 4       | 57%      | 3       |
| success    | 6       | 4       | 67%      | 2       |
| confirm    | 3       | 0       | 0%       | 3       |
| orders     | 17      | 10      | 59%      | 7       |
| menu       | 22      | 9       | 41%      | 13      |
| tables     | 12      | 5       | 42%      | 7       |
| kds        | 14      | 6       | 43%      | 8       |
| payments   | 14      | 6       | 43%      | 8       |
| staff      | 15      | 10      | 67%      | 5       |
| guests     | 12      | 5       | 42%      | 7       |
| settings   | 14      | 6       | 43%      | 8       |
| reports    | 14      | 0       | 0%       | 14      |
| offline    | 4       | 2       | 50%      | 2       |
| **Total**  | **229** | **106** | **46%**  | **123** |

**Overall Amharic coverage: ~46%**

---

## Bug: Arabic Translation in guests.title

**Issue**: The Amharic translation for `guests.title` is `' الضيوف'` which is Arabic, not Amharic.

| Key            | Current (Arabic) | Correct (Amharic) |
| -------------- | ---------------- | ----------------- |
| `guests.title` | الضيوف           | እንግዶች             |

**Location**: `src/lib/i18n/translations.ts:492`

**Fix**: Replace `' الضيوف'` with `'እንግዶች'`.

---

## Missing Amharic Translation Keys by Section

### nav (0 missing)

All keys translated.

### actions (11 missing)

| Key              | English  |
| ---------------- | -------- |
| actions.update   | Update   |
| actions.create   | Create   |
| actions.filter   | Filter   |
| actions.export   | Export   |
| actions.import   | Import   |
| actions.refresh  | Refresh  |
| actions.reset    | Reset    |
| actions.clear    | Clear    |
| actions.view     | View     |
| actions.print    | Print    |
| actions.download | Download |

### status (1 missing)

| Key              | English   |
| ---------------- | --------- |
| status.delivered | Delivered |
| status.enabled   | Enabled   |
| status.disabled  | Disabled  |

### time (11 missing) - CRITICAL

| Key            | English    |
| -------------- | ---------- |
| time.now       | Now        |
| time.today     | Today      |
| time.yesterday | Yesterday  |
| time.tomorrow  | Tomorrow   |
| time.thisWeek  | This Week  |
| time.thisMonth | This Month |
| time.lastMonth | Last Month |
| time.thisYear  | This Year  |
| time.allTime   | All Time   |
| time.minutes   | minutes    |
| time.hours     | hours      |
| time.days      | days       |
| time.weeks     | weeks      |
| time.months    | months     |
| time.years     | years      |

### currency (5 missing)

| Key              | English |
| ---------------- | ------- |
| currency.tip     | Tip     |
| currency.paid    | Paid    |
| currency.unpaid  | Unpaid  |
| currency.refund  | Refund  |
| currency.balance | Balance |

### validation (8 missing) - CRITICAL

| Key                         | English                               |
| --------------------------- | ------------------------------------- |
| validation.required         | This field is required                |
| validation.invalidEmail     | Please enter a valid email address    |
| validation.invalidPhone     | Please enter a valid phone number     |
| validation.minLength        | Must be at least {min} characters     |
| validation.maxLength        | Must be no more than {max} characters |
| validation.minValue         | Must be at least {min}                |
| validation.maxValue         | Must be no more than {max}            |
| validation.passwordMismatch | Passwords do not match                |
| validation.invalidNumber    | Please enter a valid number           |

### errors (3 missing) - CRITICAL

| Key                    | English                                        |
| ---------------------- | ---------------------------------------------- |
| errors.forbidden       | Access denied                                  |
| errors.serverError     | Server error. Please try again later.          |
| errors.sessionExpired  | Your session has expired. Please log in again. |
| errors.validationError | Please check your input and try again.         |

### success (2 missing)

| Key            | English             |
| -------------- | ------------------- |
| success.sent   | Successfully sent   |
| success.copied | Copied to clipboard |

### confirm (3 missing) - CRITICAL

| Key                    | English                                                   |
| ---------------------- | --------------------------------------------------------- |
| confirm.delete         | Are you sure you want to delete this item?                |
| confirm.cancel         | Are you sure you want to cancel?                          |
| confirm.unsavedChanges | You have unsaved changes. Are you sure you want to leave? |

### orders (7 missing)

| Key                    | English          |
| ---------------------- | ---------------- |
| orders.specialRequests | Special Requests |
| orders.orderHistory    | Order History    |
| orders.modifyOrder     | Modify Order     |
| orders.cancelOrder     | Cancel Order     |
| orders.refundOrder     | Refund Order     |
| orders.printReceipt    | Print Receipt    |
| orders.estimatedTime   | Est. {time} min  |

### menu (13 missing)

| Key              | English      |
| ---------------- | ------------ |
| menu.newItem     | New Item     |
| menu.editItem    | Edit Item    |
| menu.deleteItem  | Delete Item  |
| menu.image       | Image        |
| menu.vegetarian  | Vegetarian   |
| menu.vegan       | Vegan        |
| menu.glutenFree  | Gluten Free  |
| menu.spicy       | Spicy        |
| menu.modifiers   | Modifiers    |
| menu.addModifier | Add Modifier |
| menu.options     | Options      |
| menu.required    | Required     |
| menu.optional    | Optional     |

### tables (7 missing)

| Key                  | English                  |
| -------------------- | ------------------------ |
| tables.capacity      | Capacity: {count} guests |
| tables.reserved      | Reserved                 |
| tables.cleaning      | Cleaning                 |
| tables.currentOrder  | Current Order            |
| tables.transferTable | Transfer Table           |
| tables.mergeTables   | Merge Tables             |
| tables.splitTable    | Split Table              |
| tables.noTables      | No tables configured     |

### kds (8 missing)

| Key               | English                 |
| ----------------- | ----------------------- |
| kds.bumped        | Bumped                  |
| kds.orderReady    | Order Ready             |
| kds.markCompleted | Mark Completed          |
| kds.recall        | Recall                  |
| kds.rush          | RUSH                    |
| kds.fireAll       | Fire All                |
| kds.course        | Course {number}         |
| kds.expedite      | Expedite                |
| kds.averageTime   | Avg. Time: {time} min   |
| kds.ordersInQueue | {count} orders in queue |

### payments (8 missing)

| Key                    | English             |
| ---------------------- | ------------------- |
| payments.mobileMoney   | Mobile Money        |
| payments.chapa         | Chapa               |
| payments.split         | Split Payment       |
| payments.addTip        | Add Tip             |
| payments.noPayment     | No payment required |
| payments.paymentFailed | Payment Failed      |
| payments.refund        | Refund              |
| payments.partialRefund | Partial Refund      |

### staff (5 missing)

| Key              | English           |
| ---------------- | ----------------- |
| staff.editStaff  | Edit Staff Member |
| staff.status     | Status            |
| staff.onBreak    | On Break          |
| staff.shiftHours | Shift Hours       |
| staff.pin        | PIN               |
| staff.setPin     | Set PIN           |
| staff.changePin  | Change PIN        |

### guests (7 missing)

| Key                 | English           |
| ------------------- | ----------------- |
| guests.guestInfo    | Guest Information |
| guests.visits       | Visits            |
| guests.totalSpent   | Total Spent       |
| guests.lastVisit    | Last Visit        |
| guests.allergies    | Allergies         |
| guests.preferences  | Preferences       |
| guests.addGuest     | Add Guest         |
| guests.editGuest    | Edit Guest        |
| guests.guestHistory | Guest History     |

### settings (8 missing)

| Key                    | English        |
| ---------------------- | -------------- |
| settings.restaurant    | Restaurant     |
| settings.profile       | Profile        |
| settings.notifications | Notifications  |
| settings.integrations  | Integrations   |
| settings.billing       | Billing        |
| settings.currency      | Currency       |
| settings.timezone      | Timezone       |
| settings.taxRate       | Tax Rate       |
| settings.serviceCharge | Service Charge |

### reports (14 missing) - 0% coverage

| Key                   | English             |
| --------------------- | ------------------- |
| reports.title         | Reports             |
| reports.sales         | Sales Report        |
| reports.orders        | Order Report        |
| reports.items         | Item Report         |
| reports.staff         | Staff Report        |
| reports.payments      | Payment Report      |
| reports.exportPdf     | Export PDF          |
| reports.exportExcel   | Export Excel        |
| reports.dateRange     | Date Range          |
| reports.compare       | Compare             |
| reports.totalSales    | Total Sales         |
| reports.totalOrders   | Total Orders        |
| reports.averageOrder  | Average Order Value |
| reports.topItems      | Top Items           |
| reports.topCategories | Top Categories      |

### offline (2 missing)

| Key                 | English                                |
| ------------------- | -------------------------------------- |
| offline.pendingSync | {count} items pending sync             |
| offline.syncFailed  | Sync failed. Will retry automatically. |

---

## Hardcoded English Strings in Components

The following areas likely contain hardcoded English strings that should use the i18n system:

| Component Area       | Likely Hardcoded Strings                 | Priority |
| -------------------- | ---------------------------------------- | -------- |
| KDS Display          | Status labels, timer text, button labels | P0       |
| Order Status Badges  | Status pill text                         | P0       |
| Payment Flow         | Telebirr/Chapa flow text, error messages | P0       |
| Table Map            | Status labels, capacity text             | P1       |
| Receipt Printer      | Receipt header, footer, item formatting  | P1       |
| Error Boundaries     | Generic error page text                  | P1       |
| Offline Banner       | Connection status messages               | P2       |
| Date/Time Formatting | Relative time strings ("2 hours ago")    | P2       |
| Number Formatting    | Currency display, quantity formatting    | P2       |

> Note: A full component-level audit is recommended to identify all hardcoded strings.

---

## Recommendations for 100% Amharic Coverage

### Phase 1: Critical Fixes (P0)

1. **Fix Arabic bug** in `guests.title` - replace `الضيوف` with `እንግዶች`
2. **Add missing `time` translations** - heavily used in reports, KDS, and order displays
3. **Add missing `validation` translations** - shown on every form submission
4. **Add missing `confirm` translations** - shown on destructive actions
5. **Add missing `errors` translations** - shown on every error state

### Phase 2: Core Feature Coverage (P1)

6. Add missing `actions` translations (update, create, filter, etc.)
7. Add missing `orders` translations (order history, modify, cancel)
8. Add missing `kds` translations (bumped, recall, rush, fire all)
9. Add missing `payments` translations (mobile money, chapa, split)
10. Add missing `tables` translations (transfer, merge, split)

### Phase 3: Full Coverage (P2)

11. Add missing `menu` translations (dietary info, modifiers)
12. Add missing `guests` translations (guest info, allergies)
13. Add missing `settings` translations (billing, integrations)
14. Add missing `reports` translations (entire section at 0%)
15. Add missing `currency` and `offline` translations
16. Audit all components for hardcoded English strings
17. Add Amharic interpolation support for date/number formatting
18. Implement RTL testing for mixed Amharic/English layouts

### Automated Enforcement

- Add CI check that fails if Amharic coverage drops below 90%
- Add `getMissingTranslations('am')` call in test suite
- Add pre-commit hook to validate no Arabic characters in Amharic strings
