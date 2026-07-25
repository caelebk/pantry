import { assert, assertEquals, assertRejects } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { CreateItemDTO, UpdateItemDTO } from '../src/models/data-models/item.model.ts';
import { ItemRow } from '../src/models/schema-models/item.model.ts';
import { itemService } from '../src/services/item.service.ts';

// Helper: create an in-memory SQLite database with the items schema
function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec(`
    CREATE TABLE items (
      id TEXT PRIMARY KEY,
      ingredient_id TEXT,
      label TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      expiration_date TEXT NOT NULL,
      opened_date TEXT,
      purchase_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  return db;
}

// Helpers
const mockDate = new Date();
const mockId = '123e4567-e89b-12d3-a456-426614174000';

function seedMockItem(db: Database): ItemRow {
  const row: ItemRow = {
    id: mockId,
    ingredient_id: null,
    label: 'Test Item',
    quantity: 5,
    unit_id: 1,
    location_id: 1,
    expiration_date: mockDate.toISOString(),
    opened_date: null,
    purchase_date: mockDate.toISOString(),
    notes: 'Test notes',
    created_at: mockDate.toISOString(),
    updated_at: mockDate.toISOString(),
  };
  db.prepare(
    'INSERT INTO items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, opened_date, purchase_date, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    row.id, row.ingredient_id, row.label, row.quantity, row.unit_id, row.location_id,
    row.expiration_date, row.opened_date, row.purchase_date, row.notes, row.created_at, row.updated_at,
  );
  return row;
}

Deno.test('ItemService - getAllItems - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockItem(db);

  const items = await itemService.getAllItems();
  assertEquals(items.length, 1);
  assertEquals(items[0].id, mockRow.id);
  db.close();
});

Deno.test('ItemService - getAllItems - empty', async () => {
  const db = createTestDB();
  setDB(db);

  const items = await itemService.getAllItems();
  assertEquals(items.length, 0);
  db.close();
});

Deno.test('ItemService - getItemById - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockItem(db);

  const item = await itemService.getItemById(mockRow.id);
  assert(item !== null);
  assertEquals(item?.id, mockRow.id);
  db.close();
});

Deno.test('ItemService - getItemById - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const item = await itemService.getItemById('123e4567-e89b-12d3-a456-426614174999');
  assertEquals(item, null);
  db.close();
});

Deno.test('ItemService - createItem - success', async () => {
  const db = createTestDB();
  setDB(db);

  const newItem: CreateItemDTO = {
    label: 'New Item',
    quantity: 10,
    unitId: 1,
    locationId: 1,
    expirationDate: mockDate.toISOString(),
    purchaseDate: mockDate.toISOString(),
    notes: 'New notes',
    openedDate: undefined,
  };

  const item = await itemService.createItem(newItem);
  assertEquals(item.label, newItem.label);
  assert(item.id.length > 0);
  db.close();
});

Deno.test('ItemService - updateItem - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockItem(db);

  const updateData: UpdateItemDTO = {
    label: 'Updated Item',
    quantity: 20,
  };

  const item = await itemService.updateItem(mockRow.id, updateData);
  assert(item !== null);
  assertEquals(item?.label, 'Updated Item');
  assertEquals(item?.quantity, 20);
  db.close();
});

Deno.test('ItemService - updateItem - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const updateData: UpdateItemDTO = { label: 'Ghost Item' };
  const item = await itemService.updateItem('123e4567-e89b-12d3-a456-426614174999', updateData);
  assertEquals(item, null);
  db.close();
});

Deno.test('ItemService - deleteItemById - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockItem(db);

  const result = await itemService.deleteItemById(mockRow.id);
  assertEquals(result, true);

  // Verify it's actually deleted
  const item = await itemService.getItemById(mockRow.id);
  assertEquals(item, null);
  db.close();
});

Deno.test('ItemService - findExpiringSoon - success', async () => {
  const db = createTestDB();
  setDB(db);

  // Insert an item expiring soon (tomorrow)
  const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
  db.prepare(
    'INSERT INTO items (id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    '123e4567-e89b-12d3-a456-426614174001',
    'Expiring Soon',
    1,
    1,
    1,
    tomorrow.toISOString(),
    mockDate.toISOString(),
  );

  // Insert item expiring far in the future
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  db.prepare(
    'INSERT INTO items (id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    '123e4567-e89b-12d3-a456-426614174002',
    'Not Expiring',
    1,
    1,
    1,
    farFuture.toISOString(),
    mockDate.toISOString(),
  );

  const items = await itemService.findExpiringSoon(7);
  assertEquals(items.length, 1);
  assertEquals(items[0].label, 'Expiring Soon');
  db.close();
});
