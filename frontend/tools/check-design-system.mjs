#!/usr/bin/env node
/**
 * Design-system guardrails.
 *
 * Fails when forbidden legacy UI patterns reappear in page/component
 * templates. Canonical replacements live in `docs/design-system.md`.
 *
 * Documented exceptions are allowlisted below with a reason. Adding to the
 * allowlist requires a matching entry in the docs (see "Requesting an
 * exception" in docs/design-system.md).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/app/pages', 'src/app/components'];
// Standalone files outside ROOTS that must also comply (app shell).
const EXTRA_FILES = ['src/app/app.component.html'];
const EXCLUDED_DIRS = new Set(['ui']); // canonical primitives may use raw patterns

const RULES = [
  {
    id: 'no-native-select',
    pattern: /<select[\s>]/,
    message: 'Raw <select> — use <p-select appendTo="body"> (dropdown contract).',
  },
  {
    id: 'no-hand-rolled-spinner',
    pattern: /animate-spin/,
    message: 'Hand-rolled spinner — use <pantry-spinner> from @ui.',
  },
  {
    id: 'no-hand-rolled-skeleton',
    pattern: /animate-pulse/,
    message: 'Hand-rolled skeleton — use <pantry-skeleton variant="..."> from @ui.',
  },
  {
    id: 'no-inline-primary-button',
    pattern: /bg-primary-600\s+hover:bg-primary-700|hover:bg-primary-700[^"]*rounded-xl/,
    message: 'Inline primary-button string — use .btn-primary.',
  },
  {
    id: 'no-inline-badge-pill',
    pattern: /bg-(emerald|amber|rose|indigo|purple)-500\/10 text-/,
    message: 'Inline badge pill — use <pantry-badge variant="..."> from @ui.',
  },
  {
    id: 'no-hardcoded-brand-hex',
    pattern: /#141[Cc]2[Ee]|#ea580c|#0d1322|#8b5cf6/i,
    message: 'Hardcoded brand hex — use tokens (bg-navy-900, bg-primary-600, bg-violet-500, ...).',
  },
];

/** file -> ruleId -> reason (must be mirrored in docs/design-system.md) */
const ALLOWLIST = {
  'src/app/pages/inventory/inventory-components/ingredient-category/ingredient-category.component.html':
    {
      'no-hardcoded-brand-hex':
        'Data-driven category colors; #ea580c is the fallback for missing data values. See docs "Documented exceptions".',
    },
  'src/app/pages/inventory/ingredient-categories-page/ingredient-categories-page.component.html': {
    'no-hardcoded-brand-hex':
      'Data-driven group colors; #8b5cf6 is the fallback for missing data values. See docs "Documented exceptions".',
  },
  'src/app/app.component.html': {
    'no-hardcoded-brand-hex':
      'Decorative hero SVG artwork uses literal gradient stops (#38bdf8/#60a5fa/#3b82f6/#0ea5e9) that have no Tailwind token equivalent in SVG attributes. See docs "Documented exceptions".',
  },
  'src/app/pages/inventory/inventory.component.html': {
    'no-hand-rolled-skeleton':
      'Live-status indicator dot (2px pulse dot next to pagination summary), not a loading skeleton.',
  },
  'src/app/pages/inventory/ingredients-page/ingredients-page.component.html': {
    'no-hand-rolled-skeleton':
      'Live-status indicator dot (2px pulse dot next to pagination summary), not a loading skeleton.',
  },
  'src/app/pages/recipes/recipe-components/add-recipe-form/add-recipe-form.component.html': {
    'no-inline-badge-pill':
      'Difficulty segmented selector branches (bordered state buttons, not pills).',
  },
  'src/app/pages/meal-planner/daily-focus/daily-focus.component.html': {
    'no-inline-badge-pill': 'Status icon tile ternary (40px tile, not a badge pill).',
  },
};

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry)) yield* walk(full);
    } else if (/\.html$/.test(entry)) {
      yield full;
    } else if (/\.ts$/.test(entry) && !/\.spec\.ts$/.test(entry) && !/__tests__/.test(entry)) {
      // Inline templates in TS components are scanned too.
      yield full;
    }
  }
}

const violations = [];
const scanFile = (file) => {
  const rel = relative('.', file).split('\\').join('/');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.pattern.test(line)) {
        const allowed = ALLOWLIST[rel]?.[rule.id];
        if (!allowed) {
          violations.push(`${rel}:${i + 1} [${rule.id}] ${rule.message}`);
        }
      }
    }
  });
};
for (const root of ROOTS) {
  for (const file of walk(root)) {
    scanFile(file);
  }
}
for (const file of EXTRA_FILES) {
  try {
    scanFile(file);
  } catch {
    // Optional file — skip when absent.
  }
}

if (violations.length) {
  console.error(`\n✖ design-system guardrails: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error('  ' + v);
  console.error('\nSee docs/design-system.md for canonical patterns and the exception process.');
  process.exit(1);
}
console.log('✔ design-system guardrails passed');
