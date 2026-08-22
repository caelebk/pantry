# Pantry Design System Index (Agent-Readable Map)

**Target Audience:** AI Coding Assistants & Automated Tools  
**Specification:** `docs/design-system.md`  
**Audit:** `docs/design-system-audit.md`  
**Root Token Source:** `frontend/src/styles.scss` & `frontend/src/app/app.config.ts`  
**Canonical UI Primitives Import:** `@ui` (`src/app/components/ui/index.ts`)

---

## 1. Quick Component Lookup Table

| Component | Canonical Tag | Canonical Import | Allowed Variants | Allowed Sizes | Replacement For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SearchInput** | `<pantry-search-input>` | `import { SearchInputComponent } from '@ui'` | `default` | `md (42px)` | Hand-coded `<div class="relative"><i class="pi pi-search"></i><input ...>` |
| **Spinner** | `<pantry-spinner>` | `import { SpinnerComponent } from '@ui'` | `primary`, `white`, `surface` | `xs`, `sm`, `md`, `lg` | Hand-coded SVG `<svg class="animate-spin ...">` or border spinners |
| **EmptyState** | `<pantry-empty-state>` | `import { EmptyStateComponent } from '@ui'` | `glass`, `plain` | `md` | Hand-coded empty divs with icon & text |
| **Badge** | `<pantry-badge>` | `import { BadgeComponent } from '@ui'` | `fresh`, `expiring`, `expired`, `primary`, `neutral`, `location`, `outline` | `sm`, `md` | Inline styled status spans and arbitrary badge pills |
| **Skeleton** | `<pantry-skeleton>` | `import { SkeletonComponent } from '@ui'` | `card`, `row`, `text`, `circle`, `custom` | `custom height/width` | Raw `div.animate-pulse` placeholders |
| **FormField** | `<pantry-form-field>` | `import { FormFieldComponent } from '@ui'` | `default` | `md` | Duplicated `<label>` + asterisks + error message wrappers |
| **Card** | `<pantry-card>` | `import { CardComponent } from '@ui'` | `glass`, `sub`, `elevated` | `none`, `sm`, `md`, `lg` padding | Ad-hoc card containers |
| **Button** | `<button class="btn-*">` | Global CSS in `styles.scss` | `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-icon` | `md (42px)` | Custom inline Tailwind button class strings |
| **Select / Dropdown** | `<p-select>` | `import { SelectModule } from 'primeng/select'` | Global theme contract | `md (42px)` | Native `<select>` or hand-rolled comboboxes |

---

## 2. Forbidden Anti-Patterns & Immediate Replacements

| ❌ Forbidden Anti-Pattern | ✅ Mandatory Canonical Pattern |
| :--- | :--- |
| Hand-rolling a search input with `<i class="pi pi-search">` + `<input>` + clear button | Use `<pantry-search-input [(value)]="..." (searchChange)="...">` |
| Copying `<svg class="animate-spin ...">` or border spinners | Use `<pantry-spinner size="..." label="...">` |
| Creating inline empty state boxes with custom icons and margins | Use `<pantry-empty-state icon="..." title="..." description="...">` |
| Writing long inline Tailwind button classes (`bg-primary-600 hover:... py-3 rounded-xl ...`) | Use `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, or `.btn-icon` |
| Styling custom dropdowns with raw unstyled `<ul><li>` absolute menus | Use PrimeNG `<p-select appendTo="body">` or `<p-autoComplete>` |
| Omitting `appendTo="body"` on PrimeNG dropdowns/popovers | Always add `appendTo="body"` on `p-select` / `p-dialog` / `p-datepicker` |
| Using raw hex colors (e.g. `#ea580c`, `#141C2E`, `#f8fafc`) directly in HTML | Use design tokens: `bg-primary-600`, `bg-[#141C2E]`, `bg-surface-50`, etc. |

---

## 3. Form Field Composition Standard

```html
<pantry-form-field
  label="Ingredient Name"
  forId="ingredient-name"
  [required]="true"
  [error]="form.controls.name.invalid && form.controls.name.touched ? 'Name is required' : ''">
  <input
    pInputText
    id="ingredient-name"
    formControlName="name"
    placeholder="e.g. Roma Tomato"
    class="w-full" />
</pantry-form-field>
```

---

## 4. Design System Validation Command

Before concluding any frontend UI task, future agents MUST run:

```bash
cd frontend && npm run validate:design-system
```

This aggregates:
1. `npm run format:check` (Prettier formatting validation)
2. `npm run lint` (ESLint static analysis)
3. `npm run test` (Vitest unit and component regression suite)
4. `npm run build` (Angular AOT production compilation)
