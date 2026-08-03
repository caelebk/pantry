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

## 🛠️ Mandatory Verification Commands

- **Backend Tests:** `cd backend && deno task test`
- **Backend Lint & Format:** `cd backend && deno lint && deno fmt`
- **Frontend Tests & Build:** `cd frontend && npm run test && npm run build`
- **Frontend Lint & Format:** `cd frontend && npm run lint && npm run format`

---

## 🏷️ Domain Hierarchy (Strict 4-Tier)

```
[ Ingredient Category ] (Tier 1) ──> [ Ingredient Group ] (Tier 2) ──> [ Ingredient ] (Tier 3) ──> [ Ingredient Item ] (Tier 4)
```

For full details, agent roles, and specialized skills, see [.agents/AGENTS.md](file:///c:/Users/ckoha/OneDrive/Desktop/personal_github/pantry/.agents/AGENTS.md).
