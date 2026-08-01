---
name: backend-endpoint
description: Architectural patterns, validation rules, service design, and test guidelines for Deno + Hono REST endpoints in Pantry.
---

# Skill: Backend Endpoint Development

Use this skill when implementing new backend API routes or modifying existing HTTP handlers in `backend/src/`.

## Architecture Layers

Each backend feature follows a strict 5-layer separation:

```
Request ──> [ Route Handler ] ──> [ Validator ] ──> [ Service (DB Query) ] ──> Response DTO
                 │                                        │
           (src/routes/)                           (src/services/)
```

### 1. Models (`src/models/`)
Define explicit TypeScript interfaces for database records and API request/response DTOs:
```ts
export interface CreateIngredientItemRequest {
  ingredientId: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
  location?: 'fridge' | 'pantry' | 'freezer';
}
```

### 2. Validators (`src/validators/`)
Use Hono validator functions or custom validation logic:
- Check required parameters and valid formats.
- Return structured `400 Bad Request` responses on error.

### 3. Services (`src/services/`)
- Obtain database handle via `import { getDb } from "../db/client.ts"`.
- Use parameterized prepared SQL statements to prevent SQL injection.
- Enforce foreign keys and handle database errors cleanly.

### 4. Routes (`src/routes/`)
- Register Hono router instances in `main.ts` or sub-routers.
- Return standard JSON envelopes with explicit HTTP status codes (`200`, `201`, `400`, `404`, `500`).

### 5. Testing (`tests/`)
- Add tests in `backend/tests/<feature>.test.ts`.
- Run tests via `deno task test`.

## Checklist Before Finishing Backend Code
- [ ] Prepared SQL statement parameters used (no raw string interpolation into SQL queries).
- [ ] Correct domain terminology used (`Ingredient Category`, `Ingredient Group`, `Ingredient`, `Ingredient Item`).
- [ ] Ran `deno fmt` and `deno lint`.
- [ ] All Deno unit tests passing (`deno task test`).
