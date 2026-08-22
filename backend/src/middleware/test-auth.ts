/**
 * Test-only auth identity helpers.
 *
 * The synthetic-owner identity below exists purely so route integration tests
 * can exercise handlers without minting real JWTs. It is DOUBLE-GATED: it only
 * activates when BOTH `ENABLE_TEST_AUTH=1` (set exclusively by `deno task
 * test`) and `NODE_ENV=test` are present. Production deployments must never —
 * and cannot accidentally — satisfy both conditions.
 */
import { Context } from 'hono';
import { AuthContextVars } from './auth.ts';

export const TEST_AUTH_ENABLED = Deno.env.get('ENABLE_TEST_AUTH') === '1' &&
  Deno.env.get('NODE_ENV') === 'test';

/** Paths excluded from the bypass so real signup/login flows are always tested. */
export function isAuthExemptPath(path: string): boolean {
  return /\/(auth|me)(\/|$)/.test(path);
}

export function applyTestAuthIdentity(
  c: Context<{ Variables: AuthContextVars }>,
): void {
  c.set('user', {
    userId: 'test-user-id',
    email: 'test@pantry.app',
    primaryKitchenId: 'test-kitchen-id',
    globalRole: 'user',
  });
  c.set('activeKitchenId', c.req.header('X-Kitchen-Id') || 'test-kitchen-id');
  c.set('kitchenRole', 'owner');
}
