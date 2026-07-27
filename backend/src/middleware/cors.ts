/**
 * CORS configuration middleware
 */

import { Context, Next } from 'hono';

export async function cors(c: Context, next: Next) {
  // Allow requests from your frontend origin
  const origin = c.req.header('Origin');

  if (origin) {
    c.header('Access-Control-Allow-Origin', origin);
  } else {
    c.header('Access-Control-Allow-Origin', '*');
  }

  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  await next();
}
