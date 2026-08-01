---
name: documentation-architect
description: Documentation Agent skill for maintaining READMEs, API specifications, database schemas, inline docstrings, and Transloco i18n keys.
---

# Skill: Documentation Architect Agent

Use this skill when updating project documentation, writing API specs, updating database setup guides, or managing i18n translation strings.

## Core Documentation Artifacts & Guidelines

### 1. Repository Core Docs
- **`README.md` & `GEMINI.md`:** Maintain quick start commands, CLI reference tables, architecture overview, and 4-tier domain hierarchy rules.
- **`DATABASE_SETUP.md`:** Keep SQLite schema definitions, seed instructions, and migration steps accurate.

### 2. Codebase Documentation & Comments
- **Docstrings & JSDoc:** Preserve existing docstrings. Add concise JSDoc comments to complex service methods and API route handlers.
- **Transloco i18n Dictionary:** Ensure all new UI labels are added to `frontend/public/i18n/en.json` with clean key hierarchies (e.g. `INVENTORY.CATEGORIES.TITLE`).

### 3. Documentation Integrity Rules
- Use GitHub Flavored Markdown with clean code block syntax highlighting.
- Use exact clickable file links with `file://` scheme when referencing files.
- Keep documentation synchronized with implementation code during schema or API contract updates.
