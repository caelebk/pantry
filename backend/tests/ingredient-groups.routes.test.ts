import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { IngredientGroupDTO } from '../src/models/data-models/ingredient-group.model.ts';
import { IngredientDTO } from '../src/models/data-models/ingredient.model.ts';
import ingredientGroups from '../src/routes/ingredient-groups.routes.ts';
import { ingredientGroupService } from '../src/services/ingredient-group.service.ts';
import { ingredientService } from '../src/services/ingredients.service.ts';
import { HttpStatusCode } from '../src/utils/response.ts';

// Helper to create a request
function createRequest(path: string, method: string) {
  return new Request(`http://localhost${path}`, {
    method,
  });
}

// Mock data
const mockCategory: IngredientGroupDTO = {
  id: 1,
  name: 'Test Category',
};

const mockIngredient: IngredientDTO = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Ingredient',
  categoryId: 1,
  defaultUnitId: 1,
};

Deno.test('Categories API - GET /api/v1/ingredient-groups - success', async () => {
  const originalGetAll = ingredientGroupService.getAllIngredientGroups;
  ingredientGroupService.getAllIngredientGroups = () => Promise.resolve([mockCategory]);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredient-groups', ingredientGroups);

    const res = await app.request(createRequest('/api/v1/ingredient-groups', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockCategory.id);
  } finally {
    ingredientGroupService.getAllIngredientGroups = originalGetAll;
  }
});

Deno.test('Categories API - GET /api/v1/ingredient-groups - service error', async () => {
  const originalGetAll = ingredientGroupService.getAllIngredientGroups;
  ingredientGroupService.getAllIngredientGroups = () => Promise.reject(new Error('Fail'));

  try {
    const app = new Hono();
    app.route('/api/v1/ingredient-groups', ingredientGroups);
    const res = await app.request(createRequest('/api/v1/ingredient-groups', 'GET'));
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    ingredientGroupService.getAllIngredientGroups = originalGetAll;
  }
});

Deno.test('Categories API - GET /api/v1/ingredient-groups/:id - success', async () => {
  const originalGetById = ingredientGroupService.getIngredientGroupById;
  ingredientGroupService.getIngredientGroupById = (id) =>
    Promise.resolve(id === mockCategory.id ? mockCategory : null);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredient-groups', ingredientGroups);

    const res = await app.request(
      createRequest(`/api/v1/ingredient-groups/${mockCategory.id}`, 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockCategory.id);
  } finally {
    ingredientGroupService.getIngredientGroupById = originalGetById;
  }
});

Deno.test('Categories API - GET /api/v1/ingredient-groups/:id - not found', async () => {
  const originalGetById = ingredientGroupService.getIngredientGroupById;
  ingredientGroupService.getIngredientGroupById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredient-groups', ingredientGroups);

    const res = await app.request(createRequest('/api/v1/ingredient-groups/999', 'GET'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientGroupService.getIngredientGroupById = originalGetById;
  }
});

Deno.test('Categories API - GET /api/v1/ingredient-groups/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/v1/ingredient-groups', ingredientGroups);
  const res = await app.request(createRequest('/api/v1/ingredient-groups/abc', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Categories API - GET /api/v1/ingredient-groups/:id/ingredients - success', async () => {
  const originalGetCategoryById = ingredientGroupService.getIngredientGroupById;
  const originalGetIngredients = ingredientService.getIngredientsByGroup;

  ingredientGroupService.getIngredientGroupById = (id) =>
    Promise.resolve(id === mockCategory.id ? mockCategory : null);
  ingredientService.getIngredientsByGroup = (id) =>
    Promise.resolve(id === mockCategory.id ? [mockIngredient] : []);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredient-groups', ingredientGroups);

    const res = await app.request(
      createRequest(`/api/v1/ingredient-groups/${mockCategory.id}/ingredients`, 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockIngredient.id);
  } finally {
    ingredientGroupService.getIngredientGroupById = originalGetCategoryById;
    ingredientService.getIngredientsByGroup = originalGetIngredients;
  }
});

Deno.test('Categories API - GET /api/v1/ingredient-groups/:id/ingredients - category not found', async () => {
  const originalGetCategoryById = ingredientGroupService.getIngredientGroupById;
  ingredientGroupService.getIngredientGroupById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredient-groups', ingredientGroups);

    const res = await app.request(
      createRequest('/api/v1/ingredient-groups/999/ingredients', 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientGroupService.getIngredientGroupById = originalGetCategoryById;
  }
});

Deno.test('Categories API - GET /api/v1/ingredient-groups/:id/ingredients - invalid id', async () => {
  const app = new Hono();
  app.route('/api/v1/ingredient-groups', ingredientGroups);
  const res = await app.request(createRequest('/api/v1/ingredient-groups/abc/ingredients', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Categories API - GET /api/v1/ingredient-groups/:id/ingredients - service error', async () => {
  const originalGetCategoryById = ingredientGroupService.getIngredientGroupById;
  ingredientGroupService.getIngredientGroupById = () => Promise.resolve(mockCategory);

  // Mock ingredient service fail
  const originalGetIngredients = ingredientService.getIngredientsByGroup;
  ingredientService.getIngredientsByGroup = () => Promise.reject(new Error('Fail'));

  try {
    const app = new Hono();
    app.route('/api/v1/ingredient-groups', ingredientGroups);
    const res = await app.request(
      createRequest(`/api/v1/ingredient-groups/${mockCategory.id}/ingredients`, 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    ingredientGroupService.getIngredientGroupById = originalGetCategoryById;
    ingredientService.getIngredientsByGroup = originalGetIngredients;
  }
});
