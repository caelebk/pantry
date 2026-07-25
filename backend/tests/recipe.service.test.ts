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
      category_id INTEGER,
      default_unit_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE recipe_ingredients (
      recipe_id TEXT,
      ingredient_id TEXT,
      quantity REAL NOT NULL,
      unit_id INTEGER,
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
      timer_seconds INTEGER
    );
  `);
  return db;
}

const mockRecipeId = '123e4567-e89b-12d3-a456-426614174000';
const mockIngId = '00000000-0000-0000-0000-000000000001';

Deno.test('RecipeService - create & findById - success', async () => {
  const db = createTestDB();
  setDB(db);

  const recipe = await recipeService.create({
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
  });

  assertEquals(recipe.name, 'Pancakes');
  assertEquals(recipe.ingredients?.length, 1);
  assertEquals(recipe.steps?.length, 2);

  const found = await recipeService.findById(recipe.id);
  assert(found !== null);
  assertEquals(found?.name, 'Pancakes');
  assertEquals(found?.steps?.[0].instructionText, 'Mix dry ingredients');

  db.close();
});

Deno.test('RecipeService - update - success', async () => {
  const db = createTestDB();
  setDB(db);

  const recipe = await recipeService.create({
    name: 'Old Recipe',
  });

  const updated = await recipeService.update(recipe.id, {
    name: 'Updated Recipe',
    description: 'New Description',
  });

  assert(updated !== null);
  assertEquals(updated?.name, 'Updated Recipe');
  assertEquals(updated?.description, 'New Description');

  db.close();
});

Deno.test('RecipeService - delete - success', async () => {
  const db = createTestDB();
  setDB(db);

  const recipe = await recipeService.create({ name: 'To Delete' });
  const result = await recipeService.delete(recipe.id);

  assertEquals(result, true);
  const found = await recipeService.findById(recipe.id);
  assertEquals(found, null);

  db.close();
});

Deno.test('RecipeService - getAvailableRecipes - calculates makeable recipes', async () => {
  const db = createTestDB();
  setDB(db);

  // Units: 1 = gram (factor 1), 2 = kilogram (factor 1000)
  db.prepare('INSERT INTO units (id, name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?, ?)').run(1, 'gram', 'g', 'weight', 1);
  db.prepare('INSERT INTO units (id, name, short_name, type, to_base_factor) VALUES (?, ?, ?, ?, ?)').run(2, 'kilogram', 'kg', 'weight', 1000);

  // Pantry has 1 kg of Flour (1000g)
  const flourId = 'flour-uuid-1';
  db.prepare('INSERT INTO items (id, ingredient_id, label, quantity, unit_id, location_id, expiration_date, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    'item-1', flourId, 'Flour Bag', 1, 2, 1, '2030-01-01', '2026-01-01',
  );

  // Recipe 1 needs 500g Flour (Available: 1000g >= 500g -> TRUE)
  const r1 = await recipeService.create({
    name: 'Bread',
    ingredients: [{ ingredientId: flourId, quantity: 500, unitId: 1 }],
  });

  // Recipe 2 needs 2000g Flour (Available: 1000g < 2000g -> FALSE)
  await recipeService.create({
    name: 'Huge Cake',
    ingredients: [{ ingredientId: flourId, quantity: 2000, unitId: 1 }],
  });

  const available = await recipeService.getAvailableRecipes();
  assertEquals(available.length, 1);
  assertEquals(available[0].name, 'Bread');

  db.close();
});
