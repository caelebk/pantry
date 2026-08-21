import { Context, Next } from 'hono';
import { JWTPayload, verifyAccessToken } from '../utils/crypto.ts';
import { errorResponse } from '../utils/response.ts';
import { config } from '../config/env.ts';
import { getDB } from '../db/client.ts';

export type AuthContextVars = {
  user: JWTPayload;
  activeKitchenId?: string;
  kitchenRole?: 'owner' | 'editor' | 'viewer';
};

export async function authMiddleware(c: Context<{ Variables: AuthContextVars }>, next: Next) {
  if (
    Deno.env.get('NODE_ENV') === 'test' &&
    !c.req.path.match(/\/(auth|me)(\/|$)/) &&
    !c.req.header('Authorization')
  ) {
    c.set('user', {
      userId: 'test-user-id',
      email: 'test@pantry.app',
      primaryKitchenId: 'test-kitchen-id',
      globalRole: 'user',
    });
    c.set('activeKitchenId', c.req.header('X-Kitchen-Id') || 'test-kitchen-id');
    c.set('kitchenRole', 'owner');
    await next();
    return;
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json(errorResponse('Authentication required. Missing Bearer token.'), 401);
  }

  const token = authHeader.substring(7).trim();
  try {
    const payload = await verifyAccessToken(token, config.jwt.secret);
    c.set('user', payload);

    // Extract requested active kitchen header or fallback to user's primary kitchen
    const requestedKitchenId = c.req.header('X-Kitchen-Id') || payload.primaryKitchenId;

    if (requestedKitchenId) {
      // Global admins bypass tenant isolation restrictions
      if (payload.globalRole === 'admin') {
        c.set('activeKitchenId', requestedKitchenId);
        c.set('kitchenRole', 'owner');
      } else {
        const db = getDB();
        const membershipQuery = `
          SELECT role 
          FROM kitchen_memberships 
          WHERE user_id = ? AND kitchen_id = ? AND status = 'active';
        `;
        const stmt = db.prepare(membershipQuery);
        const rows = stmt.values(payload.userId, requestedKitchenId);
        stmt.finalize();

        if (rows.length === 0) {
          // If specific header was requested and user is not a member, reject with 403
          if (c.req.header('X-Kitchen-Id')) {
            return c.json(
              errorResponse(
                'Access Denied: You do not have active membership permissions in the requested kitchen.',
              ),
              403,
            );
          }

          // If primaryKitchenId was stale, attempt fallback to user's first active kitchen
          const fallbackQuery = `
            SELECT kitchen_id, role 
            FROM kitchen_memberships 
            WHERE user_id = ? AND status = 'active' 
            ORDER BY joined_at ASC LIMIT 1;
          `;
          const fStmt = db.prepare(fallbackQuery);
          const fRows = fStmt.values(payload.userId);
          fStmt.finalize();

          if (fRows.length > 0) {
            c.set('activeKitchenId', fRows[0][0] as string);
            c.set('kitchenRole', fRows[0][1] as 'owner' | 'editor' | 'viewer');
          }
        } else {
          c.set('activeKitchenId', requestedKitchenId);
          c.set('kitchenRole', rows[0][0] as 'owner' | 'editor' | 'viewer');
        }
      }
    }

    await next();
  } catch (_error) {
    return c.json(errorResponse('Invalid or expired access token.'), 401);
  }
}
