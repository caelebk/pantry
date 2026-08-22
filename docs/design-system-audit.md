# Design System Audit: Pantry Frontend

**Status:** Completed — foundation fully migrated (v2.0.0)  
**Author:** Senior Design-Systems Engineer, Frontend Architect, & UI/UX Reviewer  
**Scope:** `frontend/` (Angular 20 Standalone, Tailwind CSS v4, PrimeNG 20, SCSS, Transloco)  
**Date:** August 2026 (revised after the completion migration on branch `feat/design-system-completion`)

---

## 1. Executive Summary

Pantry's visual identity — **frosted-glass morphism**, **slate neutral surfaces**, **warm orange
primary (`primary-600`)**, **deep navy floating surfaces (`navy-900`)**, and a strict **42px
control baseline with 12px radii** — is codified in a centralized design system and now enforced
by automated guardrails.

This revision supersedes the original August 2026 audit. The first pass built the token layer and
seven canonical `@ui` primitives; adoption, however, was partial. This second pass completed the
migration: all raw `<select>` controls were eliminated, the hand-rolled ingredient combobox was
retired, ~130 buttons moved onto the `.btn-*` contract, ~57 badge pills and ~54 form fields now
use canonical primitives, dark mode has a single owner, and a grep-based guardrail script fails
the build when legacy patterns reappear.

**Net diff:** 77 files changed, +1153 / −1683 lines (dead markup removed).

---

## 2. Current Frontend & Styling Architecture

### 2.1 Technology Stack
- **Framework:** Angular 20.2 (standalone components, signals, `OnPush` everywhere)
- **Routing:** Angular Router, 26 lazy `loadComponent()` routes + dev-only `/design-system` gallery
- **Styling:** Tailwind CSS v4 (`@theme` tokens in `src/styles.scss`) + global component classes
  (`.glass-card`, `.sub-card*`, `.btn-*`, `.badge-*`, form-control overrides for PrimeNG)
- **UI primitives:** PrimeNG 20 (`p-select`, `p-datepicker`, `p-inputnumber`, dialogs) themed via
  `MyPreset` (Aura-based) in `src/app/app.config.ts`
- **Icons:** PrimeIcons (+ Material Symbols for the single brand glyph)
- **i18n:** Transloco 8.2
- **Testing:** Vitest 4 (AnalogJS), Playwright (E2E); ESLint 9 + Prettier
- **Theming:** `ThemeService` (`core/services/theme.service.ts`) is the single writer of the
  `.dark` class; user preference synced from the signed-in account

### 2.2 Token Layer
Single source of truth is the Tailwind v4 `@theme` block in `styles.scss`:
`--color-primary-*` (orange scale), `--color-surface-*` (slate), `--color-navy-900/950`,
`--font-sans` (Inter). The former `tailwind.config.js` was **deleted** (inert under v4, its
palettes were dead duplicates). Raw hexes in global component classes (`.btn-primary`,
`.badge-*`, gradients) were replaced with `var(--color-*, fallback)` references.

### 2.3 Component Hierarchy
```
Tokens (@theme + MyPreset)
└── Global contracts (.btn-*, .glass-card/.sub-card, PrimeNG control styling)
    └── Canonical @ui primitives (src/app/components/ui/)
        ├── SearchInputComponent   ├── BadgeComponent    ├── CardComponent
        ├── SpinnerComponent       ├── SkeletonComponent ├── EmptyStateComponent
        └── FormFieldComponent
        └── Composite pages consume primitives + contracts only
```

---

## 3. Route Inventory

26 authenticated/guest routes across auth, home, inventory (items, ingredients, groups,
unit-reconciliation), recipes, shopping-list (incl. stores, restock review), meal-planner,
profile — plus the dev-only `/design-system` gallery (guard `devOnlyGuard`, redirects to home in
production). All routes lazy-load.

---

## 4. Inconsistency Matrix — Before → After

| Category | Before (verified) | After | Status |
| :--- | :--- | :--- | :--- |
| Buttons on `.btn-*` contract | ~10 of 260 | **139 explicit uses**; remaining are segmented state pills, text links, emerald state toggles (documented below) | ✅ Resolved |
| Native `<select>` elements | 5 | **0** (all converted to `p-select appendTo="body"`) | ✅ Resolved |
| Hand-rolled comboboxes | 1 (`add-recipe-form`, absolute `ul/li` popup + z-index hacks) | **0** (replaced by `p-select [filter]="true"`; dead TS handlers removed) | ✅ Resolved |
| `p-select` trigger override strings (`!h-[42px] !rounded-xl !bg-* …`) | 28 instances | **0** (styling owned once by global CSS) | ✅ Resolved |
| Inline badge pills (`bg-{tone}-500/10 …`) | ~60 | **57 canonical `<pantry-badge>` uses**; 3 documented exceptions remain | ✅ Resolved |
| Duplicated label/error form markup | ~140 labels | **54 canonical `<pantry-form-field>` groups**; composite headers (Clear buttons, "Inherited" pills) intentionally left native | ✅ Resolved |
| Hand-rolled spinners | 12 across 9 files | **12 canonical `<pantry-spinner>` uses**, 0 raw SVGs | ✅ Resolved |
| Skeleton placeholders | 1 adopter, many raw pulse divs | **5 canonical `<pantry-skeleton>` uses** (home, shopping-list); bare pulse dots reclassified as live-status indicators (`[dot][live]` badges or intentional dots) | ✅ Resolved |
| Dark-mode toggling | 3 independent implementations | **1 `ThemeService`** used by shell + auth pages; pre-boot script prevents FOUC | ✅ Resolved |
| Hardcoded brand hexes in templates | sidebar `#141C2E`, category fallbacks | sidebar → `bg-navy-900`; category data-driven colors documented exception | ✅ Resolved (documented exceptions only) |
| Duplicate `.sub-card-hover` definitions | 2 | **1** | ✅ Resolved |

---

## 5. Accessibility Findings & Actions

| Finding | Severity | Status |
| :--- | :--- | :--- |
| Icon-only buttons without accessible names (table rows, docks, removes) | High | Fixed during button migration — `aria-label` added at every converted icon button |
| Form labels not programmatically associated (`id`/`for`) | High | Fixed via `pantry-form-field [forId]`; `p-select` conversions set `inputId` |
| Validation errors not announced | Medium | `pantry-form-field` renders errors with `role="alert"` |
| Hand-rolled combobox lacked keyboard nav/Escape | High | Eliminated — PrimeNG select provides full keyboard/AT support |
| Focus rings | Low | Preserved — global focus ring untouched; nothing removed |
| Reduced motion | Low | Already handled globally (`prefers-reduced-motion` blocks); canvas animation respects it |
| Contrast: `text-surface-400` small text in light mode | Medium | Open (pre-existing, app-wide muted-text choice) — flagged as follow-up |

---

## 6. Responsive Findings

No page-specific media queries exist; all responsiveness flows through Tailwind prefixes
(`sm:` ×111, `md:` ×81, `lg:` ×60). Toolbars stack `flex-col sm:flex-row`. Tables use PrimeNG
responsive/scrollable modes. The 42px baseline doubles as touch-target height; compact
`.btn-icon-sm` (32px) remains a deliberate density trade-off in dense table rows — mitigated by
mandatory accessible names. No regressions introduced; no new breakpoints added.

---

## 7. Remaining Exceptions (all documented, allowlisted)

1. **`ingredient-category.component.html`** — data-driven category colors concatenate hex from
   backend data; `#ea580c` is only the missing-data fallback. Tokens cannot express arbitrary
   runtime values.
2. **`add-recipe-form` difficulty selector** — bordered emerald/amber/rose *state* branches;
   selection color is the semantic, not a pill/badge.
3. **`daily-focus` status tile** — 40px icon tile with embedded tone ternary; not a badge.
4. **Segmented filter pills, page-number toggles, text links, emerald state toggles** —
   micro-controls where 42px action-button heights would break layout; they are navigation/state
   patterns, not action buttons.
5. **Auth pages' immersive split-screen layout** — kept bespoke (marketing surface, low
   traffic); theme toggle routed through `ThemeService`.

Each maps to an `ALLOWLIST` entry in `tools/check-design-system.mjs` + a row in
`docs/design-system.md §8`.

---

## 8. Prioritized Action Plan — Completion State

| Item | Classification | Priority | Status |
| :--- | :--- | :--- | :--- |
| Delete dead `tailwind.config.js`, dedupe `.sub-card-hover`, tokenize global-class hexes | Design token | High | ✅ Done |
| Single `ThemeService`; pre-boot dark class | State handling | High | ✅ Done |
| Replace 5 native selects; retire combobox; strip 28 override strings | Shared primitive (dropdown contract) | Critical | ✅ Done |
| Migrate spinners/skeletons to `@ui` | Shared primitive | Medium | ✅ Done |
| Badge variants (`indigo`, `purple`, `[live]`) + migration | Shared primitive | Medium | ✅ Done |
| `pantry-form-field` adoption (~54 groups) | Shared primitive | High | ✅ Done |
| Button contract enforcement (~130 conversions, `.btn-icon-sm` variant) | Shared primitive | High | ✅ Done |
| Guardrail script wired into `validate:design-system` | Automated enforcement | High | ✅ Done |
| Dev-only `/design-system` gallery | Documentation | Medium | ✅ Done |
| Docs v2.0.0 + index refresh | Documentation | High | ✅ Done |

### Follow-ups (recommended, non-blocking)
1. **Contrast sweep:** audit `text-surface-400` usages against WCAG AA in light mode.
2. **Visual regression tooling:** no screenshot-diff harness exists. Recommend Playwright
   screenshot tests against the `/design-system` gallery + key routes (needs running backend).
3. **Persist auth-page theme toggles** back to the user profile (`themePreference`).
4. **`pantry-badge` live-dot parity:** restock-review migrated badges use static dots where the
   originals pulsed; consider `[live]="true"` there after visual confirmation.
5. **PrimeNG preset-token theming:** long-term, replace ~150 `!important` overrides in
   `styles.scss` with `definePreset` token mappings (large, low-risk-per-step refactor).

---

## 9. Verification Performed

- `npm run format` / `format:check` — clean
- `npm run lint` — all files pass
- `npm run lint:design-system` (new guardrails) — passes with documented allowlist
- `npm test` — 45 files / 187 tests green (badge spec extended for `indigo`/`purple`/`live`)
- `npm run build` — production AOT bundle clean (pre-existing SCSS budget warning on
  restock-review-page only)
- Manual route inspection recommended post-merge; Playwright e2e requires a running backend and
  was not executed in this environment (see follow-up #2).
