/**
 * CORS configuration middleware
 */

import { Context, Next } from 'hono';

export async function cors(c: Context, next: Next) {
  const origin = c.req.header('Origin');
  const configuredFrontendUrl = Deno.env.get('FRONTEND_URL');
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:8000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:8000',
    configuredFrontendUrl,
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Vary', 'Origin');
  } else if (!origin) {
    c.header('Access-Control-Allow-Origin', 'http://localhost:4200');
    c.header('Access-Control-Allow-Credentials', 'true');
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  c.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Kitchen-Id, X-CSRF-Token',
  );
  c.header('Access-Control-Max-Age', '86400');

  if (c.req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.includes(origin)) {
      return c.json({ error: 'Origin not allowed by CORS policy' }, 403);
    }
    return c.body(null, 204);
  }

  await next();
}
