# Frontend Agent Guidelines: Pantry Design System

**Target:** `frontend/`  
**Specification:** [`docs/design-system.md`](../docs/design-system.md)  
**Quick Index:** [`docs/design-system-index.md`](../docs/design-system-index.md)

---

## ⚡ Essential Rules for Frontend UI Work

1. **Check `@ui` before building any component**: All canonical UI primitives are exported from `@ui` (`src/app/components/ui/index.ts`).
2. **Never duplicate shared primitives**: Do not copy SVG spinners, search input markup, empty state boxes, or raw pulse divs into page templates.
3. **Form controls are strictly 42px**: All inputs, selects, and buttons must have a consistent `42px` height (`h-[42px]`) with `12px` border radius (`rounded-xl`).
4. **Standardize Buttons**: Use `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, or `.btn-icon`. Avoid ad-hoc inline Tailwind button strings.
5. **Always add `appendTo="body"` to PrimeNG popovers**: `p-select`, `p-dialog`, and `p-datepicker` must specify `appendTo="body"` to avoid clipping.
6. **Required Validation Command**: Run `npm run validate:design-system` before finishing any frontend task.

---

## 📋 Standard UI Task Prompt Template

When executing UI modifications, follow this structured pattern:

```markdown
### Design-System Impact Report

- **Canonical components used:** (e.g. `pantry-search-input`, `pantry-spinner`)
- **Tokens used or changed:** (e.g. `navy-900`, `primary-600`)
- **New variants introduced:** (e.g. none)
- **Page-specific overrides:** (e.g. none)
- **Accessibility states verified:** (e.g. keyboard focus, ARIA labels, light/dark contrast)
- **Responsive states verified:** (e.g. mobile 375px, desktop 1280px)
- **Other screens affected:** (e.g. none)
- **Validation performed:** `npm run validate:design-system`
```
