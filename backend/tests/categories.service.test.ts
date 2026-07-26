import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { CategoryRow } from '../src/models/schema-models/category.model.ts';
import { ingredientGroupService } from '../src/services/ingredient-group.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE nutrient_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT,
      description TEXT
    );
    CREATE TABLE ingredient_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nutrient_group_id INTEGER REFERENCES nutrient_groups(id)
    );
  `);
  return db;
}

function seedMockCategory(db: Database): CategoryRow {
  db.prepare('INSERT INTO ingredient_groups (name) VALUES (?)').run('Test Category');
  const row = db.prepare('SELECT * FROM ingredient_groups WHERE name = ?').get('Test Category') as CategoryRow;
  return row;
}

Deno.test('IngredientGroupService - getAllIngredientGroups - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockCategory(db);

  const groups = await ingredientGroupService.getAllIngredientGroups();
  assertEquals(groups.length, 1);
  assertEquals(groups[0].name, 'Test Category');
  db.close();
});

Deno.test('IngredientGroupService - getAllIngredientGroups - empty', async () => {
  const db = createTestDB();
  setDB(db);

  const groups = await ingredientGroupService.getAllIngredientGroups();
  assertEquals(groups.length, 0);
  db.close();
});

Deno.test('IngredientGroupService - getIngredientGroupById - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockCategory(db);

  const group = await ingredientGroupService.getIngredientGroupById(mockRow.id);
  assert(group !== null);
  assertEquals(group?.id, mockRow.id);
  assertEquals(group?.name, mockRow.name);
  db.close();
});

Deno.test('IngredientGroupService - getIngredientGroupById - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const group = await ingredientGroupService.getIngredientGroupById(999);
  assertEquals(group, null);
  db.close();
});

Deno.test('IngredientGroupService - createIngredientGroup - success', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await ingredientGroupService.createIngredientGroup({
    name: 'New Group',
  });
  assert(created !== null);
  assertEquals(created.name, 'New Group');
  db.close();
});

Deno.test('IngredientGroupService - updateIngredientGroup - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockCategory(db);

  const updated = await ingredientGroupService.updateIngredientGroup(mockRow.id, {
    name: 'Updated Name',
  });
  assert(updated !== null);
  assertEquals(updated?.name, 'Updated Name');
  db.close();
});

Deno.test('IngredientGroupService - deleteIngredientGroup - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockCategory(db);

  const res = await ingredientGroupService.deleteIngredientGroup(mockRow.id);
  assertEquals(res, true);

  const check = await ingredientGroupService.getIngredientGroupById(mockRow.id);
  assertEquals(check, null);
  db.close();
});
