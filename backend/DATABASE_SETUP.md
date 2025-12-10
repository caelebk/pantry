# PostgreSQL Local Development Setup

This guide will help you get PostgreSQL running locally using Docker and manage database migrations.

## Quick Start

1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

2. **Initialize Database** (Migrate & Seed):
   ```bash
   # Reset schema and apply migrations
   deno task db:reset

   # Populate with demo data (Optional)
   deno task db:seed
   ```

3. **Verify database is running**:
   ```bash
   docker ps
   ```
   You should see `pantry_postgres` container running.

4. **Start the Deno server**:
   ```bash
   deno task dev
   ```

## Database Management & Migrations

We use a custom migration system to manage database schema changes.

- **Migration Files**: stored in `migrations/` directory (e.g., `0001_initial_schema.sql`).
- **Run Migrations**: `deno task db:migrate`
  - This script checks which migrations have already been applied (tracked in `_migrations` table)
    and runs any new ones in alphabetical order.
- **Reset Database**: `deno task db:reset`
  - **WARNING**: This drops the `public` schema (deleting all data) and re-runs all migrations.
- **Seed Database**: `deno task db:seed`
  - Populates the database with robust stub data (ingredients, items, recipes, etc.).
  - Modify data in `scripts/seed_data.ts`.

- **Create New Migration**:
  1. Create a new `.sql` file in `migrations/` with a sequential prefix (e.g.,
     `0002_add_users.sql`).
  2. Write your SQL statements (CREATE TABLE, ALTER TABLE, etc.).
  3. Run `deno task db:migrate` to apply it.

## Database Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: pantry_db
- **User**: pantry_user
- **Password**: pantry_dev_password

## Useful Commands

### Connect to PostgreSQL CLI

```bash
docker exec -it pantry_postgres psql -U pantry_user -d pantry_db
```

### Stop database

```bash
docker-compose down
```

### Reset Database (Fresh Start)

The easiest way to reset is using the Deno task:

```bash
deno task db:reset
```

If you need a full Docker reset:

```bash
# 1. Destroy container and volumes
docker-compose down -v

# 2. Start fresh container
docker-compose up -d

# 3. Re-apply schema and seed
deno task db:reset
deno task db:seed
```

### View database logs

```bash
docker-compose logs -f postgres
```

### Backup database

```bash
docker exec pantry_postgres pg_dump -U pantry_user pantry_db > backup.sql
```

### Restore database

```bash
docker exec -i pantry_postgres psql -U pantry_user -d pantry_db < backup.sql
```

## Database Schema

The database schema is defined in the `migrations/` folder. Key references:

- **Items**: Pantry inventory
- **Ingredients**: Base ingredients shared by items and recipes
- **Recipes**: Cooking recipes
- **Locations**: Storage locations (fridge, pantry, etc.)
- **Categories**: Food categories
- **Units**: Measurement units

## Troubleshooting

### Port 5432 already in use

If you get an error about port 5432 being in use:

1. Check if another PostgreSQL instance is running
2. Stop it or change the port in `docker-compose.yml`

### "relation "..." already exists" during migration

If you see errors about tables already existing when running migrations:

- You might have an old `init.sql` volume mount or existing data.
- **Fix**: Run the "Reset Database" commands above.

### Can't connect from Deno app

- Verify `.env` file has correct credentials
- Check if container is healthy: `docker-compose ps`
