import { assertEquals, assertNotEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { shoppingListBackendService } from '../src/services/shopping-list.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE shopping_list_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'pcs',
      checked INTEGER NOT NULL DEFAULT 0,
      estimated_price REAL NOT NULL DEFAULT 0,
      store_name TEXT NOT NULL DEFAULT '',
      source TEXT,
      recipe_name TEXT,
      kitchen_id TEXT NOT NULL DEFAULT 'test-kitchen-id',
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  return db;
}

Deno.test('ShoppingListService - create and retrieve item', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await shoppingListBackendService.createItem(
    {
      name: 'Olive Oil',
      category: 'Pantry',
      quantity: 1,
      unit: 'bottle',
      estimatedPrice: 8.99,
    },
    'test-kitchen-id',
    'test-user-id',
  );

  assertNotEquals(created.id, undefined);
  assertEquals(created.name, 'Olive Oil');
  assertEquals(created.estimatedPrice, 8.99);
  assertEquals(created.checked, false);

  const fetched = await shoppingListBackendService.getItemById(created.id, 'test-kitchen-id');
  assertEquals(fetched?.id, created.id);

  // Clean up
  await shoppingListBackendService.deleteItem(created.id, 'test-kitchen-id');
  db.close();
});

Deno.test('ShoppingListService - bulk insert and delete checked', async () => {
  const db = createTestDB();
  setDB(db);

  const items = await shoppingListBackendService.createMultipleItems(
    [
      { name: 'Item A', checked: true },
      { name: 'Item B', checked: false },
    ],
    'test-kitchen-id',
    'test-user-id',
  );

  assertEquals(items.length, 2);

  const deletedCount = await shoppingListBackendService.deleteCheckedItems('test-kitchen-id');
  assertEquals(deletedCount, 1);

  // Clean up remaining item
  for (const item of items) {
    await shoppingListBackendService.deleteItem(item.id, 'test-kitchen-id');
  }
  db.close();
});
