import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { recipeService } from '../src/services/recipe.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = OFF');
  db.exec(`
    CREATE TABLE difficulties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      type TEXT NOT NULL,
      to_base_factor REAL NOT NULL
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
      expiration_date TEXT,
      opened_date TEXT,
      purchase_date TEXT NOT NULL,
      notes TEXT,
      kitchen_id TEXT NOT NULL DEFAULT 'test-kitchen-id',
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      difficulty_id INTEGER,
      servings REAL,
      prep_time REAL,
      cook_time REAL,
      image_url TEXT,
      kitchen_id TEXT NOT NULL DEFAULT 'test-kitchen-id',
      created_by TEXT,
      updated_by TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE recipe_ingredients (
      recipe_id TEXT,
      ingredient_id TEXT,
      quantity REAL NOT NULL,
      unit_id INTEGER,
      ingredient_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (recipe_id, ingredient_id)
    );

    CREATE TABLE recipe_steps (
      id TEXT PRIMARY KEY,
      recipe_id TEXT,
      step_number INTEGER NOT NULL,
      instruction_text TEXT NOT NULL,
      image_url TEXT,
      timer_seconds INTEGER,
      textarea_height INTEGER
    );
  `);
  return db;
}

const mockIngId = '00000000-0000-0000-0000-000000000001';

Deno.test('RecipeService - create & findById - success', async () => {
  const db = createTestDB();
  setDB(db);

  const recipe = await recipeService.create(
    {
      name: 'Pancakes',
      description: 'Fluffy pancakes',
      servings: 4,
      prepTime: 10,
      cookTime: 15,
      ingredients: [
        { ingredientId: mockIngId, quantity: 200, unitId: 1 },
      ],
      steps: [
        { stepNumber: 1, instructionText: 'Mix dry ingredients' },
        { stepNumber: 2, instructionText: 'Cook on griddle', timerSeconds: 180 },
      ],
    },
    'test-kitchen-id',
    'test-user-id',
  );

  assertEquals(recipe.name, 'Pancakes');
  assertEquals(recipe.ingredients?.length, 1);
  assertEquals(recipe.steps?.length, 2);

  const found = await recipeService.findById(recipe.id, 'test-kitchen-id');
  assert(found !== null);
  assertEquals(found?.name, 'Pancakes');
  assertEquals(found?.steps?.[0].instructionText, 'Mix dry ingredients');

  db.close();
});

Deno.test('RecipeService - update - success', async () => {
  const db = createTestDB();
  setDB(db);

  const recipe = await recipeService.create(
    {
      name: 'Old Recipe',
    },
    'test-kitchen-id',
    'test-user-id',
  );

  const updated = await recipeService.update(recipe.id, 'test-kitchen-id', {
    name: 'Updated Recipe',
    description: 'New Description',
  }, 'test-user-id');

  assert(updated !== null);
  assertEquals(updated?.name, 'Updated Recipe');
  assertEquals(updated?.description, 'New Description');

  db.close();
});

Deno.test('RecipeService - delete - success', async () => {
  const db = createTestDB();
  setDB(db);

  const recipe = await recipeService.create(
    { name: 'To Delete' },
    'test-kitchen-id',
    'test-user-id',
  );
  const result = await recipeService.delete(recipe.id, 'test-kitchen-id');

  assertEquals(result, true);
  const found = await recipeService.findById(recipe.id, 'test-kitchen-id');
  assertEquals(found, null);

  db.close();
});

Deno.test('RecipeService - getAvailableRecipes - calculates unit factor conversion correctly', async () => {
  const db = createTestDB();
  setDB(db);

  // Units: 1 = gram (factor 1), 2 = kilogram (factor 1000)
  db.prepare(
    'INSERT INTO units (id, name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?, ?)',
  ).run(1, 'gram', 'g', 'weight', 1);
  db.prepare(
    'INSERT INTO units (id, name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?, ?)',
  ).run(2, 'kilogram', 'kg', 'weight', 1000);

  // Pantry has 1 kg of Flour (1000g)
  const flourId = 'flour-uuid-1';
  db.prepare(
    'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    'item-1',
    flourId,
    'Flour Bag',
    1,
    2,
    1,
    '2030-01-01',
    '2026-01-01',
  );

  // Recipe 1 needs 500g Flour (Available: 1000g >= 500g -> TRUE)
  await recipeService.create(
    {
      name: 'Bread',
      ingredients: [{ ingredientId: flourId, quantity: 500, unitId: 1 }],
    },
    'test-kitchen-id',
    'test-user-id',
  );

  // Recipe 2 needs 2000g Flour (Available: 1000g < 2000g -> FALSE)
  await recipeService.create(
    {
      name: 'Huge Cake',
      ingredients: [{ ingredientId: flourId, quantity: 2000, unitId: 1 }],
    },
    'test-kitchen-id',
    'test-user-id',
  );

  const available = await recipeService.getAvailableRecipes('test-kitchen-id');
  assertEquals(available.length, 1);
  assertEquals(available[0].name, 'Bread');

  db.close();
});

Deno.test('RecipeService - getAvailableRecipes - excludes expired pantry items', async () => {
  const db = createTestDB();
  setDB(db);

  db.prepare(
    'INSERT INTO units (id, name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?, ?)',
  ).run(1, 'liter', 'L', 'volume', 1000);

  const milkId = 'milk-uuid-1';

  // Expired Milk: 2L expired 5 days ago
  db.prepare(
    'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    'item-expired',
    milkId,
    'Expired Milk',
    2,
    1,
    1,
    '2020-01-01T00:00:00.000Z',
    '2019-12-25T00:00:00.000Z',
  );

  // Recipe requires 1L Milk
  await recipeService.create(
    {
      name: 'Cereal Bowl',
      ingredients: [{ ingredientId: milkId, quantity: 1, unitId: 1 }],
    },
    'test-kitchen-id',
    'test-user-id',
  );

  const available = await recipeService.getAvailableRecipes('test-kitchen-id');
  assertEquals(available.length, 0, 'Expired milk should not count toward available recipes');

  db.close();
});

Deno.test('RecipeService - getAvailableRecipes - sums multiple pantry items for same ingredient', async () => {
  const db = createTestDB();
  setDB(db);

  db.prepare(
    'INSERT INTO units (id, name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?, ?)',
  ).run(1, 'piece', 'pc', 'count', 1);

  const eggId = 'egg-uuid-1';

  // Batch 1: 3 eggs
  db.prepare(
    'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    'eggs-1',
    eggId,
    'Half Carton',
    3,
    1,
    1,
    '2030-01-01',
    '2026-01-01',
  );

  // Batch 2: 3 eggs
  db.prepare(
    'INSERT INTO ingredient_items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    'eggs-2',
    eggId,
    'Another Carton',
    3,
    1,
    1,
    '2030-01-01',
    '2026-01-01',
  );

  // Recipe requires 5 eggs (Total available = 3 + 3 = 6 >= 5 -> TRUE)
  await recipeService.create(
    {
      name: 'Omelette',
      ingredients: [{ ingredientId: eggId, quantity: 5, unitId: 1 }],
    },
    'test-kitchen-id',
    'test-user-id',
  );

  const available = await recipeService.getAvailableRecipes('test-kitchen-id');
  assertEquals(available.length, 1);
  assertEquals(available[0].name, 'Omelette');

  db.close();
});

Deno.test('RecipeService - preserves custom ordering for ingredients and steps', async () => {
  const db = createTestDB();
  setDB(db);

  const created = await recipeService.create(
    {
      name: 'Layered Parfait',
      ingredients: [
        { ingredientId: 'ing-granola', quantity: 100, unitId: 1, ingredientOrder: 1 },
        { ingredientId: 'ing-yogurt', quantity: 200, unitId: 1, ingredientOrder: 2 },
        { ingredientId: 'ing-berries', quantity: 50, unitId: 1, ingredientOrder: 3 },
      ],
      steps: [
        { stepNumber: 1, instructionText: 'Layer yogurt in glass' },
        { stepNumber: 2, instructionText: 'Top with granola' },
        { stepNumber: 3, instructionText: 'Garnish with berries' },
      ],
    },
    'test-kitchen-id',
    'test-user-id',
  );

  const fetched = await recipeService.findById(created.id, 'test-kitchen-id');
  assertEquals(fetched?.ingredients?.map((i: { ingredientId: string }) => i.ingredientId), [
    'ing-granola',
    'ing-yogurt',
    'ing-berries',
  ]);
  assertEquals(fetched?.steps?.map((s: { instructionText: string }) => s.instructionText), [
    'Layer yogurt in glass',
    'Top with granola',
    'Garnish with berries',
  ]);

  db.close();
});
