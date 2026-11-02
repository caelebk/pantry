# Q02 — Honest recipe metadata

Implemented 2026-10-04 in the current working tree. No deployment or developer-database migration performed.

Home and planner consumers omit unknown time, servings and calories. Explicit zero values remain visible. Recipe total time requires both prep and cooking time; daily and weekly totals require every contributing value. An empty collection does not imply a recorded zero. The planner's editable planned-portions input remains an explicit user choice, separate from recipe facts.

The meal-plan API now preserves unknown metadata as `null`. Migration [0018](../../../backend/migrations/0018_allow_unknown_meal_plan_metadata.sql) makes the three fields nullable without defaults, preserves historical rows and audit values, retains foreign-key deletion behavior and recreates existing indexes. Apply it through the normal migration process before using the updated service with an existing database. Tests and migration/seed verification used temporary databases only.

Historical values are preserved: prior default-looking values cannot safely be distinguished from genuine records. Q02 does not retroactively repair them. Recipe editor metadata behavior and planner error-path sample recipes remain separate page/Q01 work.

## Verification

- Home regression tests first failed on invented defaults and lost zero servings; all four Home/helper checks now pass.
- Planner regression tests reproduced ten failures, then passed all 19 focused tests, including existing planner coverage. Cases cover omitted/null metadata, zero values, complete-only aggregates, daily/cards/timeline rendering and recipe picker/planned portions.
- Backend regression tests reproduced default replacement; all 173 backend tests pass. Lint, formatting and type checks pass. The new migration test verifies historical records, unknown defaults, indexes and foreign-key deletion actions; scratch migration and seed passed.
- Six browser cases passed: Home, weekly cards and daily focus, 1440/1280/390px, both themes. Unknown facts are omitted; zero facts remain visible. Page-error and unexpected API-request lists are empty. Data is synthetic, fixed-time, with reduced motion.
- Full frontend design-system gate: formatting, ESLint, design/i18n guardrails, 49 files/223 unit tests and production build. Existing cache-binding/stylesheet-budget warnings remain.
- `git diff --check` passes.

The eighteen PNGs here capture the changed consumer states. Component screenshots are evidence of metadata presentation; tall weekly captures include unpainted offscreen regions and do not establish full-page inspection. Weekly timeline and recipe picker have component-test coverage, not browser captures in this slice. Real backend-to-browser round trips, other browser engines/devices and screen-reader behavior remain unverified.

## Independent Astra review

Astra independently inspected the changed source, migration and tests, and all eighteen screenshots. Verdict: accepted, with no material correctness or new visual regression found within the reviewed scope. Nullable create/read/update semantics, zero preservation, complete-only totals, historical/FK/index preservation and metadata omission were accepted. Astra did not independently rerun the reported suites.

## Next slice

Q02 satisfies Home H01's metadata prerequisite. Next, simplify Home summaries and next actions using S01 geometry. Keep the existing typography, background and palette.
