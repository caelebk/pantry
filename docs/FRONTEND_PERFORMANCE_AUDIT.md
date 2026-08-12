# Frontend Performance Audit & Architectural Remediation Plan

This document outlines the findings of a comprehensive audit of the Pantry Angular frontend (`frontend/src/`). It detailing root causes for UI lag, click/interaction delays, redundant network API calls, and excessive Change Detection overhead, along with a 5-phase remediation strategy.

---

## Executive Summary

The frontend performance issues stem from a compounding cascade of 4 primary architectural vulnerabilities:

1. **60 FPS Zone.js Change Detection Flood**: Un-isolated HTML5 canvas particle/vector background animation loops (`requestAnimationFrame`) and window listeners (`mousemove`, `resize`) running directly inside the Angular Zone.
2. **Top-Down Tree-Wide Re-evaluations**: 35 out of 48 frontend components (72.9%) relying on `ChangeDetectionStrategy.Default` instead of `OnPush`.
3. **Heavy Un-Memoized Template Getters/Functions**: Key page components executing heavy JS array `.filter()`, `.find()`, and `.sort()` operations inside HTML template bindings on every Change Detection tick.
4. **Uncached HTTP Master Data & Duplicate Triggers**: Services missing `shareReplay(1)` / Signal caching, and multiple components subscribing to the same state signals triggering parallel duplicate GET requests.

---

## Detailed Audit Findings

### 1. ⚡ 60 FPS Zone.js Change Detection Flood
- **Affected Files**:
  - `frontend/src/app/app.component.ts` (`requestAnimationFrame` animation loop, canvas mouse listeners)
  - `frontend/src/app/pages/auth/login/login.component.ts` (particle system background animation)
  - `frontend/src/app/pages/auth/signup/signup.component.ts` (particle system background animation)
- **Impact**: Zone.js intercepts `requestAnimationFrame` and window event listeners, triggering **60 full-application top-down Change Detection microtasks per second**, even when the user is idle.

### 2. 🧩 35 Components Using `ChangeDetectionStrategy.Default` (72.9%)
- **Impact**: When Zone.js fires dirty checks (60x/sec), all 35 `Default` components are re-evaluated from the root component down to every leaf element (including repeated list items like `ItemCardComponent` and `DailyFocusComponent`).

### 3. 🐢 Un-Memoized Template Functions & Getters
- **`InventoryComponent`** (`frontend/src/app/pages/inventory/inventory.component.ts`):
  - Getters `filteredItems`, `totalPages`, `startIndex`, `endIndex`, `displayedItems`, and `visiblePages` execute full array filter & sort operations repeatedly on every Change Detection cycle.
  - Template helper methods: `isOutOfStockItem(item)` (evaluated 8x per row), `isExpiredItem(item)` (3x per row), `isExpiringSoonItem(item)` (2x per row), `getIngredientName()` (`.find()` on ingredients array per row).
- **`IngredientsPageComponent`** (`frontend/src/app/pages/inventory/ingredients-page/ingredients-page.component.html`):
  - `getConnectedItems(ing.id)` and `getTotalQuantityText(ing.id)` execute `.filter()` on every template pass.
- **`WeeklyViewComponent`** (`frontend/src/app/pages/meal-planner/meal-planner-components/weekly-view/weekly-view.component.html`):
  - `getMealsForDay(day)` (4x per day card) and `getDayCalories(day)` (`.filter().reduce()` 2x per day card).

### 4. 🌐 Redundant API Calls & Missing HTTP Caching
- **Uncached Lookup Endpoints**:
  - `IngredientGroupService` (`frontend/src/app/services/inventory/ingredient-group.service.ts`) and `UnitService` (`frontend/src/app/services/inventory/unit.service.ts`) do not cache responses. `forkJoin` requests in `IngredientService` and `ItemService` re-fetch ingredient groups, categories, units, and locations on every call.
- **Duplicate Component Initializations**:
  - `MealPlannerService` and `MealPlannerComponent` both listen to `authService.activeKitchen()` via `effect()`, triggering **2 identical GET `/api/meal-plans` calls** in parallel when navigating to the Meal Planner tab.
  - `InventoryComponent.initParameters()` fires duplicate parallel GET calls to `/api/ingredient-groups`.
- **N * 3 HTTP Request Bursts**:
  - `RestockReviewPageComponent` calls `getSimilarIngredientItems()` in a loop for every draft item on load.

### 5. 🎨 SCSS Compositing & Layout Reflow Costs
- **Heavy Backdrop Blur**: `styles.scss` `.glass-card` (`backdrop-filter: blur(16px)`), `.spotlight-glow` (`filter: blur(120px)`), and `.topo-wave-accent` (`filter: blur(60px)`) force off-screen GPU rasterization during scroll and multi-card grid rendering.
- **Layout Reflow Triggers**: `.sub-card-hover` (`styles.scss`) uses `transition: all !important`, causing layout recalculations for every CSS property change. `.card-shine::before` animates `left: 100%` instead of GPU-accelerated `transform: translateX()`.

### 6. 🧠 123+ Unmanaged RxJS Subscriptions
- Form `valueChanges` in `AddItemPageComponent`, `EditItemPageComponent`, `AddItemFormComponent`, and `EditItemFormComponent` lack `takeUntilDestroyed()`, causing memory leaks and background subscriber retention.

---

## 5-Phase Remediation Roadmap

```
Phase 1: Zone.js & Canvas Optimization (Isolate 60 FPS animation loops)
   │
   ▼
Phase 2: Template Getter & Signal Refactoring (Convert template functions to computed() signals)
   │
   ▼
Phase 3: Service HTTP Caching & Deduplication (Add shareReplay / Signal caching)
   │
   ▼
Phase 4: Component OnPush Adoption (Migrate 35 Default components to OnPush)
   │
   ▼
Phase 5: SCSS, TrackBy & RxJS Teardown (GPU transitions, track by item.id, takeUntilDestroyed)
```

---

## Phase 1 Execution Plan: Isolate Canvas Animations

1. Inject `NgZone` into `AppComponent`, `LoginComponent`, and `SignupComponent`.
2. Wrap `requestAnimationFrame` loops and `window.addEventListener('mousemove' | 'resize')` inside `ngZone.runOutsideAngular(() => { ... })`.
3. Verify that background particle/vector animations continue running at 60 FPS while Angular Change Detection ticks drop to 0 when idle.
