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
    host: Deno.env.get('DB_HOST') || 'localhost',
    port: Number(Deno.env.get('DB_PORT')) || 5432,
    database: Deno.env.get('DB_NAME') || 'pantry',
    user: Deno.env.get('DB_USER') || 'postgres',
    password: Deno.env.get('DB_PASSWORD') || '',
  },
  jwt: {
    secret: Deno.env.get('JWT_SECRET') || 'your-secret-key',
    expiresIn: Deno.env.get('JWT_EXPIRES_IN') || '24h',
  },
} as const;
