      156 |             // Find buttons on the page
      157 |             const buttons = page.locator('button');
        at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:154:24

    Error Context: test-results\visual-regression-Visual-R-254e8-tton-states-visual-snapshot-firefox\error-context.md

39. [firefox] › e2e\visual-regression.spec.ts:172:13 › Visual Regression Tests › UI Components › card components visual snapshot

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    172 | test('card components visual snapshot', async ({ page }) => {
    173 | await page.goto('/');

    > 174 | await page.waitForLoadState('networkidle');

          |                        ^

    175 | await page.waitForTimeout(500);
    176 |
    177 | // Look for card components
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:174:24

    Error Context: test-results\visual-regression-Visual-R-838fb--components-visual-snapshot-firefox\error-context.md

40. [firefox] › e2e\visual-regression.spec.ts:189:13 › Visual Regression Tests › Responsive Design › mobile landing page visual snapshot

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    191 | await page.setViewportSize({ width: 375, height: 812 });
    192 | await page.goto('/');

    > 193 | await page.waitForLoadState('networkidle');

          |                        ^

    194 | await page.waitForTimeout(500);
    195 |
    196 | await expect(page).toHaveScreenshot('mobile-landing.png', {
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:193:24

    Error Context: test-results\visual-regression-Visual-R-4ca8e-anding-page-visual-snapshot-firefox\error-context.md

41. [firefox] › e2e\visual-regression.spec.ts:203:13 › Visual Regression Tests › Responsive Design › tablet landing page visual snapshot

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    205 | await page.setViewportSize({ width: 768, height: 1024 });
    206 | await page.goto('/');

    > 207 | await page.waitForLoadState('networkidle');

          |                        ^

    208 | await page.waitForTimeout(500);
    209 |
    210 | await expect(page).toHaveScreenshot('tablet-landing.png', {
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:207:24

    Error Context: test-results\visual-regression-Visual-R-33b15-anding-page-visual-snapshot-firefox\error-context.md

42. [firefox] › e2e\visual-regression.spec.ts:217:13 › Visual Regression Tests › Responsive Design › desktop landing page visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    Timeout: 5000ms
    Failed to take two consecutive stable screenshots.

    Snapshot: desktop-landing.png

    Call log:
    - Expect "toHaveScreenshot(desktop-landing.png)" with timeout 5000ms
        - generating new stable screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 27893 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 250ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 27927 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 500ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 32370 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 1000ms before taking screenshot
    - Timeout 5000ms exceeded.

    222 | await page.waitForTimeout(500);
    223 |

    > 224 | await expect(page).toHaveScreenshot('desktop-landing.png', {

          |                                ^

    225 | fullPage: true,
    226 | maxDiffPixels: 1500,
    227 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:224:32

    attachment #1: desktop-landing (image/png)
    Received: test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-firefox\desktop-landing-actual.png
    Previous: test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-firefox\desktop-landing-previous.png
    Diff: test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-firefox\desktop-landing-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-firefox\error-context.md

43. [firefox] › e2e\visual-regression.spec.ts:233:13 › Visual Regression Tests › Dark Mode › dark mode landing page visual snapshot

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    235 | await page.emulateMedia({ colorScheme: 'dark' });
    236 | await page.goto('/');

    > 237 | await page.waitForLoadState('networkidle');

          |                        ^

    238 | await page.waitForTimeout(500);
    239 |
    240 | await expect(page).toHaveScreenshot('dark-mode-landing.png', {
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:237:24

    Error Context: test-results\visual-regression-Visual-R-541aa-anding-page-visual-snapshot-firefox\error-context.md

44. [Mobile Chrome] › e2e\accessibility.spec.ts:13:13 › Accessibility Tests › Guest Pages › landing page should have no critical accessibility violations

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    15 |
    16 | // Wait for page to be fully loaded

    > 17 | await page.waitForLoadState('networkidle');

         |                        ^

    18 |
    19 | const accessibilityScanResults = await new AxeBuilder({ page })
    20 | .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    at C:\Users\user\Desktop\Gebetaa\e2e\accessibility.spec.ts:17:24

    Error Context: test-results\accessibility-Accessibilit-6c1d5-al-accessibility-violations-Mobile-Chrome\error-context.md

45. [Mobile Chrome] › e2e\accessibility.spec.ts:125:13 › Accessibility Tests › Interactive Components › form inputs should have labels

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    125 | test('form inputs should have labels', async ({ page }) => {
    126 | await page.goto('/');

    > 127 | await page.waitForLoadState('networkidle');

          |                        ^

    128 |
    129 | const inputs = await page
    130 | .locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"])')
    at C:\Users\user\Desktop\Gebetaa\e2e\accessibility.spec.ts:127:24

    Error Context: test-results\accessibility-Accessibilit-f175b-m-inputs-should-have-labels-Mobile-Chrome\error-context.md

46. [Mobile Chrome] › e2e\accessibility.spec.ts:154:13 › Accessibility Tests › Color Contrast › text should meet minimum color contrast requirements

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    154 | test('text should meet minimum color contrast requirements', async ({ page }) => {
    155 | await page.goto('/');

    > 156 | await page.waitForLoadState('networkidle');

          |                        ^

    157 |
    158 | const accessibilityScanResults = await new AxeBuilder({ page })
    159 | .withRules(['color-contrast'])
    at C:\Users\user\Desktop\Gebetaa\e2e\accessibility.spec.ts:156:24

    Error Context: test-results\accessibility-Accessibilit-d309d-color-contrast-requirements-Mobile-Chrome\error-context.md

47. [Mobile Chrome] › e2e\accessibility.spec.ts:177:13 › Accessibility Tests › Keyboard Navigation › focus should be visible on interactive elements

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    177 | test('focus should be visible on interactive elements', async ({ page }) => {
    178 | await page.goto('/');

    > 179 | await page.waitForLoadState('networkidle');

          |                        ^

    180 |
    181 | // Tab through focusable elements
    182 | const focusableElements = await page
    at C:\Users\user\Desktop\Gebetaa\e2e\accessibility.spec.ts:179:24

    Error Context: test-results\accessibility-Accessibilit-1ac5c-ble-on-interactive-elements-Mobile-Chrome\error-context.md

48. [Mobile Chrome] › e2e\mobile-merchant-tabs.spec.ts:74:9 › Mobile merchant tab regression › renders mobile nav and supports tab traversal without layout overflow

    Error: expect(locator).toBeVisible() failed

    Locator: getByTestId('mobile-bottom-nav')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByTestId('mobile-bottom-nav')

    76 | }) => {
    77 | await page.goto('/merchant');

    > 78 | await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();

         |                                                             ^

    79 |
    80 | const tabExpectations: Array<{ href: string; heading: RegExp }> = [
    81 | { href: '/merchant', heading: /Hello, Saba Grill/i },
    at C:\Users\user\Desktop\Gebetaa\e2e\mobile-merchant-tabs.spec.ts:78:61

    Error Context: test-results\mobile-merchant-tabs-Mobil-c96f6-sal-without-layout-overflow-Mobile-Chrome\error-context.md

49. [Mobile Chrome] › e2e\visual-regression.spec.ts:35:13 › Visual Regression Tests › Guest Pages › guest menu page visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    2670 pixels (ratio 0.01 of all image pixels) are different.

    Snapshot: guest-menu-full.png

    Call log:
    - Expect "toHaveScreenshot(guest-menu-full.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 2670 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - captured a stable screenshot
    - 2670 pixels (ratio 0.01 of all image pixels) are different.

    50 | } else {
    51 | // Fallback to full page if no specific container

    > 52 | await expect(page).toHaveScreenshot('guest-menu-full.png', {

         |                                    ^

    53 | fullPage: true,
    54 | maxDiffPixels: 2000,
    55 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:52:36

    attachment #1: guest-menu-full (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\guest-menu-full-Mobile-Chrome-win32.png
    Received: test-results\visual-regression-Visual-R-7a229-t-menu-page-visual-snapshot-Mobile-Chrome\guest-menu-full-actual.png
    Diff: test-results\visual-regression-Visual-R-7a229-t-menu-page-visual-snapshot-Mobile-Chrome\guest-menu-full-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-7a229-t-menu-page-visual-snapshot-Mobile-Chrome\error-context.md

50. [Mobile Chrome] › e2e\visual-regression.spec.ts:60:13 › Visual Regression Tests › Guest Pages › cart drawer visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    2670 pixels (ratio 0.01 of all image pixels) are different.

    Snapshot: cart-interaction.png

    Call log:
    - Expect "toHaveScreenshot(cart-interaction.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 2670 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - captured a stable screenshot
    - 2670 pixels (ratio 0.01 of all image pixels) are different.

    78 |
    79 | // Take screenshot of the page state

    > 80 | await expect(page).toHaveScreenshot('cart-interaction.png', {

         |                                ^

    81 | maxDiffPixels: 1500,
    82 | animations: 'disabled',
    83 | });
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:80:32

    attachment #1: cart-interaction (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\cart-interaction-Mobile-Chrome-win32.png
    Received: test-results\visual-regression-Visual-R-daf6c-cart-drawer-visual-snapshot-Mobile-Chrome\cart-interaction-actual.png
    Diff: test-results\visual-regression-Visual-R-daf6c-cart-drawer-visual-snapshot-Mobile-Chrome\cart-interaction-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-daf6c-cart-drawer-visual-snapshot-Mobile-Chrome\error-context.md

51. [Mobile Chrome] › e2e\visual-regression.spec.ts:172:13 › Visual Regression Tests › UI Components › card components visual snapshot

    Error: expect(locator).toHaveScreenshot(expected) failed

    Locator: locator('[class*="rounded"]').first()
    Expected an image 120px by 40px, received 345px by 72px. 9648 pixels (ratio 0.39 of all image pixels) are different.

    Snapshot: card-component.png

    Call log:
    - Expect "toHaveScreenshot(card-component.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - waiting for locator('[class*="rounded"]').first()
        - locator resolved to <nav class="flex w-full max-w-5xl items-center justify-between rounded-full px-6 py-4 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] bg-transparent">…</nav>
    - taking element screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - attempting scroll into view action
        - waiting for element to be stable
    - Expected an image 120px by 40px, received 345px by 72px. 12358 pixels (ratio 0.50 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - waiting for locator('[class*="rounded"]').first()
        - locator resolved to <nav class="flex w-full max-w-5xl items-center justify-between rounded-full px-6 py-4 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] bg-transparent">…</nav>
    - taking element screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - attempting scroll into view action
        - waiting for element to be stable
    - captured a stable screenshot
    - Expected an image 120px by 40px, received 345px by 72px. 9648 pixels (ratio 0.39 of all image pixels) are different.

    178 | const cards = page.locator('[class*="rounded"]').first();
    179 | if (await cards.isVisible()) {

    > 180 | await expect(cards).toHaveScreenshot('card-component.png', {

          |                                     ^

    181 | maxDiffPixels: 500,
    182 | animations: 'disabled',
    183 | });
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:180:37

    attachment #1: card-component (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\card-component-Mobile-Chrome-win32.png
    Received: test-results\visual-regression-Visual-R-838fb--components-visual-snapshot-Mobile-Chrome\card-component-actual.png
    Diff: test-results\visual-regression-Visual-R-838fb--components-visual-snapshot-Mobile-Chrome\card-component-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-838fb--components-visual-snapshot-Mobile-Chrome\error-context.md

52. [Mobile Chrome] › e2e\visual-regression.spec.ts:20:13 › Visual Regression Tests › Guest Pages › landing page visual snapshot

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    20 | test('landing page visual snapshot', async ({ page }) => {
    21 | await page.goto('/');

    > 22 | await page.waitForLoadState('networkidle');

         |                        ^

    23 |
    24 | // Wait for any animations to settle
    25 | await page.waitForTimeout(500);
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:22:24

    Error Context: test-results\visual-regression-Visual-R-d21ec-anding-page-visual-snapshot-Mobile-Chrome\error-context.md

53. [Mobile Chrome] › e2e\visual-regression.spec.ts:151:13 › Visual Regression Tests › UI Components › button states visual snapshot

    Error: expect(locator).toHaveScreenshot(expected) failed

    Locator: locator('button').first()
    Expected an image 32px by 32px, received 186px by 45px. 6765 pixels (ratio 0.81 of all image pixels) are different.

    Snapshot: button-primary.png

    Call log:
    - Expect "toHaveScreenshot(button-primary.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - waiting for locator('button').first()
        - locator resolved to <button class="font-geist rounded-[30px] bg-gradient-to-b from-[#2a2a2a] to-[#121212] px-6 py-3 text-sm font-medium whitespace-nowrap text-white shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] transition-transform hover:scale-[1.02]">Create Free Account</button>
    - taking element screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - attempting scroll into view action
        - waiting for element to be stable
    - Expected an image 32px by 32px, received 186px by 45px. 6765 pixels (ratio 0.81 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - waiting for locator('button').first()
        - locator resolved to <button class="font-geist rounded-[30px] bg-gradient-to-b from-[#2a2a2a] to-[#121212] px-6 py-3 text-sm font-medium whitespace-nowrap text-white shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] transition-transform hover:scale-[1.02]">Create Free Account</button>
    - taking element screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - attempting scroll into view action
        - waiting for element to be stable
    - captured a stable screenshot
    - Expected an image 32px by 32px, received 186px by 45px. 6765 pixels (ratio 0.81 of all image pixels) are different.

    162 | const firstButton = buttons.first();
    163 | if (await firstButton.isVisible()) {

    > 164 | await expect(firstButton).toHaveScreenshot('button-primary.png', {

          |                                               ^

    165 | maxDiffPixels: 200,
    166 | animations: 'disabled',
    167 | });
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:164:47

    attachment #1: button-primary (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\button-primary-Mobile-Chrome-win32.png
    Received: test-results\visual-regression-Visual-R-254e8-tton-states-visual-snapshot-Mobile-Chrome\button-primary-actual.png
    Diff: test-results\visual-regression-Visual-R-254e8-tton-states-visual-snapshot-Mobile-Chrome\button-primary-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-254e8-tton-states-visual-snapshot-Mobile-Chrome\error-context.md

54. [Mobile Chrome] › e2e\visual-regression.spec.ts:189:13 › Visual Regression Tests › Responsive Design › mobile landing page visual snapshot

    Test timeout of 45000ms exceeded.

    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.

    191 | await page.setViewportSize({ width: 375, height: 812 });
    192 | await page.goto('/');

    > 193 | await page.waitForLoadState('networkidle');

          |                        ^

    194 | await page.waitForTimeout(500);
    195 |
    196 | await expect(page).toHaveScreenshot('mobile-landing.png', {
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:193:24

    Error Context: test-results\visual-regression-Visual-R-4ca8e-anding-page-visual-snapshot-Mobile-Chrome\error-context.md

55. [Mobile Chrome] › e2e\visual-regression.spec.ts:203:13 › Visual Regression Tests › Responsive Design › tablet landing page visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    Expected an image 768px by 1874px, received 768px by 3919px. 1293625 pixels (ratio 0.43 of all image pixels) are different.

    Snapshot: tablet-landing.png

    Call log:
    - Expect "toHaveScreenshot(tablet-landing.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - Expected an image 768px by 1874px, received 768px by 3919px. 1215582 pixels (ratio 0.41 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 37779 pixels (ratio 0.02 of all image pixels) are different.
    - waiting 250ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - captured a stable screenshot
    - Expected an image 768px by 1874px, received 768px by 3919px. 1293625 pixels (ratio 0.43 of all image pixels) are different.

    208 | await page.waitForTimeout(500);
    209 |

    > 210 | await expect(page).toHaveScreenshot('tablet-landing.png', {

          |                                ^

    211 | fullPage: true,
    212 | maxDiffPixels: 1500,
    213 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:210:32

    attachment #1: tablet-landing (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\tablet-landing-Mobile-Chrome-win32.png
    Received: test-results\visual-regression-Visual-R-33b15-anding-page-visual-snapshot-Mobile-Chrome\tablet-landing-actual.png
    Diff: test-results\visual-regression-Visual-R-33b15-anding-page-visual-snapshot-Mobile-Chrome\tablet-landing-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-33b15-anding-page-visual-snapshot-Mobile-Chrome\error-context.md

…t minimum color contrast requirements
Color contrast violations found: [
'Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds'
] 56) [Mobile Chrome] › e2e\visual-regression.spec.ts:217:13 › Visual Regression Tests › Responsive Design › desktop landing page visual snapshot

    Test timeout of 45000ms exceeded.

    Error: expect(page).toHaveScreenshot(expected) failed

      Test timeout of 45000ms exceeded.

      Snapshot: desktop-landing.png

    Call log:
      - Expect "toHaveScreenshot(desktop-landing.png)" with timeout 5000ms
        - verifying given screenshot expectation
      - taking page screenshot
        - disabled all CSS animations
      - waiting for fonts to load...
      - fonts loaded
      - Expected an image 1440px by 1678px, received 1440px by 2832px. 2298313 pixels (ratio 0.57 of all image pixels) are different.
      - waiting 100ms before taking screenshot
      - Test timeout of 45000ms exceeded.


      222 |             await page.waitForTimeout(500);
      223 |
    > 224 |             await expect(page).toHaveScreenshot('desktop-landing.png', {
          |                                ^
      225 |                 fullPage: true,
      226 |                 maxDiffPixels: 1500,
      227 |                 animations: 'disabled',
        at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:224:32

    attachment #1: desktop-landing (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\desktop-landing-Mobile-Chrome-win32.png
    Received: test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-Mobile-Chrome\desktop-landing-actual.png
    Diff:     test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-Mobile-Chrome\desktop-landing-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-Mobile-Chrome\error-context.md

57. [Mobile Chrome] › e2e\visual-regression.spec.ts:233:13 › Visual Regression Tests › Dark Mode › dark mode landing page visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    Timeout: 5000ms
    Failed to take two consecutive stable screenshots.

    Snapshot: dark-mode-landing.png

    Call log:
    - Expect "toHaveScreenshot(dark-mode-landing.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - Expected an image 393px by 2930px, received 393px by 3989px. 683856 pixels (ratio 0.44 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 12180 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 250ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 5855 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 500ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 5285 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 1000ms before taking screenshot
    - Timeout 5000ms exceeded.

    238 | await page.waitForTimeout(500);
    239 |

    > 240 | await expect(page).toHaveScreenshot('dark-mode-landing.png', {

          |                                ^

    241 | fullPage: true,
    242 | maxDiffPixels: 2000,
    243 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:240:32

    attachment #1: dark-mode-landing (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\dark-mode-landing-Mobile-Chrome-win32.png
    Received: test-results\visual-regression-Visual-R-541aa-anding-page-visual-snapshot-Mobile-Chrome\dark-mode-landing-actual.png
    Previous: test-results\visual-regression-Visual-R-541aa-anding-page-visual-snapshot-Mobile-Chrome\dark-mode-landing-previous.png
    Diff: test-results\visual-regression-Visual-R-541aa-anding-page-visual-snapshot-Mobile-Chrome\dark-mode-landing-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-541aa-anding-page-visual-snapshot-Mobile-Chrome\error-context.md

58. [Mobile Safari] › e2e\mobile-merchant-tabs.spec.ts:74:9 › Mobile merchant tab regression › renders mobile nav and supports tab traversal without layout overflow

    Error: expect(locator).toBeVisible() failed

    Locator: getByTestId('mobile-bottom-nav')
    Expected: visible
    Timeout: 5000ms
    Error: element(s) not found

    Call log:
    - Expect "toBeVisible" with timeout 5000ms
    - waiting for getByTestId('mobile-bottom-nav')

    76 | }) => {
    77 | await page.goto('/merchant');

    > 78 | await expect(page.getByTestId('mobile-bottom-nav')).toBeVisible();

         |                                                             ^

    79 |
    80 | const tabExpectations: Array<{ href: string; heading: RegExp }> = [
    81 | { href: '/merchant', heading: /Hello, Saba Grill/i },
    at C:\Users\user\Desktop\Gebetaa\e2e\mobile-merchant-tabs.spec.ts:78:61

    Error Context: test-results\mobile-merchant-tabs-Mobil-c96f6-sal-without-layout-overflow-Mobile-Safari\error-context.md

59. [Mobile Safari] › e2e\visual-regression.spec.ts:35:13 › Visual Regression Tests › Guest Pages › guest menu page visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    2701 pixels (ratio 0.02 of all image pixels) are different.

    Snapshot: guest-menu-full.png

    Call log:
    - Expect "toHaveScreenshot(guest-menu-full.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 2701 pixels (ratio 0.02 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - captured a stable screenshot
    - 2701 pixels (ratio 0.02 of all image pixels) are different.

    50 | } else {
    51 | // Fallback to full page if no specific container

    > 52 | await expect(page).toHaveScreenshot('guest-menu-full.png', {

         |                                    ^

    53 | fullPage: true,
    54 | maxDiffPixels: 2000,
    55 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:52:36

    attachment #1: guest-menu-full (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\guest-menu-full-Mobile-Safari-win32.png
    Received: test-results\visual-regression-Visual-R-7a229-t-menu-page-visual-snapshot-Mobile-Safari\guest-menu-full-actual.png
    Diff: test-results\visual-regression-Visual-R-7a229-t-menu-page-visual-snapshot-Mobile-Safari\guest-menu-full-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-7a229-t-menu-page-visual-snapshot-Mobile-Safari\error-context.md

60. [Mobile Safari] › e2e\visual-regression.spec.ts:20:13 › Visual Regression Tests › Guest Pages › landing page visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    Expected an image 390px by 2930px, received 390px by 4006px. 649543 pixels (ratio 0.42 of all image pixels) are different.

    Snapshot: landing-page.png

    Call log:
    - Expect "toHaveScreenshot(landing-page.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - Expected an image 390px by 2930px, received 390px by 4006px. 647294 pixels (ratio 0.42 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - 2785 pixels (ratio 0.01 of all image pixels) are different.
    - waiting 250ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - captured a stable screenshot
    - Expected an image 390px by 2930px, received 390px by 4006px. 649543 pixels (ratio 0.42 of all image pixels) are different.

    26 |
    27 | // Take full page screenshot

    > 28 | await expect(page).toHaveScreenshot('landing-page.png', {

         |                                ^

    29 | fullPage: true,
    30 | maxDiffPixels: 1000, // Allow small differences
    31 | animations: 'disabled', // Disable animations for consistent screenshots
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:28:32

    attachment #1: landing-page (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\landing-page-Mobile-Safari-win32.png
    Received: test-results\visual-regression-Visual-R-d21ec-anding-page-visual-snapshot-Mobile-Safari\landing-page-actual.png
    Diff: test-results\visual-regression-Visual-R-d21ec-anding-page-visual-snapshot-Mobile-Safari\landing-page-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-d21ec-anding-page-visual-snapshot-Mobile-Safari\error-context.md

61. [Mobile Safari] › e2e\visual-regression.spec.ts:151:13 › Visual Regression Tests › UI Components › button states visual snapshot

    Error: expect(locator).toHaveScreenshot(expected) failed

    Locator: locator('button').first()
    Expected an image 32px by 32px, received 186px by 44px. 6827 pixels (ratio 0.84 of all image pixels) are different.

    Snapshot: button-primary.png

    Call log:
    - Expect "toHaveScreenshot(button-primary.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - waiting for locator('button').first()
        - locator resolved to <button class="font-geist rounded-[30px] bg-gradient-to-b from-[#2a2a2a] to-[#121212] px-6 py-3 text-sm font-medium whitespace-nowrap text-white shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] transition-transform hover:scale-[1.02]">Create Free Account</button>
    - taking element screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - attempting scroll into view action
        - waiting for element to be stable
    - Expected an image 32px by 32px, received 186px by 44px. 6827 pixels (ratio 0.84 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - waiting for locator('button').first()
        - locator resolved to <button class="font-geist rounded-[30px] bg-gradient-to-b from-[#2a2a2a] to-[#121212] px-6 py-3 text-sm font-medium whitespace-nowrap text-white shadow-[inset_-4px_-6px_25px_0px_rgba(201,201,201,0.08),inset_4px_4px_10px_0px_rgba(29,29,29,0.24)] transition-transform hover:scale-[1.02]">Create Free Account</button>
    - taking element screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - attempting scroll into view action
        - waiting for element to be stable
    - captured a stable screenshot
    - Expected an image 32px by 32px, received 186px by 44px. 6827 pixels (ratio 0.84 of all image pixels) are different.

    162 | const firstButton = buttons.first();
    163 | if (await firstButton.isVisible()) {

    > 164 | await expect(firstButton).toHaveScreenshot('button-primary.png', {

          |                                               ^

    165 | maxDiffPixels: 200,
    166 | animations: 'disabled',
    167 | });
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:164:47

    attachment #1: button-primary (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\button-primary-Mobile-Safari-win32.png
    Received: test-results\visual-regression-Visual-R-254e8-tton-states-visual-snapshot-Mobile-Safari\button-primary-actual.png
    Diff: test-results\visual-regression-Visual-R-254e8-tton-states-visual-snapshot-Mobile-Safari\button-primary-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-254e8-tton-states-visual-snapshot-Mobile-Safari\error-context.md

62. [Mobile Safari] › e2e\visual-regression.spec.ts:172:13 › Visual Regression Tests › UI Components › card components visual snapshot

    Error: expect(locator).toHaveScreenshot(expected) failed

    Locator: locator('[class*="rounded"]').first()
    Expected an image 120px by 40px, received 336px by 92px. 12657 pixels (ratio 0.41 of all image pixels) are different.

    Snapshot: card-component.png

    Call log:
    - Expect "toHaveScreenshot(card-component.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - waiting for locator('[class*="rounded"]').first()
        - locator resolved to <nav class="flex w-full max-w-5xl items-center justify-between rounded-full px-6 py-4 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] bg-transparent">…</nav>
    - taking element screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - attempting scroll into view action
        - waiting for element to be stable
    - Expected an image 120px by 40px, received 336px by 92px. 12657 pixels (ratio 0.41 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - waiting for locator('[class*="rounded"]').first()
        - locator resolved to <nav class="flex w-full max-w-5xl items-center justify-between rounded-full px-6 py-4 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] bg-transparent">…</nav>
    - taking element screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - attempting scroll into view action
        - waiting for element to be stable
    - captured a stable screenshot
    - Expected an image 120px by 40px, received 336px by 92px. 12657 pixels (ratio 0.41 of all image pixels) are different.

    178 | const cards = page.locator('[class*="rounded"]').first();
    179 | if (await cards.isVisible()) {

    > 180 | await expect(cards).toHaveScreenshot('card-component.png', {

          |                                     ^

    181 | maxDiffPixels: 500,
    182 | animations: 'disabled',
    183 | });
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:180:37

    attachment #1: card-component (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\card-component-Mobile-Safari-win32.png
    Received: test-results\visual-regression-Visual-R-838fb--components-visual-snapshot-Mobile-Safari\card-component-actual.png
    Diff: test-results\visual-regression-Visual-R-838fb--components-visual-snapshot-Mobile-Safari\card-component-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-838fb--components-visual-snapshot-Mobile-Safari\error-context.md

63. [Mobile Safari] › e2e\visual-regression.spec.ts:189:13 › Visual Regression Tests › Responsive Design › mobile landing page visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    Expected an image 375px by 2954px, received 375px by 4037px. 623586 pixels (ratio 0.42 of all image pixels) are different.

    Snapshot: mobile-landing.png

    Call log:
    - Expect "toHaveScreenshot(mobile-landing.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - Expected an image 375px by 2954px, received 375px by 4037px. 623586 pixels (ratio 0.42 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - captured a stable screenshot
    - Expected an image 375px by 2954px, received 375px by 4037px. 623586 pixels (ratio 0.42 of all image pixels) are different.

    194 | await page.waitForTimeout(500);
    195 |

    > 196 | await expect(page).toHaveScreenshot('mobile-landing.png', {

          |                                ^

    197 | fullPage: true,
    198 | maxDiffPixels: 1500,
    199 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:196:32

    attachment #1: mobile-landing (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\mobile-landing-Mobile-Safari-win32.png
    Received: test-results\visual-regression-Visual-R-4ca8e-anding-page-visual-snapshot-Mobile-Safari\mobile-landing-actual.png
    Diff: test-results\visual-regression-Visual-R-4ca8e-anding-page-visual-snapshot-Mobile-Safari\mobile-landing-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-4ca8e-anding-page-visual-snapshot-Mobile-Safari\error-context.md

64. [Mobile Safari] › e2e\visual-regression.spec.ts:203:13 › Visual Regression Tests › Responsive Design › tablet landing page visual snapshot

    Error: A snapshot doesn't exist at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts-snapshots\tablet-landing-Mobile-Safari-win32.png, writing actual.

    208 | await page.waitForTimeout(500);
    209 |

    > 210 | await expect(page).toHaveScreenshot('tablet-landing.png', {

          |             ^

    211 | fullPage: true,
    212 | maxDiffPixels: 1500,
    213 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:210:13

    attachment #1: tablet-landing (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\tablet-landing-Mobile-Safari-win32.png
    Received: test-results\visual-regression-Visual-R-33b15-anding-page-visual-snapshot-Mobile-Safari\tablet-landing-actual.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-33b15-anding-page-visual-snapshot-Mobile-Safari\error-context.md

65. [Mobile Safari] › e2e\visual-regression.spec.ts:233:13 › Visual Regression Tests › Dark Mode › dark mode landing page visual snapshot

    Error: expect(page).toHaveScreenshot(expected) failed

    Expected an image 390px by 2930px, received 390px by 4006px. 647294 pixels (ratio 0.42 of all image pixels) are different.

    Snapshot: dark-mode-landing.png

    Call log:
    - Expect "toHaveScreenshot(dark-mode-landing.png)" with timeout 5000ms
        - verifying given screenshot expectation
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - Expected an image 390px by 2930px, received 390px by 4006px. 647294 pixels (ratio 0.42 of all image pixels) are different.
    - waiting 100ms before taking screenshot
    - taking page screenshot
        - disabled all CSS animations
    - waiting for fonts to load...
    - fonts loaded
    - captured a stable screenshot
    - Expected an image 390px by 2930px, received 390px by 4006px. 647294 pixels (ratio 0.42 of all image pixels) are different.

    238 | await page.waitForTimeout(500);
    239 |

    > 240 | await expect(page).toHaveScreenshot('dark-mode-landing.png', {

          |                                ^

    241 | fullPage: true,
    242 | maxDiffPixels: 2000,
    243 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:240:32

    attachment #1: dark-mode-landing (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\dark-mode-landing-Mobile-Safari-win32.png
    Received: test-results\visual-regression-Visual-R-541aa-anding-page-visual-snapshot-Mobile-Safari\dark-mode-landing-actual.png
    Diff: test-results\visual-regression-Visual-R-541aa-anding-page-visual-snapshot-Mobile-Safari\dark-mode-landing-diff.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-541aa-anding-page-visual-snapshot-Mobile-Safari\error-context.md

66. [Mobile Safari] › e2e\visual-regression.spec.ts:217:13 › Visual Regression Tests › Responsive Design › desktop landing page visual snapshot

    Error: A snapshot doesn't exist at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts-snapshots\desktop-landing-Mobile-Safari-win32.png, writing actual.

    222 | await page.waitForTimeout(500);
    223 |

    > 224 | await expect(page).toHaveScreenshot('desktop-landing.png', {

          |             ^

    225 | fullPage: true,
    226 | maxDiffPixels: 1500,
    227 | animations: 'disabled',
    at C:\Users\user\Desktop\Gebetaa\e2e\visual-regression.spec.ts:224:13

    attachment #1: desktop-landing (image/png)
    Expected: e2e\visual-regression.spec.ts-snapshots\desktop-landing-Mobile-Safari-win32.png
    Received: test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-Mobile-Safari\desktop-landing-actual.png
    ──────────────────────────────────

    Error Context: test-results\visual-regression-Visual-R-dada8-anding-page-visual-snapshot-Mobile-Safari\error-context.md

66 failed
[chromium] › e2e\accessibility.spec.ts:13:13 › Accessibility Tests › Guest Pages › landing page should have no critical accessibility violations
[chromium] › e2e\accessibility.spec.ts:88:13 › Accessibility Tests › Interactive Components › buttons should have accessible names
[chromium] › e2e\accessibility.spec.ts:125:13 › Accessibility Tests › Interactive Components › form inputs should have labels
[chromium] › e2e\channels-health-delivery-ack.spec.ts:74:9 › Channels health and delivery acknowledge flow › renders channel health and acknowledges an external order  
 [chromium] › e2e\dashboard-attention-queue.spec.ts:125:9 › Dashboard attention queue workflow › renders queue, advances order status, and navigates to orders
[chromium] › e2e\dashboard-attention-queue.spec.ts:173:9 › Dashboard attention queue workflow › refresh updates attention queue payload
[chromium] › e2e\guests-directory-profile.spec.ts:74:9 › Guests directory and profile flows › loads guest directory, opens profile drawer, and saves updates
[chromium] › e2e\merchant-dashboard-audit.spec.ts:21:9 › Merchant Dashboard full-session audit › navigates all core merchant tabs and validates page intent
[chromium] › e2e\p1-localization-accessibility.spec.ts:77:9 › P1 localization and accessibility regression › guests screen keeps locale formatting and labeled controls  
 [chromium] › e2e\p1-localization-accessibility.spec.ts:155:9 › P1 localization and accessibility regression › channels screen keeps labeled controls and table semantics  
 [chromium] › e2e\p2-finance-reconciliation.spec.ts:12:9 › P2 finance reconciliation › renders payout reconciliation and exports reconciliation dataset
[chromium] › e2e\p2-loyalty-gift-card.spec.ts:12:9 › P2 loyalty and gift-card redemption › renders loyalty programs, issues a gift card, and redeems it
[chromium] › e2e\visual-regression.spec.ts:20:13 › Visual Regression Tests › Guest Pages › landing page visual snapshot
[chromium] › e2e\visual-regression.spec.ts:35:13 › Visual Regression Tests › Guest Pages › guest menu page visual snapshot
[chromium] › e2e\visual-regression.spec.ts:60:13 › Visual Regression Tests › Guest Pages › cart drawer visual snapshot
[chromium] › e2e\visual-regression.spec.ts:151:13 › Visual Regression Tests › UI Components › button states visual snapshot
[chromium] › e2e\visual-regression.spec.ts:172:13 › Visual Regression Tests › UI Components › card components visual snapshot
[chromium] › e2e\visual-regression.spec.ts:189:13 › Visual Regression Tests › Responsive Design › mobile landing page visual snapshot
[chromium] › e2e\visual-regression.spec.ts:203:13 › Visual Regression Tests › Responsive Design › tablet landing page visual snapshot
[chromium] › e2e\visual-regression.spec.ts:217:13 › Visual Regression Tests › Responsive Design › desktop landing page visual snapshot
[chromium] › e2e\visual-regression.spec.ts:233:13 › Visual Regression Tests › Dark Mode › dark mode landing page visual snapshot
[firefox] › e2e\accessibility.spec.ts:88:13 › Accessibility Tests › Interactive Components › buttons should have accessible names
[firefox] › e2e\accessibility.spec.ts:109:13 › Accessibility Tests › Interactive Components › images should have alt text
[firefox] › e2e\accessibility.spec.ts:125:13 › Accessibility Tests › Interactive Components › form inputs should have labels
[firefox] › e2e\accessibility.spec.ts:154:13 › Accessibility Tests › Color Contrast › text should meet minimum color contrast requirements
[firefox] › e2e\accessibility.spec.ts:177:13 › Accessibility Tests › Keyboard Navigation › focus should be visible on interactive elements
[firefox] › e2e\channels-health-delivery-ack.spec.ts:74:9 › Channels health and delivery acknowledge flow › renders channel health and acknowledges an external order  
 [firefox] › e2e\dashboard-attention-queue.spec.ts:125:9 › Dashboard attention queue workflow › renders queue, advances order status, and navigates to orders
[firefox] › e2e\dashboard-attention-queue.spec.ts:173:9 › Dashboard attention queue workflow › refresh updates attention queue payload
[firefox] › e2e\guests-directory-profile.spec.ts:74:9 › Guests directory and profile flows › loads guest directory, opens profile drawer, and saves updates
[firefox] › e2e\merchant-dashboard-audit.spec.ts:21:9 › Merchant Dashboard full-session audit › navigates all core merchant tabs and validates page intent
[firefox] › e2e\p1-localization-accessibility.spec.ts:77:9 › P1 localization and accessibility regression › guests screen keeps locale formatting and labeled controls  
 [firefox] › e2e\p1-localization-accessibility.spec.ts:155:9 › P1 localization and accessibility regression › channels screen keeps labeled controls and table semantics  
 [firefox] › e2e\p2-finance-reconciliation.spec.ts:12:9 › P2 finance reconciliation › renders payout reconciliation and exports reconciliation dataset
[firefox] › e2e\p2-loyalty-gift-card.spec.ts:12:9 › P2 loyalty and gift-card redemption › renders loyalty programs, issues a gift card, and redeems it
[firefox] › e2e\visual-regression.spec.ts:20:13 › Visual Regression Tests › Guest Pages › landing page visual snapshot
[firefox] › e2e\visual-regression.spec.ts:60:13 › Visual Regression Tests › Guest Pages › cart drawer visual snapshot
[firefox] › e2e\visual-regression.spec.ts:151:13 › Visual Regression Tests › UI Components › button states visual snapshot
[firefox] › e2e\visual-regression.spec.ts:172:13 › Visual Regression Tests › UI Components › card components visual snapshot
[firefox] › e2e\visual-regression.spec.ts:189:13 › Visual Regression Tests › Responsive Design › mobile landing page visual snapshot
[firefox] › e2e\visual-regression.spec.ts:203:13 › Visual Regression Tests › Responsive Design › tablet landing page visual snapshot
[firefox] › e2e\visual-regression.spec.ts:217:13 › Visual Regression Tests › Responsive Design › desktop landing page visual snapshot
[firefox] › e2e\visual-regression.spec.ts:233:13 › Visual Regression Tests › Dark Mode › dark mode landing page visual snapshot
[Mobile Chrome] › e2e\accessibility.spec.ts:13:13 › Accessibility Tests › Guest Pages › landing page should have no critical accessibility violations
[Mobile Chrome] › e2e\accessibility.spec.ts:125:13 › Accessibility Tests › Interactive Components › form inputs should have labels
[Mobile Chrome] › e2e\accessibility.spec.ts:154:13 › Accessibility Tests › Color Contrast › text should meet minimum color contrast requirements
[Mobile Chrome] › e2e\accessibility.spec.ts:177:13 › Accessibility Tests › Keyboard Navigation › focus should be visible on interactive elements
[Mobile Chrome] › e2e\mobile-merchant-tabs.spec.ts:74:9 › Mobile merchant tab regression › renders mobile nav and supports tab traversal without layout overflow
[Mobile Chrome] › e2e\visual-regression.spec.ts:20:13 › Visual Regression Tests › Guest Pages › landing page visual snapshot
[Mobile Chrome] › e2e\visual-regression.spec.ts:35:13 › Visual Regression Tests › Guest Pages › guest menu page visual snapshot
[Mobile Chrome] › e2e\visual-regression.spec.ts:60:13 › Visual Regression Tests › Guest Pages › cart drawer visual snapshot
[Mobile Chrome] › e2e\visual-regression.spec.ts:151:13 › Visual Regression Tests › UI Components › button states visual snapshot
[Mobile Chrome] › e2e\visual-regression.spec.ts:172:13 › Visual Regression Tests › UI Components › card components visual snapshot
[Mobile Chrome] › e2e\visual-regression.spec.ts:189:13 › Visual Regression Tests › Responsive Design › mobile landing page visual snapshot
[Mobile Chrome] › e2e\visual-regression.spec.ts:203:13 › Visual Regression Tests › Responsive Design › tablet landing page visual snapshot
[Mobile Chrome] › e2e\visual-regression.spec.ts:217:13 › Visual Regression Tests › Responsive Design › desktop landing page visual snapshot
[Mobile Chrome] › e2e\visual-regression.spec.ts:233:13 › Visual Regression Tests › Dark Mode › dark mode landing page visual snapshot
[Mobile Safari] › e2e\mobile-merchant-tabs.spec.ts:74:9 › Mobile merchant tab regression › renders mobile nav and supports tab traversal without layout overflow
[Mobile Safari] › e2e\visual-regression.spec.ts:20:13 › Visual Regression Tests › Guest Pages › landing page visual snapshot
[Mobile Safari] › e2e\visual-regression.spec.ts:35:13 › Visual Regression Tests › Guest Pages › guest menu page visual snapshot
[Mobile Safari] › e2e\visual-regression.spec.ts:151:13 › Visual Regression Tests › UI Components › button states visual snapshot
[Mobile Safari] › e2e\visual-regression.spec.ts:172:13 › Visual Regression Tests › UI Components › card components visual snapshot
[Mobile Safari] › e2e\visual-regression.spec.ts:189:13 › Visual Regression Tests › Responsive Design › mobile landing page visual snapshot
[Mobile Safari] › e2e\visual-regression.spec.ts:203:13 › Visual Regression Tests › Responsive Design › tablet landing page visual snapshot
[Mobile Safari] › e2e\visual-regression.spec.ts:217:13 › Visual Regression Tests › Responsive Design › desktop landing page visual snapshot
[Mobile Safari] › e2e\visual-regression.spec.ts:233:13 › Visual Regression Tests › Dark Mode › dark mode landing page visual snapshot
54 skipped
8 did not run
40 passed (11.7m)
