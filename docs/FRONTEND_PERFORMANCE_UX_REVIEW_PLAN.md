# Frontend Performance and UX Review Plan

Date: 2026-08-13

Status: Investigation complete; implementation not started

Scope: The current frontend worktree, including its existing uncommitted performance and animation changes

## Executive conclusion

The slow and clunky experience is reproducible, but it is not caused by one isolated defect. It comes from several costs landing at the same time:

1. Routes paint false zero/empty states before asynchronous data arrives, then replace them with populated panels.
2. Some pages refetch the same domain data repeatedly; the Recipes page currently scales requests with the number of rendered recipe cards.
3. Large lists and cards still perform filtering, sorting, status calculation, and relationship lookups from template-facing getters and methods.
4. Route, panel, row, count, background, and hover animations overlap. The current transition work reduces abruptness in places, but it also makes content unstable or non-interactive while entrance transforms are running.
5. A persistent canvas animation, multiple CSS animations, and per-card `requestAnimationFrame` count animations compete for frame time during route and data rendering.

The recommended approach is to stabilize data and layout first, remove request and render amplification second, and tune motion only after the underlying screens can render within a frame budget. Adding more entrance animation before those fixes would disguise latency rather than remove it.

## Evidence from the current worktree

### Measured baseline

The repository's production build completed successfully. Generated browser output was approximately 2.9 MB in total. The initial HTML references approximately 738 KiB of unique uncompressed JavaScript and CSS, plus a large inline font stylesheet in `index.html`.

The existing Playwright performance suite was run against the current frontend with mocked APIs:

| Scenario                                            | Result |
| --------------------------------------------------- | -----: |
| Home hard load to visible heading                   | 267 ms |
| Inventory overview hard load                        | 158 ms |
| Inventory items hard load                           | 237 ms |
| Recipes hard load                                   | 183 ms |
| Meal Planner hard load                              | 131 ms |
| Heap growth after 10 navigation loops and forced GC | 1.2 MB |
| Inventory filter layout count delta                 |     62 |
| Inventory filter style-recalc count delta           |     74 |
| Open Add Item route                                 | 370 ms |
| First switch to Meal Planner Daily Focus            | 946 ms |
| Switch back to Weekly Calendar                      |  53 ms |
| Inventory Near Expiry filter                        | 311 ms |

The interaction test failed because the first Daily Focus switch exceeded its 600 ms limit. A focused three-run repeat reproduced the result at 936 ms, 936 ms, and 943 ms. Add Item remained 332-350 ms and inventory filtering remained 297-313 ms.

Important limitation: the test calls its wall-clock measurement "INP," but it does not use the browser Event Timing API and is not a real Core Web Vitals INP measurement. Its first Daily Focus result includes Playwright waiting for an element that is moving during entrance animation. That makes it strong evidence of user-facing animation/actionability interference, but it should not be reported as field INP.

### Existing improvements already present

The current uncommitted changes have made useful progress and should be preserved or folded into the implementation deliberately:

- The root canvas loop runs outside Angular's zone, pauses drawing while the document is hidden, caps particle/vector counts, and respects reduced motion.
- The application root and several repeated components now use `OnPush`.
- Units, locations, ingredient groups, ingredient categories, and recipes have basic `shareReplay(1)` caching.
- Inventory, Ingredients, Recipes, and Inventory Overview have some skeleton/loading treatment.
- Expensive backdrop filters and large CSS blur filters have been reduced.
- Route and panel entrance animations have been introduced.

These changes do not yet form a coherent loading and motion system, and some of the new entrance animations contribute to the current delayed-action behavior.

## Findings, ordered by priority

### P0: False empty states and fragmented loading boundaries cause the visible flash

- `HomeComponent` owns an `isLoading` signal but `home.component.html` never reads it. The page immediately paints zero counts, empty recipe content, and empty lists, then updates all panels after the slowest request in its `forkJoin` completes.
- `MealPlannerService` starts with an empty meal array and exposes no loading/error state. Meal Planner paints zero summary cards and an empty weekly calendar before the request completes.
- `ShoppingListService` follows the same pattern. Shopping List can briefly paint its true empty-state message before loaded items arrive.
- Inventory and Recipes show skeletons, but page headers, controls, panel entrance animations, skeleton replacement, and data rendering happen as separate visual events.
- Inventory adds an artificial 50 ms timeout before clearing its loading state.
- Several pages mark loading complete when one selected request finishes rather than when all data needed for the view is ready. Ingredient Groups, for example, clears loading when categories finish even if items, ingredients, or groups are still pending.

Result: users see multiple paints with different geometry and meaning. This is the main cause of panels appearing to flash or pop into place.

### P0: Request amplification makes page cost grow with rendered content

- `RecipesComponent` loads recipes, Ingredient Items, units, and ingredients.
- Every `RecipeCardComponent` then independently requests ingredients, units, and Ingredient Items again.
- Units and lookup data are cached, but `ItemService.getItems()` and `IngredientService.getIngredients()` are not. With N recipe cards, the route can make approximately N additional ingredient requests and N additional Ingredient Item requests.
- Route-to-route navigation reloads uncached Ingredient Items and ingredients even when the active kitchen has not changed.
- Restock Review sends one similarity request per draft line. Each similarity call also joins units and locations. Lookup caches prevent some duplicate HTTP, but the similarity endpoint still grows linearly with the number of drafts.
- Mutation handlers commonly refresh whole datasets instead of updating or invalidating a shared store once.

Result: network contention, repeated DTO mapping, repeated array allocation, and staggered card updates all increase as user data grows.

### P0: Rendering work is repeatedly recomputed

- Inventory's `filteredItems`, `totalPages`, `endIndex`, `displayedItems`, `visiblePages`, category grouping, and taxonomy grouping are template-facing getters. Several getters call other getters, so one template pass can filter and sort the same collection multiple times.
- Inventory status and ingredient-name helper methods are called repeatedly per row.
- Ingredients repeatedly calls `getConnectedItems(ing.id)`, including multiple times within the same row and again inside expanded content.
- Recipe cards recompute sorted ingredients, ingredient statistics, availability, and expiration scans from template getters/methods. Some expiration helpers filter the full pantry list for each ingredient.
- Ingredient Groups builds item-to-ingredient relationships by filtering all items once per ingredient, producing O(ingredients x items) work.
- Only 23 of 48 production components declare a change-detection strategy; 25 still use Angular's default strategy. Several remaining default components render large forms, restock drafts, taxonomy trees, or repeated home content.

Result: typing, filtering, switching views, and resolving async responses can trigger far more JavaScript than the visual change requires.

### P1: The motion system overlaps and delays actionability

- A 200 ms Angular route transition wraps the routed view.
- Many pages also add 320 ms panel animations with delays up to 310 ms.
- Rows and child lists add Angular stagger animations.
- Stat cards animate values for 350-1200 ms using their own `requestAnimationFrame` loops after a 60 ms timeout.
- There are approximately 220 `transition-all` uses across templates and global styles. These make the browser consider properties beyond opacity and transform and make motion behavior hard to predict.
- `.panel-reveal` leaves `will-change: opacity, transform` applied after the animation, retaining compositor-layer hints longer than needed.
- The current route animation handles entry only. There is no coordinated old-content/new-content handoff or stable loading surface.

The repeatable 936-943 ms first Daily Focus test is largely an interaction with these overlapping entrance transforms: the first click occurs while the page is still considered unstable; the reverse switch is 51-53 ms after animations have settled.

Result: animation intended to make the UI feel polished instead makes controls feel temporarily unavailable and creates a long cascade of panels.

### P1: Persistent decorative animation competes with application work

- The authenticated application keeps a full-screen canvas animation running continuously.
- It also runs multiple long-lived SVG/CSS background animations.
- The canvas is correctly outside Angular's zone, but it still consumes main-thread drawing and compositor time while routes render and lists update.
- Four Home stat cards can each run a signal-updating animation loop at the same time as the background and list entrances.
- Reduced-motion support exists for several effects, but not every animation or transition is covered by one policy.

Result: lower-end devices and busy frames have less headroom for input, layout, paint, and data rendering.

### P2: Delivery and benchmark gaps hide regressions

- The production page includes Google Fonts CSS for seven Inter weights and a separate Material Symbols font for a narrow icon set. Font swapping can alter text metrics after the first paint.
- The performance build budget allows a very large 2 MB warning and 4 MB error for initial content, so meaningful growth can pass unnoticed.
- The current performance fixture uses only 20 Ingredient Items and two recipes, which cannot expose the request-per-card and large-list scaling problems.
- Major-route timing uses `page.goto`, which measures hard reloads instead of actual sidebar client navigation.
- The sidebar test exercised only one visible navigation item, so it did not validate the declared set.
- No test currently asserts API request counts, false empty-state paints, cumulative layout shift, long tasks, dropped frames, or true Event Timing INP.

## Remediation roadmap

### Phase 0: Establish trustworthy performance acceptance tests

Purpose: create a red baseline before changing behavior.

1. Replace wall-clock "INP" naming with explicit click-to-stable-paint latency, and add true browser Event Timing/INP collection where supported.
2. Exercise sidebar/router links for client-side navigation rather than using `page.goto` between every route.
3. Add fixtures for at least small, medium, and stress datasets, for example:
   - 20 / 200 / 1,000 Ingredient Items
   - 5 / 50 / 200 ingredients
   - 2 / 25 / 100 recipes with realistic ingredient counts
   - 5 / 50 restock drafts
4. Add request-count assertions per endpoint and verify that recipe-page requests do not grow with recipe-card count.
5. Add CPU-throttled and network-throttled runs for the key user journeys.
6. Capture long tasks, layout shift, animation frame timing, and heap after client-side navigation loops.
7. Add a visual assertion that empty states never appear before a request has reached a successful empty result.

Initial budgets to ratify with the baseline:

- Warm client route click to stable shell: <= 200 ms.
- Common filter/tab interaction to next stable paint: <= 150 ms, with no case above 250 ms on the medium fixture.
- Field-style INP target: <= 200 ms at the 75th percentile.
- Cumulative layout shift: < 0.1 per route.
- No main-thread task over 50 ms during a normal route transition on the medium fixture.
- Transition frame rate: >= 55 FPS on the reference desktop profile; document a separate mobile profile.
- No false empty-state paint.
- No entity-list request count that scales with the number of child cards.

Primary files:

- `frontend/e2e/performance-benchmarks.spec.ts`
- `frontend/playwright.config.ts`
- New focused performance fixtures/helpers under `frontend/e2e/`

### Phase 1: Build coherent kitchen-scoped remote state

Purpose: eliminate false empty states, request duplication, and whole-page refresh cascades.

1. Give each major domain resource an explicit state: `idle | loading | success | error`, data, and last successful kitchen ID.
2. Deduplicate in-flight requests and retain successful data while revalidating for the same kitchen.
3. Key caches by active kitchen, and invalidate or update them after mutations. Do not use permanent `shareReplay(1)` without a kitchen-aware invalidation policy.
4. Centralize Ingredient Items, ingredients, units, locations, recipes, meal plans, and shopping-list state instead of letting page/card components fetch independently.
5. Remove all HTTP/data-service ownership from `RecipeCardComponent`; pass a precomputed recipe view model from the page/store.
6. Batch Restock Review similarity lookup in one endpoint/request if the backend contract can support it; otherwise bound concurrency and expose per-row progress without blocking the full form.
7. Make page loading completion depend on the complete set of required resources, not whichever request happens to finish first.
8. Remove artificial loading timeouts.

Primary files:

- `frontend/src/app/services/inventory/item.service.ts`
- `frontend/src/app/services/inventory/ingredient.service.ts`
- `frontend/src/app/services/inventory/ingredient-group.service.ts`
- `frontend/src/app/services/inventory/ingredient-category.service.ts`
- `frontend/src/app/services/inventory/unit.service.ts`
- `frontend/src/app/services/inventory/location.service.ts`
- `frontend/src/app/services/recipe.service.ts`
- `frontend/src/app/services/meal-planner.service.ts`
- `frontend/src/app/services/shopping-list.service.ts`
- `frontend/src/app/pages/recipes/recipes.component.ts`
- `frontend/src/app/pages/recipes/recipe-components/recipe-card/recipe-card.component.ts`
- `frontend/src/app/pages/shopping-list/restock-review-page/restock-review-page.component.ts`

Exit criteria:

- Navigating between major routes in the same kitchen reuses valid shared data.
- Recipe-page list requests are constant with respect to recipe count.
- Every cache has tested kitchen-switch and mutation invalidation behavior.
- No route paints a true empty state while required data is still loading.

### Phase 2: Produce page view models once per state change

Purpose: make render cost proportional to changed data, not template evaluations.

1. Convert Inventory filter/sort/pagination/grouping chains into signals and `computed()` view models. Read each computed result once in the template with `@let` where helpful.
2. Precompute maps for Ingredient Item status, ingredient name by ID, items by ingredient ID, item counts, and aggregate quantities.
3. Convert Ingredients and Ingredient Groups relationship building from repeated `.filter()` scans to single-pass maps.
4. Build recipe availability, expiration, sorted ingredient, and summary data once in the parent/store, then pass immutable card view models.
5. Debounce text search only enough to protect medium/stress datasets, targeting approximately 100-150 ms, while keeping buttons and status filters synchronous.
6. Migrate high-cost remaining components to `OnPush` first: Restock Review, Ingredient Groups, Plan Meal, taxonomy components, large forms, and repeated home components.
7. Confirm every repeated render uses stable identity tracking. Add virtualization only for lists that remain large after pagination and view-model optimization.

Primary files:

- `frontend/src/app/pages/inventory/inventory.component.ts`
- `frontend/src/app/pages/inventory/inventory.component.html`
- `frontend/src/app/pages/inventory/ingredients-page/ingredients-page.component.ts`
- `frontend/src/app/pages/inventory/ingredients-page/ingredients-page.component.html`
- `frontend/src/app/pages/inventory/ingredient-groups-page/ingredient-groups-page.component.ts`
- `frontend/src/app/pages/recipes/recipes.component.ts`
- `frontend/src/app/pages/recipes/recipe-components/recipe-card/recipe-card.component.ts`
- Remaining default-change-detection components selected by measured cost

Exit criteria:

- Inventory filtering and tab changes meet the Phase 0 budget at the medium fixture.
- Recipe and ingredient card rendering performs no per-card network request.
- No template-facing getter sorts or filters a full collection.
- Large-list traces show no long task over 50 ms for the tested interactions.

### Phase 3: Replace flashing with a single stable loading and route-transition system

Purpose: make pages feel continuous without delaying input.

1. Keep the application shell, sidebar, breadcrumbs, and content bounds stable across route changes.
2. Reserve final panel dimensions with skeletons or content placeholders. Skeleton and content must share the same grid, card count, and minimum heights to avoid layout shift.
3. Render empty states only after a successful empty response. Render errors as stable in-layout states, not abrupt panel removal.
4. Use one short route-level transition, approximately 120-180 ms, limited to opacity and a very small transform. Do not layer panel-level entrance transforms on top of the route transition.
5. For same-route tabs such as Meal Planner, update selection immediately and crossfade content without making the tab control or ancestor move.
6. Remove arbitrary per-panel delays. If a stagger remains for decorative content, cap the total sequence below 200 ms and never apply it to controls.
7. Ensure reduced motion removes route, panel, row, count, and background motion through one shared policy.
8. Evaluate the browser/router view-transition mechanism only after data and layout are stable; adopt it only if it improves measured results and has a safe fallback.

Primary files:

- `frontend/src/app/app.component.html`
- `frontend/src/app/app.component.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/utility/animationUtility/animations.ts`
- `frontend/src/styles.scss`
- Home, Inventory, Ingredients, Recipes, Shopping List, and Meal Planner templates

Exit criteria:

- Controls are actionable throughout page and panel transitions.
- Daily Focus first switch meets the same budget as subsequent switches.
- CLS remains below 0.1.
- Reduced-motion mode has no entrance transforms or count animations.

### Phase 4: Enforce an animation and compositing budget

Purpose: preserve visual character without stealing frame time from the application.

1. Profile the canvas and CSS background independently from application rendering.
2. Prefer a static authenticated-app background. If motion is retained, pause or reduce it during navigation, input, scrolling, and large data updates; consider a 30 FPS cap on lower-power profiles.
3. Remove first-load number ticker animations or reduce them to one short CSS-safe update. Do not run four signal-writing RAF loops during initial data render.
4. Replace `transition-all` with explicit `transition-colors`, `transition-opacity`, `transition-transform`, or narrowly declared properties.
5. Remove persistent `will-change`; apply it only shortly before animation and let the layer be released afterward.
6. Limit animated shadows and blur/backdrop effects, especially on scrollable or repeated cards.
7. Keep motion durations and easing in shared design tokens so pages cannot accumulate independent timings.

Primary files:

- `frontend/src/app/app.component.ts`
- `frontend/src/app/app.component.html`
- `frontend/src/app/components/stat-card/stat-card.component.ts`
- `frontend/src/styles.scss`
- Templates currently using `transition-all`

Exit criteria:

- Background-on versus background-off traces have an acceptable and documented frame-time difference.
- No always-on animation causes Angular change detection.
- No page keeps unnecessary compositor layers after entrance.
- The medium fixture sustains the agreed transition/scroll frame budget.

### Phase 5: Reduce first-load and route-delivery cost

Purpose: prevent bundle and font work from competing with first useful paint.

1. Produce a bundle composition report and identify which initial shared chunks contain PrimeNG, Angular animation, Transloco, icons, and app code.
2. Tighten Angular build budgets from the current 2 MB warning / 4 MB error using measured compressed and raw baselines.
3. Load only the Inter weights actually used, and self-host or otherwise make font delivery deterministic.
4. Remove the Material Symbols webfont if its small icon usage can be represented with the existing PrimeIcons or inline SVG system.
5. Keep heavy PrimeNG controls and form-only modules in lazy route chunks.
6. Consider idle prefetching only for the most likely next route after the critical route is stable; do not eagerly download all lazy routes.

Primary files:

- `frontend/src/index.html`
- `frontend/angular.json`
- `frontend/src/styles.scss`
- Route component imports

Exit criteria:

- Initial raw and compressed assets meet ratified budgets.
- First paint uses stable font metrics with no visible font-driven shift.
- Lazy-route chunks do not regress beyond the agreed threshold.

### Phase 6: Validate with the real system and prevent regression

Purpose: ensure mocked frontend gains survive real API latency and production data.

1. Run the performance journeys against both mocked deterministic data and a seeded local backend.
2. Test at least a reference desktop and a constrained mobile profile.
3. Add CI checks for request amplification, client-navigation latency, false empty states, build budgets, and the medium dataset.
4. Keep slower stress and browser-matrix runs scheduled rather than blocking every small change.
5. Add lightweight real-user monitoring for route duration, INP, CLS, long tasks, API latency, and error rate, with privacy-safe route labels.

Exit criteria:

- All Phase 0 budgets pass in deterministic CI.
- Seeded-backend results are documented and within the agreed tolerance of mocked results.
- Performance regressions fail CI or produce an actionable scheduled report.

## Recommended implementation order

1. Phase 0 measurement corrections and red tests.
2. Phase 1 shared data/loading state, beginning with Recipes, Home, Meal Planner, and Shopping List.
3. Phase 2 Inventory, Ingredients, Recipe Card, and taxonomy render paths.
4. Phase 3 one coherent route/loading transition system.
5. Phase 4 background and micro-animation budget.
6. Phase 5 delivery optimizations.
7. Phase 6 CI and real-user monitoring.

Phases 1 and 2 are expected to produce the largest speed improvement. Phases 3 and 4 should then make that improved speed feel seamless instead of layering motion over unstable content.

## Verification gate for each implementation phase

Follow the repository's TDD and completion workflow:

1. Add or update focused tests and demonstrate the relevant baseline failure.
2. Make the smallest phase-scoped implementation.
3. Run focused unit/E2E performance tests while iterating.
4. Run `npm run test`.
5. Run `npm run lint`.
6. Run `npm run format:check` or the repository-required formatter workflow.
7. Run `npm run build`.
8. Run the ratified performance suite and compare results to the saved baseline.
9. Run `git diff --check` and audit that unrelated user changes remain intact.

## Remaining investigation risk

The current Playwright suite mocks APIs with effectively zero server latency and small datasets, so it understates production network and scaling costs. Browser traces on a constrained device and a seeded backend are still required before committing to final numeric budgets. The current evidence is sufficient to prioritize the architectural work, but not to claim final performance targets have already been achieved.
