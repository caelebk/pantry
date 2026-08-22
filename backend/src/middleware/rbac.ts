import { Context, Next } from 'hono';
import { errorResponse } from '../utils/response.ts';
import { getUserKitchenRole } from '../services/kitchen.service.ts';
import { AuthContextVars } from './auth.ts';

/** HTTP methods that constitute a read (no role requirement beyond membership). */
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Middleware that enforces the inventory-domain RBAC matrix:
 * reads are available to every kitchen member (membership is already
 * verified by authMiddleware), while mutations require `editor` or `owner`.
 *
 * Mount once per domain router AFTER authMiddleware:
 *   router.use('*', requireEditorForMutations);
 */
export function requireEditorForMutations(
  c: Context<{ Variables: AuthContextVars }>,
  next: Next,
): Promise<void | Response> {
  if (READ_METHODS.has(c.req.method)) return next();
  return requireKitchenRole(['owner', 'editor'])(c, next);
}

export function requireKitchenRole(allowedRoles: ('owner' | 'editor' | 'viewer')[]) {
  return async (c: Context<{ Variables: AuthContextVars }>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json(errorResponse('Authentication required.'), 401);
    }

    if (user.globalRole === 'admin') {
      await next();
      return;
    }

    const contextRole = c.get('kitchenRole');
    if (contextRole && allowedRoles.includes(contextRole)) {
      await next();
      return;
    }

    // Determine target kitchen ID from path parameter :kitchenId or header X-Kitchen-Id or primaryKitchenId
    const paramKitchenId = c.req.param('kitchenId');
    const headerKitchenId = c.req.header('X-Kitchen-Id');
    const kitchenId = paramKitchenId || headerKitchenId || c.get('activeKitchenId') ||
      user.primaryKitchenId;

    if (!kitchenId) {
      return c.json(errorResponse('Kitchen workspace context required.'), 400);
    }

    const role = getUserKitchenRole(user.userId, kitchenId);
    if (!role || !allowedRoles.includes(role)) {
      return c.json(
        errorResponse('Insufficient kitchen permissions for this workspace action.'),
        403,
      );
    }

    await next();
  };
}
