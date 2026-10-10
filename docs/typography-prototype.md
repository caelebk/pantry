# Typography prototype

The user approved this font and hierarchy direction. Live-application visual
verification remains pending under T01 in the [living UI cleanup plan](ui-cleanup-plan.md).

Open [the standalone preview](prototypes/typography.html) directly in a browser.
It works without Angular or the backend. Use the theme button to compare light
and dark, and the hierarchy checkbox to compare the previous size/weight/casing
with the proposed hierarchy. Both modes use your device's native system font;
the comparison does not load Inter. Sample data is illustrative and actions are
disabled.

The live application now uses the native system font and shared page-title,
section-title, label, metadata, and summary-value roles. Look at Home, Inventory,
an add/edit form, and `/design-system` in a development build. Existing text
keeps its source casing; routine labels no longer receive forced uppercase.
Shared badges use readable 12px medium-weight text and totals use tabular numerals.
The background, color theme, surfaces, layout, and control dimensions retain
their existing definitions.

The five type-role declarations in the standalone preview match `styles.scss`.
The preview is an illustrative composition, not proof of how every live page
wraps or fits. The prototype is implemented for evaluation; final visual
acceptance remains pending.

## Verification

First-phase follow-up (2026-10-03): the full `validate:design-system` gate now
passes, including 208 tests and production build, after native dependency and
test-setup repairs. The earlier blocked results below describe the prototype
session. Live rendering still requires server/browser access; see
[E01 evidence](design-evidence/E01/README.md) and [E02 evidence](design-evidence/E02/README.md).

- Angular compiler/template check: `ngc --noEmit -p tsconfig.app.json` passed.
- ESLint, design-system guardrail, and i18n guardrail passed.
- Existing Badge and FormField tests: 8 passed.
- Preview DOM checks passed for light/dark switching, hierarchy switching,
  disabled sample actions, and synchronization of all five type-role declarations.
  These use JSDOM and do not establish visual appearance.
- Full `validate:design-system` is blocked by pre-existing formatting in
  `frontend/angular.json`.
- Separately attempted full tests reported the previously observed CSS/PostCSS
  load errors and recursive Angular change-detection errors, then stalled and
  were interrupted. No passing full-suite result is claimed.
- Build and dev server fail because `lightningcss.darwin-arm64.node` is missing.
  Playwright Chromium is denied `bootstrap_check_in` permission by this sandbox.
  No browser screenshots, measured contrast, or responsive visual acceptance
  were completed.

Next visual checks: desktop and 390px mobile, both themes, long names and labels,
dropdown/dialog typography, summary values, and native-font differences between
macOS and Windows. The active prototype's typography contract is documented in
[the design system](design-system.md).
