import { getDB } from '../db/client.ts';

export function startCronJobs() {
  // Deno.cron requires --unstable-cron flag; gracefully skip if unavailable
  if (typeof Deno.cron !== 'function') {
    console.warn(
      '⚠️  Deno.cron not available (needs --unstable-cron flag). Skipping scheduled cleanup jobs.',
    );
    return;
  }

  // Run cleanup every 24 hours
  Deno.cron('Session and Rate Limit Cleanup', '0 0 * * *', () => {
    console.log('Running scheduled cleanup job...');
    const db = getDB();

    try {
      db.exec('BEGIN');

      // 1. Delete expired sessions
      const sessionResult = db.prepare(`
        DELETE FROM sessions
        WHERE expires_at <= datetime('now') OR revoked_at <= datetime('now', '-30 days');
      `).run();

      const deletedSessions = typeof sessionResult === 'number' ? sessionResult : 0;
      console.log(`Deleted ${deletedSessions} expired/revoked sessions.`);

      // 2. Delete old rate limit tracking rows (older than 1 hour)
      const rateLimitResult = db.prepare(`
        DELETE FROM auth_rate_limits
        WHERE window_start < datetime('now', '-1 hour');
      `).run();

      const deletedRateLimits = typeof rateLimitResult === 'number' ? rateLimitResult : 0;
      console.log(`Deleted ${deletedRateLimits} old rate limit records.`);

      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      console.error('Error during scheduled cleanup:', error);
    }
  });
}
