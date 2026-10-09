import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { IngredientRow } from '../src/models/schema-models/ingredient.model.ts';
import { ingredientService } from '../src/services/ingredients.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      username TEXT
    );
    CREATE TABLE profiles (
      user_id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL
    );
    CREATE TABLE ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ingredient_group_id INTEGER,
      default_unit_id INTEGER,
      kitchen_id TEXT NOT NULL DEFAULT 'test-kitchen-id',
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE ingredient_items (
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
      kitchen_id TEXT NOT NULL DEFAULT 'test-kitchen-id',
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
  return db;
}

const _mockDate = new Date();
const mockId = '123e4567-e89b-12d3-a456-426614174000';

function seedMockIngredient(db: Database): IngredientRow {
  const row: IngredientRow = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Flour',
    ingredient_group_id: 1,
    default_unit_id: 1,
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    created_by: null,
    updated_by: null,
  };
  db.prepare(
    'INSERT INTO ingredients (id, name, ingredient_group_id, default_unit_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    row.id,
    row.name,
    row.ingredient_group_id,
    row.default_unit_id,
    row.created_at,
    row.updated_at,
  );
  return row;
}

Deno.test('IngredientsService - getAllIngredients - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredients = await ingredientService.getAllIngredients('test-kitchen-id');
  assertEquals(ingredients.length, 1);
  assertEquals(ingredients[0].id, mockId);
  db.close();
});

Deno.test('IngredientsService - getAllIngredients - empty', async () => {
  const db = createTestDB();
  setDB(db);

  const ingredients = await ingredientService.getAllIngredients('test-kitchen-id');
  assertEquals(ingredients.length, 0);
  db.close();
});

Deno.test('IngredientsService - getIngredientById - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredient = await ingredientService.getIngredientById(mockId, 'test-kitchen-id');
  assert(ingredient !== null);
  assertEquals(ingredient?.id, mockId);
  db.close();
});

Deno.test('IngredientsService - getIngredientById - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const ingredient = await ingredientService.getIngredientById(
    '123e4567-e89b-12d3-a456-426614174999',
    'test-kitchen-id',
  );
  assertEquals(ingredient, null);
  db.close();
});

Deno.test('IngredientsService - createIngredient - success', async () => {
  const db = createTestDB();
  setDB(db);

  const ingredient = await ingredientService.createIngredient(
    {
      name: 'New Ingredient',
      ingredientGroupId: 1,
      defaultUnitId: 1,
    },
    'test-kitchen-id',
    'test-user-id',
  );
  assertEquals(ingredient.name, 'New Ingredient');
  assert(ingredient.id.length > 0);
  db.close();
});

Deno.test('IngredientsService - updateIngredient - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredient = await ingredientService.updateIngredient(mockId, 'test-kitchen-id', {
    name: 'Updated Ingredient',
    ingredientGroupId: 2,
  }, 'test-user-id');
  assert(ingredient !== null);
  assertEquals(ingredient?.name, 'Updated Ingredient');
  db.close();
});

Deno.test('IngredientsService - updateIngredient - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const ingredient = await ingredientService.updateIngredient(
    '123e4567-e89b-12d3-a456-426614174999',
    'test-kitchen-id',
    { name: 'Ghost' },
    'test-user-id',
  );
  assertEquals(ingredient, null);
  db.close();
});

Deno.test('IngredientsService - deleteIngredient - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const result = await ingredientService.deleteIngredient(mockId, 'test-kitchen-id');
  assertEquals(result, true);

  const ingredient = await ingredientService.getIngredientById(mockId, 'test-kitchen-id');
  assertEquals(ingredient, null);
  db.close();
});

Deno.test('IngredientsService - getIngredientsByGroup - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredients = await ingredientService.getIngredientsByGroup(1, 'test-kitchen-id');
  assertEquals(ingredients.length, 1);
  assertEquals(ingredients[0].id, mockId);
  db.close();
});

Deno.test('IngredientsService - getIngredientsByGroup - empty', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredients = await ingredientService.getIngredientsByGroup(999, 'test-kitchen-id');
  assertEquals(ingredients.length, 0);
  db.close();
});

Deno.test('IngredientsService - reconcileIngredientUnit - success and updates all linked items', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const itemId1 = 'item-123';
  const itemId2 = 'item-456';
  db.prepare(
    'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(itemId1, mockId, 'Test Stock 1', 5, 1, 1, '2026-08-10', '2026-08-01');
  db.prepare(
    'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(itemId2, mockId, 'Test Stock 2', 3, 1, 1, '2026-08-12', '2026-08-01');

  // Reconcile every linked batch explicitly; zero is a valid quantity.
  const updated = await ingredientService.reconcileIngredientUnit(mockId, 'test-kitchen-id', 2, [
    { id: itemId1, quantity: 5000 },
    { id: itemId2, quantity: 0 },
  ], 'test-user-id');

  assertEquals(updated?.defaultUnitId, 2);
  const items = await ingredientService.getItemsByIngredientId(mockId, 'test-kitchen-id');
  assertEquals(items.length, 2);

  const item1 = items.find((i) => i.id === itemId1);
  const item2 = items.find((i) => i.id === itemId2);

  assertEquals(item1?.unit_id, 2);
  assertEquals(item1?.quantity, 5000);
  assertEquals(item2?.unit_id, 2); // Also updated to unit 2
  assertEquals(item2?.quantity, 0); // Zero remains valid

  db.close();
});

Deno.test('IngredientsService - null clears membership, omission preserves it and other kitchen is untouched', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);
  try {
    await ingredientService.updateIngredient(
      mockId,
      'other-kitchen',
      { ingredientGroupId: null } as unknown as Parameters<
        typeof ingredientService.updateIngredient
      >[2],
      'user',
    );
    assertEquals(
      (await ingredientService.getIngredientById(mockId, 'test-kitchen-id'))?.ingredientGroupId,
      1,
    );
    await ingredientService.updateIngredient(
      mockId,
      'test-kitchen-id',
      { name: 'Renamed' },
      'user',
    );
    assertEquals(
      (await ingredientService.getIngredientById(mockId, 'test-kitchen-id'))?.ingredientGroupId,
      1,
    );
    await ingredientService.updateIngredient(
      mockId,
      'test-kitchen-id',
      { ingredientGroupId: null } as unknown as Parameters<
        typeof ingredientService.updateIngredient
      >[2],
      'user',
    );
    assertEquals(
      (await ingredientService.getIngredientById(mockId, 'test-kitchen-id'))?.ingredientGroupId,
      undefined,
    );
  } finally {
    db.close();
  }
});

Deno.test('Reconcile units rejects incomplete, duplicate and foreign rows atomically', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);
  db.prepare(
    'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run('a', mockId, 'A', 5, 1, 1, '2026-08-10', '2026-08-01');
  db.prepare(
    'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run('b', mockId, 'B', 3, 1, 1, '2026-08-10', '2026-08-01');
  try {
    const invalid = [
      [{ id: 'a', quantity: 1000 }],
      [{ id: 'a', quantity: 1000 }, { id: 'a', quantity: 2 }],
      [{ id: 'a', quantity: 1000 }, { id: 'foreign', quantity: 2 }],
      [{ id: 'a', quantity: 1000 }, { id: 'b', quantity: -1 }],
      [{ id: 'a', quantity: 1000 }, { id: 'b', quantity: Infinity }],
    ];
    for (const payload of invalid) {
      let rejected = false;
      try {
        await ingredientService.reconcileIngredientUnit(
          mockId,
          'test-kitchen-id',
          2,
          payload,
          'user',
        );
      } catch {
        rejected = true;
      }
      assertEquals(rejected, true);
      assertEquals(
        (await ingredientService.getIngredientById(mockId, 'test-kitchen-id'))?.defaultUnitId,
        1,
      );
      assertEquals(
        (await ingredientService.getItemsByIngredientId(mockId, 'test-kitchen-id')).map(
          (item) => [item.unit_id, item.quantity],
        ),
        [[1, 5], [1, 3]],
      );
    }
  } finally {
    db.close();
  }
});
