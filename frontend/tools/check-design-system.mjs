#!/usr/bin/env node
/**
 * Design-system guardrails.
 *
 * Fails when forbidden legacy UI patterns reappear in page/component
 * templates. Canonical replacements live in `DESIGN.md`.
 *
 * Documented exceptions are allowlisted below with a reason. Adding to the
 * allowlist requires a matching entry in the docs (see "Requesting an
 * exception" in DESIGN.md → Implementation → Documented Exceptions).
 *
 * Two kinds of allowance:
 *  - ALLOWLIST (below): documented, permanent exceptions per file and rule.
 *  - RATCHET rules (`ratchet: true`): known legacy offenders are stored as
 *    per-file counts in `tools/design-system-ratchet.json`. A file may never
 *    exceed its stored count; new files start at zero. When you fix offenders,
 *    lower the counts.
 *
 * Regenerate the ratchet counts from the current tree (run after fixing
 * offenders; never to hide new ones):
 *   npm run lint:ratchet:update        # this script + check-i18n.mjs
 *   node tools/check-design-system.mjs --update   # this script only
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const RATCHET_FILE = 'tools/design-system-ratchet.json';
const UPDATE = process.argv.includes('--update');

const ROOTS = ['src/app/pages', 'src/app/components'];
// Standalone files outside ROOTS that must also comply (app shell).
const EXTRA_FILES = ['src/app/app.component.html'];
const EXCLUDED_DIRS = new Set(['ui']); // canonical primitives may use raw patterns

const RULES = [
  {
    id: 'no-native-select',
    ratchet: true, // profile.component.ts was missed by the old regex
    pattern: /<select(\s|>|$)/m,
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

  // --- Ratchet rules: legacy offenders are counted in RATCHET_FILE ---
  {
    id: 'no-pi-spin',
    ratchet: true,
    pattern: /\bpi-spin\b/,
    message:
      'pi-spin spinner — use <pantry-skeleton> or the documented loading pattern (DESIGN.md → Feedback & Loading).',
  },
  {
    id: 'no-native-confirm',
    ratchet: true,
    pattern: /(^|[^\w.])(window\.)?confirm\(/,
    message:
      'Native confirm() — use <p-confirmDialog> or <pantry-confirm-dialog> from @ui (DESIGN.md → Confirmation).',
  },
  {
    id: 'no-font-extrabold',
    ratchet: true,
    pattern: /\bfont-extrabold\b/,
    message:
      'font-extrabold — use font-semibold / font-bold per the type scale (DESIGN.md → Typography).',
  },
  {
    id: 'no-uppercase-tracking-label',
    ratchet: true,
    pattern: /\buppercase\b.*\btracking-|\btracking-.*\buppercase\b/,
    message: 'All-caps tracked micro label — use sentence case (D25, DESIGN.md → Typography).',
  },
  {
    id: 'no-tiny-arbitrary-text',
    ratchet: true,
    pattern: /\btext-\[(9|10|11)px\]/,
    message: 'Arbitrary tiny text (9–11px) — use text-xs or larger (DESIGN.md → Typography).',
  },
  {
    id: 'no-tailwind-red',
    ratchet: true,
    pattern:
      /\b(?:[a-z-]+:)*(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|decoration|shadow)-red-\d{2,3}/,
    message: 'Tailwind red-* colour — use rose-* or status tokens (DESIGN.md → Colors).',
  },
  {
    id: 'no-text-gray',
    ratchet: true,
    pattern: /\btext-gray-\d{2,3}/,
    message: 'text-gray-* — use the slate/surface text tokens (DESIGN.md → Colors).',
  },
  {
    id: 'no-forced-height',
    ratchet: true,
    pattern: /!h-\[/,
    message:
      'Forced height (!h-[...]) — use the primitive size variants or a token (DESIGN.md → Sizing).',
  },
];

/**
 * Whole-file rules (need more than one line of context).
 * `check(content)` returns the 1-based line numbers of offences.
 */
const FILE_RULES = [
  {
    id: 'no-page-root-wrapper',
    ratchet: true,
    appliesTo: (rel) => rel.endsWith('.component.html') && !rel.startsWith('src/app/components/'),
    message:
      'Page root adds its own max-w-*/mx-auto container — the shell already provides it; use page-layout / page-header (DESIGN.md → Layout).',
    check(content) {
      // First real element of the template (skip comments / control flow / ng-container).
      const stripped = content.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));
      const re = /<(?!ng-|\/)([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
      const m = re.exec(stripped);
      if (!m) return [];
      const cls = /\bclass="([^"]*)"/.exec(m[2])?.[1] ?? '';
      if (/\bmax-w-/.test(cls) && /\bmx-auto\b/.test(cls)) {
        return [stripped.slice(0, m.index).split('\n').length];
      }
      return [];
    },
  },
];

/** file -> ruleId -> reason (must be mirrored in DESIGN.md → Documented Exceptions) */
const ALLOWLIST = {
  'src/app/pages/meal-planner/daily-focus/daily-focus.component.html': {
    'no-inline-badge-pill': 'Status icon tile ternary (40px tile, not a badge pill).',
  },
  'src/app/components/toast-container/toast-container.component.ts': {
    'no-inline-badge-pill':
      'Status icon tile inside a toast, not a badge; the toast also shows a text title.',
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

const loadRatchet = () => {
  try {
    return JSON.parse(readFileSync(RATCHET_FILE, 'utf8'));
  } catch {
    return {};
  }
};
const ratchet = loadRatchet();
const violations = [];
const counts = {}; // rel -> ruleId -> [line numbers] (ratchet rules only)
const record = (rel, rule, line) => {
  ((counts[rel] ??= {})[rule.id] ??= []).push(line);
};
const scanFile = (file) => {
  const rel = relative('.', file).split('\\').join('/');
  const content = readFileSync(file, 'utf8');
  content.split('\n').forEach((line, i) => {
    for (const rule of RULES) {
      if (!rule.pattern.test(line)) continue;
      if (rule.ratchet) record(rel, rule, i + 1);
      else if (!ALLOWLIST[rel]?.[rule.id]) {
        violations.push(`${rel}:${i + 1} [${rule.id}] ${rule.message}`);
      }
    }
  });
  for (const rule of FILE_RULES) {
    if (!rule.appliesTo(rel)) continue;
    for (const line of rule.check(content)) record(rel, rule, line);
  }
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

const ALL_RATCHET_RULES = [...RULES, ...FILE_RULES].filter((r) => r.ratchet);
if (UPDATE) {
  const out = {};
  for (const rel of Object.keys(counts).sort()) {
    for (const id of Object.keys(counts[rel]).sort()) {
      (out[rel] ??= {})[id] = counts[rel][id].length;
    }
  }
  writeFileSync(RATCHET_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`✔ wrote ${RATCHET_FILE}`);
  process.exit(0);
}
for (const rule of ALL_RATCHET_RULES) {
  for (const rel of Object.keys(counts)) {
    const lines = counts[rel][rule.id];
    if (!lines) continue;
    const allowed = ratchet[rel]?.[rule.id] ?? 0;
    if (lines.length > allowed) {
      violations.push(
        `${rel}:${lines.join(',')} [${rule.id}] ${rule.message} (${lines.length} found, ${allowed} allowed by ratchet)`,
      );
    }
  }
}

if (violations.length) {
  console.error(`\n✖ design-system guardrails: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error('  ' + v);
  console.error('\nSee DESIGN.md for canonical patterns and the exception process.');
  process.exit(1);
}
console.log('✔ design-system guardrails passed');
