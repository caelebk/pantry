# SQLite Local Development Setup

This guide details the SQLite database setup and database management commands for the Pantry backend.

## Quick Start

1. **Initialize & Seed Database**:
   ```bash
   # Create schema and apply migrations
   deno task db:migrate

   # Populate with demo seed data
   deno task db:seed
   ```

2. **Start the Deno backend server**:
   ```bash
   deno task dev
   ```

No external database server or Docker container is required. The database is stored locally in `pantry.db`.

---

## Database Management & Commands

- **Database File**: Stored at `pantry.db` in the `/backend` directory (configured via `DB_PATH` in `.env`).
- **Run Migrations**: `deno task db:migrate`
  - Checks applied migrations in the `_migrations` table and applies any pending `.sql` files from `migrations/`.
- **Reset Database**: `deno task db:reset`
  - Deletes `pantry.db` (and temporary WAL/SHM files) and re-runs all migrations from scratch.
- **Seed Database**: `deno task db:seed`
  - Inserts sample locations, categories, units, ingredients, items, and recipes. Seed data source is located in `scripts/seed_data.ts`.

---

## Testing

Run all unit and integration tests using:
```bash
deno task test
```
*Note: Service tests automatically run against an in-memory SQLite database (`:memory:`), ensuring isolated, fast test execution without modifying your local database file.*

---

## Schema Overview

- **`items`**: Pantry inventory items (UUID primary keys, linked to ingredients, units, and locations).
- **`ingredients`**: Base ingredients.
- **`recipes`**, **`recipe_ingredients`**, **`recipe_steps`**: Cooking recipes and instructions.
- **`locations`**: Storage locations (Fridge, Pantry, Freezer, Shelf).
- **`categories`**: Food categories (Produce, Dairy & Eggs, etc.).
- **`units`**: Measurement units and conversion rates.
