# Pantry Backend API

A Deno + Hono backend for the Pantry inventory management application.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   └── env.ts       # Environment configuration
│   ├── db/              # Database setup
│   │   └── client.ts    # Database client
│   ├── messages/        # Centralized message constants
│   │   └── item.messages.ts
│   ├── middleware/      # Custom middleware
│   │   ├── cors.ts      # CORS configuration
│   │   ├── errorHandler.ts  # Global error handling
│   │   └── logger.ts    # Request logging
│   ├── models/          # TypeScript interfaces/types
│   │   ├── data-models/     # Application data models (DTOs)
│   │   └── schema-models/   # Database schema models
│   ├── routes/          # API routes
│   │   ├── index.ts     # Main router
│   │   ├── items.routes.ts
│   │   └── recipes.routes.ts
│   ├── services/        # Business logic
│   │   ├── item.service.ts
│   │   └── recipe.service.ts
│   ├── utils/           # Utility functions
│   │   ├── response.ts  # API response helpers
│   │   └── validators.ts # Generic validation functions
│   ├── validators/      # Domain-specific validators
│   │   └── item.validator.ts
│   └── app.ts           # Main app setup
├── tests/               # Test files
│   └── items.test.ts
├── .env                 # Environment variables (not committed)
├── .env.example         # Environment variables template
├── .gitignore
├── deno.json            # Deno configuration
├── deno.lock            # Dependency lock file
├── main.ts              # Entry point
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) v1.37 or higher

### Installation

1. Clone the repository

2. Start PostgreSQL with Docker:
   ```bash
   docker compose up -d
   ```

3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   The default values work for local development. Update if needed.

4. The database will automatically initialize with the schema from `init.sql`

### Running the Application

```bash
# Development mode with auto-reload
deno task dev

# Production mode
deno task start

# Run tests
deno task test

# Database Operations
deno task db:migrate  # Run pending migrations
deno task db:reset    # Reset database (DATA LOSS)
deno task db:seed     # Populate with sample data
```

## 📡 API Endpoints

### Health Check

- `GET /api/health` - API health check

### Items

- `GET /api/items` - Get all items
- `GET /api/items/expiring-soon` - Get items expiring soon (optional query param `?days=7`)
- `GET /api/items/:id` - Get item by ID
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item

### Recipes

- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

## 🛠️ Development

### Code Formatting

```bash
deno fmt
```

### Linting

```bash
deno lint
```

## 🏗️ Tech Stack

- **Runtime**: Deno
- **Framework**: Hono
- **Database**: PostgreSQL (to be configured)
- **Testing**: Deno's built-in test runner
