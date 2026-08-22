import { assertEquals } from '@std/assert';
import app from '../src/app.ts';
import { ShoppingListItemDTO } from '../src/models/data-models/shopping-list.model.ts';
import { shoppingListBackendService } from '../src/services/shopping-list.service.ts';

const mockShoppingItem: ShoppingListItemDTO = {
  id: 'sl-123',
  name: 'Milk',
  category: 'Dairy',
  quantity: 2,
  unit: 'gallons',
  checked: false,
  estimatedPrice: 3.99,
  storeName: 'Grocery Store',
  source: 'manual',
  createdAt: new Date().toISOString(),
};

Deno.test('Shopping List API - GET /api/v1/shopping-list - success', async () => {
  const originalGetAll = shoppingListBackendService.getAllItems;
  shoppingListBackendService.getAllItems = (_kitchenId) => Promise.resolve([mockShoppingItem]);

  const res = await app.request('/api/v1/shopping-list');
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.length, 1);
  assertEquals(json.data[0].name, 'Milk');

  shoppingListBackendService.getAllItems = originalGetAll;
});

Deno.test('Shopping List API - POST /api/v1/shopping-list - success', async () => {
  const originalCreate = shoppingListBackendService.createItem;
  shoppingListBackendService.createItem = (dto, _kitchenId) =>
    Promise.resolve({ ...mockShoppingItem, name: dto.name });

  const res = await app.request('/api/v1/shopping-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Eggs', quantity: 12 }),
  });
  assertEquals(res.status, 201);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.name, 'Eggs');

  shoppingListBackendService.createItem = originalCreate;
});

Deno.test('Shopping List API - POST /api/v1/shopping-list - invalid item name', async () => {
  const res = await app.request('/api/v1/shopping-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '   ' }),
  });
  assertEquals(res.status, 400);
});

Deno.test('Shopping List API - POST /api/v1/shopping-list/bulk - success', async () => {
  const originalBulk = shoppingListBackendService.createMultipleItems;
  shoppingListBackendService.createMultipleItems = (items, _kitchenId) =>
    Promise.resolve(
      items.map((i, idx) => ({ ...mockShoppingItem, id: `sl-${idx}`, name: i.name })),
    );

  const res = await app.request('/api/v1/shopping-list/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([{ name: 'Apples' }, { name: 'Bananas' }]),
  });
  assertEquals(res.status, 201);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.length, 2);

  shoppingListBackendService.createMultipleItems = originalBulk;
});

Deno.test('Shopping List API - PUT /api/v1/shopping-list/:id - success', async () => {
  const originalUpdate = shoppingListBackendService.updateItem;
  shoppingListBackendService.updateItem = (id, _kitchenId, body) =>
    Promise.resolve({ ...mockShoppingItem, id, checked: body.checked ?? false });

  const res = await app.request(`/api/v1/shopping-list/${mockShoppingItem.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checked: true }),
  });
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.checked, true);

  shoppingListBackendService.updateItem = originalUpdate;
});

Deno.test('Shopping List API - DELETE /api/v1/shopping-list/checked - success', async () => {
  const originalDeleteChecked = shoppingListBackendService.deleteCheckedItems;
  shoppingListBackendService.deleteCheckedItems = (_kitchenId) => Promise.resolve(3);

  const res = await app.request('/api/v1/shopping-list/checked', {
    method: 'DELETE',
  });
  assertEquals(res.status, 200);

  const json = await res.json();
  assertEquals(json.status, 'success');
  assertEquals(json.data.count, 3);

  shoppingListBackendService.deleteCheckedItems = originalDeleteChecked;
});

Deno.test('Shopping List API - DELETE /api/v1/shopping-list/:id - success', async () => {
  const originalDeleteItem = shoppingListBackendService.deleteItem;
  shoppingListBackendService.deleteItem = (_id, _kitchenId) => Promise.resolve(true);

  const res = await app.request(`/api/v1/shopping-list/${mockShoppingItem.id}`, {
    method: 'DELETE',
  });
  assertEquals(res.status, 200);

  shoppingListBackendService.deleteItem = originalDeleteItem;
});
