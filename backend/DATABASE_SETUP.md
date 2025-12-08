# PostgreSQL Local Development Setup

This guide will help you get PostgreSQL running locally using Docker.

## Quick Start

1. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

2. **Verify database is running**:
   ```bash
   docker ps
   ```
   You should see `pantry_postgres` container running.

3. **Check database health**:
   ```bash
   docker-compose logs postgres
   ```

4. **Start the Deno server**:
   ```bash
   deno task dev
   ```

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

### Stop and remove all data (fresh start)

```bash
docker-compose down -v
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

The database is initialized with:

- **Items table**: Stores pantry inventory items
- **Recipes table**: Stores recipes
- **Recipe_ingredients table**: Links recipes to ingredients
- Sample data for testing

See `init.sql` for the complete schema.

## Troubleshooting

### Port 5432 already in use

If you get an error about port 5432 being in use:

1. Check if another PostgreSQL instance is running
2. Stop it or change the port in `docker-compose.yml`

### Connection refused

- Make sure Docker Desktop is running
- Check if the container is running: `docker ps`
- Restart the container: `docker-compose restart`

### Can't connect from Deno app

- Verify `.env` file has correct credentials
- Check if container is healthy: `docker-compose ps`
