import { Context, Hono } from 'hono';
import { IngredientMessages } from '../messages/ingredient.messages.ts';
import {
  CreateIngredientDTO,
  UpdateIngredientDTO,
} from '../models/data-models/ingredient.model.ts';
import { ingredientService } from '../services/ingredients.service.ts';
import { substitutionService } from '../services/substitution.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isValidUUID } from '../utils/validators.ts';
import {
  isValidCreateIngredientDTO,
  isValidReconcileUnitsDTO,
  isValidUpdateIngredientDTO,
} from '../validators/ingredient.validator.ts';

import { authMiddleware } from '../middleware/auth.ts';

const ingredients = new Hono();
ingredients.use('*', authMiddleware);

/**
 * GET /api/ingredients
 * @summary Get all ingredients
 * @returns {object} 200 - An array of ingredients
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": []
 * }
 */
ingredients.get('/', async (c: Context) => {
  try {
    const activeKitchenId = c.get('activeKitchenId') || '';
    const ingredients = await ingredientService.getAllIngredients(activeKitchenId);
    return c.json(successResponse(ingredients), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_RETRIEVE_ITEMS_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredients/:id
 * @summary Get ingredient by ID
 * @param {string} id.path - The ID of the ingredient to retrieve
 * @returns {object} 200 - The ingredient with the specified ID
 * @returns {object} 404 - Ingredient not found
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": { "id": "123", "name": "Flour" }
 * }
 */
ingredients.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const ingredient = await ingredientService.getIngredientById(id, activeKitchenId);
    if (!ingredient) {
      return c.json(errorResponse(IngredientMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(ingredient), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_RETRIEVE_ITEM_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * POST /api/ingredients
 * @summary Create a new ingredient
 * @param {IngredientDTO} request.body.required - The ingredient to create
 * @returns {object} 200 - The created ingredient
 * @returns {object} 400 - Invalid request body
 * @example request - example payload
 * {
 *   "name": "Sugar"
 * }
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": { "id": "124", "name": "Sugar" }
 * }
 */
ingredients.post('/', async (c: Context) => {
  try {
    const body = await c.req.json<CreateIngredientDTO>();
    if (!isValidCreateIngredientDTO(body)) {
      return c.json(errorResponse(IngredientMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const ingredient = await ingredientService.createIngredient(body, activeKitchenId, userId);
    return c.json(successResponse(ingredient), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_CREATE_ITEM_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * PUT /api/ingredients/:id
 * @summary Update an existing ingredient
 * @param {string} id.path - The ID of the ingredient to update
 * @param {IngredientDTO} request.body.required - The updated ingredient data
 * @returns {object} 200 - The updated ingredient
 * @returns {object} 400 - Invalid request body
 * @returns {object} 404 - Ingredient not found
 * @example request - example payload
 * {
 *   "name": "Brown Sugar"
 * }
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": { "id": "124", "name": "Brown Sugar" }
 * }
 */
ingredients.put('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const body = await c.req.json<UpdateIngredientDTO>();
    if (!isValidUpdateIngredientDTO(body)) {
      return c.json(errorResponse(IngredientMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const ingredient = await ingredientService.updateIngredient(id, activeKitchenId, body, userId);
    if (!ingredient) {
      return c.json(errorResponse(IngredientMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(ingredient), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_UPDATE_ITEM_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * DELETE /api/ingredients/:id
 * @summary Delete an ingredient
 * @param {string} id.path - The ID of the ingredient to delete
 * @returns {object} 200 - Confirmation of deletion
 * @returns {object} 404 - Ingredient not found
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": true
 * }
 */
ingredients.delete('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    const activeKitchenId = c.get('activeKitchenId') || '';
    const checkIngredient = await ingredientService.getIngredientById(id, activeKitchenId);
    if (!checkIngredient) {
      return c.json(errorResponse(IngredientMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    const ingredient = await ingredientService.deleteIngredient(id, activeKitchenId);
    return c.json(successResponse(ingredient), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_DELETE_ITEM_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredients/:id/substitutions
 * @summary Get smart substitution suggestions for an ingredient
 * @param {string} id.path - The ID of the ingredient to find substitutions for
 * @returns {object} 200 - Array of substitution suggestions ranked by relevance
 */
ingredients.get('/:id/substitutions', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    const activeKitchenId = c.get('activeKitchenId') || '';
    const ingredient = await ingredientService.getIngredientById(id, activeKitchenId);
    if (!ingredient) {
      return c.json(errorResponse(IngredientMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    const substitutions = await substitutionService.getSubstitutions(id, activeKitchenId);
    return c.json(successResponse(substitutions), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse('Failed to retrieve substitution suggestions.'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredients/:id/items
 * @summary Get all ingredient items tied to an ingredient
 */
ingredients.get('/:id/items', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const activeKitchenId = c.get('activeKitchenId') || '';
    const items = await ingredientService.getItemsByIngredientId(id, activeKitchenId);
    return c.json(successResponse(items), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse('Failed to retrieve items for ingredient.'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * POST /api/ingredients/:id/reconcile-units
 * @summary Reconcile ingredient default unit and associated ingredient item measures
 */
ingredients.post('/:id/reconcile-units', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const body = await c.req.json<{
      newDefaultUnitId: number;
      items: Array<{ id: string; quantity: number }>;
    }>();

    if (!isValidReconcileUnitsDTO(body)) {
      return c.json(errorResponse(IngredientMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }

    const activeKitchenId = c.get('activeKitchenId') || '';
    const userId = c.get('user').userId;
    const updated = await ingredientService.reconcileIngredientUnit(
      id,
      activeKitchenId,
      body.newDefaultUnitId,
      body.items,
      userId,
    );
    if (!updated) {
      return c.json(errorResponse(IngredientMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(updated), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse('Failed to reconcile ingredient units.'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default ingredients;
