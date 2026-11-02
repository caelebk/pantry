# S02 — Navigation and wayfinding

Implemented 2026-10-04 on `feat/ui-cleanup`, created from `feat/warm-kitchen-theme` with all existing working-tree changes preserved. No commit or push performed.

## Delivered

Breadcrumbs are quiet text with separators rather than highlighted pills. Desktop retains the full path. At widths below 640px, deep paths show the immediate parent and current page, with wrapping rather than clipped horizontal scrolling. Ancestors remain native links with visible keyboard focus and 42px minimum height; only the final crumb has current-page semantics.

Route coverage now includes Profile, Stores, shopping edits, ingredient unit reconciliation, recipe details/edit, and the development gallery. Labels use Transloco and domain wording. Entity detail labels identify the type of page without exposing raw IDs; they do not fetch entity names into global navigation. Redirected aliases resolve through NavigationEnd to canonical routes.

Nine sidebar destinations are native RouterLink anchors. Disclosure/theme/logout/kitchen actions remain buttons. Ordinary destination activation closes menus; modified clicks preserve browser behavior. Only an exact normalized path gets `aria-current="page"`; descendants retain section highlights. Query strings, fragments and trailing slashes do not break matching. Navigation/disclosure targets preserve a 42px minimum.

## Verification

- Ten breadcrumb regressions and three sidebar behavior regressions failed before implementation. Focused suites now pass ten breadcrumb and twenty sidebar tests, including query/hash visual matching and modified clicks.
- 64 Chromium browser cases pass: eight routes × 1440/1280/390/320px × both themes. Routes cover Home, Ingredient Items with a query string, Profile, Stores, shopping edit, reconciliation, recipe edit and group creation.
- Browser assertions check correct current context, exactly one final breadcrumb marker, exact sidebar markers, native destinations, narrow-path containment, visible parent links and keyboard Enter navigation with focus outlines.
- All browser cases finish with empty page-error and unexpected API-request lists. Read-only synthetic fixtures intercept APIs; no real account or mutation is involved.
- Full frontend design-system gate passes: formatting, ESLint, design/i18n guardrails, 50 files/245 unit tests and production build. Existing cache-binding and Restock Review stylesheet warning budgets remain.
- `git diff --check` passes.

## Rendered review and limits

Codex inspected desktop/laptop/mobile/narrow screenshots of Inventory, Profile, group creation and reconciliation directly. Breadcrumb text is contained and quieter, sidebar section/child hierarchy remains readable, and the immediate parent remains accessible on narrow screens. Screenshots capture surrounding pages as context; their existing form/table debt is not closed by S02.

No independent Astra acceptance was obtained in this slice; its previously reported usage limit remains. Physical devices, screen-reader behavior and actual modified-click new-tab navigation were not browser-tested; modified-click behavior has component-test coverage. Mobile drawer focus, dismissal and desktop-collapse independence remain S03, rather than being implied fixed by native links.

## Design-system impact

Preserved typography, background, colors and existing sidebar treatments. Breadcrumbs use existing text tokens, semantic navigation/list markup and focus styles; no new UI variant or dependency. New breadcrumb labels use the existing English dictionary.

SH-01 and SYS-02/03 are addressed within the verified route scope. Next: S03 mobile navigation focus and dismissal.
