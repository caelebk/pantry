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
 * GET /api/ingredient-items
 */
ingredientItems.get('/', async (c: Context) => {
  try {
    const activeKitchenId = c.get('activeKitchenId');
    const items: IngredientItemDTO[] = await ingredientItemService.getAllIngredientItems(
      activeKitchenId,
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
 * GET /api/ingredient-items/expiring-soon
 */
ingredientItems.get('/expiring-soon', async (c: Context) => {
  try {
    const daysStr: string | undefined = c.req.query('days');
    const days: number = daysStr ? parseInt(daysStr) : NaN;

    if (daysStr && !isPositiveNumber(days)) {
      return c.json(errorResponse(ItemMessages.INVALID_DAYS), HttpStatusCode.BAD_REQUEST);
    }

    const activeKitchenId = c.get('activeKitchenId') || '';
    const items: IngredientItemDTO[] = isNaN(days)
      ? await ingredientItemService.findExpiringSoon(activeKitchenId)
      : await ingredientItemService.findExpiringSoon(activeKitchenId, days);

    return c.json(successResponse(items), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.FETCH_EXPIRING_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredient-items/similarity
 */
ingredientItems.get('/similarity', async (c: Context) => {
  try {
    const name = c.req.query('name') || '';
    const thresholdStr = c.req.query('threshold') || c.req.query('minScore');
    const threshold = thresholdStr ? parseFloat(thresholdStr) : 0.45;

    const activeKitchenId = c.get('activeKitchenId') || '';
    const candidates = await ingredientItemService.findSimilarItems(
      activeKitchenId,
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
 * GET /api/ingredient-items/:id
 */
ingredientItems.get('/:id', async (c: Context) => {
  const id = c.req.param('id')!;
  if (!isValidUUID(id)) {
    return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
  }
  const activeKitchenId = c.get('activeKitchenId') || '';
  const item: IngredientItemDTO | null = await ingredientItemService.getIngredientItemById(
    id,
    activeKitchenId,
  );

  if (item) {
    return c.json(successResponse(item), HttpStatusCode.OK);
  } else {
    return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
  }
});

/**
 * POST /api/ingredient-items
 */
ingredientItems.post('/', async (c: Context) => {
  try {
    const body = await c.req.json<CreateIngredientItemDTO>();
    if (!isValidCreateItemDTO(body)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const item: IngredientItemDTO = await ingredientItemService.createIngredientItem(
      body,
      activeKitchenId,
      userId,
    );

    return c.json(successResponse(item), HttpStatusCode.CREATED);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

/**
 * PUT /api/ingredient-items/:id
 */
ingredientItems.put('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const body = await c.req.json<UpdateIngredientItemDTO>();
    if (!isValidUpdateItemDTO(body as unknown as Record<string, unknown>)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }

    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const item: IngredientItemDTO | null = await ingredientItemService.updateIngredientItem(
      id,
      activeKitchenId,
      body,
      userId,
    );
    if (!item) {
      return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    return c.json(successResponse(item), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

/**
 * DELETE /api/ingredient-items/:id
 */
ingredientItems.delete('/:id', async (c: Context) => {
  const id = c.req.param('id')!;
  if (!isValidUUID(id)) {
    return c.json(errorResponse(ItemMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
  }
  try {
    const activeKitchenId = c.get('activeKitchenId') || '';
    const checkItem = await ingredientItemService.getIngredientItemById(id, activeKitchenId);
    if (!checkItem) {
      return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    await ingredientItemService.deleteIngredientItemById(id, activeKitchenId);

    return c.json(successResponse({ message: ItemMessages.DELETE_SUCCESS(id) }), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.DELETE_ERROR), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/ingredient-items/bulk-clear-stock
 */
ingredientItems.post('/bulk-clear-stock', async (c: Context) => {
  try {
    const body = await c.req.json();
    if (!isValidBulkIdsDTO(body)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const clearedCount = await ingredientItemService.bulkClearStock(body.ids, activeKitchenId);
    return c.json(successResponse({ clearedCount }), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

/**
 * POST /api/ingredient-items/bulk-delete
 */
ingredientItems.post('/bulk-delete', async (c: Context) => {
  try {
    const body = await c.req.json();
    if (!isValidBulkIdsDTO(body)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const deletedCount = await ingredientItemService.bulkDeleteIngredientItems(
      body.ids,
      activeKitchenId,
    );
    return c.json(successResponse({ deletedCount }), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

export default ingredientItems;
