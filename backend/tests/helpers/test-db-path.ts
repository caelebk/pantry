/**
 * Test-isolation helper for route integration tests.
 *
 * Setting `DB_PATH` here works because ES modules evaluate static imports
 * in declaration order: this file must be imported FIRST, before anything
 * that transitively loads `src/config/env.ts`.
 */
import { Database } from '@db/sqlite';
import { initDB } from '../../src/db/client.ts';

const dir = await Deno.makeTempDir({ prefix: 'pantry_test_db_' });
Deno.env.set('DB_PATH', `${dir}/test-${Date.now()}.db`);

/**
 * Initialize a throwaway SQLite database (temp dir) with all SQL
 * migrations applied. Never touches the developer's real pantry.db.
 */
export function initMigratedDB(): Database {
  const db = initDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const executedRows = db.prepare('SELECT name FROM _migrations').all() as {
    name: string;
  }[];
  const executed = new Set(executedRows.map((r) => r.name));

  const files = [...Deno.readDirSync('migrations')]
    .filter((e) => e.isFile && e.name.endsWith('.sql'))
    .map((e) => e.name)
    .sort();

  for (const file of files) {
    if (executed.has(file)) continue;
    db.exec(Deno.readTextFileSync(`migrations/${file}`));
    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
  }

  return db;
}
