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

Deno.test('Ingredients API - GET /api/v1/ingredients - success', async () => {
  const originalGetAll = ingredientService.getAllIngredients;
  ingredientService.getAllIngredients = () => Promise.resolve([mockIngredient]);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);

    const res = await app.request(createRequest('/api/v1/ingredients', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockIngredient.id);
  } finally {
    ingredientService.getAllIngredients = originalGetAll;
  }
});

Deno.test('Ingredients API - GET /api/v1/ingredients - service error', async () => {
  const originalGetAll = ingredientService.getAllIngredients;
  ingredientService.getAllIngredients = () => Promise.reject(new Error('Fail'));

  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);
    const res = await app.request(createRequest('/api/v1/ingredients', 'GET'));
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    ingredientService.getAllIngredients = originalGetAll;
  }
});

Deno.test('Ingredients API - GET /api/v1/ingredients/:id - success', async () => {
  const originalGetById = ingredientService.getIngredientById;
  ingredientService.getIngredientById = (id, _kitchenId) =>
    Promise.resolve(id === mockIngredient.id ? mockIngredient : null);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);

    const res = await app.request(
      createRequest(`/api/v1/ingredients/${mockIngredient.id}`, 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockIngredient.id);
  } finally {
    ingredientService.getIngredientById = originalGetById;
  }
});

Deno.test('Ingredients API - GET /api/v1/ingredients/:id - not found', async () => {
  const originalGetById = ingredientService.getIngredientById;
  ingredientService.getIngredientById = (_id, _kitchenId) => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);

    const validUuid = '123e4567-e89b-12d3-a456-426614174999';
    const res = await app.request(createRequest(`/api/v1/ingredients/${validUuid}`, 'GET'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientService.getIngredientById = originalGetById;
  }
});

Deno.test('Ingredients API - GET /api/v1/ingredients/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/v1/ingredients', ingredients);
  const res = await app.request(createRequest('/api/v1/ingredients/abc', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Ingredients API - POST /api/v1/ingredients - success', async () => {
  const originalCreate = ingredientService.createIngredient;
  ingredientService.createIngredient = (_data, _kitchenId, _userId) =>
    Promise.resolve(mockIngredient);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);

    const newIngredient: Partial<IngredientDTO> = {
      name: 'Test Ingredient',
      categoryId: 1,
      defaultUnitId: 1,
    };

    const res = await app.request(
      createRequest('/api/v1/ingredients', 'POST', newIngredient),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockIngredient.id);
  } finally {
    ingredientService.createIngredient = originalCreate;
  }
});

Deno.test('Ingredients API - POST /api/v1/ingredients - invalid body', async () => {
  const app = new Hono();
  app.route('/api/v1/ingredients', ingredients);
  const res = await app.request(createRequest('/api/v1/ingredients', 'POST', { catId: 1 }));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Ingredients API - POST /api/v1/ingredients - service error', async () => {
  const originalCreate = ingredientService.createIngredient;
  ingredientService.createIngredient = () => Promise.reject(new Error('Fail'));
  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);
    const validBody = { name: 'Test', categoryId: 1, defaultUnitId: 1 };
    const res = await app.request(createRequest('/api/v1/ingredients', 'POST', validBody));
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    ingredientService.createIngredient = originalCreate;
  }
});

Deno.test('Ingredients API - DELETE /api/v1/ingredients/:id - success', async () => {
  const originalGetById = ingredientService.getIngredientById;
  const originalDelete = ingredientService.deleteIngredient;

  ingredientService.getIngredientById = (_id, _kitchenId) => Promise.resolve(mockIngredient);
  ingredientService.deleteIngredient = (_id, _kitchenId) => Promise.resolve(true);

  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);

    const res = await app.request(
      createRequest(`/api/v1/ingredients/${mockIngredient.id}`, 'DELETE'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
  } finally {
    ingredientService.getIngredientById = originalGetById;
    ingredientService.deleteIngredient = originalDelete;
  }
});

Deno.test('Ingredients API - DELETE /api/v1/ingredients/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/v1/ingredients', ingredients);
  const res = await app.request(createRequest('/api/v1/ingredients/abc', 'DELETE'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Ingredients API - DELETE /api/v1/ingredients/:id - not found', async () => {
  const originalGetById = ingredientService.getIngredientById;
  ingredientService.getIngredientById = (_id, _kitchenId) => Promise.resolve(null);
  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);
    const validUuid = '123e4567-e89b-12d3-a456-426614174999';
    const res = await app.request(createRequest(`/api/v1/ingredients/${validUuid}`, 'DELETE'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientService.getIngredientById = originalGetById;
  }
});

Deno.test('Ingredients API - PUT /api/v1/ingredients/:id - success', async () => {
  const originalGetById = ingredientService.getIngredientById;
  const originalUpdate = ingredientService.updateIngredient;

  ingredientService.getIngredientById = (_id, _kitchenId) => Promise.resolve(mockIngredient);
  ingredientService.updateIngredient = (_id, _kitchenId, _data, _userId) =>
    Promise.resolve({ ...mockIngredient, name: 'Updated' });

  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);
    const res = await app.request(
      createRequest(`/api/v1/ingredients/${mockIngredient.id}`, 'PUT', { name: 'Updated' }),
    );
    assertEquals(res.status, HttpStatusCode.OK);
  } finally {
    ingredientService.getIngredientById = originalGetById;
    ingredientService.updateIngredient = originalUpdate;
  }
});

Deno.test('Ingredients API - PUT /api/v1/ingredients/:id - not found', async () => {
  const originalUpdate = ingredientService.updateIngredient;
  ingredientService.updateIngredient = () => Promise.resolve(null);
  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);
    const res = await app.request(
      createRequest(`/api/v1/ingredients/${mockIngredient.id}`, 'PUT', { name: 'Updated' }),
    );
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientService.updateIngredient = originalUpdate;
  }
});

Deno.test('Ingredients API - POST /api/v1/ingredients/:id/reconcile-units - success', async () => {
  const originalReconcile = ingredientService.reconcileIngredientUnit;
  ingredientService.reconcileIngredientUnit = (_id, _kitchenId, unitId, _items, _userId) =>
    Promise.resolve({ ...mockIngredient, defaultUnitId: unitId });

  try {
    const app = new Hono();
    app.route('/api/v1/ingredients', ingredients);
    const res = await app.request(
      createRequest(`/api/v1/ingredients/${mockIngredient.id}/reconcile-units`, 'POST', {
        newDefaultUnitId: 2,
        items: [{ id: '123e4567-e89b-12d3-a456-426614174001', quantity: 100 }],
      }),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.defaultUnitId, 2);
  } finally {
    ingredientService.reconcileIngredientUnit = originalReconcile;
  }
});

Deno.test('Ingredients API - POST /api/v1/ingredients/:id/reconcile-units - invalid body', async () => {
  const app = new Hono();
  app.route('/api/v1/ingredients', ingredients);
  const res = await app.request(
    createRequest(`/api/v1/ingredients/${mockIngredient.id}/reconcile-units`, 'POST', {
      newDefaultUnitId: -1,
      items: [{ id: 'invalid-uuid', quantity: -5 }],
    }),
  );
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});
