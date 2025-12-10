# Pantry

A comprehensive full-stack inventory management application designed to help
track your pantry items, manage recipes, and plan meals.

## 🏗️ Architecture & Tech Stack

The application is structured as a monorepo with distinct frontend and backend
directories.

### Backend (`/backend`)

- **Runtime:** [Deno](https://deno.land/)
- **Framework:** [Hono](https://hono.dev/) - Web standard based, ultra-fast web
  framework.
- **Database:** PostgreSQL 16 (running via Docker).
- **ORM/Query Builder:** Uses native Deno PostgreSQL client with custom service
  layers.
- **Testing:** Deno built-in test runner.

### Frontend (`/frontend`)

- **Framework:** [Angular](https://angular.io/) (v19+)
- **Styling:** [TailwindCSS](https://tailwindcss.com/)
- **UI Components:** [PrimeNG](https://primeng.org/)
- **Internationalization:** [Transloco](https://ngneat.github.io/transloco/)

### Infrastructure

- **Docker:** Used for containerizing the PostgreSQL database and serving the
  production build of the frontend.
- **Docker Compose:** separate service definitions for backend dependencies and
  frontend deployment.

## 📂 Project Structure

```
├── backend/            # Deno + Hono API
│   ├── src/            # Source code (routes, services, models)
│   ├── tests/          # Integration tests
│   ├── scripts/        # Basic scripts (db migration)
|   ├── migrations/     # *.sql migration files
│   └── docker-compose.yml # PostgreSQL container configuration
│
└── frontend/           # Angular Application
    ├── src/            # Source code (components, services, styles)
    ├── nginx.conf      # Nginx config for Docker production build
    └── docker-compose.yml # Frontend container configuration
```

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) (v1.37+)
- [Node.js](https://nodejs.org/) (Latest LTS) & NPM
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Angular CLI: `npm install -g @angular/cli`

### 1. Database Setup

The backend requires a PostgreSQL database. We use Docker to spin this up
easily.

```bash
cd backend
# Start the PostgreSQL container
docker compose up -d
```

_This will start a Postgres instance on port 5432 and automatically run
`init.sql` to create the schema._

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env if your Docker setup differs from defaults
   ```
3. Run the development server:
   ```bash
   deno task dev
   ```
   The API will be available at `http://localhost:8000` (or the port specified
   in your code/env).

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200/` in your browser.

## 🛠️ Development Commands

### Backend

- `deno task dev`: Run in development mode (watch mode).
- `deno task start`: Run in production mode.
- `deno task test`: Run tests.
- `deno fmt`: Format code.
- `deno lint`: Lint code.

### Frontend

- `ng serve`: Run dev server.
- `ng build`: Build for production.
- `ng test`: Run unit tests.

## 🐳 Docker Deployment

### Backend

The backend's `docker-compose.yml` is primarily for the database. To run the
Deno app itself in a container, you would typically add a service for it, but
currently, it is designed to run on the host or a separate deployment
environment.

### Frontend

The frontend includes a `Dockerfile` and `docker-compose.yml` for building a
production-ready Nginx container.

```bash
cd frontend
docker compose up --build
```

This will build the Angular app and serve it via Nginx on port 4200.
