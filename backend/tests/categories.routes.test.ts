import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { CategoryDTO } from '../src/models/data-models/category.model.ts';
import { IngredientDTO } from '../src/models/data-models/ingredient.model.ts';
import categories from '../src/routes/categories.routes.ts';
import { categoryService } from '../src/services/category.service.ts';
import { ingredientService } from '../src/services/ingredients.service.ts';
import { HttpStatusCode } from '../src/utils/response.ts';

// Helper to create a request
function createRequest(path: string, method: string) {
  return new Request(`http://localhost${path}`, {
    method,
  });
}

// Mock data
const mockCategory: CategoryDTO = {
  id: 1,
  name: 'Test Category',
};

const mockIngredient: IngredientDTO = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Ingredient',
  categoryId: 1,
  defaultUnitId: 1,
};

Deno.test('Categories API - GET /api/categories - success', async () => {
  const originalGetAll = categoryService.getAllCategories;
  categoryService.getAllCategories = () => Promise.resolve([mockCategory]);

  try {
    const app = new Hono();
    app.route('/api/categories', categories);

    const res = await app.request(createRequest('/api/categories', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockCategory.id);
  } finally {
    categoryService.getAllCategories = originalGetAll;
  }
});

Deno.test('Categories API - GET /api/categories - service error', async () => {
  const originalGetAll = categoryService.getAllCategories;
  categoryService.getAllCategories = () => Promise.reject(new Error('Fail'));

  try {
    const app = new Hono();
    app.route('/api/categories', categories);
    const res = await app.request(createRequest('/api/categories', 'GET'));
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    categoryService.getAllCategories = originalGetAll;
  }
});

Deno.test('Categories API - GET /api/categories/:id - success', async () => {
  const originalGetById = categoryService.getCategoryById;
  categoryService.getCategoryById = (id) =>
    Promise.resolve(id === mockCategory.id ? mockCategory : null);

  try {
    const app = new Hono();
    app.route('/api/categories', categories);

    const res = await app.request(
      createRequest(`/api/categories/${mockCategory.id}`, 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockCategory.id);
  } finally {
    categoryService.getCategoryById = originalGetById;
  }
});

Deno.test('Categories API - GET /api/categories/:id - not found', async () => {
  const originalGetById = categoryService.getCategoryById;
  categoryService.getCategoryById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/categories', categories);

    const res = await app.request(createRequest('/api/categories/999', 'GET'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    categoryService.getCategoryById = originalGetById;
  }
});

Deno.test('Categories API - GET /api/categories/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/categories', categories);
  const res = await app.request(createRequest('/api/categories/abc', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Categories API - GET /api/categories/:id/ingredients - success', async () => {
  const originalGetCategoryById = categoryService.getCategoryById;
  const originalGetIngredients = ingredientService.getIngredientsByCategory;

  categoryService.getCategoryById = (id) =>
    Promise.resolve(id === mockCategory.id ? mockCategory : null);
  ingredientService.getIngredientsByCategory = (id) =>
    Promise.resolve(id === mockCategory.id ? [mockIngredient] : []);

  try {
    const app = new Hono();
    app.route('/api/categories', categories);

    const res = await app.request(
      createRequest(`/api/categories/${mockCategory.id}/ingredients`, 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockIngredient.id);
  } finally {
    categoryService.getCategoryById = originalGetCategoryById;
    ingredientService.getIngredientsByCategory = originalGetIngredients;
  }
});

Deno.test('Categories API - GET /api/categories/:id/ingredients - category not found', async () => {
  const originalGetCategoryById = categoryService.getCategoryById;
  categoryService.getCategoryById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/categories', categories);

    const res = await app.request(createRequest('/api/categories/999/ingredients', 'GET'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    categoryService.getCategoryById = originalGetCategoryById;
  }
});

Deno.test('Categories API - GET /api/categories/:id/ingredients - invalid id', async () => {
  const app = new Hono();
  app.route('/api/categories', categories);
  const res = await app.request(createRequest('/api/categories/abc/ingredients', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Categories API - GET /api/categories/:id/ingredients - service error', async () => {
  const originalGetCategoryById = categoryService.getCategoryById;
  categoryService.getCategoryById = () => Promise.resolve(mockCategory);

  // Mock ingredient service fail
  const originalGetIngredients = ingredientService.getIngredientsByCategory;
  ingredientService.getIngredientsByCategory = () => Promise.reject(new Error('Fail'));

  try {
    const app = new Hono();
    app.route('/api/categories', categories);
    const res = await app.request(
      createRequest(`/api/categories/${mockCategory.id}/ingredients`, 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    categoryService.getCategoryById = originalGetCategoryById;
    ingredientService.getIngredientsByCategory = originalGetIngredients;
  }
});
