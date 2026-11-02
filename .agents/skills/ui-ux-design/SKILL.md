---
name: ui-ux-design
description: UI/UX Design Specialist skill for ensuring consistent thematic aesthetics, precise element sizing and alignment, modern minimalism, visual hierarchy, dark/light glassmorphism, and intuitive user ergonomics across the Pantry application.
---

# Skill: UI/UX Design & Aesthetic Standardization

Use this skill when designing, building, auditing, or refining user interfaces, page layouts, form controls, and visual components in `frontend/src/app/`.

## 🎨 Core Design Principles

**Source of truth:** [`DESIGN.md`](../../../DESIGN.md) at the repository root defines Pantry's tokens, type roles, surfaces, components, interaction contracts, and documented exceptions. Read it before any UI work. Where this skill and `DESIGN.md` disagree, `DESIGN.md` wins. Read [`PRODUCT.md`](../../../PRODUCT.md) for who the product serves and where it is used (phone in the kitchen, phone at the store, desktop planning).

### 1. Consistent Theme & Color System
- **Curated Palette**: Use design tokens (`bg-surface-100`, `dark:bg-surface-800`, `text-primary-600`, `border-surface-200`, `dark:border-surface-700`). Never introduce ad-hoc inline hex values.
- **Surfaces**: Use `pantry-card` (`glass`, `sub`, `elevated`) or `.glass-card` / `.sub-card`. Cards are nearly opaque frosted surfaces, not translucent blur panels; depth comes from borders and tone, and only floating overlays cast a visible shadow.
- **Semantic Accents** (see DESIGN.md → Colors):
  - `primary` (Ember Orange): primary actions, focus, selection, and current navigation only.
  - `emerald` / `amber` / `rose`: fresh / expiring / expired stock, warnings, errors, and destructive actions. Never decorative, and always paired with a label or icon.

### 2. Strict Input & Component Sizing Alignment
- **Form Control Height Standard**:
  - All form controls (inputs, dropdowns, date pickers, read-only inherited containers) rendered side-by-side in grid columns MUST share the EXACT same height.
  - **Standard Field Height**: `42px` (`h-[42px]`). Apply `styleClass="w-full !h-[42px]"` and `inputStyleClass="w-full !h-[42px] !rounded-xl"` on PrimeNG controls (`p-inputnumber`, `p-select`, `p-datePicker`).
  - Read-only or inherited display containers must use matching `w-full h-[42px] flex items-center px-3.5 rounded-xl`.
- **Label Header Vertical Alignment**:
  - Wrap side-by-side field label headers in `<div class="flex items-center justify-between h-6 mb-1.5">`.
  - Ensures label text across adjacent grid columns aligns perfectly on the exact same horizontal baseline regardless of badges, icons, or action links.

### 3. Modern Minimalism & Visual Hierarchy
- **Typography & Scale**: Use the named type roles from DESIGN.md → Typography: `type-page-title`, `type-section-title`, `type-label` (13px medium, natural case — never uppercase tracked labels), `type-meta`, and `type-value`. Body and control text are 14px. Avoid extra-bold headings.
- **Whitespace & Layout**: Maintain consistent grid gaps (`gap-4` for form fields, `space-y-6` between major section cards). Avoid cramped layouts or uneven margins.
- **Corner Radius Uniformity**: Use standard `rounded-xl` for form controls/buttons and `rounded-2xl` for outer cards and modal panels.

### 4. User Ergonomics & Visibility
- **State Feedback**:
  - **Read-Only / Inherited Fields**: Remove misleading required `*` indicators. Add an explicit badge instead (e.g., `<pantry-badge variant="primary" size="sm" icon="pi pi-lock">Inherited</pantry-badge>`); never hand-roll an inline pill.
  - **Unselected / Pristine States**: Show clear, subtle dashed helper text (`<i class="pi pi-info-circle"></i> Select an ingredient first`).
- **Contrast & Legibility**: Ensure body text and badge labels pass WCAG AA contrast against both light (`text-surface-700` / `text-surface-900`) and dark (`dark:text-surface-300` / `dark:text-white`) backgrounds.

### 5. Canonical UI Primitives (`@ui`)
Always import and reuse shared components from `@ui` (`src/app/components/ui`):
- `SearchInputComponent` (`<pantry-search-input>`): Standardized 42px search field with clear action.
- `SpinnerComponent` (`<pantry-spinner>`): Semantic loading spinner (`xs`, `sm`, `md`, `lg`).
- `EmptyStateComponent` (`<pantry-empty-state>`): Standard empty view with title, description, and action.
- `BadgeComponent` (`<pantry-badge>`): Standardized freshness, location, and metadata badges.
- `SkeletonComponent` (`<pantry-skeleton>`): Harmonized placeholder loaders.
- `FormFieldComponent` (`<pantry-form-field>`): Encapsulates label, asterisk, hint, and error.
- `CardComponent` (`<pantry-card>`): Standardized glass/sub-card containers.

### 6. Domain Taxonomy Adherence
Always present UI labels using the strict 4-tier domain hierarchy:
1. `Ingredient Category` (Tier 1)
2. `Ingredient Group` (Tier 2)
3. `Ingredient` (Tier 3)
4. `Ingredient Item` (Tier 4)

---

## 📋 Mandatory UI Change Impact Report

For every UI task, include this compact report in your completion response:
```markdown
### Design-System Impact Report
- **Canonical components used:** (e.g. `pantry-search-input`, `pantry-spinner`, `pantry-badge`)
- **Tokens used or changed:** (e.g. `navy-900`, `primary-600`, `surface-100`)
- **New variants introduced:** (e.g. none / documented in `DESIGN.md`)
- **Page-specific overrides:** (e.g. none)
- **Accessibility states verified:** (e.g. keyboard focus, ARIA labels, light/dark contrast)
- **Responsive states verified:** (e.g. mobile 375px, desktop 1280px)
- **Other screens affected:** (e.g. none / inventory & recipes search bars)
- **Validation performed:** `npm run validate:design-system`
```

---

## 🛠️ Verification Checklist for UI Changes
- [ ] Consult `DESIGN.md` (and `PRODUCT.md` for usage context).
- [ ] Reuse canonical UI primitives from `@ui`.
- [ ] Standard button contracts (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-icon`) applied.
- [ ] Grid column label headers wrapped in `<div class="flex items-center justify-between h-6 mb-1.5">` or `<pantry-form-field>`.
- [ ] Adjacent form controls share identical explicit height (`h-[42px]`).
- [ ] Light and Dark mode contrast verified for custom badges and glass cards.
- [ ] Transloco i18n keys used for user-facing label text (`frontend/public/i18n/en.json`).
- [ ] Design system validation passed (`npm run validate:design-system`).
