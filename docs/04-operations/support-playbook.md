# ገበጣ lole — Support Playbook

**Version 1.0 · March 2026**
**Internal — For lole Support Staff**

> This playbook scales lole support from "founder answers every Telegram message" to a system that any team member can operate. Every known issue has a diagnosis flowchart and a resolution script. Every escalation path is defined.

---

## Support Philosophy

lole's restaurants are running live businesses. When their POS breaks during a Friday dinner service, they are losing money every minute it is down. Support is not a back-office function — it is a revenue-protection function.

**Three rules:**

1. **Acknowledge within 5 minutes** during business hours (6am–11pm EAT). Even if you have no answer, say "ተቀብለናል — እየሰራን ነን" (Received — we are working on it).
2. **Resolve or escalate within 30 minutes** for any issue affecting live orders or payments.
3. **Never leave a restaurant without a working path forward.** If the main solution does not work, give them a workaround before you hang up.

---

## Support Channels

| Channel                 | Use For                                                      | Response SLA                                         |
| ----------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| **Telegram (primary)**  | All restaurant support. Fast, async, voice note capable.     | <5 min acknowledge, <30 min resolve (business hours) |
| **Telegram voice call** | Complex issues requiring screen sharing or live walkthrough  | Initiated by support when text is not sufficient     |
| **Email**               | Billing questions, account changes, formal requests          | <4 hours (business hours)                            |
| **In-person visit**     | Hardware failures, training refreshers, new staff onboarding | Same day or next day                                 |

**Never use:** WhatsApp (no backup), SMS (too limited), Facebook (public, not secure).

---

## Support Hours & Coverage

| Time (EAT)       | Coverage                                                         |
| ---------------- | ---------------------------------------------------------------- |
| 6:00am – 11:00pm | Full support — founder or designated support person              |
| 11:00pm – 6:00am | Emergency only — P0 incidents (payment system down, data breach) |

**Business hours for Ethiopian restaurants:**

- Breakfast service: 6am–10am
- Lunch service: 11am–3pm
- Dinner service: 5pm–10pm
- Highest risk window: **Friday and Saturday 6pm–10pm** — do not schedule anything during this window

---

## Issue Classification

| Priority          | Definition                                         | Response                                   | Examples                                                                                 |
| ----------------- | -------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **P0 — Critical** | Revenue is stopped, live restaurant cannot operate | Acknowledge <2 min, resolve <30 min        | POS cannot send orders, all payments failing, KDS completely blank                       |
| **P1 — High**     | Significant degradation, workaround exists         | Acknowledge <5 min, resolve <2 hours       | Telebirr payments not confirming (cash works), printer not working, one KDS station down |
| **P2 — Medium**   | Feature broken but core workflow intact            | Acknowledge <15 min, resolve same day      | Analytics not loading, wrong prices showing, loyalty points not crediting                |
| **P3 — Low**      | Minor issue, no service impact                     | Acknowledge <1 hour, resolve within 3 days | Cosmetic bug, translation error, menu photo not uploading                                |

---

## Issue Diagnosis Flowcharts

### Flowchart 1 — "The POS is not working"

This is the most common support message. "Not working" means many different things. Always diagnose before jumping to solutions.

```
"POS is not working"
        │
        ├── Can you open the lole POS app at all?
        │     │
        │     ├── NO → App won't open
        │     │         → Is lole POS icon on the home screen?
        │     │              NO: reinstall PWA (Section A below)
        │     │              YES: Force close app → reopen
        │     │                   Still not opening: restart tablet
        │     │
        │     └── YES → App opens but something is wrong
        │                   ↓
        ├── Can you log in with a staff PIN?
        │     │
        │     ├── NO → PIN not accepted
        │     │         → Is WiFi connected? (PIN check needs internet first time)
        │     │              NO: connect WiFi → retry
        │     │              YES: check correct PIN in /merchant/staff
        │     │                   PIN was recently changed? → update them
        │     │
        │     └── YES → Logged in but something else is wrong
        │                   ↓
        ├── Can you see the menu?
        │     │
        │     ├── NO → Menu not loading
        │     │         → Is WiFi on? (menu may not be cached yet)
        │     │              NO: connect WiFi → wait 30s → retry
        │     │              YES: clear Chrome cache → reload PWA
        │     │
        │     └── YES → Menu loads but orders won't send
        │                   ↓
        └── "Order sent" confirmation appears?
              │
              ├── NO → Check internet connection
              │         → Check Supabase status: status.supabase.com
              │         → WORKAROUND: take orders offline, they sync when internet returns
              │
              └── YES but not appearing on KDS → See Flowchart 2
```

---

### Flowchart 2 — "Orders not appearing on KDS"

```
"Orders sent from POS but KDS shows nothing / missing orders"
        │
        ├── Is the KDS tablet ON and showing the lole KDS screen?
        │     │
        │     ├── NO → Screen is off or showing wrong app
        │     │         → Wake up tablet (press power button)
        │     │         → Open lole KDS from home screen
        │     │         → Confirm it shows the correct station URL:
        │     │              lole.app/kds/[station]
        │     │
        │     └── YES → KDS is on and correct URL
        │                   ↓
        ├── Is the KDS tablet on the same WiFi as the POS tablet?
        │     │
        │     ├── NO → Connect KDS tablet to restaurant WiFi
        │     │
        │     └── YES → Same WiFi
        │                   ↓
        ├── Did a test order just sent appear?
        │     │
        │     ├── YES (delay, but works) → Realtime latency issue
        │     │         → Check WiFi signal strength at KDS location
        │     │         → Move WiFi router or use WiFi extender
        │     │
        │     └── NO → Orders not reaching KDS at all
        │                   ↓
        │               → Is there a category/KDS station mismatch?
        │                    (e.g., item assigned to "Bar" but sending to "Kitchen" KDS)
        │                    Check: /merchant/menu → category → KDS station assignment
        │                    Fix: change category's KDS station
        │
        └── WORKAROUND if nothing works:
              → Switch KDS tablet to: lole.app/merchant/orders (dashboard order view)
              → Kitchen can read orders from there until issue is resolved
```

---

### Flowchart 3 — "Payment is not confirming"

```
"Guest paid via Telebirr/Chapa but POS still shows 'pending'"
        │
        ├── Guest's phone shows "Payment Successful"?
        │     │
        │     ├── NO → Payment did not go through on guest side
        │     │         → Ask guest to try again
        │     │         → If Telebirr balance issue: suggest cash or Chapa
        │     │
        │     └── YES → Guest paid but POS not confirmed
        │                   ↓
        ├── Wait 60 seconds → still pending?
        │     │
        │     ├── CONFIRMED after waiting → webhook delay, normal, issue resolved
        │     │
        │     └── STILL PENDING after 60s → webhook not arriving
        │                   ↓
        │               Check: is this a webhook configuration issue?
        │               → Go to: Chapa/Telebirr merchant dashboard
        │               → Confirm webhook URL = https://lole.app/api/webhooks/[provider]
        │               → NOT a localhost URL, NOT a preview URL
        │
        │               IMMEDIATE WORKAROUND (to release the guest):
        │               → Manager goes to /merchant/orders
        │               → Find the order → "Mark as Paid" (manual override)
        │               → Record the Telebirr transaction reference number
        │               → Flag for reconciliation review
        │
        └── Pattern: multiple restaurants affected?
              → Check Upstash QStash dashboard for job failures
              → Check Axiom logs: filter POST /api/webhooks/*
              → Escalate to engineering immediately (P0)
```

---

### Flowchart 4 — "Receipt printer not working"

```
"Printer is not printing / Print button does nothing"
        │
        ├── Is Termux running in the background on the POS tablet?
        │     │
        │     ├── NO / Not sure → Open Termux app
        │     │         → Run: ps aux | grep node
        │     │              If no result: server is not running
        │     │              → Run: cd ~/lole-print && node server.js
        │     │              → Leave Termux open (do not close it)
        │     │
        │     └── YES → Termux is running
        │                   ↓
        ├── Test the server directly:
        │     Open Chrome on POS tablet
        │     Go to: http://localhost:3001/health
        │     │
        │     ├── Returns {"status":"ok"} → server is fine, issue is elsewhere
        │     │         → Check: is printer USB cable plugged into OTG adapter?
        │     │         → Check: ls /dev/usb/ in Termux → should show lp0
        │     │
        │     └── Error / no response → server not accessible
        │               → Stop any running node: pkill node
        │               → Restart: cd ~/lole-print && node server.js
        │
        ├── Printer is connected but prints garbled text / boxes?
        │     → Ethiopic (Amharic) character encoding issue
        │     → Confirm server.js has: characterSet: 'UTF8'
        │     → Older Xprinter models print English only — acceptable fallback
        │     → WORKAROUND: disable Amharic on receipt in /merchant/settings → Receipts
        │
        └── WORKAROUND if printer completely unrecoverable:
              → Go to /merchant/orders → find order → "Email Receipt"
              → Or use browser print: Ctrl+P / ⋮ → Print from any order view
              → Hardware failure: swap USB OTG cable first (most common physical failure)
```

---

### Flowchart 5 — "Menu item missing / wrong price"

```
"A menu item is not showing on the POS" or "Price is wrong"
        │
        ├── Go to /merchant/menu → find the item
        │     │
        │     ├── Item is marked "Unavailable" (is_available = false)
        │     │         → Toggle to Available
        │     │         → Menu refreshes on POS within 5 minutes (cache)
        │     │         → For immediate refresh: POS → pull down to refresh
        │     │
        │     ├── Item price is wrong in the menu
        │     │         → Edit price in /merchant/menu
        │     │         → Note: existing open orders keep the old price
        │     │              Only NEW orders use the updated price
        │     │
        │     ├── Item does not exist yet
        │     │         → Add it: /merchant/menu → + Add Item
        │     │         → Appears on POS within 5 minutes
        │     │
        │     └── Item exists and is available but still not showing on POS
        │               → Check: is the category active? (category may be hidden)
        │               → Hard refresh on POS: hold Ctrl+Shift+R (Chrome) or
        │                    Settings → Clear Cache → reload
        │
        └── Price showing correctly in menu but wrong on receipt?
              → Confirm santim migration completed (all prices INTEGER)
              → Check: /merchant/finance → recent orders → do prices match menu?
              → If mismatch: engineering bug → escalate to P2
```

---

## Standard Response Templates

All in Amharic with English translation. Use these as starting points — adapt the tone to match your relationship with the restaurant.

### Acknowledgement (< 5 minutes after receiving message)

```
አማርኛ:
ሠላም [የምግብ ቤቱ ስም]! መልዕክትዎን ተቀብለናል።
እየሰራን ነን — ብዙም ሳይቆይ እናነጋግርዎ።

English:
Hello [Restaurant Name]! We received your message.
We are on it — we will get back to you shortly.
```

### Resolution Confirmation

```
አማርኛ:
ችግሩ ተፈቷል! [ምን እንደሠሩ ባጭሩ ይጻፉ]።
ሌላ ጥያቄ ካለ በቴሌግራም ያናድሱን።
ምግብ ቤቱ ትርፋማ ቀን ይሁንዎ! 🙏

English:
Issue resolved! [Brief explanation of what was done].
If anything else comes up, message us on Telegram.
Have a great service! 🙏
```

### Workaround While Investigating

```
አማርኛ:
ለጊዜው ይህን ያድርጉ: [workaround steps in Amharic].
ዋናውን ችግር እየፈተሽን ነን — ከ[X] ደቂቃ ውስጥ ዝርዝር ጉዳይ እናሳውቅዎ።

English:
For now, please do the following: [workaround steps].
We are investigating the root cause — we will update you within [X] minutes.
```

### Escalation to Owner/Engineering

```
[Internal Telegram message to founder/engineering]

🔴 P[0/1] ISSUE — [Restaurant Name]
Time: [HH:MM EAT]
Issue: [one sentence description]
Restaurants affected: [list]
Already tried: [what support tried]
Workaround in place: [yes/no — describe]
Needs: [what you need from engineering]
```

### Scheduled Maintenance Notice (sent 48h before)

```
አማርኛ:
ሠላም [የምግብ ቤቱ ስም]!
[ቀን] [ሰዓት] EAT ገደማ ስርዓቱ ለ[X] ደቂቃዎች ሊቆም ይችላል።
ይህ ወቅት ዝቅተኛ ሸቀጥ ሰዓት ነው ብለን ወስደናል።
ጥያቄ ካለ እናናቅ።

English:
Hello [Restaurant Name]!
On [date] around [time] EAT, the system may be briefly unavailable for [X] minutes.
We have scheduled this during a low-traffic window.
Message us with any questions.
```

---

## Known Issues & Workarounds

Maintain this table. Update whenever a new known issue is identified or resolved.

| Issue                                                 | Affected Version | Workaround                                      | Status                             | ETA Fix   |
| ----------------------------------------------------- | ---------------- | ----------------------------------------------- | ---------------------------------- | --------- |
| Telebirr webhook not auto-confirming                  | Before Sprint 1  | Manual payment override in /merchant/orders     | Resolved in Sprint 1               | Sprint 1  |
| Printer prints English only (older Xprinter firmware) | All              | Disable Amharic receipt in settings             | Permanent for old hardware         | N/A       |
| Dashboard analytics slow for >6 months of data        | Before Sprint 7  | Use 30-day filter as default                    | Resolved in Sprint 7 (TimescaleDB) | Sprint 7  |
| Menu not refreshing on POS after price change         | All              | Pull-to-refresh or Cloudflare cache (5 min TTL) | By design — 5 min acceptable       | No change |
| KDS screen going to sleep in kitchen                  | All              | Set screen timeout to Never during setup        | User education + setup checklist   | N/A       |

---

## Billing & Account Support

### Plan Upgrades

```
Restaurant wants to upgrade from Free to Pro:
→ Go to /merchant/settings → Subscription → Upgrade to Pro
→ They complete payment via Chapa in-product
→ Pro features activate immediately
→ If payment fails: ask them to try a different payment method or contact Chapa

Restaurant wants annual plan:
→ Currently only available via manual invoice
→ Send them a Chapa payment link for 10,000 ETB (12 months Pro)
→ Manually extend their plan_expires_at by 12 months after payment confirms
→ Note in their account record
```

### Account Recovery

```
Owner forgot password:
→ lole.app → Sign In → Forgot Password → enter email → reset link sent
→ If email is wrong/lost: verify owner identity via phone call → manually update email
   in Supabase Auth dashboard → send reset

Owner wants to add a new location:
→ Currently: create separate restaurant account for each location
→ Multi-location feature: Phase 4 roadmap
→ Workaround: create second account, owner manages both dashboards separately
```

### Cancellation

```
Restaurant wants to cancel their subscription:
→ Do not argue or push back — respect the decision
→ Ask one question only: "ምን ምክንያት ቢኖር ቢደወሉ አሻሽሉ?"
   (Is there anything we could improve that would change your decision?)
→ If they still want to cancel: downgrade to Free plan in Supabase
   (do not delete the account — they may return)
→ Log reason in churn tracker spreadsheet
→ Their data is retained for 90 days after downgrade
→ Send a polite farewell message — they may refer others later even if they left
```

---

## Escalation Matrix

| Situation                                   | Escalate To                 | How                    | When          |
| ------------------------------------------- | --------------------------- | ---------------------- | ------------- |
| P0 incident                                 | Founder                     | Telegram voice call    | Immediately   |
| Payment issue >30 min unresolved            | Founder                     | Telegram message       | After 30 min  |
| Suspected security issue                    | Founder                     | Call + Telegram        | Immediately   |
| Bug not in known issues list                | Engineering backlog         | Telegram + Sentry link | Same day      |
| ERCA submission failure >2 hours            | Founder                     | Telegram               | After 2 hours |
| Restaurant threatening public complaint     | Founder                     | Telegram voice call    | Immediately   |
| Hardware failure (needs replacement advice) | N/A — advise nearest repair | —                      | On contact    |

---

## Support Metrics

Track these weekly. Report to founder on Monday mornings.

| Metric                               | Target                      | How to Measure                         |
| ------------------------------------ | --------------------------- | -------------------------------------- |
| First response time (business hours) | <5 minutes median           | Telegram message timestamps            |
| Resolution time P0/P1                | <30 min / <2 hours          | Ticket open → close time               |
| Tickets per restaurant per month     | <2 (healthy) · >5 (at-risk) | Manual count                           |
| Issues resolved without escalation   | >80%                        | Count of escalated vs. total           |
| CSAT (satisfied?)                    | >90%                        | Post-resolution Telegram poll: 👍 / 👎 |
| Churn-related contacts               | Track separately            | Tag "churn risk" in conversation       |

---

## Support Tooling

| Tool                   | Purpose                                        | Access                      |
| ---------------------- | ---------------------------------------------- | --------------------------- |
| **Telegram**           | Primary support channel                        | @loleSupport account        |
| **Sentry**             | Error investigation — filter by restaurant_id  | sentry.io → lole project    |
| **Axiom**              | Log search — filter by restaurant_id, endpoint | app.axiom.co                |
| **Supabase Dashboard** | Direct DB lookup, account management           | supabase.com → lole project |
| **Better Uptime**      | Current system status, outage history          | betteruptime.com            |
| **QStash Dashboard**   | Job queue status, failed jobs                  | console.upstash.com         |
| **Vercel Dashboard**   | Deployment status, function logs               | vercel.com                  |

---

## Post-Mortem Template

Complete for every P0 incident within 24 hours.

```markdown
## Post-Mortem: [Issue Title]

**Date:** [YYYY-MM-DD]
**Duration:** [HH:MM to HH:MM EAT]
**Severity:** P0 / P1
**Restaurants affected:** [list]

### What happened

[2–3 sentence plain language description]

### Timeline

- [HH:MM] Issue first reported by [Restaurant Name]
- [HH:MM] Support acknowledged
- [HH:MM] Root cause identified
- [HH:MM] Fix deployed / workaround in place
- [HH:MM] Issue confirmed resolved

### Root cause

[Technical explanation — what failed and why]

### Impact

- Restaurants affected: [number]
- Estimated orders disrupted: [number]
- Estimated revenue impact: ~[X] ETB

### What we did to fix it

[Steps taken — be specific]

### How we prevent this next time

[Concrete engineering or process changes — not vague "we will be more careful"]

### Owner communication sent

[Yes / No — paste message if sent]
```

---

_lole Support Playbook v1.0 · March 2026 · Internal Only_
