/**
 * Ingredient Items API routes
 */
import { Context, Hono } from 'hono';
import { ItemMessages } from '../messages/item.messages.ts';
import {
  CreateIngredientItemDTO,
  IngredientItemDTO,
  UpdateIngredientItemDTO,
} from '../models/data-models/ingredient-item.model.ts';
import { ingredientItemService } from '../services/ingredient-item.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber, isValidUUID } from '../utils/validators.ts';
import {
  isValidBulkIdsDTO,
  isValidCreateItemDTO,
  isValidUpdateItemDTO,
} from '../validators/item.validator.ts';

import { authMiddleware } from '../middleware/auth.ts';
import { requireEditorForMutations } from '../middleware/rbac.ts';

const ingredientItems = new Hono();
ingredientItems.use('*', authMiddleware);
ingredientItems.use('*', requireEditorForMutations);

/**
 * Resolves the caller's active kitchen or returns a 400 response.
 * Users with zero kitchen memberships must fail explicitly, never query with ''.
 */
function getActiveKitchenOr400(c: Context): { kitchenId: string } | { response: Response } {
  const kitchenId = c.get('activeKitchenId');
  if (!kitchenId) {
    return {
      response: c.json(
        errorResponse(ItemMessages.NO_ACTIVE_KITCHEN),
        HttpStatusCode.BAD_REQUEST,
      ),
    };
  }
  return { kitchenId };
}

/**
 * GET /api/v1/ingredient-items
 */
ingredientItems.get('/', async (c: Context) => {
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  try {
    const items: IngredientItemDTO[] = await ingredientItemService.getAllIngredientItems(
      kitchen.kitchenId,
    );
    return c.json(successResponse(items), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.FETCH_ALL_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/v1/ingredient-items/expiring-soon
 */
ingredientItems.get('/expiring-soon', async (c: Context) => {
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  try {
    const daysStr: string | undefined = c.req.query('days');
    const days: number = daysStr ? parseInt(daysStr) : NaN;

    if (daysStr && !isPositiveNumber(days)) {
      return c.json(errorResponse(ItemMessages.INVALID_DAYS), HttpStatusCode.BAD_REQUEST);
    }

    const items: IngredientItemDTO[] = isNaN(days)
      ? await ingredientItemService.findExpiringSoon(kitchen.kitchenId)
      : await ingredientItemService.findExpiringSoon(kitchen.kitchenId, days);

    return c.json(successResponse(items), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.FETCH_EXPIRING_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/v1/ingredient-items/similarity
 */
ingredientItems.get('/similarity', async (c: Context) => {
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  try {
    const name = c.req.query('name') || '';
    const thresholdStr = c.req.query('threshold') || c.req.query('minScore');
    const threshold = thresholdStr ? parseFloat(thresholdStr) : 0.45;

    const candidates = await ingredientItemService.findSimilarItems(
      kitchen.kitchenId,
      name,
      threshold,
    );
    return c.json(successResponse(candidates), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.FETCH_ALL_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/v1/ingredient-items/:id
 */
ingredientItems.get('/:id', async (c: Context) => {
  const id = c.req.param('id')!;
  if (!isValidUUID(id)) {
    return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
  }
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  const item: IngredientItemDTO | null = await ingredientItemService.getIngredientItemById(
    id,
    kitchen.kitchenId,
  );

  if (item) {
    return c.json(successResponse(item), HttpStatusCode.OK);
  } else {
    return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
  }
});

/**
 * POST /api/v1/ingredient-items
 */
ingredientItems.post('/', async (c: Context) => {
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  try {
    const body = await c.req.json<CreateIngredientItemDTO>();
    if (!isValidCreateItemDTO(body)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const userId = c.get('user').userId;
    const item: IngredientItemDTO = await ingredientItemService.createIngredientItem(
      body,
      kitchen.kitchenId,
      userId,
    );

    return c.json(successResponse(item), HttpStatusCode.CREATED);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.DB_CREATE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * PUT /api/v1/ingredient-items/:id
 */
ingredientItems.put('/:id', async (c: Context) => {
  const id = c.req.param('id')!;
  if (!isValidUUID(id)) {
    return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
  }
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  try {
    const body = await c.req.json<UpdateIngredientItemDTO>();
    if (!isValidUpdateItemDTO(body as unknown as Record<string, unknown>)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }

    const userId = c.get('user').userId;
    const item: IngredientItemDTO | null = await ingredientItemService.updateIngredientItem(
      id,
      kitchen.kitchenId,
      body,
      userId,
    );
    if (!item) {
      return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    return c.json(successResponse(item), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.DB_UPDATE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * DELETE /api/v1/ingredient-items/:id
 */
ingredientItems.delete('/:id', async (c: Context) => {
  const id = c.req.param('id')!;
  if (!isValidUUID(id)) {
    return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
  }
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  try {
    const checkItem = await ingredientItemService.getIngredientItemById(id, kitchen.kitchenId);
    if (!checkItem) {
      return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    await ingredientItemService.deleteIngredientItemById(id, kitchen.kitchenId);

    return c.json(successResponse({ message: ItemMessages.DELETE_SUCCESS(id) }), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.DB_DELETE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * POST /api/v1/ingredient-items/bulk-clear-stock
 */
ingredientItems.post('/bulk-clear-stock', async (c: Context) => {
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  try {
    const body = await c.req.json();
    if (!isValidBulkIdsDTO(body)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const clearedCount = await ingredientItemService.bulkClearStock(body.ids, kitchen.kitchenId);
    return c.json(successResponse({ clearedCount }), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.DB_UPDATE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * POST /api/v1/ingredient-items/bulk-delete
 */
ingredientItems.post('/bulk-delete', async (c: Context) => {
  const kitchen = getActiveKitchenOr400(c);
  if ('response' in kitchen) return kitchen.response;
  try {
    const body = await c.req.json();
    if (!isValidBulkIdsDTO(body)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const deletedCount = await ingredientItemService.bulkDeleteIngredientItems(
      body.ids,
      kitchen.kitchenId,
    );
    return c.json(successResponse({ deletedCount }), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.DB_DELETE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default ingredientItems;
