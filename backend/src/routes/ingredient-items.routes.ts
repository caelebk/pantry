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
import { isValidCreateItemDTO, isValidUpdateItemDTO } from '../validators/item.validator.ts';

const ingredientItems = new Hono();

/**
 * GET /api/ingredient-items
 */
ingredientItems.get('/', async (c: Context) => {
  try {
    const items: IngredientItemDTO[] = await ingredientItemService.getAllIngredientItems();
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

    const items: IngredientItemDTO[] = isNaN(days)
      ? await ingredientItemService.findExpiringSoon()
      : await ingredientItemService.findExpiringSoon(days);

    return c.json(successResponse(items), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(ItemMessages.FETCH_EXPIRING_ERROR),
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
  const item: IngredientItemDTO | null = await ingredientItemService.getIngredientItemById(id);

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
    if (!isValidCreateItemDTO(body as any)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const item: IngredientItemDTO = await ingredientItemService.createIngredientItem(body);

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
    if (!isValidUpdateItemDTO(body as any)) {
      return c.json(errorResponse(ItemMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }

    const item: IngredientItemDTO | null = await ingredientItemService.updateIngredientItem(
      id,
      body,
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
    const checkItem = await ingredientItemService.getIngredientItemById(id);
    if (!checkItem) {
      return c.json(errorResponse(ItemMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    await ingredientItemService.deleteIngredientItemById(id);

    return c.json(successResponse({ message: ItemMessages.DELETE_SUCCESS(id) }), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(errorResponse(ItemMessages.DELETE_ERROR), HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
});

export default ingredientItems;
