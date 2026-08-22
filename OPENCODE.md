# OPENCODE.md - Repository Guidelines for OpenCode AI

> [!IMPORTANT]
> The single canonical source of truth for all workspace rules, agent guidelines, TDD workflows, domain taxonomy, and modular skills is located in [.agents/AGENTS.md](.agents/AGENTS.md).
> All OpenCode models and tools must read and strictly follow [.agents/AGENTS.md](.agents/AGENTS.md).

---

## 🚀 Key Commands

- **Backend Tests:** `cd backend && deno task test`
- **Backend Lint & Format:** `cd backend && deno lint && deno fmt`
- **Frontend Build & Test:** `cd frontend && npm run test && npm run build`
- **Frontend Lint & Format:** `cd frontend && npm run lint && npm run format`

---

## 🏷️ Domain Taxonomy Rules

Strict 4-tier domain hierarchy must be enforced across DB, API, models, and UI:
`Ingredient Category` (Tier 1) -> `Ingredient Group` (Tier 2) -> `Ingredient` (Tier 3) -> `Ingredient Item` (Tier 4).

For complete rules, agent personas, and skill definitions, inspect [.agents/AGENTS.md](.agents/AGENTS.md).
