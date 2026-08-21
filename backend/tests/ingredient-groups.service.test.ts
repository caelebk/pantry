import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { IngredientGroupRow } from '../src/models/schema-models/ingredient-group.model.ts';
import { ingredientGroupService } from '../src/services/ingredient-group.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
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
    CREATE TABLE ingredient_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT,
      description TEXT
    );
    CREATE TABLE ingredient_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ingredient_category_id INTEGER REFERENCES ingredient_categories(id),
      kitchen_id TEXT NOT NULL DEFAULT 'test-kitchen-id',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      created_by TEXT,
      updated_by TEXT
    );
  `);
  return db;
}

function seedMockGroup(db: Database): IngredientGroupRow {
  db.prepare('INSERT INTO ingredient_groups (name) VALUES (?)').run('Test Category');
  const row = db.prepare('SELECT * FROM ingredient_groups WHERE name = ?').get(
    'Test Category',
  ) as IngredientGroupRow;
  return row;
}

Deno.test('IngredientGroupService - getAllIngredientGroups - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockGroup(db);

  const groups = await ingredientGroupService.getAllIngredientGroups('test-kitchen-id');
  assertEquals(groups.length, 1);
  assertEquals(groups[0].name, 'Test Category');
  db.close();
});

Deno.test('IngredientGroupService - getAllIngredientGroups - empty', async () => {
  const db = createTestDB();
  setDB(db);

  const groups = await ingredientGroupService.getAllIngredientGroups('test-kitchen-id');
  assertEquals(groups.length, 0);
  db.close();
});

Deno.test('IngredientGroupService - getIngredientGroupById - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockGroup(db);

  const group = await ingredientGroupService.getIngredientGroupById(mockRow.id, 'test-kitchen-id');
  assert(group !== null);
  assertEquals(group?.id, mockRow.id);
  assertEquals(group?.name, mockRow.name);
  db.close();
});

Deno.test('IngredientGroupService - getIngredientGroupById - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const group = await ingredientGroupService.getIngredientGroupById(999, 'test-kitchen-id');
  assertEquals(group, null);
  db.close();
});

Deno.test('IngredientGroupService - createIngredientGroup - success', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await ingredientGroupService.createIngredientGroup(
    {
      name: 'New Group',
    },
    'test-kitchen-id',
    'test-user-id',
  );
  assert(created !== null);
  assertEquals(created.name, 'New Group');
  db.close();
});

Deno.test('IngredientGroupService - updateIngredientGroup - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockGroup(db);

  const updated = await ingredientGroupService.updateIngredientGroup(
    mockRow.id,
    'test-kitchen-id',
    {
      name: 'Updated Name',
    },
    'test-user-id',
  );
  assert(updated !== null);
  assertEquals(updated?.name, 'Updated Name');
  db.close();
});

Deno.test('IngredientGroupService - deleteIngredientGroup - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockGroup(db);

  const res = await ingredientGroupService.deleteIngredientGroup(mockRow.id, 'test-kitchen-id');
  assertEquals(res, true);

  const check = await ingredientGroupService.getIngredientGroupById(mockRow.id, 'test-kitchen-id');
  assertEquals(check, null);
  db.close();
});
