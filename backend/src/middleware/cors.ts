/**
 * CORS configuration middleware
 */

import { Context, Next } from 'hono';

export async function cors(c: Context, next: Next) {
  const origin = c.req.header('Origin');
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:8000',
    'http://127.0.0.1:4200',
    Deno.env.get('FRONTEND_URL'),
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    c.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  await next();
}
