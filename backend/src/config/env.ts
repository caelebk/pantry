/**
 * Environment configuration
 */

import { load } from '@std/dotenv';

// Load .env file
await load({ export: true });

const env = Deno.env.get('ENVIRONMENT') || 'development';
const jwtSecret = Deno.env.get('JWT_SECRET') ||
  'pantry-dev-jwt-secret-key-change-in-production-32-bytes';

// In production, enforce non-default 32+ character JWT secret
if (env === 'production') {
  if (
    !Deno.env.get('JWT_SECRET') ||
    jwtSecret === 'pantry-dev-jwt-secret-key-change-in-production-32-bytes' ||
    jwtSecret.length < 32
  ) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: In production, JWT_SECRET environment variable must be set to a secure, unique string of at least 32 characters.',
    );
  }
}

export const config = {
  port: Number(Deno.env.get('PORT')) || 8000,
  env,
  database: {
    path: Deno.env.get('DB_PATH') || 'pantry.db',
  },
  jwt: {
    secret: jwtSecret,
    expiresIn: Deno.env.get('JWT_EXPIRES_IN') || '15m',
    expiresInSeconds: Number(Deno.env.get('JWT_EXPIRES_IN_SECONDS')) || 900,
  },
} as const;
