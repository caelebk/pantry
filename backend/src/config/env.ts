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
    secret: Deno.env.get('JWT_SECRET') || 'pantry-dev-jwt-secret-key-change-in-production-32-bytes',
    expiresIn: Deno.env.get('JWT_EXPIRES_IN') || '15m',
    expiresInSeconds: Number(Deno.env.get('JWT_EXPIRES_IN_SECONDS')) || 900,
  },
} as const;
