import { assert, assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { nutrientTypeService } from '../src/services/nutrient-type.service.ts';

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
  `);
  return db;
}

Deno.test('NutrientTypeService - getAllNutrientTypes - success', async () => {
  const db = createTestDB();
  setDB(db);
  db.prepare('INSERT INTO nutrient_groups (name, icon, color) VALUES (?, ?, ?)').run(
    'Protein',
    '🥩',
    '#ef4444',
  );

  const types = await nutrientTypeService.getAllNutrientTypes();
  assertEquals(types.length, 1);
  assertEquals(types[0].name, 'Protein');
  assertEquals(types[0].icon, '🥩');
  db.close();
});

Deno.test('NutrientTypeService - getNutrientTypeById - success', async () => {
  const db = createTestDB();
  setDB(db);
  db.prepare(
    'INSERT INTO nutrient_groups (name, icon, color, description) VALUES (?, ?, ?, ?)',
  ).run(
    'Carbohydrate',
    '🌾',
    '#f59e0b',
    'Primary energy sources including whole grains and starches.',
  );

  const type = await nutrientTypeService.getNutrientTypeById(1);
  assert(type !== null);
  assertEquals(type?.name, 'Carbohydrate');
  assertEquals(type?.description, 'Primary energy sources including whole grains and starches.');
  db.close();
});
