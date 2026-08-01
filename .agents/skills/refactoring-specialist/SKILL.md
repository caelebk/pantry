---
name: refactoring-specialist
description: Refactoring Agent skill for safely modernizing, decoupling, simplifying, and optimizing code without breaking API contracts or test coverage.
---

# Skill: Refactoring Specialist Agent

Use this skill when simplifying complex functions, eliminating duplicate logic (DRY), modernizing code patterns, or decoupling components in Pantry.

## Refactoring Guiding Principles

### 1. Preserve Existing API & Data Contracts
- Never alter public function signatures, REST payload shapes, or database schema column names without updating all invocation sites across backend and frontend.
- Preserve all existing unit and integration test assertions.

### 2. TDD Refactoring Safety Loop
1. **Run Full Test Suite First:** Execute `deno task test` (backend) or `npm run test` (frontend) before making any code changes to establish a green baseline.
2. **Perform Small, Incremental Edits:** Make isolated refactoring steps rather than large rewrite blocks.
3. **Verify Tests Continuously:** Re-run tests after each incremental change to instantly isolate regressions.

### 3. Clean Code & Design Token Enforcement
- **Backend:** Replace duplicated SQL queries with reusable service helper functions.
- **Frontend:** Extract repetitive inline markup into reusable PrimeNG Angular components or utility classes. Consolidate custom CSS into design tokens and `.glass-card` classes.

## Refactoring Checklist
- [ ] Green test baseline verified before refactoring starts.
- [ ] No behavioral changes or contract regressions introduced.
- [ ] Code formatted (`deno fmt` / `npm run format`) and linted (`deno lint` / `npm run lint`).
- [ ] Full regression suite executed and 100% passing.
