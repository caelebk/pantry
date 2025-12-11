import { Context, Hono } from 'hono';
import { CategoryMessages } from '../messages/category.messages.ts';
import { IngredientMessages } from '../messages/ingredient.messages.ts';
import { categoryService } from '../services/categories/category.service.ts';
import { ingredientService } from '../services/ingredients/ingredients.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber } from '../utils/validators.ts';

const categories = new Hono();

/**
 * GET /api/categories
 * @summary Get all categories
 * @returns {object} 200 - An array of categories
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": []
 * }
 */
categories.get('/', async (c: Context) => {
  try {
    const categories = await categoryService.getAllCategories();
    return c.json(successResponse(categories), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(CategoryMessages.DB_RETRIEVE_CATEGORIES_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/categories/:id
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
categories.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse(CategoryMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const category = await categoryService.getCategoryById(numericId);
    if (!category) {
      return c.json(errorResponse(CategoryMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(category), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(CategoryMessages.DB_RETRIEVE_CATEGORY_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/categories/:id/ingredients
 * @summary Get ingredients by category ID
 * @param {number} id.path - The ID of the category to retrieve ingredients from
 * @returns {object} 200 - An array of ingredients in the specified category
 * @returns {object} 404 - Category not found
 * @example response - 200 - success
 * {
 *   "status": "200",
 *   "data": []
 * }
 */
categories.get('/:id/ingredients', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse(CategoryMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    // Check if category exists first
    const category = await categoryService.getCategoryById(numericId);
    if (!category) {
      return c.json(errorResponse(CategoryMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    const ingredients = await ingredientService.getIngredientsByCategory(numericId);
    return c.json(successResponse(ingredients), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse(IngredientMessages.DB_RETRIEVE_ITEMS_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default categories;
