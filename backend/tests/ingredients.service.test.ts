import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { IngredientRow } from '../src/models/schema-models/ingredient.model.ts';
import { ingredientService } from '../src/services/ingredients.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec(`
    CREATE TABLE ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ingredient_group_id INTEGER,
      default_unit_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  return db;
}

const mockDate = new Date();
const mockId = '123e4567-e89b-12d3-a456-426614174000';

function seedMockIngredient(db: Database): IngredientRow {
  const row: IngredientRow = {
    id: mockId,
    name: 'Test Ingredient',
    ingredient_group_id: 1,
    category_id: 1,
    default_unit_id: 1,
    created_at: mockDate.toISOString(),
    updated_at: mockDate.toISOString(),
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

  const ingredients = await ingredientService.getAllIngredients();
  assertEquals(ingredients.length, 1);
  assertEquals(ingredients[0].id, mockId);
  db.close();
});

Deno.test('IngredientsService - getAllIngredients - empty', async () => {
  const db = createTestDB();
  setDB(db);

  const ingredients = await ingredientService.getAllIngredients();
  assertEquals(ingredients.length, 0);
  db.close();
});

Deno.test('IngredientsService - getIngredientById - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredient = await ingredientService.getIngredientById(mockId);
  assert(ingredient !== null);
  assertEquals(ingredient?.id, mockId);
  db.close();
});

Deno.test('IngredientsService - getIngredientById - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const ingredient = await ingredientService.getIngredientById(
    '123e4567-e89b-12d3-a456-426614174999',
  );
  assertEquals(ingredient, null);
  db.close();
});

Deno.test('IngredientsService - createIngredient - success', async () => {
  const db = createTestDB();
  setDB(db);

  const ingredient = await ingredientService.createIngredient({
    name: 'New Ingredient',
    ingredientGroupId: 1,
    defaultUnitId: 1,
  });
  assertEquals(ingredient.name, 'New Ingredient');
  assert(ingredient.id.length > 0);
  db.close();
});

Deno.test('IngredientsService - updateIngredient - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredient = await ingredientService.updateIngredient(mockId, {
    name: 'Updated Ingredient',
    ingredientGroupId: 2,
  });
  assert(ingredient !== null);
  assertEquals(ingredient?.name, 'Updated Ingredient');
  db.close();
});

Deno.test('IngredientsService - updateIngredient - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const ingredient = await ingredientService.updateIngredient(
    '123e4567-e89b-12d3-a456-426614174999',
    { name: 'Ghost' },
  );
  assertEquals(ingredient, null);
  db.close();
});

Deno.test('IngredientsService - deleteIngredient - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const result = await ingredientService.deleteIngredient(mockId);
  assertEquals(result, true);

  const ingredient = await ingredientService.getIngredientById(mockId);
  assertEquals(ingredient, null);
  db.close();
});

Deno.test('IngredientsService - getIngredientsByCategory - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredients = await ingredientService.getIngredientsByCategory(1);
  assertEquals(ingredients.length, 1);
  assertEquals(ingredients[0].id, mockId);
  db.close();
});

Deno.test('IngredientsService - getIngredientsByCategory - empty', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockIngredient(db);

  const ingredients = await ingredientService.getIngredientsByCategory(999);
  assertEquals(ingredients.length, 0);
  db.close();
});
