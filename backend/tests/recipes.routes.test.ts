import { assertEquals } from '@std/assert';
import app from '../src/app.ts';
import { RecipeDTO } from '../src/models/data-models/recipe.model.ts';
import { recipeService } from '../src/services/recipe.service.ts';

const mockRecipe: RecipeDTO = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Recipe',
  description: 'Test description',
  createdAt: new Date(),
  updatedAt: new Date(),
};

Deno.test('Recipes API - GET /api/recipes - success', async () => {
  const originalGetAll = recipeService.getAllRecipes;
  recipeService.getAllRecipes = () => Promise.resolve([mockRecipe]);

  const res = await app.request('/api/recipes');
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.length, 1);
  assertEquals(json.data[0].id, mockRecipe.id);

  recipeService.getAllRecipes = originalGetAll;
});

Deno.test('Recipes API - GET /api/recipes/available - success', async () => {
  const originalAvailable = recipeService.getAvailableRecipes;
  recipeService.getAvailableRecipes = () => Promise.resolve([mockRecipe]);

  const res = await app.request('/api/recipes/available');
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.length, 1);

  recipeService.getAvailableRecipes = originalAvailable;
});

Deno.test('Recipes API - GET /api/recipes/:id - success', async () => {
  const originalGetById = recipeService.getRecipeById;
  recipeService.getRecipeById = (id) =>
    id === mockRecipe.id ? Promise.resolve(mockRecipe) : Promise.resolve(null);

  const res = await app.request(`/api/recipes/${mockRecipe.id}`);
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.id, mockRecipe.id);

  recipeService.getRecipeById = originalGetById;
});

Deno.test('Recipes API - GET /api/recipes/:id - not found', async () => {
  const originalGetById = recipeService.getRecipeById;
  recipeService.getRecipeById = () => Promise.resolve(null);

  const res = await app.request('/api/recipes/123e4567-e89b-12d3-a456-426614174999');
  assertEquals(res.status, 404);

  recipeService.getRecipeById = originalGetById;
});

Deno.test('Recipes API - POST /api/recipes - success', async () => {
  const originalCreate = recipeService.createRecipe;
  recipeService.createRecipe = (dto) => Promise.resolve({ ...mockRecipe, name: dto.name });

  const res = await app.request('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'New Recipe' }),
  });
  assertEquals(res.status, 201);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.name, 'New Recipe');

  recipeService.createRecipe = originalCreate;
});

Deno.test('Recipes API - DELETE /api/recipes/:id - success', async () => {
  const originalGetById = recipeService.getRecipeById;
  const originalDelete = recipeService.deleteRecipe;

  recipeService.getRecipeById = () => Promise.resolve(mockRecipe);
  recipeService.deleteRecipe = () => Promise.resolve(true);

  const res = await app.request(`/api/recipes/${mockRecipe.id}`, {
    method: 'DELETE',
  });
  assertEquals(res.status, 200);

  recipeService.getRecipeById = originalGetById;
  recipeService.deleteRecipe = originalDelete;
});
