import { assertEquals } from '@std/assert';
import { Hono } from 'hono';
import { CreateItemDTO, ItemDTO } from '../src/models/data-models/item.model.ts';
import items from '../src/routes/items.routes.ts';
import { ingredientItemService } from '../src/services/ingredient-item.service.ts';
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
const mockItem: ItemDTO = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  label: 'Test Item',
  quantity: 5,
  unitId: 1,
  locationId: 1,
  expirationDate: new Date(),
  openedDate: undefined,
  purchaseDate: new Date(),
  notes: 'Test notes',
  createdAt: new Date(),
  updatedAt: new Date(),
};

Deno.test('Items API - GET /api/items - success', async () => {
  // Mock service
  const originalGetAllItems = ingredientItemService.getAllIngredientItems;
  ingredientItemService.getAllIngredientItems = () => Promise.resolve([mockItem]);

  try {
    const app = new Hono();
    app.route('/api/items', items);

    const res = await app.request(createRequest('/api/items', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].id, mockItem.id);
  } finally {
    ingredientItemService.getAllIngredientItems = originalGetAllItems;
  }
});

Deno.test('Items API - GET /api/items - service error', async () => {
  const originalGetAllItems = ingredientItemService.getAllIngredientItems;
  ingredientItemService.getAllIngredientItems = () => Promise.reject(new Error('DB Fail'));

  try {
    const app = new Hono();
    app.route('/api/items', items);
    const res = await app.request(createRequest('/api/items', 'GET'));
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    ingredientItemService.getAllIngredientItems = originalGetAllItems;
  }
});

Deno.test('Items API - GET /api/items/:id - success', async () => {
  const originalGetItemById = ingredientItemService.getIngredientItemById;
  ingredientItemService.getIngredientItemById = (id) =>
    Promise.resolve(id === mockItem.id ? mockItem : null);

  try {
    const app = new Hono();
    app.route('/api/items', items);

    const res = await app.request(createRequest(`/api/items/${mockItem.id}`, 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.id, mockItem.id);
  } finally {
    ingredientItemService.getIngredientItemById = originalGetItemById;
  }
});

Deno.test('Items API - GET /api/items/:id - not found', async () => {
  const originalGetItemById = ingredientItemService.getIngredientItemById;
  ingredientItemService.getIngredientItemById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/items', items);

    const validUuid = '123e4567-e89b-12d3-a456-426614174999';
    const res = await app.request(createRequest(`/api/items/${validUuid}`, 'GET'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientItemService.getIngredientItemById = originalGetItemById;
  }
});

Deno.test('Items API - GET /api/items/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/items', items);
  const res = await app.request(createRequest('/api/items/invalid-uuid', 'GET'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Items API - POST /api/items - success', async () => {
  const originalCreateItem = ingredientItemService.createIngredientItem;
  ingredientItemService.createIngredientItem = (_data) => Promise.resolve(mockItem);

  try {
    const app = new Hono();
    app.route('/api/items', items);

    const newItem: CreateItemDTO = {
      label: 'Test Item',
      quantity: 5,
      unitId: 1,
      locationId: 1,
      expirationDate: new Date().toISOString(),
      purchaseDate: new Date().toISOString(),
      notes: 'notes',
      openedDate: undefined,
    };

    const res = await app.request(createRequest('/api/items', 'POST', newItem));
    assertEquals(res.status, HttpStatusCode.CREATED);
    const body = await res.json();
    assertEquals(body.data.id, mockItem.id);
  } finally {
    ingredientItemService.createIngredientItem = originalCreateItem;
  }
});

Deno.test('Items API - POST /api/items - invalid body', async () => {
  const app = new Hono();
  app.route('/api/items', items);
  // Missing label and quantity
  const res = await app.request(createRequest('/api/items', 'POST', { notes: 'only notes' }));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Items API - POST /api/items - service error', async () => {
  const originalCreateItem = ingredientItemService.createIngredientItem;
  ingredientItemService.createIngredientItem = () => Promise.reject(new Error('DB Fail'));

  try {
    const app = new Hono();
    app.route('/api/items', items);
    const newItem = {
      label: 'Test',
      quantity: 1,
      unitId: 1,
      locationId: 1,
      purchaseDate: new Date(),
      expirationDate: new Date(),
    };
    const res = await app.request(createRequest('/api/items', 'POST', newItem));
    assertEquals(res.status, HttpStatusCode.INTERNAL_SERVER_ERROR);
  } finally {
    ingredientItemService.createIngredientItem = originalCreateItem;
  }
});

Deno.test('Items API - PUT /api/items/:id - success', async () => {
  const originalGetItemById = ingredientItemService.getIngredientItemById;
  const originalUpdateItem = ingredientItemService.updateIngredientItem;

  ingredientItemService.getIngredientItemById = () => Promise.resolve(mockItem);
  ingredientItemService.updateIngredientItem = (_id, _data) =>
    Promise.resolve({ ...mockItem, label: 'Updated Only' });

  try {
    const app = new Hono();
    app.route('/api/items', items);
    const updateData = { label: 'Updated Only' };
    const res = await app.request(createRequest(`/api/items/${mockItem.id}`, 'PUT', updateData));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.label, 'Updated Only');
  } finally {
    ingredientItemService.getIngredientItemById = originalGetItemById;
    ingredientItemService.updateIngredientItem = originalUpdateItem;
  }
});

Deno.test('Items API - PUT /api/items/:id - not found', async () => {
  const originalUpdateItem = ingredientItemService.updateIngredientItem;
  ingredientItemService.updateIngredientItem = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/items', items);
    const res = await app.request(
      createRequest(`/api/items/${mockItem.id}`, 'PUT', { label: 'Update' }),
    );
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientItemService.updateIngredientItem = originalUpdateItem;
  }
});

Deno.test('Items API - PUT /api/items/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/items', items);
  const res = await app.request(
    createRequest('/api/items/invalid-uuid', 'PUT', { label: 'Update' }),
  );
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Items API - DELETE /api/items/:id - success', async () => {
  const originalGetItemById = ingredientItemService.getIngredientItemById;
  const originalDeleteItemById = ingredientItemService.deleteIngredientItemById;

  ingredientItemService.getIngredientItemById = () => Promise.resolve(mockItem);
  ingredientItemService.deleteIngredientItemById = () => Promise.resolve(true);

  try {
    const app = new Hono();
    app.route('/api/items', items);

    const res = await app.request(createRequest(`/api/items/${mockItem.id}`, 'DELETE'));
    assertEquals(res.status, HttpStatusCode.OK);
  } finally {
    ingredientItemService.getIngredientItemById = originalGetItemById;
    ingredientItemService.deleteIngredientItemById = originalDeleteItemById;
  }
});

Deno.test('Items API - DELETE /api/items/:id - invalid id', async () => {
  const app = new Hono();
  app.route('/api/items', items);
  const res = await app.request(createRequest('/api/items/invalid-uuid', 'DELETE'));
  assertEquals(res.status, HttpStatusCode.BAD_REQUEST);
});

Deno.test('Items API - DELETE /api/items/:id - not found', async () => {
  const originalGetItemById = ingredientItemService.getIngredientItemById;
  ingredientItemService.getIngredientItemById = () => Promise.resolve(null);

  try {
    const app = new Hono();
    app.route('/api/items', items);
    const validUuid = '123e4567-e89b-12d3-a456-426614174999';
    const res = await app.request(createRequest(`/api/items/${validUuid}`, 'DELETE'));
    assertEquals(res.status, HttpStatusCode.NOT_FOUND);
  } finally {
    ingredientItemService.getIngredientItemById = originalGetItemById;
  }
});

Deno.test('Items API - GET /api/items/similarity - success with candidates', async () => {
  const originalFindSimilarItems = ingredientItemService.findSimilarItems;
  ingredientItemService.findSimilarItems = (name, _threshold) =>
    Promise.resolve([
      {
        item: mockItem,
        score: name.toLowerCase().includes('test') ? 1.0 : 0.8,
        tier: 'exact',
      },
    ]);

  try {
    const app = new Hono();
    app.route('/api/items', items);

    const res = await app.request(
      createRequest('/api/items/similarity?name=Test&threshold=0.5', 'GET'),
    );
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 1);
    assertEquals(body.data[0].item.id, mockItem.id);
  } finally {
    ingredientItemService.findSimilarItems = originalFindSimilarItems;
  }
});

Deno.test('Items API - GET /api/items/similarity - empty query returns empty candidates', async () => {
  const originalFindSimilarItems = ingredientItemService.findSimilarItems;
  ingredientItemService.findSimilarItems = () => Promise.resolve([]);

  try {
    const app = new Hono();
    app.route('/api/items', items);

    const res = await app.request(createRequest('/api/items/similarity?name=', 'GET'));
    assertEquals(res.status, HttpStatusCode.OK);
    const body = await res.json();
    assertEquals(body.data.length, 0);
  } finally {
    ingredientItemService.findSimilarItems = originalFindSimilarItems;
  }
});
