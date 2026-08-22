# Pantry Design System Specification

**Version:** 1.0.0  
**Author:** Frontend Architecture & Design Systems Team  
**Scope:** Canonical Design Language, UI Primitives, Tokens, and Component Contracts for the Pantry Application  
**Package Alias:** `@ui` (`src/app/components/ui`)

---

## 1. Design Principles & Aesthetic Foundations

1. **Frosted-Glass Morphism (`glass-card` / `sub-card`)**
   - Translucent multi-layered surfaces over dynamic mesh gradients.
   - High visual depth with crisp borders (`border-surface-200/80` in light mode, `border-surface-800/80` or `border-white/10` in dark mode) and subtle drop shadows.
2. **Slate Neutral & Deep Navy Palette**
   - Neutral foundation uses Tailwind `surface-50` through `surface-950` (Slate system).
   - Elevated popovers and workspace switchers use Deep Navy (`#141c2e` / `navy-900`).
3. **Warm Energetic Orange Primary Accent (`#ea580c` / `primary-600`)**
   - Used intentionally for primary calls-to-action, active navigation tabs, and selected states.
4. **Standard 42px Control Baseline & 12px Radii**
   - Every single-line input, button, select trigger, datepicker, and number input is strictly **42px height** (`h-[42px]`) with **12px radius** (`rounded-xl` / `0.75rem`).
   - Cards and structural containers use **16px radius** (`rounded-2xl` / `1rem`).
5. **Accessibility & Contrast by Default**
   - High text contrast (`text-surface-900` / `text-white` for primary headings, `text-surface-600` / `text-surface-300` for body/labels).
   - Standardized focus rings (`ring-2 ring-primary-500/50`) on interactive controls.
   - Reduced-motion fallbacks (`@media (prefers-reduced-motion: reduce)`).

---

## 2. Design Token Taxonomy

### 2.1 Color Tokens
| Token Name | Light Mode Value | Dark Mode Value | Usage / Semantic Role |
| :--- | :--- | :--- | :--- |
| `primary-500` / `primary-600` | `#f97316` / `#ea580c` | `#f97316` / `#fb923c` | Primary actions, focus rings, brand accents |
| `navy-900` / `navy-950` | `#141c2e` / `#0d1322` | `#141c2e` / `#0d1322` | Floating menus, workspace popovers |
| `surface-50` / `surface-100` | `#f8fafc` / `#f1f5f9` | `#0f172a` / `#1e293b` | Page background, input fields, badges |
| `surface-200` / `surface-300` | `#e2e8f0` / `#cbd5e1` | `#334155` / `#475569` | Component borders, separators |
| `surface-800` / `surface-900` | `#1e293b` / `#0f172a` | `#f1f5f9` / `#ffffff` | Primary typography |
| `emerald-500` / `emerald-600` | `#10b981` / `#059669` | `#34d399` / `#10b981` | Fresh stock, in-cart items, positive metrics |
| `amber-500` / `amber-600` | `#f59e0b` / `#d97706` | `#fbbf24` / `#f59e0b` | Expiring soon, warnings, budget highlights |
| `rose-500` / `rose-600` | `#f43f5e` / `#e11d48` | `#fb7185` / `#f43f5e` | Expired stock, errors, destructive actions |

### 2.2 Sizing, Spacing & Border Radii
| Dimension Role | Value | Token / Class |
| :--- | :--- | :--- |
| **Control Height** | `42px` | `h-[42px]` / `.btn-*` / `.p-inputtext` |
| **Control Border Radius** | `12px` (`0.75rem`) | `rounded-xl` |
| **Card Border Radius** | `16px` (`1rem`) | `rounded-2xl` |
| **Small Pill / Badge Radius** | `8px` / `9999px` | `rounded-lg` / `rounded-full` |
| **Standard Page Max Width** | `80rem` (`1280px`) | `max-w-7xl mx-auto` |
| **Form Container Max Width** | `72rem` / `64rem` | `max-w-6xl` / `max-w-5xl` |

---

## 3. Canonical UI Component Hierarchy (`@ui`)

All shared primitives are exported from `@ui` (`src/app/components/ui/index.ts`):

```typescript
import {
  SearchInputComponent,
  SpinnerComponent,
  EmptyStateComponent,
  BadgeComponent,
  SkeletonComponent,
  FormFieldComponent,
  CardComponent
} from '@ui';
```

### 3.1 `SearchInputComponent` (`pantry-search-input`)
- **Use For:** Table search filters, catalog search bars, real-time query inputs.
- **Inputs:** `value: model<string>`, `placeholder: input<string>`, `disabled: input<boolean>`, `ariaLabel: input<string>`, `clearAriaLabel: input<string>`.
- **Outputs:** `searchChange: output<string>()`.
- **Behavior:** Renders 42px search field with left search icon, auto-clearing `X` button, Escape-key clear, and focus management.

```html
<pantry-search-input
  [(value)]="searchQuery"
  (searchChange)="onSearch($event)"
  placeholder="Search items by name..."
  ariaLabel="Search items">
</pantry-search-input>
```

### 3.2 `SpinnerComponent` (`pantry-spinner`)
- **Use For:** Asynchronous loading states, data fetching indicators, button loading states.
- **Inputs:** `size: input<'xs' | 'sm' | 'md' | 'lg'>`, `color: input<'primary' | 'white' | 'surface'>`, `layout: input<'inline' | 'stacked'>`, `label: input<string>`.
- **Behavior:** Accessible SVG spinner with `role="status"`, `aria-live="polite"`, and screen-reader announcement.

```html
<pantry-spinner size="md" label="Loading inventory..."></pantry-spinner>
```

### 3.3 `EmptyStateComponent` (`pantry-empty-state`)
- **Use For:** Zero-data screens, empty search/filter results, unpopulated catalog groups.
- **Inputs:** `title: input.required<string>`, `description: input<string>`, `icon: input<string>`, `actionText: input<string>`, `actionIcon: input<string>`, `variant: input<'glass' | 'plain'>`.
- **Outputs:** `actionClick: output<void>()`.

```html
<pantry-empty-state
  icon="pi pi-search"
  title="No items found"
  description="Try adjusting your filter or search query."
  actionText="Add Item"
  actionIcon="pi pi-plus"
  (actionClick)="openAddDialog()">
</pantry-empty-state>
```

### 3.4 `BadgeComponent` (`pantry-badge`)
- **Use For:** Inventory freshness status (`fresh`, `expiring`, `expired`), item locations, tags.
- **Inputs:** `variant: input<'fresh' | 'expiring' | 'expired' | 'primary' | 'neutral' | 'location' | 'outline'>`, `size: input<'sm' | 'md'>`, `icon: input<string>`, `dot: input<boolean>`.

```html
<pantry-badge variant="fresh" [dot]="true">Fresh</pantry-badge>
<pantry-badge variant="location" icon="pi pi-map-marker">Pantry Shelf A</pantry-badge>
```

### 3.5 `SkeletonComponent` (`pantry-skeleton`)
- **Use For:** Loading placeholder skeletons during initial page load and tab transitions.
- **Inputs:** `variant: input<'card' | 'row' | 'text' | 'circle' | 'custom'>`, `height: input<string>`, `width: input<string>`, `count: input<number>`.

```html
<pantry-skeleton variant="card" height="120px" [count]="3"></pantry-skeleton>
```

### 3.6 `FormFieldComponent` (`pantry-form-field`)
- **Use For:** Standardizing form field labels, required asterisks, helper hints, and error messages.
- **Inputs:** `label: input<string>`, `forId: input<string>`, `required: input<boolean>`, `hint: input<string>`, `error: input<string>`, `badge: input<string>`.

```html
<pantry-form-field label="Item Name" forId="item-name" [required]="true" [error]="nameError">
  <input pInputText id="item-name" formControlName="name" placeholder="e.g. Greek Yogurt" />
</pantry-form-field>
```

### 3.7 `CardComponent` (`pantry-card`)
- **Use For:** Structural containers, summaries, stat cards, sub-panels.
- **Inputs:** `variant: input<'glass' | 'sub' | 'elevated'>`, `hover: input<boolean>`, `padding: input<'none' | 'sm' | 'md' | 'lg'>`.

```html
<pantry-card variant="glass" padding="md">
  <div header class="font-bold text-lg">Storage Overview</div>
  <p>Main content goes here.</p>
</pantry-card>
```

---

## 4. Dropdown & Select Consolidation Contract

### 4.1 Canonical Select Styling
All dropdowns and selects in Pantry MUST conform to this uniform contract:
1. **Trigger Height:** `42px` (`h-[42px]`)
2. **Trigger Radius:** `12px` (`rounded-xl`)
3. **Trigger Background:** `bg-surface-100 dark:bg-surface-800` (or `bg-white/80 dark:bg-surface-800/80` inside `.glass-card`)
4. **Trigger Border:** `1px solid var(--color-surface-200)` / `dark:border-surface-700`
5. **Focus State:** `border-primary-500` with `ring-2 ring-primary-500/30`
6. **Popup Surface:** `panelStyleClass="p-dialog-glass text-xs"`
7. **Body Attachment:** Always specify `appendTo="body"` on PrimeNG popovers to prevent overflow clipping.

```html
<p-select
  inputId="item-category"
  [options]="categories"
  formControlName="category"
  optionLabel="name"
  placeholder="Select Category"
  class="w-full"
  appendTo="body">
</p-select>
```

---

## 5. Standard Button Contract (`.btn-*`)

Always use standardized CSS utility classes for button actions:
- `.btn-primary`: Primary CTA (`#ea580c`, 42px height, 12px radius, bold text, shadow-md).
- `.btn-secondary`: Neutral bordered action button.
- `.btn-danger`: Destructive / delete action button (`#e11d48`).
- `.btn-ghost`: Borderless subtle text button.
- `.btn-icon`: Square `42x42px` icon-only button.

---

## 6. How Future Changes Work

When modifying global design attributes, make edits at the centralized source of truth:

| To Change... | File Location | Mechanism |
| :--- | :--- | :--- |
| **All Dropdowns** | `src/styles.scss` (lines 650–790) | Adjust `.p-select`, `.p-multiselect` height, radius, background, or panel styles. |
| **All Buttons** | `src/styles.scss` (lines 1350–1495) | Adjust `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-icon`. |
| **Global Border Radius** | `src/styles.scss` & `tailwind.config.js` | Adjust `rounded-xl` (`0.75rem`), `rounded-2xl` (`1rem`). |
| **Brand Primary Colors** | `src/app/app.config.ts` & `src/styles.scss` | Update `MyPreset` primary palette and `@theme` `--color-primary-*`. |
| **Deep Navy Popovers** | `src/styles.scss` & `tailwind.config.js` | Update `--color-navy-900` (`#141c2e`). |
| **Search Inputs** | `src/app/components/ui/search-input/` | Edit canonical `SearchInputComponent`. |
| **Loading Spinners** | `src/app/components/ui/spinner/` | Edit canonical `SpinnerComponent`. |
| **Empty States** | `src/app/components/ui/empty-state/` | Edit canonical `EmptyStateComponent`. |
| **Page-Specific Variants** | Page Component SCSS / Template | Wrap canonical primitive with an explicit variant prop or scoped container. |

---

## 7. Migration & Deprecation Policy

1. **Never copy raw SVG spinners or pulse divs into page templates.** Always use `<pantry-spinner>` or `<pantry-skeleton>`.
2. **Never hand-roll search bars.** Always use `<pantry-search-input>`.
3. **Never hard-code custom Tailwind button styles for standard buttons.** Always use `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, or `.btn-icon`.
4. **Never create local unstyled `<select>` or custom combobox overlays.** Always use PrimeNG `p-select` or `p-autoComplete` with `appendTo="body"`.
5. **Always validate design system changes** with `npm run validate:design-system`.
