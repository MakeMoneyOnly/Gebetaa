1.  [chromium] › e2e/accessibility.spec.ts:14:13 › Accessibility Tests › Guest Pages › landing page should have no critical accessibility violations
    Error: expect(received).toEqual(expected) // deep equality
    - Expected - 1
    * Received + 305
    - Array []
    * Array [
    * Object {
    *     "description": "Ensure buttons have discernible text",
    *     "help": "Buttons must have discernible text",
    *     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright",
    *     "id": "button-name",
    *     "impact": "critical",
    *     "nodes": Array [
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/30 transition-all hover:bg-black/10 hover:text-black active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".text-black\\/30.hover\\:bg-black\\/10.h-\\[34px\\]:nth-child(1)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/30 transition-all hover:bg-black/10 hover:text-black active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".text-black\\/30.hover\\:bg-black\\/10.h-\\[34px\\]:nth-child(2)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/5 bg-white/10 text-white/50 transition-all hover:text-white active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".border-white\\/5.bg-white\\/10.text-white\\/50:nth-child(1)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/5 bg-white/10 text-white/50 transition-all hover:text-white active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".border-white\\/5.bg-white\\/10.text-white\\/50:nth-child(2)",
    *         ],
    *       },
    *     ],
    *     "tags": Array [
    *       "cat.name-role-value",
    *       "wcag2a",
    *       "wcag412",
    *       "section508",
    *       "section508.22.a",
    *       "TTv5",
    *       "TT6.a",
    *       "EN-301-549",
    *       "EN-9.4.1.2",
    *       "ACT",
    *       "RGAAv4",
    *       "RGAA-11.9.1",
    *     ],
    * },
    * ]
      27 | );
      28 |
        > 29 | expect(criticalViolations).toEqual([]);
             |                                        ^
        30 | });
        31 |
        32 | test('guest menu page should have no accessibility violations', async ({ page }) => {
        at /home/runner/work/lole/lole/e2e/accessibility.spec.ts:29:40
        Error Context: test-results/accessibility-Accessibilit-6c1d5-al-accessibility-violations-chromium/error-context.md
        Retry #1 ───────────────────────────────────────────────────────────────────────────────────────
        Error: expect(received).toEqual(expected) // deep equality
    - Expected - 1
    * Received + 305
    - Array []
    * Array [
    * Object {
    *     "description": "Ensure buttons have discernible text",
    *     "help": "Buttons must have discernible text",
    *     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright",
    *     "id": "button-name",
    *     "impact": "critical",
    *     "nodes": Array [
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/30 transition-all hover:bg-black/10 hover:text-black active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".text-black\\/30.hover\\:bg-black\\/10.h-\\[34px\\]:nth-child(1)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/30 transition-all hover:bg-black/10 hover:text-black active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".text-black\\/30.hover\\:bg-black\\/10.h-\\[34px\\]:nth-child(2)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/5 bg-white/10 text-white/50 transition-all hover:text-white active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".border-white\\/5.bg-white\\/10.text-white\\/50:nth-child(1)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/5 bg-white/10 text-white/50 transition-all hover:text-white active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".border-white\\/5.bg-white\\/10.text-white\\/50:nth-child(2)",
    *         ],
    *       },
    *     ],
    *     "tags": Array [
    *       "cat.name-role-value",
    *       "wcag2a",
    *       "wcag412",
    *       "section508",
    *       "section508.22.a",
    *       "TTv5",
    *       "TT6.a",
    *       "EN-301-549",
    *       "EN-9.4.1.2",
    *       "ACT",
    *       "RGAAv4",
    *       "RGAA-11.9.1",
    *     ],
    * },
    * ]
      27 | );
      28 |
        > 29 | expect(criticalViolations).toEqual([]);
             |                                        ^
        30 | });
        31 |
        32 | test('guest menu page should have no accessibility violations', async ({ page }) => {
        at /home/runner/work/lole/lole/e2e/accessibility.spec.ts:29:40
        Error Context: test-results/accessibility-Accessibilit-6c1d5-al-accessibility-violations-chromium-retry1/error-context.md
        attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
        test-results/accessibility-Accessibilit-6c1d5-al-accessibility-violations-chromium-retry1/trace.zip
        Usage:
        pnpm exec playwright show-trace test-results/accessibility-Accessibilit-6c1d5-al-accessibility-violations-chromium-retry1/trace.zip
        ────────────────────────────────────────────────────────────────────────────────────────────────
        Retry #2 ───────────────────────────────────────────────────────────────────────────────────────
        Error: expect(received).toEqual(expected) // deep equality
    - Expected - 1
    * Received + 305
    - Array []
    * Array [
    * Object {
    *     "description": "Ensure buttons have discernible text",
    *     "help": "Buttons must have discernible text",
    *     "helpUrl": "https://dequeuniversity.com/rules/axe/4.11/button-name?application=playwright",
    *     "id": "button-name",
    *     "impact": "critical",
    *     "nodes": Array [
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/30 transition-all hover:bg-black/10 hover:text-black active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".text-black\\/30.hover\\:bg-black\\/10.h-\\[34px\\]:nth-child(1)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-black/5 bg-black/5 text-black/30 transition-all hover:bg-black/10 hover:text-black active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".text-black\\/30.hover\\:bg-black\\/10.h-\\[34px\\]:nth-child(2)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/5 bg-white/10 text-white/50 transition-all hover:text-white active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".border-white\\/5.bg-white\\/10.text-white\\/50:nth-child(1)",
    *         ],
    *       },
    *       Object {
    *         "all": Array [],
    *         "any": Array [
    *           Object {
    *             "data": null,
    *             "id": "button-has-visible-text",
    *             "impact": "critical",
    *             "message": "Element does not have inner text that is visible to screen readers",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-label",
    *             "impact": "critical",
    *             "message": "aria-label attribute does not exist or is empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "aria-labelledby",
    *             "impact": "critical",
    *             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": Object {
    *               "messageKey": "noAttr",
    *             },
    *             "id": "non-empty-title",
    *             "impact": "critical",
    *             "message": "Element has no title attribute",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "implicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an implicit (wrapped) <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "explicit-label",
    *             "impact": "critical",
    *             "message": "Element does not have an explicit <label>",
    *             "relatedNodes": Array [],
    *           },
    *           Object {
    *             "data": null,
    *             "id": "presentational-role",
    *             "impact": "critical",
    *             "message": "Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *             "relatedNodes": Array [],
    *           },
    *         ],
    *         "failureSummary": "Fix any of the following:
    * Element does not have inner text that is visible to screen readers
    * aria-label attribute does not exist or is empty
    * aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
    * Element has no title attribute
    * Element does not have an implicit (wrapped) <label>
    * Element does not have an explicit <label>
    * Element's default semantics were not overridden with role=\"none\" or role=\"presentation\"",
    *         "html": "<button class=\"flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/5 bg-white/10 text-white/50 transition-all hover:text-white active:scale-95\">",
    *         "impact": "critical",
    *         "none": Array [],
    *         "target": Array [
    *           ".border-white\\/5.bg-white\\/10.text-white\\/50:nth-child(2)",
    *         ],
    *       },
    *     ],
    *     "tags": Array [
    *       "cat.name-role-value",
    *       "wcag2a",
    *       "wcag412",
    *       "section508",
    *       "section508.22.a",
    *       "TTv5",
    *       "TT6.a",
    *       "EN-301-549",
    *       "EN-9.4.1.2",
    *       "ACT",
    *       "RGAAv4",
    *       "RGAA-11.9.1",
    *     ],
    * },
    * ]
      27 | );
      28 |
        > 29 | expect(criticalViolations).toEqual([]);
             |                                        ^
        30 | });
        31 |
        32 | test('guest menu page should have no accessibility violations', async ({ page }) => {
        at /home/runner/work/lole/lole/e2e/accessibility.spec.ts:29:40
        Error Context: test-results/accessibility-Accessibilit-6c1d5-al-accessibility-violations-chromium-retry2/error-context.md
2.  [chromium] › e2e/accessibility.spec.ts:55:13 › Accessibility Tests › Merchant Dashboard › merchant dashboard should have no accessibility violations
    Test timeout of 45000ms exceeded.
    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.
    58 |
    59 | // Wait for the page to be fully loaded
    > 60 | await page.waitForLoadState('networkidle');
         |                        ^
    61 |
    62 | // Wait for main content to be visible
    63 | await page.waitForSelector('#main-content', { timeout: 10000 });
    at /home/runner/work/lole/lole/e2e/accessibility.spec.ts:60:24
    Error Context: test-results/accessibility-Accessibilit-2725b-no-accessibility-violations-chromium/error-context.md
    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────
    Test timeout of 45000ms exceeded.
    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.
    58 |
    59 | // Wait for the page to be fully loaded
    > 60 | await page.waitForLoadState('networkidle');
         |                        ^
    61 |
    62 | // Wait for main content to be visible
    63 | await page.waitForSelector('#main-content', { timeout: 10000 });
    at /home/runner/work/lole/lole/e2e/accessibility.spec.ts:60:24
    Error Context: test-results/accessibility-Accessibilit-2725b-no-accessibility-violations-chromium-retry1/error-context.md
    attachment #2: trace (application/zip) ─────────────────────────────────────────────────────────
    test-results/accessibility-Accessibilit-2725b-no-accessibility-violations-chromium-retry1/trace.zip
    Usage:
    pnpm exec playwright show-trace test-results/accessibility-Accessibilit-2725b-no-accessibility-violations-chromium-retry1/trace.zip
    ────────────────────────────────────────────────────────────────────────────────────────────────
    Retry #2 ───────────────────────────────────────────────────────────────────────────────────────
    Test timeout of 45000ms exceeded.
    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.
    58 |
    59 | // Wait for the page to be fully loaded
    > 60 | await page.waitForLoadState('networkidle');
         |                        ^
    61 |
    62 | // Wait for main content to be visible
    63 | await page.waitForSelector('#main-content', { timeout: 10000 });
    at /home/runner/work/lole/lole/e2e/accessibility.spec.ts:60:24
    Error Context: test-results/accessibility-Accessibilit-2725b-no-accessibility-violations-chromium-retry2/error-context.md
3.  [chromium] › e2e/accessibility.spec.ts:77:13 › Accessibility Tests › Merchant Dashboard › merchant orders page should have no accessibility violations
    Test timeout of 45000ms exceeded.
    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.
    77 | test('merchant orders page should have no accessibility violations', async ({ page }) => {
    78 | await page.goto('/merchant/orders'); > 79 | await page.waitForLoadState('networkidle');
    | ^
    80 | await page.waitForSelector('#main-content', { timeout: 10000 });
    81 |
    82 | const accessibilityScanResults = await new AxeBuilder({ page })
    at /home/runner/work/lole/lole/e2e/accessibility.spec.ts:79:24
    Error Context: test-results/accessibility-Accessibilit-636ae-no-accessibility-violations-chromium/error-context.md
    Retry #1 ───────────────────────────────────────────────────────────────────────────────────────
    Test timeout of 45000ms exceeded.
    Error: page.waitForLoadState: Test timeout of 45000ms exceeded.
    77 | test('merchant orders page should have no accessibility violations', async ({ page }) => {
    78 | await page.goto('/merchant/orders'); > 79 | await page.waitForLoadState('networkidle');
    | ^
    80 | await page.waitForSelector('#main-content', { timeout: 10000 });
     ELIFECYCLE  Command failed with exit code 1.
    Error: Process completed with exit code 1.
