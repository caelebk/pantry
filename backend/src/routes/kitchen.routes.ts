import { Hono } from 'hono';
import { errorResponse, successResponse } from '../utils/response.ts';
import {
  validateCreateKitchenRequest,
  validateInviteKitchenMemberRequest,
  validateUpdateKitchenRequest,
} from '../validators/kitchen.validator.ts';
import {
  addKitchenMember,
  createKitchen,
  deleteKitchen,
  getKitchenMembers,
  getUserKitchens,
  removeKitchenMember,
  updateKitchen,
} from '../services/kitchen.service.ts';
import { AuthContextVars, authMiddleware } from '../middleware/auth.ts';
import { requireKitchenRole } from '../middleware/rbac.ts';

export const kitchenRoutes = new Hono<{ Variables: AuthContextVars }>();

kitchenRoutes.use('*', authMiddleware);

// 1. GET /api/v1/kitchens
kitchenRoutes.get('/', (c) => {
  try {
    const user = c.get('user');
    const kitchens = getUserKitchens(user.userId);
    return c.json(successResponse(kitchens, 'Kitchens retrieved successfully'), 200);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve kitchens';
    return c.json(errorResponse(msg), 500);
  }
});

// 2. POST /api/v1/kitchens
kitchenRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validation = validateCreateKitchenRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    const kitchen = createKitchen(body.name.trim(), body.description?.trim(), user.userId);
    return c.json(successResponse(kitchen, 'Kitchen created successfully'), 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create kitchen';
    return c.json(errorResponse(msg), 500);
  }
});

// 3. GET /api/v1/kitchens/:kitchenId
kitchenRoutes.get('/:kitchenId', requireKitchenRole(['owner', 'editor', 'viewer']), (c) => {
  try {
    const kitchenId = c.req.param('kitchenId');
    if (!kitchenId) return c.json(errorResponse('Kitchen ID required'), 400);

    const members = getKitchenMembers(kitchenId);
    return c.json(
      successResponse({ kitchenId, members }, 'Kitchen details retrieved successfully'),
      200,
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to retrieve kitchen details';
    return c.json(errorResponse(msg), 500);
  }
});

// 4. PATCH /api/v1/kitchens/:kitchenId
kitchenRoutes.patch('/:kitchenId', requireKitchenRole(['owner', 'editor']), async (c) => {
  try {
    const kitchenId = c.req.param('kitchenId');
    if (!kitchenId) return c.json(errorResponse('Kitchen ID required'), 400);

    const body = await c.req.json();
    const validation = validateUpdateKitchenRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    const updated = updateKitchen(kitchenId, body.name?.trim(), body.description?.trim());
    return c.json(successResponse(updated, 'Kitchen updated successfully'), 200);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update kitchen';
    return c.json(errorResponse(msg), 500);
  }
});

// 5. DELETE /api/v1/kitchens/:kitchenId
kitchenRoutes.delete('/:kitchenId', requireKitchenRole(['owner']), (c) => {
  try {
    const kitchenId = c.req.param('kitchenId');
    if (!kitchenId) return c.json(errorResponse('Kitchen ID required'), 400);

    deleteKitchen(kitchenId);
    return c.body(null, 204);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to delete kitchen';
    return c.json(errorResponse(msg), 500);
  }
});

// 6. POST /api/v1/kitchens/:kitchenId/members
kitchenRoutes.post('/:kitchenId/members', requireKitchenRole(['owner']), async (c) => {
  try {
    const kitchenId = c.req.param('kitchenId');
    if (!kitchenId) return c.json(errorResponse('Kitchen ID required'), 400);

    const body = await c.req.json();
    const validation = validateInviteKitchenMemberRequest(body);
    if (!validation.isValid) {
      return c.json(errorResponse('Validation failed', validation.errors), 400);
    }

    const member = addKitchenMember(kitchenId, body.email.trim(), body.role);
    return c.json(successResponse(member, 'Kitchen member added successfully'), 201);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to add kitchen member';
    if (msg.includes('does not exist')) {
      return c.json(errorResponse(msg), 400);
    }
    if (msg.includes('already a member')) {
      return c.json(errorResponse(msg), 409);
    }
    return c.json(errorResponse(msg), 500);
  }
});

// 7. DELETE /api/v1/kitchens/:kitchenId/members/:userId
kitchenRoutes.delete('/:kitchenId/members/:userId', requireKitchenRole(['owner']), (c) => {
  try {
    const kitchenId = c.req.param('kitchenId');
    const targetUserId = c.req.param('userId');
    if (!kitchenId || !targetUserId) {
      return c.json(errorResponse('Kitchen ID and User ID required'), 400);
    }

    removeKitchenMember(kitchenId, targetUserId);
    return c.body(null, 204);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to remove kitchen member';
    return c.json(errorResponse(msg), 500);
  }
});
