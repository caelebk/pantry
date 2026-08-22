# Architecture & Agent-Harness Review — 2026-08-21

> Read-only review performed by an AI architect agent on branch `main` @ `78f19f9`.
> Status: findings below drove the cleanup implemented in the same PR where noted.
> Every finding is backed by file/symbol evidence gathered via static inspection.

---

## Executive Summary

Pantry is a well-scoped monorepo (Deno/Hono + SQLite backend, Angular 20 + PrimeNG
frontend) with genuinely good bones: clean route→validator→service→db layering,
parameterized SQL everywhere, real-DB integration tests, and a thoughtful agent
harness (`.agents/AGENTS.md` + 10 skills).

However, **two generations of architecture coexist** without a completion boundary:
pre-auth legacy aliases (`/api/items`, `/nutrient-groups`) alongside post-auth domain
routes; class-based vs function-style services; Karma-era test config beside Vitest;
hand-rolled UI markup beside canonical `@ui` primitives. The most serious issues are
security-shaped: RBAC exists but only guards kitchen-management routes, the production
JWT guard reads `ENVIRONMENT` while Docker sets `DENO_ENV`, and backend route tests run
against the developer's real `pantry.db`.

For AI agents: the harness's canonical path pointer is broken (Windows OneDrive path),
README contradicts reality on three facts agents rely on (test runner, Deno version,
Docker setup), and there is no documented baseline for distinguishing introduced
failures from existing ones.

---

## Current Architecture

```
pantry/
├── backend/   Deno 2.x + Hono → validators → services → @db/sqlite (WAL)
│              src/routes (12 routers) · src/middleware (auth, rbac, rate-limit,
│              error-handler, logger) · migrations/ (15 files) · tests/ (29 files)
├── frontend/  Angular 20 standalone · pages/ (5 domains) · components/ui (7
│              canonical primitives) · services (HTTP, ~12) · Vitest + Playwright
├── docker-compose.yml (root, full-stack) + frontend/docker-compose.yml (broken orphan)
├── dev.sh     migrate + concurrent watch
└── .agents/   AGENTS.md (113 L) + skills/ (10 SKILL.md)
```

Dependency direction is correct in both halves: routes never touch SQL; validators are
pure; components only depend on HTTP services.

## Strengths Worth Preserving

| Strength | Evidence |
|---|---|
| Clean backend layering — zero SQL in routes, zero business logic in validators | verified across `src/routes/`, `src/services/` |
| Parameterized queries throughout; no injection found | all services use `db.prepare(...)` |
| N+1 actively avoided with batch-fetch + in-memory maps | `recipe.service.ts findAll` (3 queries total) |
| Real-DB service tests with `:memory:` isolation | `ingredients.service.test.ts:82` uses `setDB(new Database(':memory:'))` |
| Migration runner with ledger table + per-file transactions | `scripts/migrate_db.ts` |
| Thorough hand-rolled auth validation incl. password blocklist | `auth.validator.ts:45–98` |
| Model-agnostic harness with small, focused skills | `.agents/skills/*` avg ~48 lines each |
| Canonical UI primitive pattern | `components/ui/index.ts`, RULE-07 in AGENTS.md |
| Clean git hygiene — no committed DBs/dist/artifacts | `git ls-files` verified |

## Findings Summary Table

| Priority | Finding | Evidence | Impact | Effort | Confidence |
|---|---|---|---|---|---|
| Critical | Test-mode auth bypass gated on env var | `middleware/auth.ts:14–29` | Full bypass if leaked to prod | Low | Confirmed |
| High | Prod JWT guard never fires; fallback secret in prod | `env.ts:10–25` vs root compose (`DENO_ENV` vs `ENVIRONMENT`) | Secret compromise in prod | Low | Confirmed |
| High | No RBAC on inventory-domain writes | `rbac.ts` used only in `kitchen.routes.ts` | Viewers mutate/delete data | Medium | Confirmed |
| High | Route integration tests hit real dev DB | `tests/kitchen.routes.test.ts:6` | Data pollution, flaky verification | Low | Confirmed |
| High | Missing FKs on `kitchen_id` columns | migration `0011:107–110` | Orphaned tenant rows | Low | Confirmed |
| High | Broken harness pointer ×7 entry files | CLAUDE.md et al → OneDrive Windows path | Agent onboarding failure at first step | Low | Confirmed |
| High | README/Karma/Docker documentation drift | README vs `package.json:9`; `frontend/docker-compose.yml` dead proxy | Agents run wrong commands | Low | Confirmed |
| High | Duplicate API mounts + legacy aliases | `routes/index.ts:42–64` incl. `/nutrient-*` | Rate-limit bypass, harness RULE-02 violation | Medium | Confirmed |
| Medium | Dead `AppError`; sentinel-string errors; error leakage | `errorHandler.ts:8–17`; `auth.routes.ts:70–131` | Fragile status mapping, info leak | Medium | Confirmed |
| Medium | Fail-open tenant scoping `\|\| ''` | `meal-plans.routes.ts:14`, `stores.routes.ts:11` | Masked scoping bugs | Low | Confirmed |
| Medium | Unvalidated meal-plan/store write bodies | `stores.routes.ts:38`, `meal-plans.routes.ts:46–51` | Bad data; violates RULE-03 §3 | Low | Confirmed |
| Medium | No CI build/type-check jobs; e2e lacks backend | `.github/workflows/*`, `playwright.config.ts:44–49` | Breakage ships undetected | Medium | Confirmed |
| Medium | Inventory god-component; dead dashboard tree | `inventory.component.*` (903 TS / 1057 HTML); duplicate selector `app.routes.ts:36` | High change-risk surface | Medium | Confirmed |
| Medium | Frontend/backend DTO drift | `models/items.model.ts:16–46` | Silent contract breaks | Medium | Confirmed |
| Medium | Harness rules conflict with code, no debt register | RULE-02 vs `index.ts:55–56`; RULE-07 vs unused primitives | Agent churn / false fixes | Low | Confirmed |
| Low | Triplicated EMAIL_REGEX; dual membership checks | `utils/validators.ts:10`, `auth.validator.ts:15`, `kitchen.validator.ts:8` | Drift risk | Low | Confirmed |
| Low | Console double-logging; no request IDs | `recipe.service.ts:115` + `recipes.routes.ts:26` | Debugging friction | Low | Confirmed |
| Info | Root doc clutter (~1,800 lines of stale/planning docs) | `AUTH_*.md`, `DESIGN_SYSTEM.md` duplicating `docs/design-system.md` | Context waste, stale specs | Low | Confirmed |
| Info | Observability gaps (console.log logger, no levels/redaction) | `middleware/logger.ts:17` | Debugging friction | Low | Confirmed |

## Detailed Notes

### Backend

- **Two API generations mounted simultaneously** — every router mounts under both
  `/api/v1/*` and `/api/*`, plus legacy shims `/nutrient-groups`, `/nutrient-types`,
  `/items`, `/categories`. Rate limiting keyed by path (`rate-limit.ts:17`) is
  bypassable via alias. `/nutrient-*` routes directly violate harness RULE-02.
- **RBAC exists but guards almost nothing** — `requireKitchenRole` used only in
  `kitchen.routes.ts`. All inventory-domain writes accept any authenticated member.
- **Silent-fail tenant scoping** — `c.get('activeKitchenId') || ''` pattern fails open.
- **Dead typed-error infrastructure** — `AppError` has zero usages; services throw
  sentinel strings (`'EMAIL_ALREADY_EXISTS'`) that routes string-match back to statuses.
- **God modules** — `auth.service.ts` (616 LOC, ≥4 responsibilities),
  `recipe.service.ts` (524 LOC). Tenant WHERE clause duplicated 40+ times.
- **Missing validators** for meal-plans, stores, shopping-list, ingredient-groups.
- **Test-mode bypass** — unauthenticated requests get `userId: 'test-user-id'`,
  role `owner` when `NODE_ENV=test` (`middleware/auth.ts:14–29`).

### Frontend

- **God component** — `pages/inventory/` at 903 TS / 1,057 HTML lines, 12 injected
  services.
- **Dead dashboard tree** — `pantry-items-container` declared twice; stale selectors.
- **Hardcoded API base URLs ×12**, no Angular environments; mixed `/api/v1` vs `/api`.
- **Broken i18n keys** render raw strings to users
  (`add-recipe-form.component.html:30,39–40`, `add-item-page.component.html:231`).
- **Stale Karma config** — `angular.json` test target references nonexistent
  `karma.conf.js`; actual runner is Vitest via `vite.config.ts`.
- **Design-system migration incomplete** — 3 of 7 `@ui` primitives have zero usage.
- **DTO duplication without codegen** with observed drift (`items.model.ts:16–46`).
- **No error handling** in most HTTP services (only meal-planner has `catchError`).

### Tooling / CI

- **Prod env contract broken**: compose sets `DENO_ENV=production`; code reads
  `ENVIRONMENT` → production JWT guard never fires, no `JWT_SECRET` passed → prod runs
  on committed fallback secret.
- **`frontend/docker-compose.yml` is broken/incoherent**: nginx proxies `/api` to host
  `backend` which doesn't exist in that compose project → all API calls 502. README's
  Docker instructions point here instead of the working root compose.
- **CI runs no build or type-check for either stack**; Playwright e2e starts frontend
  only while proxy targets `localhost:8000` (nothing listens).
- **Floating versions**: CI Deno `v2.x`; no `.nvmrc`, no `engines`.
- **README drift**: says Karma/Jasmine (actually Vitest), Deno v1.37+ (actually 2.x),
  global Angular CLI needed (it's a local devDependency), 4 migrations (there are 15).

### Agent Harness

- **Canonical pointer broken everywhere**: CLAUDE.md, GEMINI.md, OPENCODE.md, PI.md,
  `.cursorrules`, `.windsurfrules`, copilot-instructions cite a nonexistent
  `file:///c:/Users/ckoha/OneDrive/...` path.
- **Harness rules conflict with code without reconciliation guidance** (RULE-02 vs
  live `/nutrient-*` routes; RULE-03 §3 vs missing validators; RULE-07 vs partially
  adopted primitives). Needs a known-debt register so agents don't freelance fixes.
- **No failure-baseline mechanism** for distinguishing introduced failures from
  pre-existing ones (`ng test` broken, CI e2e known-incomplete).
- **Seven near-duplicate entry files** = seven update points per rule change.
- What already works well: small always-loaded surface (113-line AGENTS.md), ~48-line
  task-scoped skills — a good progressive-context foundation worth keeping.

## Recommended Phasing

- **Phase 0 — Truth & Safety (hours):** fix env/JWT wiring; fix entry-file paths;
  truth-pass on README; remove stale Karma config reference; fix broken i18n keys;
  add reality corrections + known-debt register to AGENTS.md.
- **Phase 1 — Reliability (days):** temp-DB isolation for route tests; CI build /
  type-check jobs; e2e backend service; pin CI Deno version; add `.nvmrc` + engines.
- **Phase 2 — Security completion (days):** RBAC rollout to inventory writes;
  FK-validation migration for `kitchen_id`; fail-closed tenant scoping; validators
  for meal-plans/stores/shopping-list/groups.
- **Phase 3 — Consolidation (week):** deprecate `/api/*` duplicates + legacy aliases;
  unify error handling on `AppError`; delete dead frontend code; consolidate docs.
- **Phase 4 — Structural (opportunistic):** split inventory god-component; split
  `auth.service.ts`; consistent DTO sync strategy.

## Changes Explicitly Not Justified Now

See `docs/PROPOSALS_DEFERRED_ABSTRACTIONS.md` for investigation and proposals on:
store library, repository/base data-access layer, schema-validation library
(zod-style), structured logging library, DTO codegen, monorepo task runner.
