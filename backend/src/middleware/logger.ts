/**
 * Request logging middleware
 */

import { Context, Next } from "hono";

export async function logger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const status = c.res.status;
  const duration = Date.now() - start;

  console.log(`[${new Date().toISOString()}] ${method} ${path} ${status} - ${duration}ms`);
}
