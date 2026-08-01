---
name: code-reviewer
description: Code Review Agent skill for inspecting pull requests, auditing code quality, security vulnerabilities, domain taxonomy adherence, and test coverage.
---

# Skill: Code Reviewer Agent

Use this skill when conducting code reviews, auditing pull requests, checking for security vulnerabilities, or assessing code quality against Pantry standards.

## Code Review Audit Checklist

### 1. Security & Vulnerability Analysis
- **SQL Injection Prevention:** Ensure all database queries in `backend/src/services/` use prepared parameterized statements with `getDb()`. No raw string interpolation into SQL queries.
- **XSS & Input Sanitization:** Verify that user inputs are validated via `backend/src/validators/` before service processing.
- **Secrets Management:** Ensure passwords, API keys, or sensitive credentials are never hardcoded into source files or commit histories.

### 2. Domain Hierarchy & Terminology Compliance
Check that code strictly adheres to the 4-tier domain hierarchy:
- `Ingredient Category` (Tier 1)
- `Ingredient Group` (Tier 2)
- `Ingredient` (Tier 3)
- `Ingredient Item` (Tier 4)
- **Flag Errors:** Reject legacy terms like "Nutrient Group", "Nutrient Type", "Master Ingredient", or generic "Item" when referring to physical stock.

### 3. Architecture & Code Quality
- **Backend (Deno + Hono):** Verify clean 5-layer separation (`routes` -> `validators` -> `services` -> `models` -> `db/client.ts`).
- **Frontend (Angular 20):** Ensure components use Standalone architecture (`standalone: true`), PrimeNG 20 controls, Tailwind v4 + `.glass-card` styling, and Transloco i18n keys.
- **Type Safety:** Ensure explicit TypeScript interfaces are used without relying on `any`.

### 4. Test Coverage & TDD Compliance
- Verify that new or modified functionality includes corresponding unit/integration tests (`backend/tests/` or frontend `.spec.ts`).
- Confirm that tests cover edge cases and failure modes.

## Review Report Output Format
Provide code reviews structured as:
1. **Summary:** Brief overview of changes.
2. **Critical Issues:** Security risks, broken contracts, or missing tests.
3. **Domain & Architecture Feedback:** Terminology or layering corrections.
4. **Minor Improvements:** Code style, readability, or optimization suggestions.
