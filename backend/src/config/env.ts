/**
 * Environment configuration
 */

import { load } from '@std/dotenv';

// Load .env file
await load({ export: true });

export const config = {
  port: Number(Deno.env.get('PORT')) || 8000,
  env: Deno.env.get('ENVIRONMENT') || 'development',
  database: {
    path: Deno.env.get('DB_PATH') || 'pantry.db',
  },
  jwt: {
    secret: Deno.env.get('JWT_SECRET') || 'your-secret-key',
    expiresIn: Deno.env.get('JWT_EXPIRES_IN') || '24h',
  },
} as const;
