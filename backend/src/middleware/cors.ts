/**
 * CORS configuration middleware
 */

import { Context, Next } from "hono";

export async function cors(c: Context, next: Next) {
  // Allow requests from your frontend origin
  const origin = c.req.header("Origin");
  
  // Configure allowed origins (update based on your needs)
  const allowedOrigins = [
    "http://localhost:4200", // Angular default
    "http://localhost:3000",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    c.res.headers.set("Access-Control-Allow-Origin", origin);
  }

  c.res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  c.res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.res.headers.set("Access-Control-Max-Age", "86400");

  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }

  await next();
}
