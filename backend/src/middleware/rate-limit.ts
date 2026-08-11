import { Context, Next } from 'hono';
import { config } from '../config/env.ts';
import { getDB } from '../db/client.ts';
import { errorResponse } from '../utils/response.ts';

export function rateLimitMiddleware(maxAttempts = 5, windowMinutes = 15) {
  return async (c: Context, next: Next) => {
    // In development or test environments, bypass rate limiting to prevent developer lockouts
    if (config.env === 'development' || config.env === 'test') {
      return await next();
    }

    const db = getDB();
    const ip = c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip') ||
      '127.0.0.1';
    const path = c.req.path;
    const key = `rate:${ip}:${path}`;
    const windowMs = windowMinutes * 60 * 1000;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowMs).toISOString();

    const query =
      `SELECT attempts, first_attempt_at, locked_until, expires_at FROM auth_rate_limits WHERE key = ?;`;
    const stmt = db.prepare(query);
    const rows = stmt.values(key);
    stmt.finalize();

    if (rows.length > 0) {
      const [attempts, _firstAt, lockedUntil, expAt] = rows[0] as [
        number,
        string,
        string | null,
        string,
      ];

      if (lockedUntil && new Date(lockedUntil) > now) {
        const retryAfterSeconds = Math.ceil(
          (new Date(lockedUntil).getTime() - now.getTime()) / 1000,
        );
        c.header('Retry-After', String(retryAfterSeconds));
        c.header('RateLimit-Limit', String(maxAttempts));
        c.header('RateLimit-Remaining', '0');
        c.header('RateLimit-Reset', String(Math.floor(new Date(lockedUntil).getTime() / 1000)));

        return c.json(
          errorResponse(
            `Too many request attempts. Please try again in ${
              Math.ceil(retryAfterSeconds / 60)
            } minutes.`,
          ),
          429,
        );
      }

      if (new Date(expAt) < now) {
        // Window expired, reset counter
        const resetQuery =
          `UPDATE auth_rate_limits SET attempts = 1, first_attempt_at = datetime('now'), expires_at = ?, locked_until = NULL WHERE key = ?;`;
        const rStmt = db.prepare(resetQuery);
        rStmt.run(expiresAt, key);
        rStmt.finalize();
      } else {
        const newAttempts = attempts + 1;
        let lockTime: string | null = null;
        if (newAttempts >= maxAttempts) {
          lockTime = expiresAt;
        }

        const updateQuery =
          `UPDATE auth_rate_limits SET attempts = ?, locked_until = ? WHERE key = ?;`;
        const uStmt = db.prepare(updateQuery);
        uStmt.run(newAttempts, lockTime, key);
        uStmt.finalize();

        if (newAttempts >= maxAttempts) {
          const retryAfterSeconds = windowMinutes * 60;
          c.header('Retry-After', String(retryAfterSeconds));
          c.header('RateLimit-Limit', String(maxAttempts));
          c.header('RateLimit-Remaining', '0');

          return c.json(
            errorResponse(
              `Too many failed attempts. Account temporary lock active for ${windowMinutes} minutes.`,
            ),
            429,
          );
        }
      }
    } else {
      const insertQuery =
        `INSERT INTO auth_rate_limits (key, attempts, expires_at) VALUES (?, 1, ?);`;
      const iStmt = db.prepare(insertQuery);
      iStmt.run(key, expiresAt);
      iStmt.finalize();
    }

    await next();

    // If the request was successful, reset the rate limit counter for this IP/path
    if (c.res.status >= 200 && c.res.status < 400) {
      const deleteQuery = `DELETE FROM auth_rate_limits WHERE key = ?;`;
      const dStmt = db.prepare(deleteQuery);
      dStmt.run(key);
      dStmt.finalize();
    }
  };
}
