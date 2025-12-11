import { closeDB, getPool, initDB } from '../src/db/client.ts';
import { runMigrations } from './migrate_db.ts';

async function resetDB() {
  console.log('⚠️  DANGER: You are about to RESET the database.');
  console.log("This will permanently DELETE ALL DATA in the 'public' schema.");

  if (!confirm('Are you sure you want to proceed?')) {
    console.log('Operation cancelled.');
    Deno.exit(0);
  }

  console.log('\n💥 Resetting database...');

  // 1. Drop and Recreate Schema
  try {
    await initDB();
    const pool = getPool();
    const client = await pool.connect();

    try {
      console.log('🗑️  Dropping public schema...');
      await client.queryArray('DROP SCHEMA public CASCADE;');
      console.log('✨ Creating fresh public schema...');
      await client.queryArray('CREATE SCHEMA public;');
      await client.queryArray('GRANT ALL ON SCHEMA public TO public;');
      console.log('✅ Schema reset complete.');
    } finally {
      client.release();
    }

    // Close connection before running migrations to avoid any pool conflicts
    // calls closeDB() which sets pool = null
    await closeDB();
  } catch (error) {
    console.error('❌ Failed to reset database schema:', error); // Use console.error for errors
    await closeDB();
    Deno.exit(1);
  }

  // 2. Run Migrations
  // runMigrations manages its own connection (initDB ... closeDB)
  try {
    console.log('\n🔄 Running migrations...');
    await runMigrations();
  } catch (error) {
    console.error('❌ Failed to run migrations after reset:', error);
    Deno.exit(1);
  }

  console.log('\n✨ Database reset successfully! You are ready to start fresh.');
}

if (import.meta.main) {
  resetDB();
}
