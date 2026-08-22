# Deferred Abstractions — Investigation & Proposals

> Companion to `docs/ARCHITECTURE_REVIEW_2026-08-21.md` §11 ("Changes Not Currently
> Justified"). Each item documents the observed evidence, why adoption is deferred,
> what a minimal alternative looks like today, and the concrete trigger condition
> that would justify revisiting.

---

## 1. Store library (NgRx / SignalStore / signals-based state)

**Current evidence**
- No global store. Only cross-page cache is one `shareReplay(1)` HTTP cache
  (`item.service.ts:30`).
- Pages fetch independently on mount (e.g., `home.component.ts:100–111` refetches
  inventory the item service may already hold).
- Only 1 of ~10 HTTP services has error handling (`catchError` in meal-planner).

**Why deferred:** One cached query and page-local state is not evidence of store
need. Introducing NgRx now would add boilerplate around problems we haven't hit
(cross-page optimistic updates, undo, complex derived state).

**Minimal alternative today:** Add `shareReplay` + invalidation to the 2–3 hottest
services (inventory items, recipes) and standardize a small error-handler operator
in all HTTP services. Solves staleness and silent failures without a framework.

**Trigger to revisit:** ≥3 pages mutating the same domain state with visible sync
requirements (e.g., shopping list ↔ inventory ↔ home dashboard), or optimistic UI
requirements. If triggered, prefer `@ngrx/signals` (lightest) over classic NgRx;
evaluate Angular 20 built-in signal resources first.

**Effort if adopted:** Medium (1–2 weeks incl. migration). **Risk:** Medium.

---

## 2. Repository / base data-access layer

**Current evidence**
- Tenant guard `WHERE id = ? AND kitchen_id = ?` duplicated **58 times** across
  `backend/src/services/*.ts`.
- Two coexisting service styles (class-based Promise-wrapped vs plain functions);
  positional tuple row-mapping (`row[0] as [string, ...]`) repeated dozens of times.
- Legacy shims: `item.service.ts` wraps `ingredientItemService` 1:1;
  `recipe.service.ts` has delegate twins (`getAllRecipes→findAll`).

**Why deferred:** A repository abstraction imposed now would force rewriting two
generations of services at once — exactly the churn the review warned against. The
duplication is mechanical, not behavioral; it doesn't yet cause bugs.

**Minimal alternative today:** When touching any service, (a) delete legacy wrapper
methods, (b) extract named SQL fragment constants for the tenant predicate, (c)
move row-tuple mapping into the matching `src/models/schema-models/*` file as a
typed mapper function. Converges styles opportunistically with zero new concepts.

**Trigger to revisit:** A second storage engine, OR if a third service generation
starts appearing; also revisit alongside FK hardening (migration adding
`kitchen_id REFERENCES kitchens(id)`), since both touch every table.

**Effort if adopted:** High (full rewrite risk) — hence opportunistic path preferred.
**Risk:** High if big-bang; Low if incremental.

---

## 3. Schema-validation library (zod-style)

**Current evidence**
- Hand-rolled `{ isValid, errors }` validators: `auth.validator.ts` (234 L,
  thorough), plus ingredient/item/kitchen/recipe modules.
- Missing entirely for meal-plans, stores, shopping-list, ingredient-groups —
  those routes validate inline/truthiness-only (`stores.routes.ts:38` PUT body is
  completely unvalidated).
- Duplication: `EMAIL_REGEX` defined 3× (`utils/validators.ts:10`,
  `auth.validator.ts:15`, `kitchen.validator.ts:8`); `ValidationResult`
  re-declared per module.

**Proposal (two-step):**
1. **Now (no new dependency):** Fill the four missing validator modules in the
   existing hand-rolled style, and consolidate EMAIL_REGEX/ValidationResult into
   `utils/validators.ts`. Restores RULE-03 §3 compliance cheaply.
2. **Later (conditional):** Adopt zod only together with item 5 (OpenAPI codegen),
   via `@hono/zod-openapi`, so validation schemas double as API documentation.
   Adopting zod *alone* buys little beyond syntax.

**Trigger for step 2:** API surface growth beyond current ~40 endpoints, or
external API consumers requiring published contracts.

**Effort:** Step 1 low (half day). Step 2 medium-high. **Risk:** Step 1 minimal.

---

## 4. Structured logging library

**Current evidence**
- 63 `console.*` calls in `backend/src`; same failures logged twice
  (e.g., `recipe.service.ts:115` then `recipes.routes.ts:26`).
- Logger middleware emits unstructured lines; no request IDs, levels, or redaction
  (`middleware/logger.ts:17`).

**Proposal (no library needed yet):**
1. Remove `console.error` from services — let the global `errorHandler` be the
   single logging point (this also forces the AppError migration forward).
2. Generate a request ID (`crypto.randomUUID()`) in the logger middleware, attach
   to context, echo in responses, prefix log lines with it.
3. Emit JSON lines when `ENVIRONMENT=production`, human-readable otherwise —
   ~30 lines in `logger.ts`, no dependency.

**Trigger for a real library (e.g., pino):** Multiple backend instances shipping
logs centrally, log-volume costs, or sampling needs. None apply today.

**Effort:** Half day. **Risk:** Minimal.

---

## 5. DTO codegen / contract sync

**Current evidence**
- Frontend models hand-mirror backend DTOs; drift is already observable:
  - `frontend/src/app/models/items.model.ts:16–46`: `string` ids where backend
    uses numeric FKs; `name`/`label` field mismatch papered over by `ItemMapper.ts`.
  - Backend `IngredientItemDTO` omits `kitchen_id` added by migration 0011.
- No environments layer in the frontend; base paths hardcoded per service
  (`'/api/v1'` in `core/services/auth.service.ts:24`, `/api/meal-plans`,
  `/api/shopping-list`, …).

**Proposal (staged):**
1. **Now:** Fix the two known drift spots by hand and add a `frontend/src/environments`
   pair (`environment.ts` / `environment.development.ts`) holding `apiBaseUrl`, used
   by all services. Removes the config-shaped half of the problem.
2. **Later:** If API consumers multiply, publish an OpenAPI document from Hono
   (`@hono/zod-openapi`) and generate frontend types (`openapi-typescript`). This
   depends on proposal 3 step 2.

**Trigger for step 2:** Second non-trivial client, or public API.

**Effort:** Step 1 low. Step 2 high. **Risk:** Step 1 minimal.

---

## 6. Monorepo task runner (turborepo / nx)

**Current evidence**
- Two packages; `dev.sh` handles concurrent watch correctly (trap + `kill 0`).
- CI duplication exists but is job-level parallelism, not a runner gap: each of
  4–6 jobs repeats checkout/setup/install (~15 lines each).

**Why deferred:** Runners solve task-graph caching for many packages. With two,
they add config surface and a learning burden for zero speedup that CI-level npm
caching doesn't already provide.

**Minimal alternative today:** Trim CI duplication only if job startup time
becomes measurable (combine fmt+lint into one job per stack).

**Trigger to revisit:** Third package (e.g., shared DTO package from item 5), or
CI wall-time exceeding ~10 min due to uncached rebuilds.

**Effort if adopted:** Medium. **Risk:** Low value today.

---

## Decision Summary

| Item | Verdict | Next action | Revisit trigger |
|---|---|---|---|
| 1. Store library | Defer | shareReplay + error operator on hot services | ≥3 pages sharing mutable state |
| 2. Repository layer | Defer | Opportunistic cleanup conventions | 2nd storage engine / FK migration |
| 3. Validation lib | Defer (2-step) | Fill 4 missing validators, dedupe regex | OpenAPI/codegen adoption |
| 4. Logging lib | Defer | Dedupe + request IDs + JSON-in-prod | Centralized multi-instance logging |
| 5. DTO codegen | Defer (2-step) | Fix known drift + environments files | Public API / 2nd client |
| 6. Monorepo runner | Reject for now | None (watch CI timing) | 3rd package |
