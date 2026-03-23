Run echo "=== Debug: Checking environment variables ==="
=== Debug: Checking environment variables ===
NEXT_PUBLIC_SUPABASE_URL: https://axuegixbqsvz...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY set: 46 chars
SUPABASE_SECRET_KEY set: 41 chars
QR_HMAC_SECRET set: 64 chars
UPSTASH_REDIS_REST_URL set: 34 chars
UPSTASH_REDIS_REST_TOKEN set: 71 chars

> gebeta-menu@0.1.0 test:e2e /home/runner/work/Gebetaa/Gebetaa
> playwright test

Running 84 tests using 1 worker
Color contrast violations found: [
'Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds'
]
Color contrast violations found: [
'Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds'
]
··°°·····××F××F××F××F····××F·×°°°°×°°°°F°°°°°××F××F××F××F°°°°°°°°°°°°°··°°······
××F××F××F····××F·×°°°°×°°°°F°°°°°××F××F××F××F°°°°°°°°°°°°°

1.  [chromium] › e2e/accessibility.spec.ts:203:13 › Accessibility Tests › Keyboard Navigation › should be able to navigate with keyboard

    Error: expect(locator).toBeVisible() failed

    Locator: locator(':focus')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for locator(':focus')

    212 | // Verify focus has moved
    213 | const focusedElement = page.locator(':focus');

    > 214 | await expect(focusedElement).toBeVisible();

          |                                          ^

    215 | });
    216 | });
    217 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/accessibility.spec.ts:214:42

    Error Context: test-results/accessibility-Accessibilit-24dfe-e-to-navigate-with-keyboard-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: locator(':focus')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for locator(':focus')

    212 | // Verify focus has moved
    213 | const focusedElement = page.locator(':focus');

    > 214 | await expect(focusedElement).toBeVisible();

          |                                          ^

    215 | });
    216 | });
    217 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/accessibility.spec.ts:214:42

    Error Context: test-results/accessibility-Accessibilit-24dfe-e-to-navigate-with-keyboard-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/accessibility-Accessibilit-24dfe-e-to-navigate-with-keyboard-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/accessibility-Accessibilit-24dfe-e-to-navigate-with-keyboard-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: locator(':focus')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for locator(':focus')

    212 | // Verify focus has moved
    213 | const focusedElement = page.locator(':focus');

    > 214 | await expect(focusedElement).toBeVisible();

          |                                          ^

    215 | });
    216 | });
    217 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/accessibility.spec.ts:214:42

    Error Context: test-results/accessibility-Accessibilit-24dfe-e-to-navigate-with-keyboard-chromium-retry2/error-context.md

2.  [chromium] › e2e/channels-health-delivery-ack.spec.ts:74:9 › Channels health and delivery acknowledge flow › renders channel health and acknowledges an external order

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    186 | await page.goto('/merchant/channels');
    187 |

    > 188 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    189 | await expect(page.getByText('Connected Channels')).toBeVisible();
    190 | await expect(page.getByText('BEU-1001')).toBeVisible();
    191 | await expect(
    at /home/runner/work/Gebetaa/Gebetaa/e2e/channels-health-delivery-ack.spec.ts:188:84

    Error Context: test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    186 | await page.goto('/merchant/channels');
    187 |

    > 188 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    189 | await expect(page.getByText('Connected Channels')).toBeVisible();
    190 | await expect(page.getByText('BEU-1001')).toBeVisible();
    191 | await expect(
    at /home/runner/work/Gebetaa/Gebetaa/e2e/channels-health-delivery-ack.spec.ts:188:84

    Error Context: test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    186 | await page.goto('/merchant/channels');
    187 |

    > 188 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    189 | await expect(page.getByText('Connected Channels')).toBeVisible();
    190 | await expect(page.getByText('BEU-1001')).toBeVisible();
    191 | await expect(
    at /home/runner/work/Gebetaa/Gebetaa/e2e/channels-health-delivery-ack.spec.ts:188:84

    Error Context: test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-chromium-retry2/error-context.md

3.  [chromium] › e2e/dashboard-attention-queue.spec.ts:125:9 › Dashboard attention queue workflow › renders queue, advances order status, and navigates to orders

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Attention Queue' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Attention Queue' })

    149 | await page.goto('/merchant');
    150 |

    > 151 | await expect(page.getByRole('heading', { name: 'Attention Queue' })).toBeVisible({

          |                                                                              ^

    152 | timeout: 15000,
    153 | });
    154 | await expect(page.getByText('ORD-1001', { exact: false }).first()).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:151:78

    Error Context: test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Attention Queue' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Attention Queue' })

    149 | await page.goto('/merchant');
    150 |

    > 151 | await expect(page.getByRole('heading', { name: 'Attention Queue' })).toBeVisible({

          |                                                                              ^

    152 | timeout: 15000,
    153 | });
    154 | await expect(page.getByText('ORD-1001', { exact: false }).first()).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:151:78

    Error Context: test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Attention Queue' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Attention Queue' })

    149 | await page.goto('/merchant');
    150 |

    > 151 | await expect(page.getByRole('heading', { name: 'Attention Queue' })).toBeVisible({

          |                                                                              ^

    152 | timeout: 15000,
    153 | });
    154 | await expect(page.getByText('ORD-1001', { exact: false }).first()).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:151:78

    Error Context: test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-chromium-retry2/error-context.md

4.  [chromium] › e2e/dashboard-attention-queue.spec.ts:173:9 › Dashboard attention queue workflow › refresh updates attention queue payload

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('Status: pending').first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByText('Status: pending').first()

    187 | await page.goto('/merchant');
    188 |

    > 189 | await expect(page.getByText('Status: pending').first()).toBeVisible({ timeout: 15000 });

          |                                                                 ^

    190 | await page.getByRole('button', { name: 'Refresh' }).first().click();
    191 | await expect(page.getByText('Status: ready').first()).toBeVisible({ timeout: 15000 });
    192 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:189:65

    Error Context: test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('Status: pending').first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByText('Status: pending').first()

    187 | await page.goto('/merchant');
    188 |

    > 189 | await expect(page.getByText('Status: pending').first()).toBeVisible({ timeout: 15000 });

          |                                                                 ^

    190 | await page.getByRole('button', { name: 'Refresh' }).first().click();
    191 | await expect(page.getByText('Status: ready').first()).toBeVisible({ timeout: 15000 });
    192 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:189:65

    Error Context: test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('Status: pending').first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByText('Status: pending').first()

    187 | await page.goto('/merchant');
    188 |

    > 189 | await expect(page.getByText('Status: pending').first()).toBeVisible({ timeout: 15000 });

          |                                                                 ^

    190 | await page.getByRole('button', { name: 'Refresh' }).first().click();
    191 | await expect(page.getByText('Status: ready').first()).toBeVisible({ timeout: 15000 });
    192 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:189:65

    Error Context: test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-chromium-retry2/error-context.md

5.  [chromium] › e2e/guests-directory-profile.spec.ts:74:9 › Guests directory and profile flows › loads guest directory, opens profile drawer, and saves updates

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    173 | await page.goto('/merchant/guests');
    174 |

    > 175 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    176 | await expect(
    177 | page.getByRole('button', { name: /Open guest profile for Selam Guest/i })
    178 | ).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/guests-directory-profile.spec.ts:175:82

    Error Context: test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    173 | await page.goto('/merchant/guests');
    174 |

    > 175 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    176 | await expect(
    177 | page.getByRole('button', { name: /Open guest profile for Selam Guest/i })
    178 | ).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/guests-directory-profile.spec.ts:175:82

    Error Context: test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    173 | await page.goto('/merchant/guests');
    174 |

    > 175 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    176 | await expect(
    177 | page.getByRole('button', { name: /Open guest profile for Selam Guest/i })
    178 | ).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/guests-directory-profile.spec.ts:175:82

    Error Context: test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-chromium-retry2/error-context.md

6.  [chromium] › e2e/merchant-dashboard-audit.spec.ts:21:9 › Merchant Dashboard full-session audit › navigates all core merchant tabs and validates page intent

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /^Hello,/i })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /^Hello,/i })

    at page-objects/merchant-dashboard.po.ts:33

    31 | async gotoDashboard() {
    32 | await this.safeGoto('/merchant');

    > 33 | await expect(this.page.getByRole('heading', { name: /^Hello,/i })).toBeVisible({

         |                                                                            ^

    34 | timeout: 15_000,
    35 | });
    36 | }
    at MerchantShellPage.gotoDashboard (/home/runner/work/Gebetaa/Gebetaa/e2e/page-objects/merchant-dashboard.po.ts:33:76)
    at /home/runner/work/Gebetaa/Gebetaa/e2e/merchant-dashboard-audit.spec.ts:23:9

    Error Context: test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /^Hello,/i })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /^Hello,/i })

    at page-objects/merchant-dashboard.po.ts:33

    31 | async gotoDashboard() {
    32 | await this.safeGoto('/merchant');

    > 33 | await expect(this.page.getByRole('heading', { name: /^Hello,/i })).toBeVisible({

         |                                                                            ^

    34 | timeout: 15_000,
    35 | });
    36 | }
    at MerchantShellPage.gotoDashboard (/home/runner/work/Gebetaa/Gebetaa/e2e/page-objects/merchant-dashboard.po.ts:33:76)
    at /home/runner/work/Gebetaa/Gebetaa/e2e/merchant-dashboard-audit.spec.ts:23:9

    Error Context: test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /^Hello,/i })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /^Hello,/i })

    at page-objects/merchant-dashboard.po.ts:33

    31 | async gotoDashboard() {
    32 | await this.safeGoto('/merchant');

    > 33 | await expect(this.page.getByRole('heading', { name: /^Hello,/i })).toBeVisible({

         |                                                                            ^

    34 | timeout: 15_000,
    35 | });
    36 | }
    at MerchantShellPage.gotoDashboard (/home/runner/work/Gebetaa/Gebetaa/e2e/page-objects/merchant-dashboard.po.ts:33:76)
    at /home/runner/work/Gebetaa/Gebetaa/e2e/merchant-dashboard-audit.spec.ts:23:9

    Error Context: test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-chromium-retry2/error-context.md

7.  [chromium] › e2e/p1-localization-accessibility.spec.ts:77:9 › P1 localization and accessibility regression › guests screen keeps locale formatting and labeled controls

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    140 | await page.goto('/merchant/guests');
    141 |

    > 142 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    143 | await expect(page.getByLabel('Search guests by name')).toBeVisible();
    144 | await expect(page.getByText('English')).toBeVisible();
    145 | await expect(page.getByText(/ETB/).first()).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:142:82

    Error Context: test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    140 | await page.goto('/merchant/guests');
    141 |

    > 142 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    143 | await expect(page.getByLabel('Search guests by name')).toBeVisible();
    144 | await expect(page.getByText('English')).toBeVisible();
    145 | await expect(page.getByText(/ETB/).first()).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:142:82

    Error Context: test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    140 | await page.goto('/merchant/guests');
    141 |

    > 142 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    143 | await expect(page.getByLabel('Search guests by name')).toBeVisible();
    144 | await expect(page.getByText('English')).toBeVisible();
    145 | await expect(page.getByText(/ETB/).first()).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:142:82

    Error Context: test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-chromium-retry2/error-context.md

8.  [chromium] › e2e/p1-localization-accessibility.spec.ts:155:9 › P1 localization and accessibility regression › channels screen keeps labeled controls and table semantics

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    230 | await page.goto('/merchant/channels');
    231 |

    > 232 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    233 | await expect(page.getByLabel('Connect Provider')).toBeVisible();
    234 | await expect(page.getByLabel('Provider display name')).toBeVisible();
    235 | await expect(page.getByLabel('External Orders')).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:232:84

    Error Context: test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    230 | await page.goto('/merchant/channels');
    231 |

    > 232 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    233 | await expect(page.getByLabel('Connect Provider')).toBeVisible();
    234 | await expect(page.getByLabel('Provider display name')).toBeVisible();
    235 | await expect(page.getByLabel('External Orders')).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:232:84

    Error Context: test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    230 | await page.goto('/merchant/channels');
    231 |

    > 232 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    233 | await expect(page.getByLabel('Connect Provider')).toBeVisible();
    234 | await expect(page.getByLabel('Provider display name')).toBeVisible();
    235 | await expect(page.getByLabel('External Orders')).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:232:84

    Error Context: test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-chromium-retry2/error-context.md

9.  [chromium] › e2e/p2-finance-reconciliation.spec.ts:12:9 › P2 finance reconciliation › renders payout reconciliation and exports reconciliation dataset

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /Finance/i }).first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /Finance/i }).first()

    121 |
    122 | // h1 reads "Finance & Reconciliation" via i18n copy

    > 123 | await expect(page.getByRole('heading', { name: /Finance/i }).first()).toBeVisible({

          |                                                                               ^

    124 | timeout: 15000,
    125 | });
    126 | await expect(page.getByRole('heading', { name: 'Payout Reconciliation' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-finance-reconciliation.spec.ts:123:79

    Error Context: test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /Finance/i }).first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /Finance/i }).first()

    121 |
    122 | // h1 reads "Finance & Reconciliation" via i18n copy

    > 123 | await expect(page.getByRole('heading', { name: /Finance/i }).first()).toBeVisible({

          |                                                                               ^

    124 | timeout: 15000,
    125 | });
    126 | await expect(page.getByRole('heading', { name: 'Payout Reconciliation' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-finance-reconciliation.spec.ts:123:79

    Error Context: test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /Finance/i }).first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /Finance/i }).first()

    121 |
    122 | // h1 reads "Finance & Reconciliation" via i18n copy

    > 123 | await expect(page.getByRole('heading', { name: /Finance/i }).first()).toBeVisible({

          |                                                                               ^

    124 | timeout: 15000,
    125 | });
    126 | await expect(page.getByRole('heading', { name: 'Payout Reconciliation' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-finance-reconciliation.spec.ts:123:79

    Error Context: test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-chromium-retry2/error-context.md

10. [chromium] › e2e/p2-loyalty-gift-card.spec.ts:12:9 › P2 loyalty and gift-card redemption › renders loyalty programs, issues a gift card, and redeems it

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Loyalty Program Builder' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Loyalty Program Builder' })

    148 | await page.goto('/merchant/guests', { waitUntil: 'domcontentloaded' });
    149 |

    > 150 | await expect(page.getByRole('heading', { name: 'Loyalty Program Builder' })).toBeVisible({

          |                                                                                      ^

    151 | timeout: 15000,
    152 | });
    153 | await expect(page.getByRole('heading', { name: 'Gift Card Manager' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-loyalty-gift-card.spec.ts:150:86

    Error Context: test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-chromium/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Loyalty Program Builder' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Loyalty Program Builder' })

    148 | await page.goto('/merchant/guests', { waitUntil: 'domcontentloaded' });
    149 |

    > 150 | await expect(page.getByRole('heading', { name: 'Loyalty Program Builder' })).toBeVisible({

          |                                                                                      ^

    151 | timeout: 15000,
    152 | });
    153 | await expect(page.getByRole('heading', { name: 'Gift Card Manager' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-loyalty-gift-card.spec.ts:150:86

    Error Context: test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-chromium-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-chromium-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-chromium-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Loyalty Program Builder' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Loyalty Program Builder' })

    148 | await page.goto('/merchant/guests', { waitUntil: 'domcontentloaded' });
    149 |

    > 150 | await expect(page.getByRole('heading', { name: 'Loyalty Program Builder' })).toBeVisible({

          |                                                                                      ^

    151 | timeout: 15000,
    152 | });
    153 | await expect(page.getByRole('heading', { name: 'Gift Card Manager' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-loyalty-gift-card.spec.ts:150:86

    Error Context: test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-chromium-retry2/error-context.md

11. [firefox] › e2e/channels-health-delivery-ack.spec.ts:74:9 › Channels health and delivery acknowledge flow › renders channel health and acknowledges an external order

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    186 | await page.goto('/merchant/channels');
    187 |

    > 188 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    189 | await expect(page.getByText('Connected Channels')).toBeVisible();
    190 | await expect(page.getByText('BEU-1001')).toBeVisible();
    191 | await expect(
    at /home/runner/work/Gebetaa/Gebetaa/e2e/channels-health-delivery-ack.spec.ts:188:84

    Error Context: test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    186 | await page.goto('/merchant/channels');
    187 |

    > 188 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    189 | await expect(page.getByText('Connected Channels')).toBeVisible();
    190 | await expect(page.getByText('BEU-1001')).toBeVisible();
    191 | await expect(
    at /home/runner/work/Gebetaa/Gebetaa/e2e/channels-health-delivery-ack.spec.ts:188:84

    Error Context: test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    186 | await page.goto('/merchant/channels');
    187 |

    > 188 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    189 | await expect(page.getByText('Connected Channels')).toBeVisible();
    190 | await expect(page.getByText('BEU-1001')).toBeVisible();
    191 | await expect(
    at /home/runner/work/Gebetaa/Gebetaa/e2e/channels-health-delivery-ack.spec.ts:188:84

    Error Context: test-results/channels-health-delivery-a-cf6cb-nowledges-an-external-order-firefox-retry2/error-context.md

12. [firefox] › e2e/dashboard-attention-queue.spec.ts:125:9 › Dashboard attention queue workflow › renders queue, advances order status, and navigates to orders

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Attention Queue' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Attention Queue' })

    149 | await page.goto('/merchant');
    150 |

    > 151 | await expect(page.getByRole('heading', { name: 'Attention Queue' })).toBeVisible({

          |                                                                              ^

    152 | timeout: 15000,
    153 | });
    154 | await expect(page.getByText('ORD-1001', { exact: false }).first()).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:151:78

    Error Context: test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Attention Queue' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Attention Queue' })

    149 | await page.goto('/merchant');
    150 |

    > 151 | await expect(page.getByRole('heading', { name: 'Attention Queue' })).toBeVisible({

          |                                                                              ^

    152 | timeout: 15000,
    153 | });
    154 | await expect(page.getByText('ORD-1001', { exact: false }).first()).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:151:78

    Error Context: test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Attention Queue' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Attention Queue' })

    149 | await page.goto('/merchant');
    150 |

    > 151 | await expect(page.getByRole('heading', { name: 'Attention Queue' })).toBeVisible({

          |                                                                              ^

    152 | timeout: 15000,
    153 | });
    154 | await expect(page.getByText('ORD-1001', { exact: false }).first()).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:151:78

    Error Context: test-results/dashboard-attention-queue--a2c69-tus-and-navigates-to-orders-firefox-retry2/error-context.md

13. [firefox] › e2e/dashboard-attention-queue.spec.ts:173:9 › Dashboard attention queue workflow › refresh updates attention queue payload

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('Status: pending').first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByText('Status: pending').first()

    187 | await page.goto('/merchant');
    188 |

    > 189 | await expect(page.getByText('Status: pending').first()).toBeVisible({ timeout: 15000 });

          |                                                                 ^

    190 | await page.getByRole('button', { name: 'Refresh' }).first().click();
    191 | await expect(page.getByText('Status: ready').first()).toBeVisible({ timeout: 15000 });
    192 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:189:65

    Error Context: test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('Status: pending').first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByText('Status: pending').first()

    187 | await page.goto('/merchant');
    188 |

    > 189 | await expect(page.getByText('Status: pending').first()).toBeVisible({ timeout: 15000 });

          |                                                                 ^

    190 | await page.getByRole('button', { name: 'Refresh' }).first().click();
    191 | await expect(page.getByText('Status: ready').first()).toBeVisible({ timeout: 15000 });
    192 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:189:65

    Error Context: test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByText('Status: pending').first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByText('Status: pending').first()

    187 | await page.goto('/merchant');
    188 |

    > 189 | await expect(page.getByText('Status: pending').first()).toBeVisible({ timeout: 15000 });

          |                                                                 ^

    190 | await page.getByRole('button', { name: 'Refresh' }).first().click();
    191 | await expect(page.getByText('Status: ready').first()).toBeVisible({ timeout: 15000 });
    192 | });
    at /home/runner/work/Gebetaa/Gebetaa/e2e/dashboard-attention-queue.spec.ts:189:65

    Error Context: test-results/dashboard-attention-queue--1b2c0-tes-attention-queue-payload-firefox-retry2/error-context.md

14. [firefox] › e2e/guests-directory-profile.spec.ts:74:9 › Guests directory and profile flows › loads guest directory, opens profile drawer, and saves updates

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    173 | await page.goto('/merchant/guests');
    174 |

    > 175 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    176 | await expect(
    177 | page.getByRole('button', { name: /Open guest profile for Selam Guest/i })
    178 | ).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/guests-directory-profile.spec.ts:175:82

    Error Context: test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    173 | await page.goto('/merchant/guests');
    174 |

    > 175 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    176 | await expect(
    177 | page.getByRole('button', { name: /Open guest profile for Selam Guest/i })
    178 | ).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/guests-directory-profile.spec.ts:175:82

    Error Context: test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    173 | await page.goto('/merchant/guests');
    174 |

    > 175 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    176 | await expect(
    177 | page.getByRole('button', { name: /Open guest profile for Selam Guest/i })
    178 | ).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/guests-directory-profile.spec.ts:175:82

    Error Context: test-results/guests-directory-profile-G-920bd-le-drawer-and-saves-updates-firefox-retry2/error-context.md

15. [firefox] › e2e/merchant-dashboard-audit.spec.ts:21:9 › Merchant Dashboard full-session audit › navigates all core merchant tabs and validates page intent

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /^Hello,/i })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /^Hello,/i })

    at page-objects/merchant-dashboard.po.ts:33

    31 | async gotoDashboard() {
    32 | await this.safeGoto('/merchant');

    > 33 | await expect(this.page.getByRole('heading', { name: /^Hello,/i })).toBeVisible({

         |                                                                            ^

    34 | timeout: 15_000,
    35 | });
    36 | }
    at MerchantShellPage.gotoDashboard (/home/runner/work/Gebetaa/Gebetaa/e2e/page-objects/merchant-dashboard.po.ts:33:76)
    at /home/runner/work/Gebetaa/Gebetaa/e2e/merchant-dashboard-audit.spec.ts:23:9

    Error Context: test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /^Hello,/i })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /^Hello,/i })

    at page-objects/merchant-dashboard.po.ts:33

    31 | async gotoDashboard() {
    32 | await this.safeGoto('/merchant');

    > 33 | await expect(this.page.getByRole('heading', { name: /^Hello,/i })).toBeVisible({

         |                                                                            ^

    34 | timeout: 15_000,
    35 | });
    36 | }
    at MerchantShellPage.gotoDashboard (/home/runner/work/Gebetaa/Gebetaa/e2e/page-objects/merchant-dashboard.po.ts:33:76)
    at /home/runner/work/Gebetaa/Gebetaa/e2e/merchant-dashboard-audit.spec.ts:23:9

    Error Context: test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /^Hello,/i })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /^Hello,/i })

    at page-objects/merchant-dashboard.po.ts:33

    31 | async gotoDashboard() {
    32 | await this.safeGoto('/merchant');

    > 33 | await expect(this.page.getByRole('heading', { name: /^Hello,/i })).toBeVisible({

         |                                                                            ^

    34 | timeout: 15_000,
    35 | });
    36 | }
    at MerchantShellPage.gotoDashboard (/home/runner/work/Gebetaa/Gebetaa/e2e/page-objects/merchant-dashboard.po.ts:33:76)
    at /home/runner/work/Gebetaa/Gebetaa/e2e/merchant-dashboard-audit.spec.ts:23:9

    Error Context: test-results/merchant-dashboard-audit-M-ec616-s-and-validates-page-intent-firefox-retry2/error-context.md

16. [firefox] › e2e/p1-localization-accessibility.spec.ts:77:9 › P1 localization and accessibility regression › guests screen keeps locale formatting and labeled controls

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    140 | await page.goto('/merchant/guests');
    141 |

    > 142 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    143 | await expect(page.getByLabel('Search guests by name')).toBeVisible();
    144 | await expect(page.getByText('English')).toBeVisible();
    145 | await expect(page.getByText(/ETB/).first()).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:142:82

    Error Context: test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    140 | await page.goto('/merchant/guests');
    141 |

    > 142 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    143 | await expect(page.getByLabel('Search guests by name')).toBeVisible();
    144 | await expect(page.getByText('English')).toBeVisible();
    145 | await expect(page.getByText(/ETB/).first()).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:142:82

    Error Context: test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Guests', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Guests', exact: true })

    140 | await page.goto('/merchant/guests');
    141 |

    > 142 | await expect(page.getByRole('heading', { name: 'Guests', exact: true })).toBeVisible();

          |                                                                                  ^

    143 | await expect(page.getByLabel('Search guests by name')).toBeVisible();
    144 | await expect(page.getByText('English')).toBeVisible();
    145 | await expect(page.getByText(/ETB/).first()).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:142:82

    Error Context: test-results/p1-localization-accessibil-8b4c7-atting-and-labeled-controls-firefox-retry2/error-context.md

17. [firefox] › e2e/p1-localization-accessibility.spec.ts:155:9 › P1 localization and accessibility regression › channels screen keeps labeled controls and table semantics

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    230 | await page.goto('/merchant/channels');
    231 |

    > 232 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    233 | await expect(page.getByLabel('Connect Provider')).toBeVisible();
    234 | await expect(page.getByLabel('Provider display name')).toBeVisible();
    235 | await expect(page.getByLabel('External Orders')).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:232:84

    Error Context: test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    230 | await page.goto('/merchant/channels');
    231 |

    > 232 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    233 | await expect(page.getByLabel('Connect Provider')).toBeVisible();
    234 | await expect(page.getByLabel('Provider display name')).toBeVisible();
    235 | await expect(page.getByLabel('External Orders')).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:232:84

    Error Context: test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Channels', exact: true })
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByRole('heading', { name: 'Channels', exact: true })

    230 | await page.goto('/merchant/channels');
    231 |

    > 232 | await expect(page.getByRole('heading', { name: 'Channels', exact: true })).toBeVisible();

          |                                                                                    ^

    233 | await expect(page.getByLabel('Connect Provider')).toBeVisible();
    234 | await expect(page.getByLabel('Provider display name')).toBeVisible();
    235 | await expect(page.getByLabel('External Orders')).toBeVisible();
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p1-localization-accessibility.spec.ts:232:84

    Error Context: test-results/p1-localization-accessibil-d29b7-ontrols-and-table-semantics-firefox-retry2/error-context.md

18. [firefox] › e2e/p2-finance-reconciliation.spec.ts:12:9 › P2 finance reconciliation › renders payout reconciliation and exports reconciliation dataset

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /Finance/i }).first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /Finance/i }).first()

    121 |
    122 | // h1 reads "Finance & Reconciliation" via i18n copy

    > 123 | await expect(page.getByRole('heading', { name: /Finance/i }).first()).toBeVisible({

          |                                                                               ^

    124 | timeout: 15000,
    125 | });
    126 | await expect(page.getByRole('heading', { name: 'Payout Reconciliation' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-finance-reconciliation.spec.ts:123:79

    Error Context: test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /Finance/i }).first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /Finance/i }).first()

    121 |
    122 | // h1 reads "Finance & Reconciliation" via i18n copy

    > 123 | await expect(page.getByRole('heading', { name: /Finance/i }).first()).toBeVisible({

          |                                                                               ^

    124 | timeout: 15000,
    125 | });
    126 | await expect(page.getByRole('heading', { name: 'Payout Reconciliation' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-finance-reconciliation.spec.ts:123:79

    Error Context: test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: /Finance/i }).first()
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: /Finance/i }).first()

    121 |
    122 | // h1 reads "Finance & Reconciliation" via i18n copy

    > 123 | await expect(page.getByRole('heading', { name: /Finance/i }).first()).toBeVisible({

          |                                                                               ^

    124 | timeout: 15000,
    125 | });
    126 | await expect(page.getByRole('heading', { name: 'Payout Reconciliation' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-finance-reconciliation.spec.ts:123:79

    Error Context: test-results/p2-finance-reconciliation--d6eee-orts-reconciliation-dataset-firefox-retry2/error-context.md

19. [firefox] › e2e/p2-loyalty-gift-card.spec.ts:12:9 › P2 loyalty and gift-card redemption › renders loyalty programs, issues a gift card, and redeems it

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Loyalty Program Builder' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Loyalty Program Builder' })

    148 | await page.goto('/merchant/guests', { waitUntil: 'domcontentloaded' });
    149 |

    > 150 | await expect(page.getByRole('heading', { name: 'Loyalty Program Builder' })).toBeVisible({

          |                                                                                      ^

    151 | timeout: 15000,
    152 | });
    153 | await expect(page.getByRole('heading', { name: 'Gift Card Manager' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-loyalty-gift-card.spec.ts:150:86

    Error Context: test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-firefox/error-context.md

    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Loyalty Program Builder' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Loyalty Program Builder' })

    148 | await page.goto('/merchant/guests', { waitUntil: 'domcontentloaded' });
    149 |

    > 150 | await expect(page.getByRole('heading', { name: 'Loyalty Program Builder' })).toBeVisible({

          |                                                                                      ^

    151 | timeout: 15000,
    152 | });
    153 | await expect(page.getByRole('heading', { name: 'Gift Card Manager' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-loyalty-gift-card.spec.ts:150:86

    Error Context: test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-firefox-retry1/error-context.md

    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-firefox-retry1/trace.zip
    Usage:

        pnpm exec playwright show-trace test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-firefox-retry1/trace.zip

    ────────────────────────────────────────────────────────────────────────────────────────────────

    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────

    Error: expect(locator).toBeVisible() failed

    Locator: getByRole('heading', { name: 'Loyalty Program Builder' })
    Expected: visible
    Timeout: 15000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 15000ms
    - waiting for getByRole('heading', { name: 'Loyalty Program Builder' })

    148 | await page.goto('/merchant/guests', { waitUntil: 'domcontentloaded' });
    149 |

    > 150 | await expect(page.getByRole('heading', { name: 'Loyalty Program Builder' })).toBeVisible({

          |                                                                                      ^

    151 | timeout: 15000,
    152 | });
    153 | await expect(page.getByRole('heading', { name: 'Gift Card Manager' })).toBeVisible({
    at /home/runner/work/Gebetaa/Gebetaa/e2e/p2-loyalty-gift-card.spec.ts:150:86

    Error Context: test-results/p2-loyalty-gift-card-P2-lo-9f551--a-gift-card-and-redeems-it-firefox-retry2/error-context.md

19 failed
[chromium] › e2e/accessibility.spec.ts:203:13 › Accessibility Tests › Keyboard Navigation › should be able to navigate with keyboard
[chromium] › e2e/channels-health-delivery-ack.spec.ts:74:9 › Channels health and delivery acknowledge flow › renders channel health and acknowledges an external order
[chromium] › e2e/dashboard-attention-queue.spec.ts:125:9 › Dashboard attention queue workflow › renders queue, advances order status, and navigates to orders
[chromium] › e2e/dashboard-attention-queue.spec.ts:173:9 › Dashboard attention queue workflow › refresh updates attention queue payload
[chromium] › e2e/guests-directory-profile.spec.ts:74:9 › Guests directory and profile flows › loads guest directory, opens profile drawer, and saves updates
[chromium] › e2e/merchant-dashboard-audit.spec.ts:21:9 › Merchant Dashboard full-session audit › navigates all core merchant tabs and validates page intent
[chromium] › e2e/p1-localization-accessibility.spec.ts:77:9 › P1 localization and accessibility regression › guests screen keeps locale formatting and labeled controls
[chromium] › e2e/p1-localization-accessibility.spec.ts:155:9 › P1 localization and accessibility regression › channels screen keeps labeled controls and table semantics
[chromium] › e2e/p2-finance-reconciliation.spec.ts:12:9 › P2 finance reconciliation › renders payout reconciliation and exports reconciliation dataset
[chromium] › e2e/p2-loyalty-gift-card.spec.ts:12:9 › P2 loyalty and gift-card redemption › renders loyalty programs, issues a gift card, and redeems it
[firefox] › e2e/channels-health-delivery-ack.spec.ts:74:9 › Channels health and delivery acknowledge flow › renders channel health and acknowledges an external order
[firefox] › e2e/dashboard-attention-queue.spec.ts:125:9 › Dashboard attention queue workflow › renders queue, advances order status, and navigates to orders
[firefox] › e2e/dashboard-attention-queue.spec.ts:173:9 › Dashboard attention queue workflow › refresh updates attention queue payload
[firefox] › e2e/guests-directory-profile.spec.ts:74:9 › Guests directory and profile flows › loads guest directory, opens profile drawer, and saves updates
[firefox] › e2e/merchant-dashboard-audit.spec.ts:21:9 › Merchant Dashboard full-session audit › navigates all core merchant tabs and validates page intent
[firefox] › e2e/p1-localization-accessibility.spec.ts:77:9 › P1 localization and accessibility regression › guests screen keeps locale formatting and labeled controls
[firefox] › e2e/p1-localization-accessibility.spec.ts:155:9 › P1 localization and accessibility regression › channels screen keeps labeled controls and table semantics
[firefox] › e2e/p2-finance-reconciliation.spec.ts:12:9 › P2 finance reconciliation › renders payout reconciliation and exports reconciliation dataset
[firefox] › e2e/p2-loyalty-gift-card.spec.ts:12:9 › P2 loyalty and gift-card redemption › renders loyalty programs, issues a gift card, and redeems it
32 skipped
8 did not run
25 passed (13.1m)
 ELIFECYCLE  Command failed with exit code 1.
Error: Process completed with exit code 1.
