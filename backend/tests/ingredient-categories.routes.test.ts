import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { IngredientCategoryDTO } from '../src/models/data-models/ingredient-category.model.ts';
import ingredientCategories from '../src/routes/ingredient-categories.routes.ts';
import { ingredientCategoryService } from '../src/services/ingredient-category.service.ts';
import { HttpStatusCode } from '../src/utils/response.ts';

function createRequest(path: string, method: string) {
  return new Request(`http://localhost${path}`, { method });
}

const mockCategory: IngredientCategoryDTO = {
  id: 1,
  name: 'Protein & Dairy',
  icon: '🥩',
  color: '#ef4444',
};

Deno.test('IngredientCategories API - GET /api/ingredient-categories - success', async () => {
  const originalGetAll = ingredientCategoryService.getAllIngredientCategories;
  ingredientCategoryService.getAllIngredientCategories = () => Promise.resolve([mockCategory]);

  try {
    const app = new Hono();
    app.route('/api/ingredient-categories', ingredientCategories);

    const res = await app.request(createRequest('/api/ingredient-categories', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockCategory.id);
  } finally {
    ingredientCategoryService.getAllIngredientCategories = originalGetAll;
  }
});

Deno.test('IngredientCategories API - GET /api/ingredient-categories/:id - success', async () => {
  const originalGetById = ingredientCategoryService.getIngredientCategoryById;
  ingredientCategoryService.getIngredientCategoryById = (id) =>
    Promise.resolve(id === mockCategory.id ? mockCategory : null);

  try {
    const app = new Hono();
    app.route('/api/ingredient-categories', ingredientCategories);

    const res = await app.request(createRequest(`/api/ingredient-categories/${mockCategory.id}`, 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockCategory.id);
  } finally {
    ingredientCategoryService.getIngredientCategoryById = originalGetById;
  }
});
