# Inventory overview: content and hierarchy refinement

Date: 2026-10-09  
Status: Implemented and fully verified (2026-10-09).  
Route: `/inventory` only.

## 1. Assignment and scope — read first

Reduce the visual and reading noise on the existing Inventory overview. Keep its three purposes: explain terminology, navigate to the three inventory destinations, and summarize stock needing attention.

**This document supersedes the earlier [Inventory overview plan](INVENTORY_OVERVIEW_PLAN.md) for this refinement. Do not implement the older plan's destination-page enhancements.**

The user explicitly restricted this work to the Inventory overview. Do not modify Ingredients, Ingredient Items, Ingredient Categories & Groups, their forms, shared navigation, backend services, or their tests. Finding an issue in one of those areas is not authorization to fix it. Report it separately if it blocks this task.

Implement the decisions below as written. Do not add charts, metrics, features, dependencies, API calls, routing parameters, or alternative design directions. Use the current data and supported links.

### Allowed edits

| File                                                                                                                              | Permitted changes                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [Overview template](../frontend/src/app/pages/inventory/inventory-overview-page/inventory-overview-page.component.html)           | Content, semantic markup, local layout classes, and existing link placement                                            |
| [Overview component](../frontend/src/app/pages/inventory/inventory-overview-page/inventory-overview-page.component.ts)            | Change preview limit from five to three; small presentation helpers only if needed for section-specific loading states |
| [Overview component tests](../frontend/src/app/pages/inventory/inventory-overview-page/inventory-overview-page.component.spec.ts) | Tests of the behavior specified here                                                                                   |
| [English translations](../frontend/public/i18n/en.json)                                                                           | Only the `inventoryOverview` object; retain unrelated keys and formatting                                              |
| `frontend/e2e/inventory-overview-refinement.spec.ts`                                                                              | A focused browser test if needed; use existing fixtures without editing them                                           |
| `docs/design-evidence/inventory-overview-refinement/`                                                                             | Screenshots and a short verification record                                                                            |
| This document                                                                                                                     | Implementation status and actual verification results                                                                  |

Everything else is read-only. In particular, keep the [overview stock classifier](../frontend/src/app/pages/inventory/inventory-overview-page/inventory-overview-stock.ts), services, routes, global styles, and design-system definitions unchanged. No new component or SCSS file is necessary: use local utility classes and existing primitives.

### Preserve the dirty working tree

Other files already contain edits. Before starting, record `git status --short` and the current diff. Compare your final changes against that starting state, not merely against HEAD. Never run a broad reset, checkout, restore, or formatter to clean up unrelated files.

## 2. Why this refinement is needed

The current page contains four definition/example blocks, a relationship paragraph, three destination cards with repeated descriptions and footer links, expiry links inside a destination card, and additional expiry explanations below. Several sections explain the same concepts.

The desired result is less repetition and a clearer reading order. Keep readable typography and useful information. Do not achieve compactness by making text smaller, reducing contrast, or hiding the three destinations.

## 3. Final page structure — fixed order

```text
Inventory                                      Add Ingredient Item

How inventory is organized
Ingredient Category → Ingredient Group → Ingredient → Ingredient Item
Fiber & Produce     → Vegetables       → Spinach    → 200 g in the fridge
One short relationship sentence
Explain these terms [closed disclosure]

Explore inventory
┌ Ingredients                                      → ┐
│ 42 ingredients · 28 with stock                      │
├ Ingredient Items                                 → ┤
│ 76 stock batches on hand                           │
├ Ingredient Categories & Groups                   → ┤
│ 5 categories · 18 groups                           │
└────────────────────────────────────────────────────┘

Needs attention                         Stock by location
Expired or due within 14 days           Stock batches on hand
3 expired →  6 due within 14 days →      Fridge       ━━━━━ 12
Up to three records                     Pantry       ━━━    8
Optional missing-date note
```

Numbers above are illustrative, never hardcode them. Desktop uses the existing two-column lower section at `xl`; smaller widths stack attention before location. Destination navigation is a three-row list at every width, not a three-column card grid.

Keep the DOM reading order identical to this order. Keep `page-layout`, `page-header`, and existing typography roles. Do not change the app shell's gutters.

## 4. Implementation details by section

### A. Header

- Retain the `Inventory` h1 and existing primary link to `/inventory/items/new`.
- Retain the button text `Add Ingredient Item` and its plus icon.
- Remove the subtitle `Understand your ingredient catalog, stock, and organization.` from the template. It repeats the page's content.
- Do not add a hero, greeting, date, global metric strip, or extra header action.

### B. Compact terminology guide

- Keep `How inventory is organized` immediately below the header with its existing section heading ID.
- Replace the four always-visible definition/example blocks with a compact ordered example. Each step contains exactly a term and its example, without its explanatory definition.
- At `lg` and above: four columns in order, with decorative right arrows between steps. Below `lg`: a two-column, two-row grid in the same order. Use small decorative step numbers to preserve sequence when wrapped; hide horizontal connecting arrows below `lg`.
- Allow term names to wrap naturally at 320px. Do not abbreviate them, shrink type below the existing metadata role, or introduce horizontal scrolling.
- Keep the relationship sentence below the example.
- Add one native `<details>` disclosure directly below the sentence, closed by default. Its `<summary>` is `Explain these terms`, with a minimum 42px target and visible keyboard focus. No persisted preference, modal, hover tooltip, or custom accordion state.
- Inside the disclosure, render the four existing definitions as a `<dl>`. The essentials remain visible when the disclosure is closed. Definitions remain available during loading and errors.
- Use spacing and at most one quiet bottom divider. Remove the existing pair of top and bottom guide borders.

Exact visible terms and examples:

| Term                | Example             |
| ------------------- | ------------------- |
| Ingredient Category | Fiber & Produce     |
| Ingredient Group    | Vegetables          |
| Ingredient          | Spinach             |
| Ingredient Item     | 200 g in the fridge |

Relationship sentence: `An ingredient can have several stock batches, each with its own location and expiry date.`

The guide is an example, not current inventory data. Removing the example's `Expires Friday` prevents a static weekday from looking like a real stock deadline.

### C. Three compact destination rows

- Keep the `Explore inventory` heading and semantic `<nav>` with the existing translated navigation label.
- Replace the three separate article cards with **one** existing-style `glass-card rounded-2xl` surface containing three rows and quiet dividers.
- Each row is one native `routerLink` anchor covering the row. Put its title and metric line inside the same anchor; place one decorative right arrow at the trailing edge.
- No nested links/buttons. No footer CTA. No selected/tab state, tab role, pill styling, or large destination icons.
- Use approximately the existing `p-4 sm:p-5` spacing. The row expands for wrapped content; do not impose a fixed height. Minimum interactive height remains 42px.
- Titles use `type-label` and normal foreground color. Summary lines use the existing muted body/metadata style. Reserve `type-section-title` for the actual section headings.
- Keep all three rows visible and usable during loading, empty, and partial-failure states.

| Title                          | Route                    | Single summary line when all dependencies are ready |
| ------------------------------ | ------------------------ | --------------------------------------------------- |
| Ingredients                    | `/inventory/ingredients` | `{{count}} ingredients · {{stocked}} with stock`    |
| Ingredient Items               | `/inventory/items`       | `{{count}} stock batches on hand`                   |
| Ingredient Categories & Groups | `/inventory/groups`      | `{{categories}} categories · {{groups}} groups`     |

For Ingredients, `count = ingredientsCount()` and `stocked = stockedIngredientsCount()`. For Ingredient Items, `count = stockedItemsCount()`, not `itemsCount()`. For organization, use existing category/group counts.

Remove the three purpose paragraphs, the separate without-stock count, the ungrouped count, and the two expiry links from this navigation region. This removes visible content only; do not refactor unrelated computations just because their values no longer appear.

These rows browse entire destinations. Their summaries provide context; they are not filter links. Do not add `stocked`, `groupId=none`, `location`, or other query parameters.

### D. Needs attention

- Keep the existing heading and location in the lower section.
- Replace its paragraph with `Expired or due within 14 days`.
- Move the existing expired and expiring summary links here, immediately above the preview list. This is their only home on the page.
- Show an expired link only when `expiredCount() > 0`. Show an upcoming link only when `expiringCount() > 0`. Zero counts do not need warning badges or links.
- Use rose for a nonzero expired link and amber for a nonzero upcoming link; retain explicit text so color is not the only signal.
- Each link displays the full count, even when the preview contains only three records. Keep both links when both buckets are nonzero, even if the preview happens to show only expired records.
- Change `attentionItems` from `.slice(0, 5)` to `.slice(0, 3)`. Preserve its existing filtering and ordering exactly.
- Keep each preview row's name, quantity/unit, location, status, explicit date, and existing edit link.
- Keep missing/invalid expiry dates out of the preview. Show one quiet note below it when `undatedCount() > 0`.
- If no stock needs attention, show the concise neutral sentence specified below, without a warning color or a large success card.

Supported links, unchanged:

| Label                          | Target                             |
| ------------------------------ | ---------------------------------- |
| `{{count}} expired`            | `/inventory/items?status=expired`  |
| `{{count}} due within 14 days` | `/inventory/items?status=expiring` |
| Individual stock record        | `/inventory/items/:id/edit`        |

The count links are also the way to see records beyond the three-row preview. Do not invent a combined `attention` status or add another duplicate footer link.

### E. Stock by location

- Change the heading from `By location` to `Stock by location`.
- Replace the explanatory paragraph with `Stock batches on hand`.
- Preserve current sorting, counts, inclusion of zero-count locations, and the `No location` bucket.
- Preserve the bar calculation: `location.count / stockedItemsCount() * 100`, guarded against a zero denominator.
- Make bar fills neutral using existing surface tokens (`bg-surface-400 dark:bg-surface-500`); retain a subdued track. Do not add a color per location.
- These rows are informational. Remove **all** arrow icons from their markup, including the current `pi-arrow-right` beside the count. No links, click handlers, pointer cursor, or navigation-style hover effect.
- Keep exact numeric values visible and decorative bars `aria-hidden="true"`.
- Do not add totals, percentages, charts, or a location filter.

## 5. Copy and translation instructions

Use Transloco for every new or changed user-facing string. Edit only `inventoryOverview` in the dictionary. Reuse existing keys when the meaning is unchanged; add narrowly named keys for new summary combinations. Leave unused old keys in place for this task, avoiding unrelated dictionary cleanup.

| Purpose / existing key       | Required copy                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| New disclosure summary       | `Explain these terms`                                                                       |
| `itemExample`                | `200 g in the fridge`                                                                       |
| `relationship`               | `An ingredient can have several stock batches, each with its own location and expiry date.` |
| `attentionDescription`       | `Expired or due within 14 days`                                                             |
| `expiringCount`              | `{{count}} due within 14 days`                                                              |
| `nothingUrgent`              | `No recorded stock is expired or due within 14 days.`                                       |
| `undatedCount`               | `Expiry date missing or invalid for {{count}} stock batches.`                               |
| `locations`                  | `Stock by location`                                                                         |
| `locationDescription`        | `Stock batches on hand`                                                                     |
| New loading summary          | `Loading summary…`                                                                          |
| Existing unavailable summary | `Summary unavailable`                                                                       |

Keep the four canonical terms, full destination titles, definitions, existing error message, retry label, and empty-state copy. Add singular variants where needed for one ingredient, batch, category, or group; use the repository's existing translation approach. A count of zero uses the plural form. Do not show `1 ingredients` or `1 stock batches`.

## 6. State handling — required behavior

Preserve independent collection loading and failure handling, request cancellation, kitchen reset behavior, and the fourteen-calendar-day classifier. Do not change dates, backend semantics, stock definitions, or service caches.

| State                                     | Display                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| All collections loading                   | Guide and navigation remain visible; retain one canonical spinner; each pending summary says `Loading summary…`                |
| Ingredients ready, stock pending/failed   | Ingredients row shows ingredient total only, with no invented stock count                                                      |
| A required collection failed              | Affected summary says `Summary unavailable`; retain existing page-level error/retry; successfully loaded regions remain usable |
| Categories ready, groups pending          | Organization summary remains loading until both are ready                                                                      |
| Any organization dependency failed        | Organization summary says unavailable even if another unrelated collection is still loading                                    |
| Collections idle / no active kitchen      | Guide and navigation remain visible; summaries say unavailable, not zero or perpetual loading                                  |
| Successful load, zero ingredient items    | Keep guide/navigation and the existing canonical stock empty state; do not show attention/location charts                      |
| Records exist but all quantities are zero | Ingredient Items summary shows zero stock batches; attention is calm; location bars have zero width                            |
| Locations fail, stock succeeds            | Attention remains visible; location breakdown stays unavailable/hidden rather than displaying false zero counts                |
| Kitchen changes                           | Preserve existing immediate clearing and cancellation; do not show old-kitchen counts                                          |

For a combined summary: failure takes precedence, then pending, then ready; idle is unavailable. Determine this from `sectionStates()` for that summary's dependencies, not the global `isLoading()` value. This is a small overview presentation change, not a request to refactor loading infrastructure.

## 7. Implementation sequence

1. **Record the baseline.** Read this handoff, applicable repository guidance, the current overview files, and the design-system index. Record existing edits. Use `premium-frontend` for implementation and `browser-qa` for rendered verification.
2. **Write focused behavioral tests first.** Add the tests listed below. Run them and confirm the expected failures before changing behavior. Do not test individual Tailwind class names.
3. **Implement the compact guide and disclosure.** Keep essential terminology outside `<details>`.
4. **Replace navigation cards with three rows.** Apply the dependency-specific summary states and approved links.
5. **Consolidate attention content.** Move count links, limit preview to three, and shorten copy.
6. **Simplify the location region.** Neutral bars, short labels, no arrow affordances.
7. **Format only allowed files.** Do not run a repository-wide write formatter.
8. **Run the checks below.** Fix regressions caused by this work within scope.
9. **Inspect screenshots and refine once if needed.** Address observed hierarchy, wrapping, or interaction defects. Do not use this step to introduce new features.
10. **Audit scope and hand off.** Compare against the starting diff; record implemented changes, verification, and any rendering blocker.

### Required focused tests

- The guide's example and all three destination links remain visible when data is empty or unavailable.
- The new disclosure is closed initially; essential example content is outside it. **Update the existing test asserting there are no `<details>` elements**: that assertion is obsolete, but its visibility requirement remains valid.
- Exactly three destination anchors exist within the navigation region, with the approved hrefs and no nested interactive elements.
- Positive expired/upcoming counts appear as links inside the attention region and are absent from destination navigation. Zero counts do not render warning links.
- At least five mixed stock records produce only three preview rows, in the existing expiry/name/ID ordering, while the summary links retain the full counts.
- A failed summary is not labeled loading merely because another collection is pending; available ingredient totals remain visible when stock fails.
- Existing stock-count, error/retry, stale-response, and expiry-classification regression tests continue to pass.

Use complete synthetic records for rendered stock tests: provide unit, location, and valid purchase/expiry dates. Do not weaken tests or cast incomplete data to bypass errors.

## 8. Verification and acceptance checklist

Run from `frontend/`:

```sh
npm run test -- --run src/app/pages/inventory/inventory-overview-page
npm run validate:design-system
```

The full gate covers formatting, lint, design-system checks, translation checks, tests, and production build. Do not run backend migrations or modify backend code. Existing Angular test diagnostics must be reported accurately even if the test command exits successfully.

Use the existing [Playwright setup](../frontend/playwright.config.ts) and [synthetic fixture](../frontend/e2e/fixtures/design-baseline.ts). Capture and view `/inventory` at 1440px, 1280px, 390px, and 320px in light and dark themes. Include a populated state, an empty stock state, and a partial failure. Do not capture real personal inventory.

- [x] Header contains only the title and existing add action.
- [x] Terminology is near the top and understandable with the disclosure closed.
- [x] The guide uses four columns on wide screens and a readable 2×2 layout on narrow screens.
- [x] Three destinations are equally prominent, each with one anchor and one compact summary.
- [x] No purpose paragraphs or repeated footer navigation remain in the destination region.
- [x] Expiry totals appear only beside the attention preview.
- [x] Preview shows at most three records; both supported count links expose the complete relevant lists.
- [x] Location bars have neutral styling, numeric values, and no misleading arrows.
- [x] Text wraps without clipping at 320px, including the full Categories & Groups title.
- [x] No page-wide horizontal scrolling; no fixed-height rows clip long names.
- [x] Tab order follows reading order; every link and disclosure has visible focus; Enter/Space operates the native disclosure.
- [x] Light/dark text remains readable; no essential information depends on color or hover.
- [x] No destination-page, backend, service, global-style, or routing changes were introduced.
- [x] All checks are reported as passed, failed, or blocked, with actual evidence.

Browser launch was previously blocked by Chromium sandbox permissions. Check availability once. If still blocked, finish feasible source/tests/build checks and explicitly mark screenshot review, responsive appearance, and keyboard/browser behavior unverified. Do not change security settings or install a new browser stack to bypass the restriction.

Stop when these criteria are satisfied. Do not continue adding analytics or redesigning neighboring pages.

## 9. Design references and how to apply them

These references explain the decisions; they are not instructions to copy another product's theme.

- [Linear's March 2026 interface refresh](https://linear.app/now/behind-the-latest-design-refresh): reduce competing navigation emphasis and unnecessary visual separators. Apply through compact rows and restrained surfaces.
- [NN/G: Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): keep the essential hierarchy visible and put longer definitions behind an explicit disclosure.
- [GOV.UK: Accordion guidance](https://design-system.service.gov.uk/components/accordion/): edit and structure content before hiding it. Use a single small explanation disclosure, not an accordion around every section.
- [Shopify: Customizing the Analytics overview dashboard](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/customizing-overview-dashboard): compact summaries prioritize primary metrics. Do not add dashboard customization.

## 10. Required implementation handoff

Report:

1. The overview content and layout changes actually implemented.
2. Files changed during this task, distinguishing existing unrelated edits.
3. Focused/full check results and any existing diagnostics.
4. Screenshot paths and viewed states, or the exact rendering blocker.
5. A short design-system impact statement: reused primitives/tokens, new variants (expected: none), and responsive/accessibility checks performed.

Do not claim the page is visually verified based solely on a successful build.
