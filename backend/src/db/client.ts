/**
 * Database client setup (SQLite)
 */

import { Database } from '@db/sqlite';
import { config } from '../config/env.ts';

let db: Database | null = null;

/**
 * Get database instance
 */
export function getDB(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return db;
}

/**
 * Set database instance (for testing)
 */
export function setDB(database: Database) {
  db = database;
}

/**
 * Initialize SQLite database connection
 */
export function initDB(): Database {
  try {
    const dbPath = config.database.path;
    console.log(`🔌 Opening SQLite database at: ${dbPath}`);

    db = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance
    db.exec('PRAGMA journal_mode = WAL');
    // Enable foreign key enforcement (off by default in SQLite)
    db.exec('PRAGMA foreign_keys = ON');

    console.log('✅ Database connected successfully');
    return db;
  } catch (error) {
    console.error('❌ Failed to open database:', error);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDB() {
  try {
    if (db) {
      db.close();
      db = null;
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Failed to close database connection:', error);
    throw error;
  }
}
