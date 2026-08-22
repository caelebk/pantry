# Design System Audit: Pantry Frontend

**Status:** Completed  
**Author:** Senior Design-Systems Engineer, Frontend Architect, & UI/UX Reviewer  
**Scope:** `frontend/` (Angular 20 Standalone, Tailwind CSS v4, PrimeNG 20, SCSS, Transloco)  
**Date:** August 2026

---

## 1. Executive Summary

Pantry has a distinct and compelling visual identity centered around **frosted-glass morphism**, **slate neutral surfaces**, **warm energetic orange accents (`#ea580c`)**, **deep navy floating overlays (`#141c2e`)**, and a **clean 42px control baseline**.

However, the codebase currently suffers from significant **fragmentation, markup duplication, and page-local styling leaks**. Over 280 button elements, 30+ select dropdowns, 12 loading spinners, 6 search input implementations, and 80+ form labels have been repeatedly hard-coded with slight variations in margin, padding, border radius, colors, and accessibility attributes.

This audit details the current state of the frontend UI architecture, catalogs every UI primitive across 18+ routes and 25+ components, identifies concrete inconsistencies and anti-patterns, and outlines an actionable, low-risk migration strategy to establish a centralized design system.

---

## 2. Current Frontend & Styling Architecture

### 2.1 Technology Stack & Rendering
- **Framework:** Angular 20.2 (Standalone Component Architecture, Signal-based reactivity)
- **Change Detection:** `ChangeDetectionStrategy.OnPush` across all core components
- **Routing:** Angular Router with lazy-loaded route components (`loadComponent()`) and route animation transitions
- **Internationalization:** Transloco 8.2 (`@jsverse/transloco`) with JSON locale files (`public/i18n/en.json`)
- **Testing & Tooling:** AnalogJS / Vitest 4.0 (`@analogjs/vitest-angular`), Playwright 1.57 for E2E, ESLint 9, Prettier 3

### 2.2 Styling Layers & Precedence
1. **CSS Custom Properties & `@theme`:** Defined in `src/styles.scss` (Tailwind CSS v4 `@theme` block) and mirrored in `tailwind.config.js`.
2. **Global Utility & Component Classes:** Defined in `src/styles.scss` (`.glass-card`, `.sub-card`, `.btn-primary`, `.btn-secondary`, `.location-badge`, `.card-label`).
3. **PrimeNG Aura Preset Overrides:** Defined in `src/app/app.config.ts` (`MyPreset` extending PrimeNG Aura) and overridden via `!important` rules in `src/styles.scss`.
4. **Tailwind Utility Classes:** Applied directly in HTML templates.
5. **Component Scoped SCSS:** Local `*.component.scss` files.

---

## 3. Existing UI Dependencies

| Package | Version | Role in Architecture |
| :--- | :--- | :--- |
| `primeng` | `^20.3.0` | Accessible headless/styled UI primitives (Dialog, Select, DatePicker, InputNumber, Checkbox) |
| `@primeng/themes` | `^20.3.0` | Base theme token provider (`Aura` preset) |
| `tailwindcss` / `@tailwindcss/postcss` | `^4.1.17` | Utility CSS engine & design token consumer |
| `primeicons` | `^7.0.0` | Secondary UI icons (`pi pi-*`) |
| Google Material Symbols | Web Font | Brand icon (`skillet`) |
| `@jsverse/transloco` | `^8.2.0` | Internationalization and UI string translation |

---

## 4. Route & Component Inventory

```
/auth/login                          -> LoginComponent
/auth/signup                         -> SignupComponent
/profile                             -> ProfileComponent
/home                                -> HomeComponent
/dashboard                           -> Redirects to /home
/inventory                           -> InventoryOverviewPageComponent
/inventory/items                     -> InventoryComponent (Master Stock Table)
/inventory/items/new                 -> AddItemPageComponent
/inventory/items/:id/edit            -> EditItemPageComponent
/inventory/ingredients               -> IngredientsPageComponent (Tier 3 Master Ingredients)
/inventory/ingredients/new           -> AddIngredientPageComponent
/inventory/ingredients/:id/edit      -> EditIngredientPageComponent
/inventory/ingredients/:id/unit-reconciliation -> UnitReconciliationPageComponent
/inventory/groups                    -> IngredientGroupsPageComponent (Tier 2 Groups & Tier 1 Categories)
/inventory/groups/new                -> AddIngredientGroupPageComponent
/inventory/groups/:id/edit           -> EditIngredientGroupPageComponent
/recipes                             -> RecipesComponent
/recipes/new                         -> AddRecipeFormComponent
/recipes/:id                         -> RecipeDetailComponent
/recipes/:id/edit                    -> AddRecipeFormComponent
/shopping-list                       -> ShoppingListComponent
/shopping-list/new                   -> AddShoppingItemPageComponent
/shopping-list/stores                -> StoresPageComponent
/shopping-list/:id/edit              -> AddShoppingItemPageComponent
/shopping-list/restock               -> RestockReviewPageComponent
/meal-planner                        -> MealPlannerComponent
/meal-planner/new                    -> PlanMealPageComponent
```

---

## 5. UI Element Inventory & Inconsistency Matrix

### 5.1 Buttons & Button-Like Links
- **Canonical Design:**
  - Height: `42px` (`h-[42px]`)
  - Border Radius: `0.75rem` (`rounded-xl`)
  - Typography: `text-sm font-bold` or `font-semibold`
  - Variants: `primary` (orange `#ea580c`), `secondary` (bordered neutral), `danger` (rose `#e11d48`), `ghost` (transparent), `icon` (square `42x42px`)
- **Findings & Inconsistencies:**
  - `styles.scss` defines `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-icon`.
  - In `src/app/pages/inventory/inventory-components/add-item-form/add-item-form.component.html` (line 239), the submit button uses inline classes: `bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl shadow-md ...` bypassing `.btn-primary`.
  - In `src/app/pages/inventory/ingredient-groups-page/ingredient-groups-page.component.html` (line 16), the button uses `px-5 py-3 ... bg-primary-600 hover:bg-primary-700 rounded-xl`.
  - In `src/app/pages/shopping-list/shopping-list.component.html` (lines 17, 25, 33), action buttons use custom padding `px-4 py-2.5 rounded-xl` instead of `.btn-secondary` and `.btn-primary`.
  - Icon buttons in table actions (`inventory.component.html`, `shopping-list.component.html`) use ad-hoc `w-8 h-8 rounded-lg` with inconsistent hover states.

### 5.2 Text & Search Inputs
- **Canonical Design:**
  - Height: `42px`
  - Background: `bg-surface-100 dark:bg-surface-800` (or `bg-white/80 dark:bg-surface-800/80` inside glass cards)
  - Border: `1px solid var(--color-surface-200)` / `dark:border-surface-700`
  - Focus Ring: `2px solid var(--color-primary-500)` with `box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.25)`
- **Findings & Inconsistencies:**
  - **Search Inputs:** Re-implemented with nearly identical 15-line boilerplate in 5 separate components:
    1. `src/app/pages/inventory/inventory.component.html` (lines 28–46)
    2. `src/app/pages/shopping-list/shopping-list.component.html` (lines 118–136)
    3. `src/app/pages/recipes/recipes.component.html` (lines 35–52)
    4. `src/app/pages/inventory/ingredients-page/ingredients-page.component.html` (lines 26–44)
    5. `src/app/pages/inventory/inventory-components/ingredient-group-container/ingredient-group-container.component.html` (lines 6–22)
  - Missing accessible `aria-label` or clear-button accessibility in several search inputs.

### 5.3 Selects, Dropdowns, and Comboboxes
- **Canonical Design:**
  - Trigger Height: `42px`
  - Border Radius: `0.75rem` (`rounded-xl`)
  - Dropdown Surface: `panelStyleClass="p-dialog-glass text-xs"` or `bg-surface-800` with `border-surface-700`
  - Placement: `appendTo="body"` to prevent clipping inside overflow containers
- **Findings & Inconsistencies:**
  - Over 30 `p-select` instances use varying inline styles (`class="w-full !bg-white/60 dark:!bg-surface-800/60..."` vs `styleClass="w-full h-[42px] !rounded-xl..."`).
  - Some instances omit `appendTo="body"`, causing clipping bugs in modals and cards.
  - In `src/app/pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component.html` (lines 387–400), an ad-hoc ingredient combobox was hand-coded with an unstyled `<ul><li>` absolute popup instead of a standardized combobox/autocomplete.

### 5.4 Form Labels, Required Indicators & Form Fields
- **Canonical Design:**
  - Label: `text-xs font-semibold text-surface-600 dark:text-surface-400 uppercase tracking-wider`
  - Required Asterisk: `<span class="text-rose-500 ml-0.5">*</span>`
  - Spacing: `mb-1.5`
- **Findings & Inconsistencies:**
  - Over 80 `<label>` tags duplicate label classes.
  - Required asterisks fluctuate between `text-red-500` and `text-rose-500`.
  - Validation error text fluctuates between `text-xs text-rose-500 mt-1` and `text-[11px] text-red-500`.

### 5.5 Cards, Containers, and Glass Surfaces
- **Canonical Design:**
  - Outer Page Container Card: `.glass-card rounded-2xl p-6 border border-surface-200/80 dark:border-surface-800/80 shadow-xs`
  - Inner / Sub Card: `.sub-card rounded-xl p-3.5` or `.sub-card-hover`
- **Findings & Inconsistencies:**
  - Padding varies arbitrarily: `p-4`, `p-5`, `p-6`, `p-8` across cards with identical visual hierarchy.
  - Border opacity varies: `border-surface-200/60`, `border-surface-200/80`, `border-white/10`.

### 5.6 Loading Spinners & Skeleton Loaders
- **Canonical Design:**
  - Animated spinner with semantic sizes (`sm: 16px`, `md: 20px`, `lg: 32px`) and colors (`primary`, `white`, `muted`).
  - Pulsing skeleton placeholders with matching border radius (`rounded-xl`, `rounded-2xl`).
- **Findings & Inconsistencies:**
  - 12 different hand-coded SVG or border spinners are scattered across 9 pages:
    - `src/app/pages/inventory/ingredient-groups-page/ingredient-groups-page.component.html` (line 28)
    - `src/app/pages/inventory/ingredient-categories-page/ingredient-categories-page.component.html` (line 18)
    - `src/app/pages/inventory/unit-reconciliation-page/unit-reconciliation-page.component.html` (lines 30, 137)
    - `src/app/pages/inventory/add-ingredient-group-page/add-ingredient-group-page.component.html` (line 219)
    - `src/app/pages/inventory/add-ingredient-page/add-ingredient-page.component.html` (line 127)
    - `src/app/pages/inventory/edit-ingredient-page/edit-ingredient-page.component.html` (lines 28, 151)
    - `src/app/pages/recipes/recipe-detail/recipe-detail.component.html` (lines 5, 315)
  - Skeletons are duplicated hand-coded `animate-pulse` boxes with inconsistent heights.

### 5.7 Empty States
- **Canonical Design:**
  - Centered icon in a muted circle, bold title, secondary description, optional CTA button.
- **Findings & Inconsistencies:**
  - Implemented haphazardly with raw text (`<p>No ingredients in this group yet.</p>`) or one-off icon divs.

### 5.8 Badges, Tags, and Status Indicators
- **Canonical Design:**
  - Fresh: `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20`
  - Expiring Soon: `bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20`
  - Expired: `bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`
  - Location Badge: `.location-badge`
- **Findings & Inconsistencies:**
  - Recipe tags use inline styles (`bg-primary-600/10 text-primary-600 border border-primary-600/20`).
  - Category badges use arbitrary text sizes (`text-[10px]` vs `text-xs`).

---

## 6. Accessibility Findings

1. **Missing Accessible Labels on Icon Buttons:**
   - Several action buttons (filter clear buttons, table row actions) lack `aria-label` or `title` attributes.
2. **Color Contrast:**
   - `text-surface-400` on light background (`#94a3b8` on `#f8fafc`) has a contrast ratio of ~2.8:1, failing WCAG AA (4.5:1) for small body text. Labels must use `text-surface-600` in light mode.
3. **Keyboard Navigation & Focus Trapping:**
   - Hand-rolled comboboxes and custom dropdowns lack arrow-key navigation and Escape-key closure.
4. **Form Association:**
   - Several inputs lack explicit `id` / `for` attribute pairing with their `<label>`.

---

## 7. Responsive Design Findings

1. **Form Grid Breakpoints:**
   - Multi-column form layouts (`add-item-form`, `add-recipe-form`) collapse cleanly on `sm` (640px) or `md` (768px).
2. **Action Toolbars:**
   - Search bars and filter button groups stack vertically on mobile (`flex-col sm:flex-row`) but occasionally cause horizontal scrollbars when filter pills exceed viewport width.
3. **Table Mobile Experience:**
   - PrimeNG tables on mobile switch to responsive card views or scrollable containers.

---

## 8. Prioritized Action Plan & Classification

| Item | Classification | Severity | Affected Area | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Search Input Duplication** | Shared Primitive | **High** | Inventory, Shopping, Recipes, Groups | Create canonical `PantrySearchInputComponent` |
| **Loading Spinner Fragmentation** | Shared Primitive | **Medium** | 9+ route pages | Create canonical `PantrySpinnerComponent` |
| **Empty State Inconsistency** | Shared Primitive | **Medium** | Inventory, Shopping, Recipes | Create canonical `PantryEmptyStateComponent` |
| **Form Field & Label Duplication** | Shared Primitive | **High** | All Form Pages | Create canonical `PantryFormFieldComponent` |
| **Dropdown & Select Harmonization** | Shared Primitive | **Critical** | All Pages with `p-select` | Standardize `p-select` styling & create canonical wrapper |
| **Button Class Enforcement** | Shared Primitive | **High** | Action bars, submit buttons | Enforce button contracts `.btn-*` across all pages |
| **Skeleton Loader Standardization** | Shared Primitive | **Medium** | Shopping, Inventory, Recipes | Create canonical `PantrySkeletonComponent` |
| **Status Badge Standardization** | Shared Primitive | **Medium** | Stock items, recipes, cards | Create canonical `PantryBadgeComponent` |
| **AI Agent Harness & Guardrails** | Automated Enforcement | **High** | `.agents/`, `docs/`, `package.json` | Add validation script and structured design system index |

---

## 9. Next Steps

1. Create canonical UI primitives in `frontend/src/app/components/ui/`.
2. Migrate all duplicated search inputs, spinners, empty states, and form fields to the new primitives.
3. Create `docs/design-system.md` and `docs/design-system-index.md`.
4. Add `validate:design-system` command in `package.json`.
5. Run full test suite, linting, formatting, and build checks to guarantee zero regressions.
