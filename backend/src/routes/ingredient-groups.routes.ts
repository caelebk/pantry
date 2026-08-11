import { Context, Hono } from 'hono';
import { IngredientGroupMessages } from '../messages/ingredient-group.messages.ts';
import { IngredientMessages } from '../messages/ingredient.messages.ts';
import {
  CreateIngredientGroupDTO,
  UpdateIngredientGroupDTO,
} from '../models/data-models/ingredient-group.model.ts';
import { ingredientGroupService } from '../services/ingredient-group.service.ts';
import { ingredientService } from '../services/ingredients.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber } from '../utils/validators.ts';

import { authMiddleware } from '../middleware/auth.ts';

const ingredientGroups = new Hono();
ingredientGroups.use('*', authMiddleware);

/**
 * GET /api/ingredient-groups
 */
ingredientGroups.get('/', async (c: Context) => {
  try {
    const activeKitchenId = c.get('activeKitchenId') || '';
    const groups = await ingredientGroupService.getAllIngredientGroups(activeKitchenId);
    return c.json(successResponse(groups), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientGroupMessages.DB_RETRIEVE_CATEGORIES_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredient-groups/:id
 */
ingredientGroups.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse(IngredientGroupMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const group = await ingredientGroupService.getIngredientGroupById(numericId, activeKitchenId);
    if (!group) {
      return c.json(errorResponse(IngredientGroupMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(group), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientGroupMessages.DB_RETRIEVE_CATEGORY_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * POST /api/ingredient-groups
 */
ingredientGroups.post('/', async (c: Context) => {
  try {
    const body = await c.req.json<CreateIngredientGroupDTO>();
    if (!body || !body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return c.json(
        errorResponse(IngredientGroupMessages.INVALID_BODY),
        HttpStatusCode.BAD_REQUEST,
      );
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const created = await ingredientGroupService.createIngredientGroup(
      body,
      activeKitchenId,
      userId,
    );
    return c.json(successResponse(created), HttpStatusCode.CREATED);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientGroupMessages.DB_CREATE_CATEGORY_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * PUT /api/ingredient-groups/:id
 */
ingredientGroups.put('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse(IngredientGroupMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const body = await c.req.json<UpdateIngredientGroupDTO>();
    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const updated = await ingredientGroupService.updateIngredientGroup(
      numericId,
      activeKitchenId,
      body,
      userId,
    );
    if (!updated) {
      return c.json(errorResponse(IngredientGroupMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(updated), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientGroupMessages.DB_UPDATE_CATEGORY_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * DELETE /api/ingredient-groups/:id
 */
ingredientGroups.delete('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse(IngredientGroupMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const deleted = await ingredientGroupService.deleteIngredientGroup(numericId, activeKitchenId);
    if (!deleted) {
      return c.json(errorResponse(IngredientGroupMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(true), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientGroupMessages.DB_DELETE_CATEGORY_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredient-groups/:id/ingredients
 */
ingredientGroups.get('/:id/ingredients', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse(IngredientGroupMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    const activeKitchenId = c.get('activeKitchenId') || '';
    const group = await ingredientGroupService.getIngredientGroupById(numericId, activeKitchenId);
    if (!group) {
      return c.json(errorResponse(IngredientGroupMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    const ingredients = await ingredientService.getIngredientsByGroup(numericId, activeKitchenId);
    return c.json(successResponse(ingredients), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_RETRIEVE_ITEMS_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default ingredientGroups;
