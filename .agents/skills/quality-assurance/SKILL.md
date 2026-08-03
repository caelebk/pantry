---
name: quality-assurance
description: Complete verification suite including TDD red/green validation, Deno tests, formatting, linting, Angular specs, and E2E checks.
---

# Skill: Quality Assurance & Pre-Commit Verification

Use this skill during TDD cycles and before declaring work completed, submitting pull requests, or verifying refactored code across backend and frontend.

## TDD Quality Verification Phases

1. **Pre-Implementation Verification (Red Phase):** Confirm that new tests fail against existing code prior to implementation changes.
2. **Post-Implementation Verification (Green Phase):** Confirm that new tests pass once code changes are made.
3. **Full Suite Regression Check:** Execute the complete test suite to ensure existing features remain 100% operational.

---

## Full Verification Checklist & Suite

### 1. Backend Verification (`/backend`)
Run the following commands in sequence:
```bash
# 1. Format Deno backend code
deno fmt

# 2. Lint backend codebase
deno lint

# 3. Execute backend Deno unit and integration test suite
deno task test
```

### 2. Frontend Verification (`/frontend`)
Run the following commands in sequence:
```bash
# 1. Format code with Prettier
npm run format

# 2. Perform static analysis with ESLint
npm run lint

# 3. Execute Angular unit tests
npm run test

# 4. Verify Angular production build compilation
npm run build

# 5. (Optional/E2E) Execute Playwright test suite
npm run e2e
```

## Mandatory Regression Safeguard Rules
- Adhere to Test-Driven Development (TDD) for all additions or bug fixes.
- Never delete, disable, or comment out existing failing tests to pass verification.
- Always resolve root cause defects in code contracts when test failures occur.
