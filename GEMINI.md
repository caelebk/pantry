# GEMINI.md - Repository Guidelines for Gemini AI Models

> [!IMPORTANT]
> The single canonical source of truth for all workspace rules, agent guidelines, TDD workflows, domain taxonomy, and modular skills is located in [.agents/AGENTS.md](file:///c:/Users/ckoha/OneDrive/Desktop/personal_github/pantry/.agents/AGENTS.md).
> All Gemini models must read and strictly follow [.agents/AGENTS.md](file:///c:/Users/ckoha/OneDrive/Desktop/personal_github/pantry/.agents/AGENTS.md).

---

## 🚀 Quick Start & Development Commands

- **Concurrent Watch Mode:** `./dev.sh`
- **Backend (Deno + Hono):** `cd backend && deno task dev` (Runs on `http://localhost:8000`)
- **Frontend (Angular 20):** `cd frontend && npm start` (Runs on `http://localhost:4200`)

---

## 🛠️ Mandatory Verification Workflow

All tasks must pass this strict 3-step verification before completion:
1. **Bug & Code Audit:** Inspect changed files, component imports, and template bindings for logic bugs or missing dependencies.
2. **Run Tests:**
   - Backend: `cd backend && deno task test`
   - Frontend: `cd frontend && npm run test`
3. **Ensure Build Compiles:**
   - Frontend Build: `cd frontend && npm run build`
   - Formatting & Linting: `cd backend && deno lint && deno fmt` and `cd frontend && npm run format && npm run lint`

---

## 🏷️ Domain Hierarchy (Strict 4-Tier)

```
[ Ingredient Category ] (Tier 1) ──> [ Ingredient Group ] (Tier 2) ──> [ Ingredient ] (Tier 3) ──> [ Ingredient Item ] (Tier 4)
```

For full details, agent roles, and specialized skills, see [.agents/AGENTS.md](file:///c:/Users/ckoha/OneDrive/Desktop/personal_github/pantry/.agents/AGENTS.md).
