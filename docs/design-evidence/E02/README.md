# E02 — Formatting and test baseline

Recorded 2026-10-03 against the current uncommitted typography working tree.

The formatting failure was the multiline `cli.schematicCollections` array in `frontend/angular.json`; applying the repository Prettier configuration fixes it without changing behavior.

The stalled test suites used SCSS; the mismatched Sass native installation prevented collection. E01's native package recovery removes that blocker.

Inventory, Ingredients, and Recipes specs called `TestBed.flushEffects()` immediately before `fixture.detectChanges()`. In Angular 20, `flushEffects()` performs an application tick, which reentered the zone change-detection scheduler in these fixtures. Removing the redundant tick lets fixture change detection handle initialization. This changes test setup only.

The existing Inventory initialization test now spies on Angular's `ErrorHandler` and asserts that loading the expected stock counts emits no runtime errors. Before the fix it captured 92 recursive-tick errors; after the fix the three focused suites pass (18 tests) without NG0101. No tests were removed or disabled.

The full suite passes: 46 files, 208 tests. `npm run validate:design-system` exits successfully with formatting, lint, both guardrails, all tests, and production build. Existing fixture dictionary warnings remain; they do not fail the tests. Build warnings are recorded in E01.

An additional optional `tsc -p tsconfig.spec.json --noEmit` check fails with existing TS2688 because the configuration references unavailable Jasmine types. E02a tracks this separately; no type dependency was added.

No product behavior or design tokens changed in this repair.
