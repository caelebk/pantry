import { Context, Hono } from 'hono';
import { ingredientCategoryService } from '../services/ingredient-category.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isPositiveNumber } from '../utils/validators.ts';

import { authMiddleware } from '../middleware/auth.ts';

const ingredientCategories = new Hono();
ingredientCategories.use('*', authMiddleware);

/**
 * GET /api/ingredient-categories
 */
ingredientCategories.get('/', async (c: Context) => {
  try {
    const categories = await ingredientCategoryService.getAllIngredientCategories();
    return c.json(successResponse(categories), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse('Failed to retrieve ingredient categories from the database.'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

/**
 * GET /api/ingredient-categories/:id
 */
ingredientCategories.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id');
    const numericId = Number(id);
    if (!isPositiveNumber(numericId)) {
      return c.json(errorResponse('Invalid ID provided.'), HttpStatusCode.BAD_REQUEST);
    }
    const category = await ingredientCategoryService.getIngredientCategoryById(numericId);
    if (!category) {
      return c.json(errorResponse('Ingredient category not found.'), HttpStatusCode.NOT_FOUND);
    }
    return c.json(successResponse(category), HttpStatusCode.OK);
  } catch (_error: unknown) {
    return c.json(
      errorResponse('Failed to retrieve ingredient category from the database.'),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default ingredientCategories;
