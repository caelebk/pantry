/**
 * Recipes API routes
 */

import { Context, Hono } from 'hono';
import { RecipeMessages } from '../messages/recipe.messages.ts';
import type { CreateRecipeDTO, UpdateRecipeDTO } from '../models/data-models/recipe.model.ts';
import { recipeService } from '../services/recipe.service.ts';
import { errorResponse, HttpStatusCode, successResponse } from '../utils/response.ts';
import { isValidUUID } from '../utils/validators.ts';

const recipes = new Hono();

// GET /api/recipes - Get all recipes
recipes.get('/', async (c: Context) => {
  try {
    const data = await recipeService.getAllRecipes();
    return c.json(successResponse(data), HttpStatusCode.OK);
  } catch (error: unknown) {
    console.error('Error fetching recipes:', error);
    return c.json(
      errorResponse(RecipeMessages.FETCH_ALL_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// GET /api/recipes/available - Get available recipes based on pantry items
recipes.get('/available', async (c: Context) => {
  try {
    const data = await recipeService.getAvailableRecipes();
    return c.json(successResponse(data), HttpStatusCode.OK);
  } catch (error: unknown) {
    console.error('Error fetching available recipes:', error);
    return c.json(
      errorResponse(RecipeMessages.FETCH_AVAILABLE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// GET /api/recipes/:id - Get recipe by ID
recipes.get('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(RecipeMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }
    const recipe = await recipeService.getRecipeById(id);
    if (recipe) {
      return c.json(successResponse(recipe), HttpStatusCode.OK);
    } else {
      return c.json(errorResponse(RecipeMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
  } catch (error: unknown) {
    console.error('Error fetching recipe by ID:', error);
    return c.json(
      errorResponse(RecipeMessages.FETCH_ALL_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// POST /api/recipes - Create new recipe
recipes.post('/', async (c: Context) => {
  try {
    const body: CreateRecipeDTO = await c.req.json();

    if (!body || !body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return c.json(
        errorResponse('Recipe name is required'),
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const recipe = await recipeService.createRecipe(body);
    return c.json(successResponse(recipe), HttpStatusCode.CREATED);
  } catch (error: unknown) {
    console.error('Error creating recipe:', error);
    return c.json(
      errorResponse(RecipeMessages.DB_CREATE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// PUT /api/recipes/:id - Update recipe
recipes.put('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(RecipeMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    const body: UpdateRecipeDTO = await c.req.json();
    const recipe = await recipeService.updateRecipe(id, body);

    if (recipe) {
      return c.json(successResponse(recipe), HttpStatusCode.OK);
    } else {
      return c.json(errorResponse(RecipeMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }
  } catch (error: unknown) {
    console.error('Error updating recipe:', error);
    return c.json(
      errorResponse(RecipeMessages.DB_UPDATE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

// DELETE /api/recipes/:id - Delete recipe
recipes.delete('/:id', async (c: Context) => {
  try {
    const id = c.req.param('id')!;
    if (!isValidUUID(id)) {
      return c.json(errorResponse(RecipeMessages.INVALID_ID), HttpStatusCode.BAD_REQUEST);
    }

    const checkRecipe = await recipeService.getRecipeById(id);
    if (!checkRecipe) {
      return c.json(errorResponse(RecipeMessages.NOT_FOUND), HttpStatusCode.NOT_FOUND);
    }

    await recipeService.deleteRecipe(id);
    return c.json(
      successResponse({ message: RecipeMessages.DELETE_SUCCESS(id) }),
      HttpStatusCode.OK,
    );
  } catch (error: unknown) {
    console.error('Error deleting recipe:', error);
    return c.json(
      errorResponse(RecipeMessages.DELETE_ERROR),
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
});

export default recipes;
