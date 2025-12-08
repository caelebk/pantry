/**
 * Database client setup
 */

import { Pool } from 'postgres';
import { config } from '../config/env.ts';

let pool: Pool | null = null;

/**
 * Get database pool instance
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDB() first.');
  }
  return pool;
}

/**
 * Initialize database connection pool
 */
export async function initDB() {
  try {
    const connectionParams = {
      hostname: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
    };
    
    console.log('🔌 Attempting database connection with:', {
      ...connectionParams,
      password: '***' // Hide password in logs
    });
    
    pool = new Pool(connectionParams, 10); // pool size

    // Test the connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();

    return pool;
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Close database connection pool
 */
export async function closeDB() {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('Database connection pool closed');
    }
  } catch (error) {
    console.error('Failed to close database connection:', error);
    throw error;
  }
}
