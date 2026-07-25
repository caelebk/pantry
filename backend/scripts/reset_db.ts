import { config } from '../src/config/env.ts';
import { runMigrations } from './migrate_db.ts';

function resetDB() {
  console.log('⚠️  DANGER: You are about to RESET the database.');
  console.log("This will permanently DELETE ALL DATA.");

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
  try { Deno.removeSync(dbPath + '-wal'); } catch { /* ignore */ }
  try { Deno.removeSync(dbPath + '-shm'); } catch { /* ignore */ }

  // 2. Run Migrations (this will create a fresh database)
  console.log('\n🔄 Running migrations...');
  runMigrations();

  console.log('\n✨ Database reset successfully! You are ready to start fresh.');
}

if (import.meta.main) {
  resetDB();
}
