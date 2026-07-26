import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { ingredientCategoryService } from '../src/services/ingredient-category.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE ingredient_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT,
      description TEXT
    );
  `);
  return db;
}

Deno.test('IngredientCategoryService - getAllIngredientCategories - success', async () => {
  const db = createTestDB();
  setDB(db);

  db.prepare('INSERT INTO ingredient_categories (name, icon, color) VALUES (?, ?, ?)').run(
    'Protein',
    '🍖',
    '#ef4444',
  );

  const categories = await ingredientCategoryService.getAllIngredientCategories();
  assertEquals(categories.length, 1);
  assertEquals(categories[0].name, 'Protein');
  assertEquals(categories[0].icon, '🍖');
  db.close();
});

Deno.test('IngredientCategoryService - getIngredientCategoryById - success', async () => {
  const db = createTestDB();
  setDB(db);

  db.prepare(
    'INSERT INTO ingredient_categories (name, icon, color, description) VALUES (?, ?, ?, ?)',
  ).run('Carbs', '🌾', '#f59e0b', 'Carbohydrates & Grains');

  const category = await ingredientCategoryService.getIngredientCategoryById(1);
  assert(category !== null);
  assertEquals(category?.name, 'Carbs');
  assertEquals(category?.description, 'Carbohydrates & Grains');
  db.close();
});
