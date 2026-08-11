import { Context, Next } from 'hono';
import { errorResponse } from '../utils/response.ts';
import { getUserKitchenRole } from '../services/kitchen.service.ts';
import { AuthContextVars } from './auth.ts';

export function requireKitchenRole(allowedRoles: ('owner' | 'editor' | 'viewer')[]) {
  return async (c: Context<{ Variables: AuthContextVars }>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json(errorResponse('Authentication required.'), 401);
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
      return c.json(errorResponse('Insufficient kitchen permissions for this workspace.'), 403);
    }

    await next();
  };
}
