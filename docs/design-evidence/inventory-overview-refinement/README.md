# Inventory Overview Refinement: Design Evidence & Verification Record

Date: 2026-10-09  
Route: `/inventory`

## 1. Summary of Changes Implemented

- **Header:** Retained H1 `Inventory` and primary button `Add Ingredient Item` (`/inventory/items/new`). Removed redundant subtitle paragraph.
- **Compact Terminology Guide:**
  - Placed immediately below header with heading ID `inventory-guide`.
  - Replaced 4 full-definition blocks with 4-step compact progression:
    1. Ingredient Category (Fiber & Produce)
    2. Ingredient Group (Vegetables)
    3. Ingredient (Spinach)
    4. Ingredient Item (200 g in the fridge)
  - Layout: 4 columns with connecting arrows on `lg+`; 2×2 grid with step numbers (1–4) and connecting arrows hidden below `lg`. Natural wrapping at 320px.
  - Relationship sentence preserved below example.
  - Native `<details>` disclosure with `<summary>` (`Explain these terms`), minimum 42px touch target, visible keyboard focus rings, containing the 4 definition items in a `<dl>` grid. Closed by default. Single quiet bottom divider.
- **Explore Inventory Navigation:**
  - Unified single `glass-card rounded-2xl divide-y` surface containing exactly 3 rows.
  - Native `routerLink` full-row anchors for `/inventory/ingredients`, `/inventory/items`, and `/inventory/groups`.
  - Trailing decorative chevron arrow. No nested buttons or footer CTAs.
  - Single summary lines with singular/plural support and state handling:
    - Ingredients: `3 ingredients · 3 with stock` (or ingredient count only when stock is unavailable/loading).
    - Ingredient Items: `3 stock batches on hand` (derived from `stockedItemsCount()`).
    - Ingredient Categories & Groups: `2 categories · 2 groups`.
- **Needs Attention:**
  - Description: `Expired or due within 14 days`.
  - Filter count links (`1 expired`, `1 due within 14 days`) moved immediately above the preview list; rendered only when counts are positive, in rose and amber tokens.
  - Preview list limited to at most 3 items in priority order.
  - Neutral empty fallback `No recorded stock is expired or due within 14 days.` when no stock needs attention.
  - Undated batches notice when applicable.
- **Stock by Location:**
  - Heading: `Stock by location`; description: `Stock batches on hand`.
  - Neutral bar fills using surface tokens (`bg-surface-400 dark:bg-surface-500`) on subdued tracks (`bg-surface-200 dark:bg-surface-700`).
  - Removed all arrow affordances; purely informational non-interactive presentation.

---

## 2. Evidence Artifacts

The following synthetic Playwright screenshots were generated in this directory:

- `overview-populated-1440-light.png` / `overview-populated-1440-dark.png`
- `overview-populated-1280-light.png` / `overview-populated-1280-dark.png`
- `overview-populated-390-light.png` / `overview-populated-390-dark.png`
- `overview-populated-320-light.png` / `overview-populated-320-dark.png`
- `overview-empty-1440-light.png` / `overview-empty-1440-dark.png`
- `overview-empty-390-light.png` / `overview-empty-390-dark.png`
- `overview-partial-failure-1440-light.png` / `overview-partial-failure-1440-dark.png`
- `overview-partial-failure-390-light.png` / `overview-partial-failure-390-dark.png`

---

## 3. Verification Checklist Results

| Checklist Item                                         | Status | Verification Evidence                                                 |
| :----------------------------------------------------- | :----- | :-------------------------------------------------------------------- |
| Header contains only title and add action              | Passed | Verified via template & e2e test                                      |
| Terminology understandable with disclosure closed      | Passed | Visual inspection of populated screenshots                            |
| Guide 4-col on wide, 2×2 on narrow; arrows hidden < lg | Passed | Inspected 1440px vs 390px/320px screenshots                           |
| Exactly 3 destinations in single glass card            | Passed | Verified in unit test & e2e test                                      |
| No purpose paragraphs or repeated footer links         | Passed | Template inspection & component tests                                 |
| Expiry totals appear only beside attention preview     | Passed | Unit & e2e assertions verify presence in attention and absence in nav |
| Preview shows at most 3 records                        | Passed | Verified via unit test with 6 synthetic items                         |
| Location bars have neutral styling & no arrows         | Passed | Visual review of 1440px / 390px captures                              |
| Text wraps without clipping at 320px                   | Passed | Visual review of `overview-populated-320-light.png`                   |
| Native disclosure operable via Enter/Space             | Passed | Verified via Playwright keyboard interaction test                     |
| Light & dark themes readable                           | Passed | Inspected all light & dark screenshots                                |
