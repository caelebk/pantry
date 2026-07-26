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

const ingredientGroups = new Hono();

/**
 * GET /api/ingredient-groups
 */
ingredientGroups.get('/', async (c: Context) => {
  try {
    const groups = await ingredientGroupService.getAllIngredientGroups();
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
    const group = await ingredientGroupService.getIngredientGroupById(numericId);
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
      return c.json(errorResponse(IngredientGroupMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const created = await ingredientGroupService.createIngredientGroup(body);
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
    const updated = await ingredientGroupService.updateIngredientGroup(numericId, body);
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
    const deleted = await ingredientGroupService.deleteIngredientGroup(numericId);
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

    const group = await ingredientGroupService.getIngredientGroupById(numericId);
    if (!group) {
      return c.json(errorResponse(IngredientGroupMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    const ingredients = await ingredientService.getIngredientsByGroup(numericId);
    return c.json(successResponse(ingredients), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_RETRIEVE_ITEMS_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default ingredientGroups;
