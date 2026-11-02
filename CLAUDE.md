# CLAUDE.md - Repository Guidelines for Anthropic Claude AI

> [!IMPORTANT]
> The single canonical source of truth for all workspace rules, agent guidelines, TDD workflows, domain taxonomy, and modular skills is located in [.agents/AGENTS.md](.agents/AGENTS.md).
> All Claude models must read and strictly follow [.agents/AGENTS.md](.agents/AGENTS.md).

---

## 🧭 Product & Design Context

- **[PRODUCT.md](PRODUCT.md):** users, usage contexts, positioning, product principles, and accessibility needs. Read it before planning any feature or user-facing change.
- **[DESIGN.md](DESIGN.md):** the single source of truth for visual design: tokens, components, `@ui` primitives, contracts, exceptions, and enforcement. Read it before any UI work and update it in the same change when a visual rule changes. Older design specs in `docs/archive/` are history only.

---

## 🚀 Key Commands

- **Backend Tests:** `cd backend && deno task test`
- **Backend Lint & Format:** `cd backend && deno lint && deno fmt`
- **Frontend Build & Test:** `cd frontend && npm run test && npm run build`
- **Frontend Lint & Format:** `cd frontend && npm run lint && npm run format`
- **Frontend Design System Validation (mandatory on UI tasks):** `cd frontend && npm run validate:design-system`

---

## 🏷️ Domain Taxonomy Rules

Strict 4-tier domain hierarchy must be enforced across DB, API, models, and UI:
`Ingredient Category` (Tier 1) -> `Ingredient Group` (Tier 2) -> `Ingredient` (Tier 3) -> `Ingredient Item` (Tier 4).

For complete rules, agent personas, and skill definitions, inspect [.agents/AGENTS.md](.agents/AGENTS.md).
