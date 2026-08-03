---
name: test-driven-development
description: Workflow for TDD: requirement discovery, writing failing tests first (Red), minimal implementation (Green), refactoring, and regression testing.
---

# Skill: Test-Driven Development (TDD) Workflow

Use this skill whenever starting a new feature, modifying existing logic, adding API endpoints, or fixing a bug in the Pantry repository.

## The 4-Step TDD Loop

```
┌─────────────────────────────────────────────────────────┐
│ 1. Discover Requirements (Interactive User Alignment)  │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Write Failing Tests First (Red Phase)                │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Implement Minimal Solution (Green Phase)             │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Refactor & Run Full Regression Suite                │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed Step Instructions

### Step 1: Requirement Discovery & Clarification
Before writing any code or tests:
- Review task goals and domain model constraints (Tier 1: `Ingredient Category`, Tier 2: `Ingredient Group`, Tier 3: `Ingredient`, Tier 4: `Ingredient Item`).
- Clarify ambiguous requirements, edge cases, error conditions, and expected inputs/outputs with the user.
- Break down the request into concrete, testable assertion statements.

### Step 2: Red Phase — Write Failing Tests First
Write the unit/integration tests before writing implementation code:
- **Backend Tests (`backend/tests/`):**
  - Create test files using Deno's testing API (`Deno.test` or Hono `app.request`).
  - Cover valid inputs, invalid inputs, edge cases, and expected HTTP response status codes.
  - Run `deno task test` to **confirm that tests fail as expected** (Red).

- **Frontend Tests (`frontend/src/app/.../*.spec.ts`):**
  - Create component/service specs using Jasmine/Karma.
  - Mock external services and verify template rendering and signal/state updates.
  - Run `npm run test` to confirm test failures (Red).

### Step 3: Green Phase — Implement Minimal Code
- Write the simplest implementation required to make the failing tests pass.
- Do not write extra unrequested features or over-engineer solutions.
- Run `deno task test` (backend) or `npm run test` (frontend) to **confirm all tests now pass** (Green).

### Step 4: Refactor & Full Regression Check
- Clean up code formatting (`deno fmt`, `npm run format`).
- Run static linter (`deno lint`, `npm run lint`).
- Execute the full test suite to guarantee zero regressions across existing functionality.

---

## TDD Rules & Checklist
- [ ] Requirements fully clarified and documented in test assertions before writing logic.
- [ ] Test failure verified (Red phase) before implementing feature logic.
- [ ] Implementation code written to pass tests (Green phase).
- [ ] Code formatted and linted cleanly without swallowing errors or disabling tests.
- [ ] Full regression suite executed and 100% passing.
