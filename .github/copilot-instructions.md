# GitHub Copilot Instructions

All workspace rules, architecture guidelines, domain taxonomy rules, and specialized skills are maintained in `.agents/AGENTS.md`.

## Key Rules for Copilot Code Generation
1. **TDD First:** Always generate test cases (`backend/tests/` or Angular `.spec.ts`) before or alongside implementation code.
2. **Strict Domain Terminology:** Use `Ingredient Category` (Tier 1), `Ingredient Group` (Tier 2), `Ingredient` (Tier 3), and `Ingredient Item` (Tier 4). Never use "Nutrient Group", "Master Ingredient", or plain "Item".
3. **Database Security:** Always use prepared parameterized statements (`db.prepare(...)`) in `backend/src/services/`. Never interpolate variables directly into SQL string queries.
4. **Angular 20 Standalone:** Use standalone Angular components (`standalone: true`), PrimeNG 20 controls, and TailwindCSS v4 with `.glass-card` styling.
5. **Transloco i18n:** Use Transloco translation keys from `frontend/public/i18n/en.json`.
