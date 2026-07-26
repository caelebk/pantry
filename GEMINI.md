# GEMINI.md - Local Development & Repository Guidelines

This document provides essential repository context, architecture guidelines, domain terminology rules, and CLI development commands for AI models and developers working on **Pantry**.

---

## 🚀 Quick Start & Local Development

Run both backend and frontend concurrently in development watch mode:

```bash
./dev.sh
```

Or run services individually:

- **Backend (Deno + Hono)**: `cd backend && deno task dev` *(Runs on http://localhost:8000)*
- **Frontend (Angular 20)**: `cd frontend && npm start` *(Runs on http://localhost:4200)*

---

## 🛠️ Key CLI Commands

### Backend (`/backend`)

| Command | Description |
| :--- | :--- |
| `deno task dev` | Start backend in watch mode |
| `deno task start` | Start backend in production mode |
| `deno task test` | Run backend Deno unit/integration test suite |
| `deno task db:migrate` | Execute pending SQL migrations |
| `deno task db:seed` | Seed database with taxonomy & sample inventory |
| `deno task db:reset` | Reset and recreate database from scratch |
| `deno fmt` | Format TypeScript files |
| `deno lint` | Lint backend code |

### Frontend (`/frontend`)

| Command | Description |
| :--- | :--- |
| `npm start` | Start Angular dev server (`ng serve`) |
| `npm run build` | Build production bundle (`ng build`) |
| `npm run test` | Run unit tests with Karma & Jasmine |
| `npm run e2e` | Run E2E tests with Playwright |
| `npm run lint` | Run ESLint static check |
| `npm run format` | Prettify code using Prettier |

---

## 🏗️ Architecture & Stack Overview

### 1. Backend Stack & Patterns
- **Runtime:** Deno (v1.37+)
- **HTTP Framework:** Hono (`jsr:@hono/hono`)
- **Database:** Embedded SQLite via `@db/sqlite` (`pantry.db`), WAL mode enabled with foreign keys enforced.
- **Layering Pattern:**
  - `src/routes/`: Route declarations & Hono request handling.
  - `src/validators/`: Request payload validation functions.
  - `src/services/`: Domain business logic & SQL query execution.
  - `src/models/`: TypeScript interfaces & DTO schemas.
  - `src/db/client.ts`: Database connection singleton.

### 2. Frontend Stack & Patterns
- **Framework:** Angular 20 (Standalone Components architecture).
- **Styling:** TailwindCSS v4 + PostCSS, PrimeNG 20 (`@primeng/themes`), and custom SCSS Glassmorphism themes (`glass-card`).
- **i18n:** Transloco (`@jsverse/transloco`) for internationalization keys located in `frontend/public/i18n/`.
- **Services:** HTTP services communicating with backend REST endpoints.

---

## 🏷️ Domain Terminology & Hierarchy Rules

Always adhere to the updated 4-tier domain hierarchy and terminology:

```
[ Nutrient Group ]    (Tier 1: Protein & Dairy, Fiber & Produce, Carbs & Grains, etc.)
       │
       ▼
[ Ingredient Group ]  (Tier 2: Meat, Seafood, Beans, Vegetables, Fruits, Grains, etc.)
       │
       ▼
[ Ingredient ]        (Tier 3: Master definition e.g. Chicken Breast, Gala Apple, Jasmine Rice)
       │
       ▼
[ Ingredient Item ]   (Physical stock instance in Fridge/Pantry with qty, exp date, location)
```

### Terminology Rules:
- **Use `Ingredient`** (catalog entry) — *Do NOT use "Master Ingredient"*.
- **Use `Ingredient Group`** — *Do NOT use generic "Category"*.
- **Use `Nutrient Group`** — *Do NOT use "Nutrient Type"*.
- **Use `Ingredient Item`** — *Do NOT use plain "Item" when referring to physical inventory batches*.

---

## 🎨 UI & Code Style Guidelines

- **Angular Components:** Use Angular Standalone Components (`standalone: true`). Use PrimeNG components whenever possible. Keep logic modular and concise.
- **Styling:** Prefer PrimeNG components and TailwindCSS classes combined with `glass-card` styling for consistency across pages.
- **UI/UX Principles:** Keep UI/UX clean and minimalist. Avoid verboseness, redundant copy, and unnecessary visual or structural complexity.
- **Type Safety:** Always define explicit interfaces in `models/` for request/response bodies and component state.
- **Formatting:** Run `deno fmt` for backend code and `npm run format` for frontend code before committing.
