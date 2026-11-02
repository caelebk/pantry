> [!WARNING]
> ARCHIVED 2026-11-02: superseded by [DESIGN.md](../../DESIGN.md), the single source of truth for Pantry's visual design. Kept for history only; do not follow or update this file.

# Pantry Design System Index (Agent-Readable Map)

**Target Audience:** AI Coding Assistants & Automated Tools  
**Specification:** `docs/design-system.md`  
**Audit:** `docs/design-system-audit.md`  
**Root Token Source:** `frontend/src/styles.scss` & `frontend/src/app/app.config.ts`  
**Canonical UI Primitives Import:** `@ui` (`src/app/components/ui/index.ts`)

**Typography prototype:** use `type-page-title`, `type-section-title`,
`type-label`, `type-meta`, and `type-value` from `styles.scss`. Native system
sans replaces Inter; labels no longer receive forced uppercase. See the Typography prototype
section of the specification and the `/design-system` sample.

**Page geometry pilot:** the shell owns outer gutters. Use `page-layout` for wide
workspaces and `page-layout page-layout--form` for left-aligned compact forms
(640px maximum). Use `page-header`, `page-header__actions` and optional
`page-header--compact` for title/action alignment. Current consumers are Home,
Ingredient Items and Add Ingredient; migrate other pages in their own slices.
See “Page geometry pilot (S01)” in the specification.

**Navigation (S02):** destinations use native RouterLink anchors; disclosure/action controls remain buttons. Sidebar current-page markers require an exact normalized path. Breadcrumbs use quiet text, a semantic ordered list, and only the final current-page marker; deep phone paths show parent/current while desktop shows the full path. Navigation targets retain 42px minimum height.

---

## 1. Quick Component Lookup Table

| Component             | Canonical Tag            | Canonical Import                                | Allowed Variants                                                                                                                      | Allowed Sizes                    | Replacement For                                                            |
| :-------------------- | :----------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------- | :------------------------------------------------------------------------- |
| **SearchInput**       | `<pantry-search-input>`  | `import { SearchInputComponent } from '@ui'`    | `default`                                                                                                                             | `md (42px)`                      | Hand-coded `<div class="relative"><i class="pi pi-search"></i><input ...>` |
| **Spinner**           | `<pantry-spinner>`       | `import { SpinnerComponent } from '@ui'`        | `primary`, `white`, `surface`                                                                                                         | `xs`, `sm`, `md`, `lg`           | Hand-coded SVG `<svg class="animate-spin ...">` or border spinners         |
| **EmptyState**        | `<pantry-empty-state>`   | `import { EmptyStateComponent } from '@ui'`     | `glass`, `plain`                                                                                                                      | `md`                             | Hand-coded empty divs with icon & text                                     |
| **Badge**             | `<pantry-badge>`         | `import { BadgeComponent } from '@ui'`          | `fresh`, `expiring`, `expired`, `primary`, `neutral`, `location`, `outline`, `indigo`, `purple` (+ `[dot]`, `[live]`, `[borderless]`) | `sm`, `md`                       | Inline styled status spans and arbitrary badge pills                       |
| **Skeleton**          | `<pantry-skeleton>`      | `import { SkeletonComponent } from '@ui'`       | `card`, `row`, `text`, `circle`, `custom`                                                                                             | `custom height/width`            | Raw `div.animate-pulse` placeholders                                       |
| **FormField**         | `<pantry-form-field>`    | `import { FormFieldComponent } from '@ui'`      | `default`                                                                                                                             | `md`                             | Duplicated `<label>` + asterisks + error message wrappers                  |
| **Card**              | `<pantry-card>`          | `import { CardComponent } from '@ui'`           | `glass`, `sub`, `elevated`                                                                                                            | `none`, `sm`, `md`, `lg` padding | Ad-hoc card containers                                                     |
| **Button**            | `<button class="btn-*">` | Global CSS in `styles.scss`                     | `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-icon`, `.btn-icon-sm`                                            | `md (42px)`, icon-sm `32px`      | Custom inline Tailwind button class strings                                |
| **Select / Dropdown** | `<p-select>`             | `import { SelectModule } from 'primeng/select'` | Global theme contract (`appendTo="body"`, type-to-filter via `[filter]="true"`)                                                       | `md (42px)`                      | Native `<select>` or hand-rolled comboboxes                                |

---

## 2. Forbidden Anti-Patterns & Immediate Replacements

| ❌ Forbidden Anti-Pattern                                                                                | ✅ Mandatory Canonical Pattern                                                                                                |
| :------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| Hand-rolling a search input with `<i class="pi pi-search">` + `<input>` + clear button                   | Use `<pantry-search-input [(value)]="..." (searchChange)="...">`                                                              |
| Copying `<svg class="animate-spin ...">` or border spinners                                              | Use `<pantry-spinner size="..." label="...">`                                                                                 |
| Creating inline empty state boxes with custom icons and margins                                          | Use `<pantry-empty-state icon="..." title="..." description="...">`                                                           |
| Writing long inline Tailwind button classes (`bg-primary-600 hover:... py-3 rounded-xl ...`)             | Use `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, or `.btn-icon`                                             |
| Styling custom dropdowns with raw unstyled `<ul><li>` absolute menus                                     | Use PrimeNG `<p-select appendTo="body">` or `<p-autoComplete>`                                                                |
| Omitting `appendTo="body"` on PrimeNG dropdowns/popovers                                                 | Always add `appendTo="body"` on `p-select` / `p-dialog` / `p-datepicker`                                                      |
| Using raw hex colors (e.g. `#ea580c`, `#141C2E`, `#f8fafc`) directly in HTML                             | Use design tokens: `bg-primary-600`, `bg-navy-900`, `bg-surface-50`, etc.                                                     |
| Hand-rolling inline pills for entity/taxonomy reference columns (Ingredient, Ingredient Group, Category) | Use `<pantry-badge variant="primary">`; unassigned refs use `<span class="text-surface-400 italic text-xs">Unassigned</span>` |

---

## 4. Automated Guardrails

`npm run lint:design-system` scans all page/component templates (including `.ts` inline
templates and the app shell) and fails on: raw `<select>`, `animate-spin` spinners,
`animate-pulse` skeletons, inline primary-button strings, inline badge pills, and hardcoded
brand hexes (`#141c2e`, `#ea580c`, `#0d1322`, `#8b5cf6`). Sanctioned exceptions live in the
`ALLOWLIST` of `frontend/tools/check-design-system.mjs` and must be mirrored in
`docs/design-system.md §8`. Run the full gate with `npm run validate:design-system`
(prettier → eslint → guardrails → vitest → build).

---

## 3. Form Field Composition Standard

```html
<pantry-form-field
  label="Ingredient Name"
  forId="ingredient-name"
  [required]="true"
  [error]="form.controls.name.invalid && form.controls.name.touched ? 'Name is required' : ''"
>
  <input
    pInputText
    id="ingredient-name"
    formControlName="name"
    placeholder="e.g. Roma Tomato"
    class="w-full"
  />
</pantry-form-field>
```

---

## 5. Design System Validation Command

Before concluding any frontend UI task, future agents MUST run:

```bash
cd frontend && npm run validate:design-system
```

This aggregates:

1. `npm run format:check` (Prettier formatting validation)
2. `npm run lint` (ESLint static analysis)
3. `npm run lint:design-system` (design-system guardrails)
4. `npm run test` (Vitest unit and component regression suite)
5. `npm run build` (Angular AOT production compilation)

## Shared interaction contracts

S03–S07 contracts are documented in `docs/design-system.md` (Shared interaction contracts).
Use the shared `KitchenCreateDialogComponent` for kitchen creation. Pending creation blocks
repeated submission and dismissal; errors remain inline and retain input. Mobile navigation
has its own state, focus containment and inert background. Toast errors persist until dismissed.
Projected form controls associate help/errors automatically through `NgControl`; plain inputs
need `#fieldControl`. Long-form error summaries link to focus targets. Pagination clamps result
changes, announces range/current page, and uses fewer navigation buttons on phones.
Evidence: `docs/design-evidence/S03-S07/README.md`.

## Inventory rollback

Inventory pages and their forms use their original branch implementations following the user's revert request. Cleanup-specific toolbar, editor and centered-form components are no longer active. See [rollback verification](design-evidence/inventory-rollback/README.md).
