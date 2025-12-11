import { join } from '@std/path';
import { closeDB, getPool, initDB } from '../src/db/client.ts';

export async function runMigrations() {
  console.log('🚀 Starting migrations...');

  await initDB();
  const pool = getPool();
  const client = await pool.connect();

  try {
    // 1. Create migrations table if not exists
    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Get executed migrations
    const { rows: executedRows } = await client.queryObject<{ name: string }>(
      'SELECT name FROM _migrations',
    );
    const executed = new Set(executedRows.map((r) => r.name));

    // 3. Read migration files
    const migrationsDir = join(Deno.cwd(), 'migrations');
    const files = [];
    try {
      for await (const entry of Deno.readDir(migrationsDir)) {
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
        const sql = await Deno.readTextFile(filePath);

        const transaction = client.createTransaction('migration_' + file);
        await transaction.begin();
        try {
          await transaction.queryArray(sql);
          await transaction.queryArray(
            'INSERT INTO _migrations (name) VALUES ($1)',
            [file],
          );
          await transaction.commit();
          console.log(`✅ Applied: ${file}`);
        } catch (err) {
          console.error(`❌ Failed migration ${file}:`, err);
          await transaction.rollback();
          throw err;
        }
      }
    }

    console.log('✨ All migrations applied successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    Deno.exit(1);
  } finally {
    client.release();
    await closeDB();
  }
}

if (import.meta.main) {
  runMigrations();
}
