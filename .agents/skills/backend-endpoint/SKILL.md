---
name: backend-endpoint
description: Architectural patterns, validation rules, service design, and test guidelines for Deno + Hono REST endpoints in Pantry.
---

# Skill: Backend Endpoint Development

Use this skill when implementing new backend API routes or modifying existing HTTP handlers in `backend/src/`.

## Architecture Layers

Dependency direction (enforced — never skip a layer):

```
Request ──> [ Route Handler ] ──> [ Validator ] ──> [ Service (DB Query) ] ──> db/client.ts
```

### 1. Models (`src/models/`)
Define explicit TypeScript interfaces in `data-models/` (API DTOs) and `schema-models/`
(DB row shapes). Never use `any`.

### 2. Validators (`src/validators/`)
Pure input-shape checks — no DB access:
- Check required parameters and valid formats.
- Return structured `400 Bad Request` responses on error.

### 3. Services (`src/services/`)
- Obtain database handle via `import { getDB } from "../db/client.ts"`.
- Use parameterized prepared SQL statements to prevent SQL injection.
- **Tenancy rule (critical):** every domain query MUST filter by `kitchen_id`
  using `WHERE id = ? AND kitchen_id = ?` with `activeKitchenId` from context.

### 4. Routes (`src/routes/`)
- Mount domain routers in `src/routes/index.ts` under `/api/v1/<domain>`; apply
  `authMiddleware` + `requireEditorForMutations` on every domain router.
- Return standard JSON envelopes with explicit HTTP status codes (`200`, `201`, `400`, `404`, `500`).
- Users without an active kitchen must get an explicit `400`, never a silent empty query.

### 5. Testing (`tests/`)
- Add tests in `backend/tests/<feature>.test.ts`.
- Run tests via `deno task test`.

## Checklist Before Finishing Backend Code
- [ ] Prepared SQL statement parameters used (no raw string interpolation into SQL queries).
- [ ] Correct domain terminology used (`Ingredient Category`, `Ingredient Group`, `Ingredient`, `Ingredient Item`).
- [ ] Ran `deno fmt` and `deno lint`.
- [ ] All Deno unit tests passing (`deno task test`).
