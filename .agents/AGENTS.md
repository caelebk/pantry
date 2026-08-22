# AGENTS.md - Workspace Agent Rules & Guidelines

This file defines project-wide rules, architecture contracts, domain taxonomy, and coding standards for all AI models working in the **Pantry** codebase.

---

## 🌐 Universal Model & Tool Compatibility

This harness is **model-agnostic** and compatible with any AI model (Gemini, Claude, GPT, Codex, Inflection Pi) and IDE/CLI assistant (Cursor, Windsurf, OpenCode, Pi, Aider, GitHub Copilot).

All model-specific entry point files bridge directly to this file (`.agents/AGENTS.md`):
- `GEMINI.md` (Gemini / Antigravity entry point)
- `CLAUDE.md` (Claude Code / Anthropic entry point)
- `OPENCODE.md` (OpenCode CLI / Agent entry point)
- `PI.md` (Pi CLI / Agent entry point)
- `.cursorrules` (Cursor IDE entry point)
- `.windsurfrules` (Windsurf IDE entry point)
- `.github/copilot-instructions.md` (GitHub Copilot entry point)

**Any AI assistant loading this repository MUST inspect `.agents/AGENTS.md` and trigger appropriate skills in `.agents/skills/`.**

---

## 📜 Mandatory Workspace Rules

### RULE-01: Test-Driven Development (TDD) Methodology
All feature development, bug fixes, API endpoint modifications, and refactoring MUST strictly follow TDD:
1. **Clarify Requirements:** Work with the user to discover requirements and establish precise acceptance criteria.
2. **Red Phase (Write Tests First):** Write failing unit/integration tests (`backend/tests/` or frontend `.spec.ts`) validating requirements BEFORE writing implementation code. Run `deno task test` or `npm run test` to confirm test failure.
3. **Green Phase (Minimal Implementation):** Write minimal implementation code to satisfy tests. Confirm all tests pass.
4. **Refactor & Regression Verification:** Format, lint, and run the full test suite to guarantee zero regressions. Never delete or disable failing tests.

### RULE-02: Strict Domain Taxonomy & Terminology
Always strictly enforce the 4-tier domain hierarchy across database schemas, backend DTOs, frontend models, UI labels, and documentation:

```
[ Ingredient Category ] (Tier 1: Protein & Dairy, Fiber & Produce, Carbs & Grains, etc.)
       │
       ▼
[ Ingredient Group ]    (Tier 2: Meat, Seafood, Beans, Vegetables, Fruits, Grains, etc.)
       │
       ▼
[ Ingredient ]        (Tier 3: Master definition e.g. Chicken Breast, Gala Apple, Jasmine Rice)
       │
       ▼
[ Ingredient Item ]   (Physical stock instance in Fridge/Pantry with qty, exp date, location)
```

- **`Ingredient Category`** — *Never use "Nutrient Group" or "Nutrient Type"*.
- **`Ingredient Group`** — *Never use generic "Category"*.
- **`Ingredient`** — *Never use "Master Ingredient"*.
- **`Ingredient Item`** — *Never use plain "Item" when referring to physical inventory stock*.

### RULE-03: Security & Database Integrity
1. **Parameterized Queries:** All SQL queries in `backend/src/services/` MUST use prepared parameters (`db.prepare(...)`). Never concatenate raw user input into SQL strings.
2. **SQLite WAL Mode:** Database access must preserve Write-Ahead Logging (WAL) mode and enforce foreign keys (`PRAGMA foreign_keys = ON;`).
3. **Input Validation:** All HTTP route parameters and request bodies MUST be validated in `backend/src/validators/` before invoking business logic.
4. **Immutable Migration Logs:** Never edit past SQL migration files (e.g. `0001_initial_schema.sql`). All database schema alterations must be added as new sequential migration files in `backend/migrations/`.


### RULE-04: Frontend Architecture & UI Aesthetics
1. **Standalone Components:** All Angular components must use Angular Standalone architecture (`standalone: true`).
2. **UI & Glassmorphism Theme:** Use PrimeNG 20 controls (`@primeng/themes`), TailwindCSS v4 flexbox/grid layout, and custom SCSS `.glass-card` styling for card elements.
3. **Transloco i18n:** User-facing strings MUST be defined in `frontend/public/i18n/en.json` (and locale dictionaries) and rendered via Transloco pipes/directives.

### RULE-05: Code Formatting & Quality Safeguards
1. **Backend Formatting & Linting:** Always run `deno fmt` and `deno lint` before completing tasks.
2. **Frontend Formatting & Linting:** Always run `npm run format` and `npm run lint` before completing tasks.
3. **Type Safety:** Always define explicit interfaces in `models/` for DTOs and state. Do not use `any`.

### RULE-06: Mandatory 3-Step Verification Workflow Before Task Completion
NEVER declare a task resolved, a bug fixed, or a feature complete without performing and confirming the full 3-step verification workflow:
1. **Code & Logic Audit (Bug Check):** Inspect all modified files, template bindings, and imports to ensure there are no logic bugs, missing imports/modules, or broken component contracts.
2. **Automated Test Suite:** Run tests to confirm zero regressions (`cd backend && deno task test` and `cd frontend && npm run test`).
3. **Build Compilation:** Run production build checks to guarantee full type safety and template compilation (`cd frontend && npm run build`).

### RULE-07: Design System Compliance & Canonical UI Primitives
All frontend modifications MUST strictly comply with the centralized design system:
1. **Source of Truth:** Consult `docs/design-system.md` and `docs/design-system-index.md` before making UI changes.
2. **Canonical `@ui` Primitives:** Always reuse canonical components from `@ui` (`SearchInputComponent`, `SpinnerComponent`, `EmptyStateComponent`, `BadgeComponent`, `SkeletonComponent`, `FormFieldComponent`, `CardComponent`). Never hand-roll local copies of search inputs, loading spinners, empty states, or skeletons.
3. **Button Contract:** Standardize all button elements using `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, or `.btn-icon`. Avoid long arbitrary inline Tailwind button strings.
4. **Dropdown Contract:** Use PrimeNG `p-select` with `appendTo="body"`. Never introduce raw unstyled `<select>` elements or hand-coded `<ul><li>` popup menus.
5. **Design System Validation:** Run `cd frontend && npm run validate:design-system` on all UI tasks.
6. **UI Impact Report:** Every frontend change must include a compact `Design-system impact` report in the final response.

---

## 🤖 Specialized Coding Agents & Skill Mapping

Agents operating in this workspace adopt specialized roles mapped to `.agents/skills/`:

| Agent Role | Primary Responsibilities | Skill Reference |
| :--- | :--- | :--- |
| **UI/UX Design Specialist** | Consistent themeing, element height & baseline alignment, minimalism, contrast, visual hierarchy | [.agents/skills/ui-ux-design/SKILL.md](file:///Users/caelebkoharjo/Desktop/github/pantry/.agents/skills/ui-ux-design/SKILL.md) |
| **Code Reviewer** | Security audit, taxonomy compliance, test coverage, code quality reviews | [.agents/skills/code-reviewer/SKILL.md](file:///Users/caelebkoharjo/Desktop/github/pantry/.agents/skills/code-reviewer/SKILL.md) |
| **Refactoring Specialist** | Safe code simplification, decoupling, DRY enforcement, design token adoption | [.agents/skills/refactoring-specialist/SKILL.md](file:///Users/caelebkoharjo/Desktop/github/pantry/.agents/skills/refactoring-specialist/SKILL.md) |
| **Bug Investigator** | Log inspection, stack trace analysis, TDD bug reproduction, root cause fixes | [.agents/skills/bug-investigator/SKILL.md](file:///Users/caelebkoharjo/Desktop/github/pantry/.agents/skills/bug-investigator/SKILL.md) |
| **Documentation Architect** | API specs, DB schema docs, README updates, Transloco i18n keys | [.agents/skills/documentation-architect/SKILL.md](file:///Users/caelebkoharjo/Desktop/github/pantry/.agents/skills/documentation-architect/SKILL.md) |
| **QA Specialist** | Pre-commit verification suites, formatting, linting, regression testing | [.agents/skills/quality-assurance/SKILL.md](file:///Users/caelebkoharjo/Desktop/github/pantry/.agents/skills/quality-assurance/SKILL.md) |
| **TDD Specialist** | Requirement discovery, red/green testing loops, assertion verification | [.agents/skills/test-driven-development/SKILL.md](file:///Users/caelebkoharjo/Desktop/github/pantry/.agents/skills/test-driven-development/SKILL.md) |

---

## 🚀 Development & Verification Commands

- **Concurrent Watch Mode:** `./dev.sh`
- **Backend Test Suite:** `cd backend && deno task test`
- **Backend Migration:** `cd backend && deno task db:migrate`
- **Backend Lint & Format:** `cd backend && deno lint && deno fmt`
- **Frontend Test Suite:** `cd frontend && npm run test`
- **Frontend Build Check:** `cd frontend && npm run build`
- **Frontend Lint & Format:** `cd frontend && npm run lint && npm run format`
- **Frontend Design System Validation:** `cd frontend && npm run validate:design-system`
