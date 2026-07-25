import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { CategoryRow } from '../src/models/schema-models/category.model.ts';
import { categoryService } from '../src/services/category.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);
  return db;
}

function seedMockCategory(db: Database): CategoryRow {
  db.prepare('INSERT INTO categories (name) VALUES (?)').run('Test Category');
  const row = db.prepare('SELECT * FROM categories WHERE name = ?').get('Test Category') as CategoryRow;
  return row;
}

Deno.test('CategoryService - getAllCategories - success', async () => {
  const db = createTestDB();
  setDB(db);
  seedMockCategory(db);

  const categories = await categoryService.getAllCategories();
  assertEquals(categories.length, 1);
  assertEquals(categories[0].name, 'Test Category');
  db.close();
});

Deno.test('CategoryService - getAllCategories - empty', async () => {
  const db = createTestDB();
  setDB(db);

  const categories = await categoryService.getAllCategories();
  assertEquals(categories.length, 0);
  db.close();
});

Deno.test('CategoryService - getCategoryById - success', async () => {
  const db = createTestDB();
  setDB(db);
  const mockRow = seedMockCategory(db);

  const category = await categoryService.getCategoryById(mockRow.id);
  assert(category !== null);
  assertEquals(category?.id, mockRow.id);
  assertEquals(category?.name, mockRow.name);
  db.close();
});

Deno.test('CategoryService - getCategoryById - not found', async () => {
  const db = createTestDB();
  setDB(db);

  const category = await categoryService.getCategoryById(999);
  assertEquals(category, null);
  db.close();
});
