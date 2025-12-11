import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { IngredientDTO } from '../src/models/data-models/ingredient.model.ts';
import ingredients from '../src/routes/ingredients.routes.ts';
import { ingredientService } from '../src/services/ingredients.service.ts';
import { HttpStatusCode } from '../src/utils/response.ts';

// Helper to create a request
function createRequest(path: string, method: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Mock data
const mockIngredient: IngredientDTO = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Ingredient',
  categoryId: 1,
  defaultUnitId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

Deno.test('Ingredients API - GET /api/ingredients - success', async () => {
  const originalGetAll = ingredientService.getAllIngredients;
  ingredientService.getAllIngredients = () => Promise.resolve([mockIngredient]);

  try {
    const app = new Hono();
    app.route('/api/ingredients', ingredients);

    const res = await app.request(createRequest('/api/ingredients', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockIngredient.id);
  } finally {
    ingredientService.getAllIngredients = originalGetAll;
  }
});

Deno.test('Ingredients API - GET /api/ingredients/:id - success', async () => {
  const originalGetById = ingredientService.getIngredientById;
  ingredientService.getIngredientById = (id) =>
    Promise.resolve(id === mockIngredient.id ? mockIngredient : null);

  try {
    const app = new Hono();
    app.route('/api/ingredients', ingredients);

    const res = await app.request(
      createRequest(`/api/ingredients/${mockIngredient.id}`, 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockIngredient.id);
  } finally {
    ingredientService.getIngredientById = originalGetById;
  }
});

Deno.test('Ingredients API - GET /api/ingredients/:id - not found', async () => {
  const originalGetById = ingredientService.getIngredientById;
  ingredientService.getIngredientById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/ingredients', ingredients);

    const validUuid = '123e4567-e89b-12d3-a456-426614174999';
    const res = await app.request(createRequest(`/api/ingredients/${validUuid}`, 'GET'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientService.getIngredientById = originalGetById;
  }
});

Deno.test('Ingredients API - POST /api/ingredients - success', async () => {
  const originalCreate = ingredientService.createIngredient;
  ingredientService.createIngredient = (_data) => Promise.resolve(mockIngredient);

  try {
    const app = new Hono();
    app.route('/api/ingredients', ingredients);

    const newIngredient: Partial<IngredientDTO> = {
      name: 'Test Ingredient',
      categoryId: 1,
      defaultUnitId: 1,
    };

    const res = await app.request(
      createRequest('/api/ingredients', 'POST', newIngredient),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockIngredient.id);
  } finally {
    ingredientService.createIngredient = originalCreate;
  }
});

Deno.test('Ingredients API - DELETE /api/ingredients/:id - success', async () => {
  const originalGetById = ingredientService.getIngredientById;
  const originalDelete = ingredientService.deleteIngredient;

  ingredientService.getIngredientById = () => Promise.resolve(mockIngredient);
  ingredientService.deleteIngredient = () => Promise.resolve(true);

  try {
    const app = new Hono();
    app.route('/api/ingredients', ingredients);

    const res = await app.request(
      createRequest(`/api/ingredients/${mockIngredient.id}`, 'DELETE'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
  } finally {
    ingredientService.getIngredientById = originalGetById;
    ingredientService.deleteIngredient = originalDelete;
  }
});
