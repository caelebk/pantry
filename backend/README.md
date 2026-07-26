# Pantry Backend API

A Deno + Hono RESTful backend API for the Pantry inventory management application, backed by an embedded SQLite database.

---

## 🏗️ Architecture

```
backend/
├── src/
│   ├── config/          # Configuration & environment setup
│   ├── db/              # SQLite client connection & PRAGMAs (WAL mode, FKs)
│   ├── messages/        # Centralized response/error string constants
│   ├── middleware/      # CORS, Request Logger, Global Error Handler
│   ├── models/          # DTOs and Database schema interfaces
│   ├── routes/          # Hono route endpoints
│   │   ├── index.ts     # Main API router mounting sub-routes
│   │   ├── items.routes.ts
│   │   ├── ingredient-items.routes.ts
│   │   ├── ingredients.routes.ts
│   │   ├── ingredient-groups.routes.ts
│   │   ├── nutrient-groups.routes.ts
│   │   ├── locations.routes.ts
│   │   ├── units.routes.ts
│   │   ├── recipes.routes.ts
│   │   ├── meal-plans.routes.ts
│   │   └── shopping-list.routes.ts
│   ├── services/        # Business logic & SQL query execution
│   ├── utils/           # Response formatter & generic validators
│   ├── validators/      # Domain-specific payload validation
│   └── app.ts           # Hono application setup
├── migrations/          # Sequential SQL schema migrations
├── scripts/             # Database migration, reset, and seed scripts
├── tests/               # Backend integration and unit tests
├── deno.json            # Deno tasks and import map
├── main.ts              # Server entry point
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) v1.37 or higher

### Setup & Run

1. Copy `.env.example` to `.env` (optional for defaults):
   ```bash
   cp .env.example .env
   ```

2. Run database migrations:
   ```bash
   deno task db:migrate
   ```

3. Seed initial taxonomy data and sample inventory:
   ```bash
   deno task db:seed
   ```

4. Start development server:
   ```bash
   deno task dev
   ```
   *Server listens at `http://localhost:8000`.*

---

## 🛠️ CLI Tasks

```bash
# Start server in watch mode
deno task dev

# Start server in production mode
deno task start

# Run unit & integration tests
deno task test

# Run database migrations
deno task db:migrate

# Seed database
deno task db:seed

# Reset database schema & data
deno task db:reset

# Code formatting & linting
deno fmt
deno lint
```

---

## 📡 API Endpoints Summary

### System
- `GET /api/health` - API health check

### Inventory & Items
- `GET /api/ingredient-items` - List physical inventory items (with optional filters)
- `GET /api/ingredient-items/expiring-soon` - Get items expiring within specified days
- `GET /api/ingredient-items/:id` - Get item details by ID
- `POST /api/ingredient-items` - Add new inventory batch
- `PUT /api/ingredient-items/:id` - Update inventory item
- `DELETE /api/ingredient-items/:id` - Remove item

### Taxonomy & Ingredients
- `GET /api/ingredients` - List all master ingredients
- `GET /api/ingredients/:id` - Get ingredient by ID
- `POST /api/ingredients` - Create master ingredient
- `PUT /api/ingredients/:id` - Update master ingredient
- `DELETE /api/ingredients/:id` - Delete master ingredient
- `GET /api/ingredient-groups` - List ingredient categories/groups
- `GET /api/nutrient-groups` - List top-level nutrient groups

### Locations & Units
- `GET /api/locations` - Storage locations (Fridge, Freezer, Pantry, etc.)
- `GET /api/units` - Measurement units & standard unit conversions

### Recipes, Meal Planner & Shopping List
- `GET /api/recipes` - List recipes with required ingredients
- `POST /api/recipes` - Create new recipe
- `GET /api/meal-plans` - Get scheduled meals
- `POST /api/meal-plans` - Schedule a meal
- `GET /api/shopping-list` - Get shopping list items
- `POST /api/shopping-list` - Add/sync items to shopping list

---

## ⚙️ Tech Stack

- **Runtime**: Deno
- **Framework**: Hono (`jsr:@hono/hono`)
- **Database**: SQLite (`@db/sqlite`) with WAL mode & Foreign Keys enabled
- **Testing**: Deno built-in test runner
