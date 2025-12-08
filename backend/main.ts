/**
 * Entry point for the Pantry API
 */

import app from './src/app.ts';
import { config } from './src/config/env.ts';
import { closeDB, initDB } from './src/db/client.ts';

console.log(`🚀 Starting Pantry API on port ${config.port}`);
console.log(`📝 Environment: ${config.env}`);

// Initialize database connection
try {
  await initDB();
} catch (error) {
  console.error('Failed to initialize database:', error);
  Deno.exit(1);
}

// Graceful shutdown
Deno.addSignalListener('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await closeDB();
  Deno.exit(0);
});

Deno.serve({ port: config.port }, app.fetch);
