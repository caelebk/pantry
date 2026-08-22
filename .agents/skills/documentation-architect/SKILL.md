---
name: documentation-architect
description: Documentation Agent skill for maintaining READMEs, API specifications, database schemas, inline docstrings, and Transloco i18n keys.
---

# Skill: Documentation Architect Agent

Use this skill when updating project documentation, writing API specs, updating database setup guides, or managing i18n translation strings.

## Core Documentation Artifacts & Guidelines

### 1. Repository Core Docs
- **All agent entry points (`CLAUDE.md`, `GEMINI.md`, `OPENCODE.md`, `PI.md`, `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md`) plus `README.md`:** Keep them as thin bridges to `.agents/AGENTS.md`; when commands change, update `.agents/AGENTS.md` first and mirror only where entry points duplicate them.
- **`backend/DATABASE_SETUP.md`:** Keep SQLite schema definitions, seed instructions, and migration steps accurate.

### 2. Codebase Documentation & Comments
- **Docstrings & JSDoc:** Preserve existing docstrings. Add concise JSDoc comments to complex service methods and API route handlers.
- **Transloco i18n Dictionary:** Ensure all new UI labels are added to `frontend/public/i18n/en.json` with clean key hierarchies (e.g. `INVENTORY.CATEGORIES.TITLE`).

### 3. Documentation Integrity Rules
- Use GitHub Flavored Markdown with clean code block syntax highlighting.
- Use repo-relative Markdown links (e.g. `[AGENTS.md](.agents/AGENTS.md)`) when referencing files. Never use absolute `file:///Users/...` URLs — they break on other machines and CI.
- Keep documentation synchronized with implementation code during schema or API contract updates.
