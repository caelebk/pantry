import { config } from '../src/config/env.ts';
import { runMigrations } from './migrate_db.ts';
import { closeDB, getDB, initDB } from '../src/db/client.ts';
import { seedBareNecessities } from './seed_db.ts';

function resetDB() {
  console.log('⚠️  DANGER: You are about to RESET the database.');
  console.log('This will permanently DELETE ALL DATA.');

  if (!confirm('Are you sure you want to proceed?')) {
    console.log('Operation cancelled.');
    Deno.exit(0);
  }

  console.log('\n💥 Resetting database...');

  // 1. Delete the database file
  const dbPath = config.database.path;
  try {
    Deno.removeSync(dbPath);
    console.log(`🗑️  Deleted database file: ${dbPath}`);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      console.error('❌ Failed to delete database file:', error);
      Deno.exit(1);
    }
    console.log('ℹ️  No existing database file to delete.');
  }

  // Also clean up WAL and SHM files if they exist
  try {
    Deno.removeSync(dbPath + '-wal');
  } catch {
    /* ignore */
  }
  try {
    Deno.removeSync(dbPath + '-shm');
  } catch {
    /* ignore */
  }

  // 2. Run Migrations (this will create a fresh database)
  console.log('\n🔄 Running migrations...');
  runMigrations();

  // 3. Seed essential reference taxonomy (Locations, Ingredient Categories, Ingredient Groups, Units, Difficulties)
  console.log('\n🧱 Seeding essential reference taxonomy...');
  initDB();
  const db = getDB();
  db.exec('BEGIN');
  try {
    seedBareNecessities(db);
    db.exec('COMMIT');
    console.log('✅ Essential taxonomy seeded!');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('❌ Failed to seed essential taxonomy:', err);
  } finally {
    closeDB();
  }

  console.log(
    '\n✨ Database reset successfully with essential taxonomy! You are ready to start fresh.',
  );
}

if (import.meta.main) {
  resetDB();
}
