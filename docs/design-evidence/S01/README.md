# S01 — Page geometry pilot

Completed 2026-10-04. Current uncommitted working tree; no branch or PR created.

## Delivered scope

- Home, Ingredient Items and Add Ingredient use the shell's existing gutters.
  Their page headings, breadcrumb area and content share one outer edge.
- Wide workspaces remain wide; Add Ingredient is left-aligned with a 640px
  maximum width.
- Titles/actions wrap naturally. Narrow form actions preserve single-line
  labels and 42px height instead of squeezing Save onto two lines.
- Stock filters wrap with complete labels and 42px targets. Laptop search keeps
  a useful minimum and allows other controls to move to the next row.
- Home notice rows stack on phones to keep the expired-stock action inside the
  surface at 320px. Larger Home information-priority work stays H01.
- PrimeIcons glyphs stay inside their controls after a narrow override of the
  upstream pseudo-element backface-visibility hint. No icon-position resets,
  font changes or background changes were introduced.

The shared pattern is documented in the design-system specification and index.

## Evidence and verification

`before/` preserves 24 loaded pilot captures: three pages, four widths
(1440, 1280, 390, 320px), both themes. `../T01/before/` preserves typography and
select-overlay observations, including the form filled with the long name.

`after/` contains corresponding pilot geometry/typography captures, eight open
select overlays, eight form-footer views, four long-kitchen-title cases, and
JSON measurements. The geometry tests fill the form's name field; use the T01
before frames for matching that state. Captures are fixed-shell viewport views,
not a claim of inspecting every lower section of every page.

`regression/` contains 24 final capture checks across Home, Ingredient Items,
Add Item, Add Ingredient, Recipes and Shopping, at desktop/mobile sizes in both
themes. These preserve route/theme/fixture, current revision, dirty-tree and
source hashes, observed font and console/network observations. Original E03
evidence is preserved. These captures passed with empty error lists.

Results:

- 24 original pilot baseline captures passed.
- 24 T01 role/control/select-keyboard observation checks passed.
- 34 final geometry, typography, keyboard, long-title and icon checks passed.
- 24 six-page capture regression checks passed.
- Four focused filter-interaction checks passed at 390px and 320px in both
  themes: Fresh, Near Expiry, Expired, Out of Stock, then All.
- The full design-system gate passed: formatting, ESLint, both guardrails,
  46 test files/208 unit tests and production build.
- Astra independently reviewed the baseline and accepted the final pilot;
  see [baseline findings](../E03/astra-review.md) and
  [after-review](astra-review.md).

Meaningful failing reproductions preceded repairs: title/breadcrumb offsets
were 16px apart on mobile; six icon-paint checks detected no glyph pixels inside
their layout boxes; 320px Save text spanned two lines; and a Home action extended
4px past the page. The first after-review also caught the laptop search
regression, which was corrected and added to the assertions.

## Remaining work

H01 should consolidate Home summaries/actions and prioritize usable stock and
recipes. S02 handles mobile breadcrumbs; I01 handles mobile table presentation.
Field spacing, residual uppercase roles and the narrow overlay placeholder stay
with their existing page/field tasks. Windows/other-engine rendering, physical
devices, screen readers and unshown states remain unverified.

Existing nonfatal build warnings remain: optional Angular JavaScript cache
binding unavailable for the local Node runtime; Restock Review's stylesheet
exceeds its warning budget. No dependencies or backend contracts changed.
