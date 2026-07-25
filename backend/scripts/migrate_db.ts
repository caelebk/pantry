import { join } from '@std/path';
import { closeDB, getDB, initDB } from '../src/db/client.ts';

export function runMigrations() {
  console.log('🚀 Starting migrations...');

  initDB();
  const db = getDB();

  try {
    // 1. Create migrations table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      );
    `);

    // 2. Get executed migrations
    const executedRows = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
    const executed = new Set(executedRows.map((r) => r.name));

    // 3. Read migration files
    const migrationsDir = join(Deno.cwd(), 'migrations');
    const files = [];
    try {
      for (const entry of Deno.readDirSync(migrationsDir)) {
        if (entry.isFile && entry.name.endsWith('.sql')) {
          files.push(entry.name);
        }
      }
    } catch (e) {
      console.error(`⚠️ Could not read migrations directory: ${migrationsDir}`);
      throw e;
    }

    files.sort(); // Ensure order (0001, 0002, etc.)

    // 4. Run pending migrations
    for (const file of files) {
      if (!executed.has(file)) {
        console.log(`▶️ Running migration: ${file}`);
        const filePath = join(migrationsDir, file);
        const sql = Deno.readTextFileSync(filePath);

        // Use a transaction for each migration
        db.exec('BEGIN');
        try {
          db.exec(sql);
          db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
          db.exec('COMMIT');
          console.log(`✅ Applied: ${file}`);
        } catch (err) {
          console.error(`❌ Failed migration ${file}:`, err);
          db.exec('ROLLBACK');
          throw err;
        }
      }
    }

    console.log('✨ All migrations applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    Deno.exit(1);
  } finally {
    closeDB();
  }
}

if (import.meta.main) {
  runMigrations();
}
