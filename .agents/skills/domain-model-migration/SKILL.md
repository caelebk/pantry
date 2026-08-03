---
name: domain-model-migration
description: Workflow and safeguards for updating the database schema, domain taxonomy, SQL migrations, database seeders, and cross-stack DTO types.
---

# Skill: Domain Model & Database Migration

Use this skill when altering database schemas, modifying the 4-tier domain hierarchy, or updating database seed data in Pantry.

## Schema Architecture & Taxonomy

Pantry operates on a strict 4-tier inventory domain hierarchy:

1. **`Ingredient Category`** (Tier 1: Master category e.g., Protein & Dairy, Produce, Grains)
2. **`Ingredient Group`** (Tier 2: Sub-grouping e.g., Meat, Seafood, Vegetables, Fruit)
3. **`Ingredient`** (Tier 3: Definition entry e.g., Chicken Breast, Gala Apple)
4. **`Ingredient Item`** (Tier 4: Physical inventory stock batch e.g., 500g in Fridge, exp 2026-08-10)

## Migration Execution Procedure

### 1. SQL Migration (`backend/migrations/`)
- Create a new migration file with sequential numeric prefix (e.g., `004_add_item_notes.sql`).
- Write idempotent SQL statements or standard DDL alterations.
- Test execution using `deno task db:migrate`.

### 2. Database Seeding & Reset (`backend/scripts/`)
- Ensure sample data and category hierarchies in seed files match updated schema contracts.
- Test seed script with `deno task db:seed` and complete reset with `deno task db:reset`.

### 3. Model DTO Synchronization
Synchronize TypeScript interfaces across both stacks:
- `backend/src/models/`
- `frontend/src/app/models/` (or equivalent Angular model/service interfaces)

### 4. UI Label Audit
Check that no legacy terms ("Nutrient Group", "Nutrient Type", "Master Ingredient", plain "Item") leak into API payloads, logs, or UI components.

## Verification
- [ ] Backend migration tests cleanly (`deno task db:migrate`).
- [ ] Database seeds without constraint errors (`deno task db:seed`).
- [ ] Backend Deno tests pass (`deno task test`).
- [ ] Frontend compiles cleanly (`npm run build`).
