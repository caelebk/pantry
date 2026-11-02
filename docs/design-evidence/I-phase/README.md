# Ingredient phase evidence — I01–I10

Routes use synthetic API fixtures and macOS Chromium; no production data was changed. The working branch is `feat/ui-cleanup`; changes remain uncommitted.

## Implemented scope

- **I01–I03 Stock:** original table character retained, named item links, deliberate phone rows, matching grid actions, quantity/expiry signals, current-page selection, and per-item restock previews. Pending submission cannot dismiss the dialog; partial retry resubmits only failed items.
- **I04 Item editors:** one shared add/edit form, required fields first, optional details, reference loading/retry, quick ingredient creation, unknown expiry, and return context.
- **I05 Overview:** stock attention and task navigation; optional taxonomy explanation and explicit load failure.
- **I06 Catalog / Q03:** aligned table columns, taxonomy and stock badges, positive-quantity availability, expanded batches, native sorting, pagination, and deletion impact/retry.
- **I07–I08 Ingredient editors and reconciliation:** shared fields, preserved edit drafts, explicit unit-change handoff, finite nonnegative quantities, manual entry for incompatible dimensions, and all-batch validation before transactional updates.
- **I09–I10 Groups:** matching directory table with category/count/disclosure/edit; keyboard membership selection, explicit create/move/remove review, 20+ members, and retry without repeating completed changes.
- **Q04:** removed fabricated freshness previews; unknown expiry remains unknown.

## User-directed consistency correction

Stock, Catalog, and Groups retain shaded table headers, glass frames, row dividers, taxonomy/status badges, and common header/action sizing. Each filter bar is exactly one row: flexible Search, Filters with active count, and More. Status/location/group/category options are inside Filters; sorting, view, selection and disclosure commands are inside More. The same layout applies at every viewport. Escape and Done return focus to the trigger; outside click dismisses the panel.

## Captures

Each of the 11 routes has light/dark captures at 1440, 1280, 390 and 320 pixels (88 captures). Filenames include page, width and theme. `editors/`, `groups/`, and restock preview/retry captures record primary interactions and failure recovery. Browser emulation does not establish physical-device or Windows font behavior.

Representative pages: [Stock desktop](stock-1440-light.png), [Stock mobile](stock-390-dark.png), [Catalog desktop](catalog-1440-light.png), [Catalog mobile](catalog-390-dark.png), [Groups desktop](groups-1440-light.png), [Groups mobile](groups-390-dark.png).

## Verification

- `npm run validate:design-system`: passed formatting, ESLint, design/i18n guardrails, 298 tests in 57 files, and production build.
- Backend: 178 tests passed, plus lint, formatting and type checks.
- Browser: 90 distinct cases passed across the inventory matrix (eight cases covering 88 route/theme/width captures), stock selection/restock (four), editor flows (20), group membership (four), and shared navigation/geometry/icon regressions (54). The first final matrix run had two failures caused by fractional 42px bounding-box rounding; the assertion now allows 0.1px rounding and all eight matrix cases passed. No unexpected API requests or page errors in the passing scoped suites.
- Toolbar checks measure equal control centerlines, 42px controls, panels inside the viewport, Escape dismissal and returned focus. Desktop mobile-label visibility is also checked after the observed CSS regression.
- `git diff --check`: passed.

Build warnings remain for the existing Node/native-cache environment and Stock/Shopping restock stylesheet budgets. These do not fail the build. The final Astra follow-up was unavailable due to a usage limit; [review record](astra-review.md) distinguishes independent findings from root verification.
