# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The owner and their household. Pantry is a personal, self-run tool. A small number of household members share one kitchen workspace (the app models this as "Kitchen Workspaces" with workspace members). It is not a public product for outside sign-ups.

The same people use it in three situations, all of them primary:

- **Phone in the kitchen:** checking what is on hand, cooking from a recipe, logging items as they are put away into the fridge, freezer, or pantry.
- **Phone at the store:** working through the shopping list while shopping, often one-handed and in a hurry.
- **Desktop planning:** planning meals, writing and editing recipes, and curating the ingredient taxonomy.

## Product Purpose

Pantry keeps an accurate record of the household's food and turns it into decisions: what to use first, what can be cooked now, what is planned, and what needs buying. Success means less food thrown away, fewer duplicate or forgotten purchases, and meals planned from what is actually in the kitchen.

## Positioning

Pantry does three things together that a notes app or a generic inventory app does not:

1. **Know what I have.** A low-friction, trustworthy record of physical stock per storage location, with quantities, purchase dates, and expiry dates.
2. **Reduce food waste.** Expiry-aware stock drives what to cook and what to use first (expired and expiring-soon items surface on Home and feed recipe suggestions).
3. **Closed loop.** Stock, recipes, meal plan, shopping list, and restock are connected through one shared ingredient taxonomy, so recipes know what is cookable from current stock and buying something flows back into stock through restock review. (Whether cooking a recipe deducts stock automatically is not confirmed in the current app.)

The shared taxonomy is the mechanism that makes the loop work; features that bypass it weaken the product.

## Operating Context

- Routes: Home, Inventory (overview, stock items, ingredients catalog, categories and groups, unit reconciliation), Recipes (list, detail, editor), Meal Planner, Shopping List (items, stores, restock review), Profile, Auth (login, signup).
- Physical storage locations are part of the domain: Fridge, Freezer, Pantry.
- Shopping is organized by store; a restock review moves purchased items back into stock.
- Use spans short glances on a phone (mid-cooking, mid-aisle) and longer focused sessions at a desk.

## Capabilities and Constraints

- **Stack (existing):** Angular 20 standalone components, PrimeNG 20, TailwindCSS v4, Transloco i18n; Deno + Hono API over embedded SQLite. Docker/Nginx for the frontend.
- **Domain taxonomy is strict and four-tier**, enforced in DB, API, models, and UI: Ingredient Category (Tier 1) → Ingredient Group (Tier 2) → Ingredient (Tier 3) → Ingredient Item (Tier 4, a physical stock instance). Use these exact terms; do not invent synonyms.
- **All user-facing strings go through Transloco** (`frontend/public/i18n/en.json`); no hard-coded copy.
- **Workspace rules** live in `.agents/AGENTS.md`; UI work must pass `npm run validate:design-system` in `frontend/`.
- **Visual authority** lives in `DESIGN.md` (single source of truth); the `/design-system` gallery route renders its primitives.
- **Undecided:** whether outside households will ever be supported; formal accessibility conformance target.

## Brand Commitments

- Name: **Pantry**.
- Voice: calm, practical household tool. Plain kitchen language over jargon; existing copy retains its source casing.

## Evidence on Hand

- Real household data via the backend seeder (`backend/scripts/seed_db.ts`) and the user's own database.
- Design evidence and reviews in `docs/design-evidence/`, `docs/design-review-2026-10-03.md`, and Playwright design specs in `frontend/e2e/`.
- No testimonials, users outside the household, metrics, or press exist. Do not fabricate any.

## Product Principles

1. **Trust the record.** Stock data must stay accurate and easy to correct; logging an item should cost seconds, not a form-filling session.
2. **Surface what needs attention.** Expired and expiring stock, cookable recipes, and the next thing to buy come before browsing.
3. **One taxonomy, one loop.** Every feature reads from and writes to the shared ingredient hierarchy so stock, recipes, plans, and shopping stay connected.
4. **Fit the moment.** Phone use in the kitchen and store needs fast, glanceable, thumb-friendly flows; desktop planning can carry more density and editing depth.
5. **Fewer decisions, not less information.** Keep useful density and explicit actions; remove redundant framing, headings, and badges around the task.

## Accessibility & Inclusion

- Primary workflows (recipe editing, shopping, meal planning, forms, navigation) must work on phones and with a keyboard, including 320px reflow and real mobile keyboards.
- Text and status colors must stay legible in both light and dark themes against their actual backgrounds; status must not rely on color alone.
- Respect `prefers-reduced-motion`.
- Formal WCAG level: not yet decided.
