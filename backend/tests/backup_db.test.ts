import { assert, assertEquals, assertExists } from '@std/assert';
import { join } from '@std/path';
import { Database } from '@db/sqlite';
import { config } from '../src/config/env.ts';
import { createBackup } from '../scripts/backup_db.ts';
import { closeDB } from '../src/db/client.ts';

Deno.test('Backup DB - creates valid point-in-time snapshot of SQLite database', () => {
  const tempDir = Deno.makeTempDirSync();
  const originalPath = config.database.path;
  const tempDbPath = join(tempDir, 'test_pantry.db');

  try {
    // 1. Create a dummy SQLite database with test data
    const db = new Database(tempDbPath);
    db.exec(`
      CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT);
      INSERT INTO test_table (name) VALUES ('Apple'), ('Banana');
    `);
    db.close();

    // 2. Override config database path for the test
    (config.database as { path: string }).path = tempDbPath;

    // 3. Create backup
    const backupPath = createBackup();
    assertExists(backupPath, 'Backup path should be returned');
    assert(Deno.statSync(backupPath).isFile, 'Backup file should exist');

    // 4. Verify contents of backup database file
    const backupDb = new Database(backupPath);
    const rows = backupDb.prepare('SELECT name FROM test_table ORDER BY id').all() as { name: string }[];
    backupDb.close();

    assertEquals(rows.length, 2);
    assertEquals(rows[0].name, 'Apple');
    assertEquals(rows[1].name, 'Banana');
  } finally {
    closeDB();
    (config.database as { path: string }).path = originalPath;
    try {
      Deno.removeSync(tempDir, { recursive: true });
    } catch {
      /* ignore */
    }
  }
});

Deno.test('Backup DB - gracefully returns null if database file does not exist', () => {
  const tempDir = Deno.makeTempDirSync();
  const originalPath = config.database.path;
  const nonExistentDbPath = join(tempDir, 'does_not_exist.db');

  try {
    (config.database as { path: string }).path = nonExistentDbPath;

    const backupPath = createBackup();
    assertEquals(backupPath, null, 'Should return null when database file does not exist');
  } finally {
    (config.database as { path: string }).path = originalPath;
    try {
      Deno.removeSync(tempDir, { recursive: true });
    } catch {
      /* ignore */
    }
  }
});

Deno.test('Backup DB - prunes old backup files when total exceeds max limit', () => {
  const tempDir = Deno.makeTempDirSync();
  const originalPath = config.database.path;
  const tempDbPath = join(tempDir, 'test_prune.db');
  const backupsDir = join(tempDir, 'backups');

  try {
    // 1. Create a dummy SQLite database
    const db = new Database(tempDbPath);
    db.exec(`CREATE TABLE dummy (id INTEGER PRIMARY KEY);`);
    db.close();

    (config.database as { path: string }).path = tempDbPath;
    Deno.mkdirSync(backupsDir, { recursive: true });

    // 2. Create 20 mock existing backup files with staggered timestamps
    const now = Date.now();
    for (let i = 0; i < 20; i++) {
      const mockFileName = `pantry_backup_2026-01-${String(i + 1).padStart(2, '0')}_00-00-00.db`;
      const mockFilePath = join(backupsDir, mockFileName);
      Deno.writeTextFileSync(mockFilePath, 'mock sqlite file content');
      // Set modification time (older to newer)
      Deno.utimeSync(mockFilePath, new Date(now - (20 - i) * 60000), new Date(now - (20 - i) * 60000));
    }

    // 3. Trigger backup, which should trigger pruning of old backups (>15)
    createBackup();

    // 4. Check remaining backup files
    const remainingFiles = Array.from(Deno.readDirSync(backupsDir)).filter(
      (entry) => entry.isFile && entry.name.startsWith('pantry_backup_') && entry.name.endsWith('.db'),
    );

    // Should retain MAX_BACKUPS (15) files
    assertEquals(remainingFiles.length, 15, 'Should prune backups to max limit of 15');
  } finally {
    closeDB();
    (config.database as { path: string }).path = originalPath;
    try {
      Deno.removeSync(tempDir, { recursive: true });
    } catch {
      /* ignore */
    }
  }
});
