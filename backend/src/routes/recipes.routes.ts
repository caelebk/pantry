/**
 * Recipes API routes
 */

import { Hono } from 'hono';
import type { CreateRecipeDTO, UpdateRecipeDTO } from '../models/data-models/recipe.model.ts';

const recipes = new Hono();

// GET /api/recipes - Get all recipes
recipes.get('/', (c) => {
  // TODO: Implement get all recipes logic
  return c.json({
    status: 'success',
    data: [],
  });
});

// GET /api/recipes/:id - Get recipe by ID
recipes.get('/:id', (c) => {
  const id = c.req.param('id');

  // TODO: Implement get recipe by ID logic
  return c.json({
    status: 'success',
    data: { id },
  });
});

// POST /api/recipes - Create new recipe
recipes.post('/', async (c) => {
  const body: CreateRecipeDTO = await c.req.json();

  // TODO: Implement create recipe logic
  return c.json(
    {
      status: 'success',
      data: body,
    },
    201,
  );
});

// PUT /api/recipes/:id - Update recipe
recipes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body: UpdateRecipeDTO = await c.req.json();

  // TODO: Implement update recipe logic
  return c.json({
    status: 'success',
    data: { id, ...body },
  });
});

// DELETE /api/recipes/:id - Delete recipe
recipes.delete('/:id', (c) => {
  const id = c.req.param('id');

  // TODO: Implement delete recipe logic
  return c.json({
    status: 'success',
    message: `Recipe ${id} deleted`,
  });
});

export default recipes;
