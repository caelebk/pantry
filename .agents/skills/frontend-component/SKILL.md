---
name: frontend-component
description: Design principles, PrimeNG glassmorphism styling, Transloco i18n, and Angular 20 standalone component standards for Pantry frontend.
---

# Skill: Frontend Component Development

Use this skill when building or modifying Angular 20 components, pages, or services in `frontend/src/app/`.

## Framework & UI Guidelines

### 1. Component Architecture
- Use **Angular Standalone Components** (`standalone: true`).
- Keep components modular, concise, and typed.
- Inject services cleanly using `inject(Service)` or constructor injection.

### 2. UI Aesthetics & Styling
- **Glassmorphism Theme:** Use `.glass-card` styling classes for container cards and interactive panels.
- **UI Components:** Prefer PrimeNG 20 controls (`p-button`, `p-table`, `p-dialog`, `p-card`, `p-toast`, etc.).
- **Tailwind v4:** Combine Tailwind utilities for layout, spacing, and flexbox grid with PrimeNG tokens.
- **Design Tokens & Colors:** Maintain consistent color palettes across light/dark themes. Avoid hardcoded, non-standard inline color styles.

### 3. Internationalization (i18n)
- Use **Transloco** (`@jsverse/transloco`).
- Always define user-visible UI text in `frontend/public/i18n/en.json` (and other locale files).
- Reference translation keys in HTML templates using standard `transloco` pipe or directive:
  ```html
  <h2>{{ 'INVENTORY.TITLE' | transloco }}</h2>
  ```

### 4. Domain Model Mapping
Ensure domain labels strictly reflect the 4-tier domain terminology:
- Tier 1: `Ingredient Category`
- Tier 2: `Ingredient Group`
- Tier 3: `Ingredient`
- Tier 4: `Ingredient Item`

## Testing Checklist
- [ ] Angular unit test spec updated (`*.spec.ts`).
- [ ] Run `npm run lint` for ESLint check.
- [ ] Run `npm run format` for Prettier code formatting.
- [ ] Run `npm run test` for Karma/Jasmine verification.
