#!/usr/bin/env node
/**
 * i18n ratchet guardrail.
 *
 * RULE-04 §3: user-facing strings MUST be defined in `public/i18n/*.json` and
 * rendered via Transloco. This check enforces that every page/component
 * template uses Transloco — OR appears in I18N_DEBT below. Inline templates
 * (`template: \`...\`` in non-spec `.ts` files) are scanned like `.html` files.
 *
 * The debt list is a ratchet: it may only shrink. Adding a new template
 * without Transloco fails this check; removing one should remove its entry.
 *
 * Literal-text ratchet: templates are also scanned for user-visible English
 * literals (text nodes outside {{ }}, and literal placeholder / title /
 * aria-label / alt attributes). Today's per-file counts live in
 * `tools/i18n-literals-ratchet.json`; a file may never exceed its count.
 * Move the string to `public/i18n/en.json` and lower the count.
 *
 * Regenerate the counts from the current tree (after fixing literals; never
 * to hide new ones):
 *   npm run lint:ratchet:update        # this script + check-design-system.mjs
 *   node tools/check-i18n.mjs --update # this script only
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const RATCHET_FILE = 'tools/i18n-literals-ratchet.json';
const UPDATE = process.argv.includes('--update');
const REPORT = process.argv.includes('--report');

const ROOTS = ['src/app/pages', 'src/app/components'];
const EXCLUDED_DIRS = new Set(['ui']); // primitives render projected content
// Developer-only page, deliberately English (not user-facing copy).
const EXCLUDED_PATHS = ['src/app/pages/design-system'];

/** file -> literal strings that are not translatable copy in that file. */
const ALLOWED_LITERALS = {
  // Brand wordmark; a brand name, never translated.
  'src/app/components/skillet-icon/skillet-icon.component.ts': ['skillet'],
};

/**
 * file -> reason (known i18n debt; do NOT add new entries without a migration plan)
 */
const I18N_DEBT = {};

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      const rel = full.split('\\').join('/');
      if (!EXCLUDED_DIRS.has(entry) && !EXCLUDED_PATHS.includes(rel)) yield* walk(full);
    } else if (/\.html$/.test(entry) || (/\.ts$/.test(entry) && !/\.spec\.ts$/.test(entry))) {
      yield full;
    }
  }
}

// Body allows escaped characters (e.g. \`) inside the backtick template.
const INLINE_TEMPLATE_RE = /template:\s*`((?:\\[\s\S]|[^`\\])*)`/g;
const INLINE_TEMPLATE_START_RE = /template:\s*['"`]/g;
const QUOTED_TEMPLATE_RE = /template:\s*['"]/;

/**
 * Returns [{html, startLine}] template sources for a file: the whole file for
 * `.html`, every inline `template: \`...\`` for `.ts` (none if absent).
 */
function templatesOf(file, content) {
  if (file.endsWith('.html')) return [{ html: content, startLine: 1 }];
  return [...content.matchAll(INLINE_TEMPLATE_RE)].map((m) => ({
    // Blank `${...}` interpolations so they are not read as text.
    html: m[1].replace(/\$\{[^}]*\}/g, blank),
    startLine: content.slice(0, m.index + m[0].indexOf('`') + 1).split('\n').length,
  }));
}

/** Literals in a file (real file line numbers), minus allowlisted strings. */
function findFileLiterals(file, content) {
  const allowedLiterals = ALLOWED_LITERALS[relative('.', file).split('\\').join('/')] ?? [];
  return templatesOf(file, content).flatMap(({ html, startLine }) =>
    findLiterals(html)
      .filter((f) => !allowedLiterals.includes(f.text))
      .map((f) => ({ ...f, line: f.line + startLine - 1 })),
  );
}

const blank = (m) => m.replace(/[^\n]/g, ' ');
const TAG_RE = /<\/?[a-zA-Z][\w.-]*((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const LITERAL_ATTRS = /(?:^|\s)(placeholder|title|aria-label|alt)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const hasWord = (t) => /[A-Za-z]{2,}/.test(t);

/** Returns [{line, text}] for user-visible literal English in a template. */
function findLiterals(content) {
  let src = content
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, blank)
    // Icon ligature text (Material Symbols), not user copy.
    .replace(/(<[^>]*material-(?:symbols|icons)[^>]*>)([^<]*)/g, (_, tag, t) => tag + blank(t))
    .replace(/\{\{[\s\S]*?\}\}/g, blank)
    // Control flow headers: @if (...) {, @for (...) {, @else {, @let x = ...;
    .replace(
      /@(?:else if|if|for|switch|case|defer|placeholder|loading|error|empty|else|default)\b[^{]*\{/g,
      blank,
    )
    .replace(/@let\b[^;]*;/g, blank)
    .replace(/[{}]/g, ' ');
  const found = [];
  const lineAt = (idx) => src.slice(0, idx).split('\n').length;
  // Attributes first (they live inside tags), then blank the tags out.
  for (const tag of src.matchAll(TAG_RE)) {
    for (const a of tag[1].matchAll(LITERAL_ATTRS)) {
      const text = (a[2] ?? a[3] ?? '').trim();
      if (hasWord(text)) found.push({ line: lineAt(tag.index), text: `${a[1]}="${text}"` });
    }
  }
  src = src.replace(TAG_RE, (m) => m.replace(/[^\n]/g, '\u0000'));
  for (const m of src.matchAll(/[^\u0000]+/g)) {
    const text = m[0].replace(/\s+/g, ' ').trim();
    if (hasWord(text)) {
      found.push({ line: lineAt(m.index + m[0].search(/\S/)), text });
    }
  }
  return found;
}

const literalCounts = {};
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative('.', file).split('\\').join('/');
    const found = findFileLiterals(file, readFileSync(file, 'utf8'));
    if (found.length) literalCounts[rel] = found;
  }
}

if (REPORT) {
  // Read-only: list every literal still present, optionally filtered by a path substring.
  const filter = process.argv[process.argv.indexOf('--report') + 1];
  for (const [rel, found] of Object.entries(literalCounts)) {
    if (filter && !filter.startsWith('--') && !rel.includes(filter)) continue;
    console.log(`${rel} (${found.length})`);
    for (const f of found) console.log(`  L${f.line} ${f.text}`);
  }
  process.exit(0);
}

if (UPDATE) {
  const out = {};
  for (const rel of Object.keys(literalCounts).sort()) out[rel] = literalCounts[rel].length;
  writeFileSync(RATCHET_FILE, JSON.stringify(out, null, 2) + '\n');
  console.log(`✔ wrote ${RATCHET_FILE}`);
  process.exit(0);
}

let ratchet = {};
try {
  ratchet = JSON.parse(readFileSync(RATCHET_FILE, 'utf8'));
} catch {
  // No ratchet file: every literal is a violation.
}

const violations = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (!file.endsWith('.ts')) continue;
    const content = readFileSync(file, 'utf8');
    const starts = [...content.matchAll(INLINE_TEMPLATE_START_RE)].length;
    if (
      starts > 0 &&
      (QUOTED_TEMPLATE_RE.test(content) || templatesOf(file, content).length < starts)
    ) {
      const rel = relative('.', file).split('\\').join('/');
      violations.push(
        `${rel} — unsupported inline template form, use a backtick template or templateUrl.`,
      );
    }
  }
}
for (const [rel, found] of Object.entries(literalCounts)) {
  const allowed = ratchet[rel] ?? 0;
  if (found.length > allowed) {
    const sample = found
      .slice(0, 5)
      .map((f) => `L${f.line} "${f.text.slice(0, 40)}"`)
      .join('; ');
    violations.push(
      `${rel} — ${found.length} hardcoded literal(s), ${allowed} allowed by ratchet. Use Transloco keys from public/i18n/en.json. e.g. ${sample}`,
    );
  }
}
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const rel = relative('.', file).split('\\').join('/');
    const content = readFileSync(file, 'utf8');
    // A .ts file only needs Transloco when its inline template shows text.
    const hasText =
      file.endsWith('.html') ||
      templatesOf(file, content).some(
        ({ html }) => /\{\{/.test(html) || findFileLiterals(file, content).length > 0,
      );
    if (hasText && !content.includes('transloco') && !I18N_DEBT[rel]) {
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
