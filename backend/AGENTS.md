# backend/AGENTS.md — Backend Directory Guide

Canonical workspace rules live in [`.agents/AGENTS.md`](../.agents/AGENTS.md). This file covers
backend-specific conventions only.

## Layout & Dependency Direction

```
src/routes/      Hono handlers — HTTP concerns ONLY (no SQL, no business rules)
src/validators/  Pure input-shape checks — no DB access
src/services/    Business logic + all SQL (@db/sqlite prepared statements)
src/middleware/  auth, rbac, rate-limit, error-handler, logger
src/models/      data-models/ = API DTOs · schema-models/ = DB row shapes
migrations/      Sequential SQL, immutable once committed (RULE-03 §4)
tests/           Deno test runner; service tests use :memory:, route tests use helpers/
```

Direction: `routes → validators → services → db/client.ts`. Never skip a layer.

## Critical Conventions

1. **Tenancy:** Every domain query MUST filter by `kitchen_id`. The established pattern is
   `WHERE id = ? AND kitchen_id = ?` with parameterized values. `activeKitchenId` comes from context
   (`c.get('activeKitchenId')`) set by `middleware/auth.ts`.
2. **SQL safety:** Only `db.prepare(...)` with bound parameters. Never interpolate request data into
   SQL strings (RULE-03 §1).
3. **Migrations:** New schema changes = new sequential file in `migrations/`. Never edit an applied
   migration. Verify with a scratch DB: `DB_PATH=$(mktemp -d)/scratch.db deno task db:migrate`.
4. **Errors:** Current convention is sentinel-string errors translated to status codes in route
   handlers (`'EMAIL_ALREADY_EXISTS'` etc. — see the known-debt register in `.agents/AGENTS.md`).
   Follow it for consistency; typed `AppError` exists but is not yet adopted.
5. **Tests:**
   - Service tests: `setDB(new Database(':memory:'))` — fully isolated.
   - Route tests that need a real schema: import `initMigratedDB` from `./helpers/test-db-path.ts`
     as the **first** import. It builds a migrated temp DB and never touches the developer's
     `pantry.db`.

## Verification Commands

| Purpose                 | Command (from `backend/`)                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Full suite              | `deno task test`                                                                                                       |
| Single test file        | `deno test --allow-env --allow-net --allow-read --allow-write --allow-ffi --unstable-ffi --unstable-cron tests/<file>` |
| Lint / format           | `deno lint && deno fmt --check`                                                                                        |
| Type check              | `deno check main.ts`                                                                                                   |
| Scratch migration check | `DB_PATH=$(mktemp -d)/s.db deno task db:migrate && deno task db:seed`                                                  |

Known-incomplete: rate limiting is disabled under test and therefore untested.
RBAC: inventory-domain mutations require `editor`/`owner` — enforced via
`requireEditorForMutations` mounted in every domain router; denial paths are
covered by `tests/rbac.routes.test.ts`.
