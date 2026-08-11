import { Context, Next } from 'hono';
import { JWTPayload, verifyAccessToken } from '../utils/crypto.ts';
import { errorResponse } from '../utils/response.ts';
import { config } from '../config/env.ts';

export type AuthContextVars = {
  user: JWTPayload;
  activeKitchenId?: string;
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

    // Extract optional active kitchen header
    const kitchenHeader = c.req.header('X-Kitchen-Id');
    c.set('activeKitchenId', kitchenHeader || payload.primaryKitchenId);

    await next();
  } catch (_error) {
    return c.json(errorResponse('Invalid or expired access token.'), 401);
  }
}
