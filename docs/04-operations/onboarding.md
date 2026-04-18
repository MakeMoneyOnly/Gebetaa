# ገበጣ lole — Restaurant Onboarding Guide

**Version 1.0 · March 2026**
**For lole Staff & Founders Only — Not for Distribution**

> This guide covers everything required to get a new restaurant from first conversation to first live order. Follow every step in sequence. Do not skip hardware verification. A bad setup on Day 1 creates support tickets for months.

---

## Overview: The 7-Day Onboarding Arc

```
Day 0    Pre-visit checklist + hardware procurement advice
Day 1    On-site setup: tablet, printer, WiFi, accounts, menu
Day 2    Staff training session (Amharic, 2 hours)
Day 3    Soft launch: first real orders with you present
Day 7    Check-in call: resolve blockers, confirm daily usage
Day 30   Analytics review + upgrade conversation
Day 60   Referral ask
```

Total time investment: ~8 hours over 60 days.
After Day 7, the restaurant is self-sufficient for 95% of issues.

---

## Day 0 — Pre-Visit Checklist

Complete this before arriving. Do not show up without confirming all of these.

### Information to Collect from Owner

```
[ ] Restaurant full name (English):  ________________________________
[ ] Restaurant full name (Amharic):  ________________________________
[ ] Physical address:                ________________________________
[ ] Owner full name:                 ________________________________
[ ] Owner phone (Telegram-capable):  ________________________________
[ ] Owner email address:             ________________________________
[ ] Number of tables:                ____
[ ] Number of waitstaff:             ____
[ ] KDS stations needed:
      [ ] Kitchen    [ ] Bar    [ ] Coffee    [ ] Dessert    [ ] Expeditor
[ ] Payment methods:
      [ ] Cash    [ ] Telebirr    [ ] Chapa    [ ] CBE Birr
[ ] VAT-registered?      [ ] Yes    [ ] No
[ ] TIN number:          ________________________________
[ ] VAT number:          ________________________________
[ ] WiFi available?      [ ] Yes    [ ] No (advise 4G hotspot)
[ ] WiFi SSID/password:  ________________________________
```

### Hardware to Confirm Before Visit

The restaurant purchases hardware — you advise, you do not supply.

**POS Tablet (1 per station):**

- Samsung Galaxy Tab A8 or Tecno T40 Pro
- Android 10+, minimum 3GB RAM
- Where to buy: Addis Mercato electronics, Sheger Mall, Bole phone shops
- Price: ETB 4,500–8,000
- Must be charged to at least 50% before visit

**Thermal Printer (1 per POS station):**

- Xprinter XP-80 (80mm, USB) — strongly recommended
- Where to buy: Kazanchis office supply shops, Piazza stationers
- Price: ETB 2,500–4,500
- Confirm USB cable included + 80mm paper roll loaded

**USB OTG Adapter:**

- USB-C to USB-A OTG for modern tablets
- Any mobile accessories shop — ETB 50–150

**Network:**

- WiFi: confirm it reaches kitchen + bar areas physically
- No WiFi: recommend Ethio Telecom 4G hotspot router (ETB 1,200–2,500)

---

## Day 1 — On-Site Setup (3–4 hours)

**Arrive when the restaurant is NOT open for service. Never set up during service hours.**

---

### Step 1 — Create Restaurant Account (30 min)

On your laptop (not the tablet):

```
1. Go to lole.app/register
2. Create owner account with owner's email
3. Complete restaurant profile:
   - Name in English and Amharic
   - Address (Amharic and English)
   - Phone number
   - Timezone: Africa/Addis_Ababa
   - Upload logo (phone photo of sign is fine)
4. Add all tables: /merchant/tables
   - Use the restaurant's own table names (A1, Window 1, Outside 3, etc.)
5. Configure payments: /merchant/settings → Payments
   - Always enable Cash
   - Enable Telebirr if they have a merchant API key
   - Enable Chapa if they want card payments
   - Enter API keys from their provider merchant dashboard
```

**If no Telebirr Merchant account yet:**
Help them apply at ethiotelecom.et. Takes 2–5 business days.
Go live on Cash only and add Telebirr when it is ready.

---

### Step 2 — Build the Menu (45–60 min)

Do this with the owner present so Amharic names are correct.

```
/merchant/menu → Add Category for each section:

  Category fields:
  - English name
  - Amharic name (owner dictates, you type)
  - KDS station assignment:
      All food items    → Kitchen
      Beer/water/soda   → Bar
      Coffee/tea/juice  → Coffee
      Cakes/ice cream   → Dessert
  - Upload category image (optional)

For each item within a category:
  - English name
  - Amharic name
  - Price in ETB
  - Photo (phone camera, acceptable quality)
  - Modifier groups where needed:

    Example — Steak:
      Group: "Cooking" | Required: Yes | Multi-select: No
      Options: Rare (0 ETB) / Medium (0 ETB) / Well Done (0 ETB)

    Example — Coffee:
      Group: "Milk" | Required: No | Multi-select: No
      Options: No milk (0 ETB) / A little (0 ETB) / Full (0 ETB)

    Example — Fresh juice:
      Group: "Size" | Required: Yes | Multi-select: No
      Options: Small (0 ETB) / Large (+15 ETB)
```

**Tip:** Ask for their printed menu or WhatsApp price list — data entry is 3× faster from a document than from dictation.

**Common Amharic category names:**
| Amharic | English |
|---------|---------|
| ቁርስ | Breakfast |
| ምሳ | Lunch |
| እራት | Dinner |
| መጠጥ | Drinks |
| ቡና / ሻይ | Coffee / Tea |
| ጣፋጭ | Dessert |
| ፈጣን ምግብ | Quick bites / Snacks |
| ምሳ ልዩ | Daily special / Chef's special |

---

### Step 3 — Add Staff Accounts (20 min)

```
/merchant/staff → Add Staff Member for each person who uses the POS:

  Fields per staff:
  - Full name (and nickname they go by)
  - Role: waiter / cashier / kitchen / bar
  - 4-digit PIN (assign a different PIN to each person)

Write all PINs on a card and give it to the owner.
Tell the owner: keep this card in your office, not at the POS station.

KDS-only staff (kitchen, bar) do NOT need lole accounts.
KDS runs on a shared tablet with no individual login.
```

---

### Step 4 — Set Up POS Tablet (45 min)

```
On the Android tablet:

1. Connect to restaurant WiFi

2. Open Chrome (NOT Samsung Internet or other browsers)

3. Navigate to: lole.app/pos/waiter

4. Log in with owner's account (one-time — this links tablet to restaurant)

5. Install as PWA:
   - Chrome shows "Add to Home Screen" banner at bottom of screen
   - If not visible: tap Chrome menu (⋮) → "Add to Home Screen"
   - Name: "lole POS"
   - Tap "Add"

6. Verify:
   - Close Chrome completely
   - Open lole POS from home screen
   - Confirm: opens fullscreen (no Chrome address bar)
   - Enter any waiter's PIN — menu should load in Amharic

7. Enable Screen Pinning (prevents staff navigating away accidentally):
   Android Settings → Biometrics and Security → Screen Pin → On
   To pin: open app → hold Back + Recent buttons simultaneously

8. Set screen timeout: Settings → Display → Screen Timeout → 10 minutes
   (Not "Never" for POS — battery drain. KDS is "Never" because it must always be visible.)
```

---

### Step 5 — Set Up Thermal Printer via Termux (45–60 min)

This is the most technical step. Go slowly. Every command matters.

```
On the POS tablet:

PART A — Install Termux (do NOT use Play Store version — it is abandoned)

1. Open Chrome on tablet
2. Go to: f-droid.org
3. Download F-Droid APK
4. Android will ask permission to install — allow Chrome to install APKs
5. Install F-Droid
6. Open F-Droid → search "Termux" → Install
7. Also install "Termux:Boot" from F-Droid (search same term)

PART B — Connect the printer

1. Plug USB OTG adapter into tablet's charging port
2. Connect printer USB cable to the OTG adapter
3. Power on the printer (switch on back or side)
4. Printer should beep

PART C — Install print server

1. Open Termux app
2. Run these commands one at a time (wait for each to finish):

   pkg update -y
   pkg install nodejs-lts -y
   mkdir -p ~/lole-print
   cd ~/lole-print
   npm init -y
   npm install express node-thermal-printer

3. Confirm printer is visible:
   ls /dev/usb/
   → Should show: lp0
   → If nothing: see troubleshooting below

4. Create server file:
   nano server.js
   → Paste the complete server.js from the Master Blueprint (Section 3)
   → Ctrl+X → Y → Enter to save

5. Test run:
   node server.js
   → Should print: "lole Print Server ready on localhost:3001"

6. Verify from browser:
   Open Chrome on same tablet → go to: http://localhost:3001/health
   → Should return: {"status":"ok","timestamp":"..."}

7. Set up auto-start on tablet reboot:
   mkdir -p ~/.termux/boot
   nano ~/.termux/boot/start.sh

   Paste:
   #!/data/data/com.termux/files/usr/bin/sh
   cd ~/lole-print && node server.js >> ~/print.log 2>&1 &

   Ctrl+X → Y → Enter

   chmod +x ~/.termux/boot/start.sh

8. Enable Termux:Boot:
   Open Termux:Boot app from home screen
   Follow the permission prompt

PART D — Test a real receipt
   In the lole POS, take a test order and tap Print Receipt
   → Printer should produce a bilingual (Amharic + English) receipt
```

**Printer troubleshooting:**

| Problem                            | Fix                                                                                                                               |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `ls /dev/usb/` shows nothing       | Try different OTG cable · Ensure printer is powered on before connecting · Try rebooting tablet with printer connected            |
| Permission denied on /dev/usb/lp0  | Run: `sudo chmod 666 /dev/usb/lp0` in Termux                                                                                      |
| Termux prints garbled characters   | Confirm `CharacterSet: UTF8` in server.js — Ethiopic requires UTF-8                                                               |
| Printer prints but no Amharic text | Confirm the Xprinter XP-80 firmware supports UTF-8 (most 2022+ models do). Older models print English only — acceptable fallback. |
| Termux not starting on boot        | Open Termux:Boot → confirm it has "Allow background activity" permission in Android battery settings                              |

---

### Step 6 — Set Up KDS Tablets (15 min each)

```
For each KDS station:

1. Open Chrome on the KDS tablet
2. Go to the station URL:
   Kitchen:   lole.app/kds/kds
   Bar:       lole.app/kds/bar
   Coffee:    lole.app/kds/coffee
   Dessert:   lole.app/kds/dessert
   Expeditor: lole.app/kds/expeditor

3. Log in with owner's account

4. Install as PWA: Chrome (⋮) → Add to Home Screen → "lole KDS [Station]"

5. Open from home screen to confirm fullscreen

6. Settings → Display → Screen Timeout → Never
   (KDS must stay on during entire service — do not let it sleep)

7. Set brightness to maximum

8. Enable Screen Pinning

9. Mount on wall or place on shelf at eye level for standing staff
```

---

### Step 7 — Generate and Print QR Codes (20 min)

```
1. Go to /merchant/tables
2. Click the QR icon on each table → Download PNG

3. Printing options (in order of quality):
   a. Print shop (Bole or Piazza): best quality, lamination available
   b. Chrome print from dashboard: acceptable for testing
   c. Acrylic table stands: order at any Addis print shop, ETB 50–100 each

4. Add instruction text on or near each QR:
   Amharic: "QR ኮዱን ስካን ያድርጉ ለማዘዝ"
   English: "Scan to order"

5. Laminate QR codes if possible — food and drinks destroy paper QR codes quickly
```

---

### Day 1 Completion Sign-Off

Do not leave until every item is checked. This list is your warranty.

```
Accounts & Configuration
[ ] Owner account created + verified (check welcome email arrived)
[ ] Restaurant profile: name in Amharic ✓, address ✓, logo ✓
[ ] All tables added with correct names
[ ] Full menu entered — every item has Amharic name
[ ] Modifiers configured for all items that need them
[ ] Payment methods configured (at minimum: Cash)
[ ] All staff PINs created + PIN card given to owner

Hardware & Software
[ ] POS tablet: PWA installed, opens fullscreen, menu loads in Amharic
[ ] POS tablet: waiter PIN login works
[ ] KDS tablet(s): correct URL, PWA installed, screen timeout = Never
[ ] Printer: Termux running, /api/health returns OK, test receipt prints correctly
[ ] QR codes: generated, printed, placed on tables

Offline Test (MANDATORY)
[ ] Turn off WiFi on POS tablet
[ ] Confirm menu still loads from cached data
[ ] Place a test order while offline
[ ] Turn WiFi back on
[ ] Confirm offline order synced and appeared on KDS

Owner Handoff
[ ] Owner has email + password written down (not just in their head)
[ ] Owner has Termux knowledge: how to restart print server if it stops
[ ] Owner has your Telegram number as first support contact
[ ] Day 2 training session time confirmed
```

---

## Day 2 — Staff Training Session

See **Staff Training Manual (Doc 15)** for the complete session guide.

Bring: your demo tablet (backup), printed Amharic quick-reference cards (one per waiter).

Duration: 2 hours, ideally the morning before the restaurant opens for the day.

---

## Day 3 — Soft Launch (1 hour on-site)

Be physically present for the first 1–2 hours of real service. You are a silent observer — let staff use the system. Only intervene if something is broken.

**Watch for:**

- Are waitstaff going through the full flow (open table → add items → modifiers → send)?
- Is the KDS showing orders within 2 seconds of POS submission?
- Are staff printing receipts or asking "how do I print again?"?
- Is the kitchen actually watching the KDS or waiting for someone to shout the order?

**Common Day 3 issues:**

| Issue                                  | Cause                                       | Fix                                                          |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| KDS not showing new orders             | KDS tablet screen is asleep                 | Set screen timeout to Never — repeat this step               |
| Order appears on KDS but wrong station | Item category assigned to wrong KDS station | Fix in /merchant/menu → edit category → reassign KDS station |
| Print button does nothing              | Termux print server stopped                 | Open Termux → run: `cd ~/lole-print && node server.js`       |
| Staff forgot PIN                       | PINs not memorised yet                      | Show owner: /merchant/staff → view PIN for that staff member |
| Menu item missing                      | Forgotten during setup                      | Add on the spot via /merchant/menu → + Add Item              |
| "Connection error" on POS              | WiFi dropped                                | Check WiFi router — reconnect tablet                         |

---

## Day 7 — First Check-In Call (30 min via Telegram)

```
Ask these questions:

1. "ፒኦኤስ ሁሉም ትዕዛዞች ለ ያስገቡ?" — Is the POS being used for every order?
   If reverting to paper: find out why. Speed? Confidence? Missing items?

2. "ኩሽናው KDS ን ይጠቀማሉ?" — Is the kitchen using the KDS?
   If not: remove paper kitchen tickets. Force the transition.

3. "ምናሌ ላይ የጎደሉ ነገሮች አሉ?" — Any missing menu items or wrong prices?
   Do a quick review together.

4. "ዳሽቦርዱን ተመልክቷቸዋል?" — Have you checked the dashboard yet?
   Walk them through their top-selling item. Make the data feel real.

5. "ክፍያ ችግር ነበር?" — Any payment issues?
   Check /merchant/finance for any failed transactions.
```

---

## Day 30 — Analytics Review + Upgrade Conversation

Prepare: open their analytics dashboard before the call.

```
Key numbers to share:
- Total orders and revenue, last 30 days
- Top 3 selling items
- Busiest day and hour
- Average ticket size (ETB)
- Payment method split (cash vs Telebirr vs Chapa)

Script:
"ባለፉት 30 ቀናት [X] ትዕዛዞችን አስተናግደዋል — [Y] ብር ሰርተዋል"
"In the last 30 days you served [X] orders and earned [Y] ETB"

Show their top item: most owners are genuinely surprised.
Show their busiest hour: operational insight they did not have before.

Upgrade ask:
"Pro plan ሊጨምር የሚችለው: 재고 ማንቂያዎች, ታማኝነት ነጥቦች, ሙሉ ትንታኔ ታሪክ"
"Pro plan adds: inventory alerts, loyalty points, full analytics history"
"1,200 ብር ወርሃዊ — እናንቃ?"
"1,200 ETB per month — shall we activate it?"
```

---

## Day 60 — Referral Ask

```
"ምግብ ቤቶች ባለቤቶች ጓደኞችዎ አሉ?"
"Do you have restaurant owner friends?"

"ስልካቸውን ካጋሩ 2 ወር Pro ነፃ ያገኛሉ"
"If you share their contact, you get 2 months Pro free"

Most happy operators in Addis give 1–3 referrals.
These referrals are your primary growth engine in Phase 1.
```

---

## Common Setup FAQs

**Old tablet (Android 7 or 8) — will it work?**
Test: open Chrome → lole.app. If it loads and shows PWA install prompt, it works. Chrome 90+ runs on Android 7+.

**Owner wants to use iPad instead of Android:**
Termux is not available on iOS. Printing requires Bluetooth printer + AirPrint or Safari print. Functional but less reliable. Recommend Android strongly. Do not block the sale — work with what they have.

**No WiFi, just mobile data:**
Staff member's phone as mobile hotspot works fine. 1GB data ≈ 50–80 hours of POS use (menus cache locally). Payments need internet — a few MB per transaction.

**Second POS terminal at the bar:**
Set up second tablet same way. Same restaurant account login. Orders from both appear in unified queue and all KDS stations automatically.

**Printer prints but no Amharic — just boxes or symbols:**
Older Xprinter firmware does not support UTF-8 Ethiopic. English-only receipt is the fallback — functional, just not bilingual. Recommend they buy a 2022+ Xprinter model when their current printer needs replacement.

---

_lole Restaurant Onboarding Guide v1.0 · March 2026 · For lole Staff Only_
