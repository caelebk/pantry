#!/usr/bin/env node
/**
 * i18n ratchet guardrail.
 *
 * RULE-04 §3: user-facing strings MUST be defined in `public/i18n/*.json` and
 * rendered via Transloco. This check enforces that every page/component
 * template uses Transloco — OR appears in I18N_DEBT below.
 *
 * The debt list is a ratchet: it may only shrink. Adding a new template
 * without Transloco fails this check; removing one should remove its entry.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/app/pages', 'src/app/components'];
const EXCLUDED_DIRS = new Set(['ui']); // primitives render projected content

/**
 * file -> reason (known i18n debt; do NOT add new entries without a migration plan)
 */
const I18N_DEBT = {
  'src/app/pages/inventory/add-ingredient-group-page/add-ingredient-group-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/add-ingredient-page/add-ingredient-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/add-item-page/add-item-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/edit-ingredient-group-page/edit-ingredient-group-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/edit-ingredient-page/edit-ingredient-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/edit-item-page/edit-item-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/ingredient-categories-page/ingredient-categories-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/ingredient-groups-page/ingredient-groups-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/ingredients-page/ingredients-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/inventory-components/ingredient-category/ingredient-category.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/inventory-components/ingredient-group-container/ingredient-group-container.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/inventory-components/ingredient-group/ingredient-group.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/inventory-components/ingredient-row/ingredient-row.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/inventory-components/item-card/item-card.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/inventory/inventory-overview-page/inventory-overview-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/meal-planner/daily-focus/daily-focus.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/meal-planner/meal-planner.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/meal-planner/plan-meal-page/plan-meal-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/meal-planner/weekly-view/weekly-view.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/recipes/recipe-components/recipe-card/recipe-card.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/pages/shopping-list/restock-review-page/restock-review-page.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
  'src/app/components/stat-card/stat-card.component.html':
    'Pre-existing hardcoded English; pending i18n migration.',
};

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry)) yield* walk(full);
    } else if (/\.html$/.test(entry)) {
      yield full;
    }
  }
}

const violations = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative('.', file).split('\\').join('/');
    const content = readFileSync(file, 'utf8');
    if (!content.includes('transloco') && !I18N_DEBT[rel]) {
      violations.push(
        `${rel} — no Transloco usage found. Add translation keys from public/i18n/en.json.`,
      );
    }
  }
}

if (violations.length) {
  console.error(`\n✖ i18n guardrail: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error('  ' + v);
  console.error('\nUser-facing strings must use Transloco keys (RULE-04 §3).');
  process.exit(1);
}
console.log('✔ i18n guardrail passed');
