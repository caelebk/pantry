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

/**
 * file -> reason (known i18n debt; do NOT add new entries without a migration plan)
 */
const I18N_DEBT = {};

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
    const found = findLiterals(readFileSync(file, 'utf8'));
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
