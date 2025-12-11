import { Context, Hono } from 'hono';
import { IngredientMessages } from '../messages/ingredient.messages.ts';
import { IngredientDTO } from '../models/data-models/ingredient.model.ts';
import { ingredientService } from '../services/ingredients/ingredients.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber, isValidUUID } from '../utils/validators.ts';
import {
  isValidCreateIngredientDTO,
  isValidUpdateIngredientDTO,
} from '../validators/ingredient.validator.ts';

const ingredients = new Hono();

/**
 * GET /api/ingredients/categories
 * @summary Get all ingredient categories
 * @returns {object} 200 - An array of ingredient categories
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": []
 * }
 */
ingredients.get('/categories', async (c: Context) => {
  try {
    const categories = await ingredientService.getAllCategories();
    return c.json(successResponse(categories), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_RETRIEVE_CATEGORIES_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredients/categories/:id
 * @summary Get a category by ID
 * @param {number} id.path - The ID of the category to retrieve
 * @returns {object} 200 - The category with the specified ID
 * @returns {object} 404 - Category not found
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": { "id": 1, "name": "Grains" }
 * }
 */
ingredients.get('/categories/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    if (!isPositiveNumber(Number(id))) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const category = await ingredientService.getCategoryById(Number(id));
    if (!category) {
      return c.json(errorResponse(IngredientMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(category), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_RETRIEVE_CATEGORY_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredients/categories/:id/ingredients
 * @summary Get ingredients by category ID
 * @param {number} id.path - The ID of the category to retrieve ingredients from
 * @returns {object} 200 - An array of ingredients with the specified category ID
 * @returns {object} 404 - Category not found
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": []
 * }
 */
ingredients.get('/categories/:id/ingredients', async (c: Context) => {
  try {
    const id = c.req.param('id');
    if (!isPositiveNumber(Number(id))) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const ingredients = await ingredientService.getIngredientsByCategory(Number(id));
    if (!ingredients) {
      return c.json(errorResponse(IngredientMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(ingredients), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_RETRIEVE_ITEMS_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

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
    const ingredients = await ingredientService.getAllIngredients();
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
    const id = c.req.param('id');
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const ingredient = await ingredientService.getIngredientById(id);
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
    const body = await c.req.json<IngredientDTO>();
    if (!isValidCreateIngredientDTO(body)) {
      return c.json(errorResponse(IngredientMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const ingredient = await ingredientService.createIngredient(body);
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
    const id = c.req.param('id');
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const body = await c.req.json<IngredientDTO>();
    if (!isValidUpdateIngredientDTO(body)) {
      return c.json(errorResponse(IngredientMessages.INVALID_BODY), HttpStatusCode.BAD_REQUEST);
    }
    const ingredient = await ingredientService.updateIngredient(id, body);
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
    const id = c.req.param('id');
    if (!isValidUUID(id)) {
      return c.json(errorResponse(IngredientMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    const checkIngredient = await ingredientService.getIngredientById(id);
    if (!checkIngredient) {
      return c.json(errorResponse(IngredientMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    const ingredient = await ingredientService.deleteIngredient(id);
    return c.json(successResponse(ingredient), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_DELETE_ITEM_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default ingredients;
