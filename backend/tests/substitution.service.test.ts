import { assertEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { setDB } from '../src/db/client.ts';
import { substitutionService } from '../src/services/substitution.service.ts';

function createTestDB(): Database {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE nutrient_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE ingredient_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      nutrient_group_id INTEGER REFERENCES nutrient_groups(id)
    );
    CREATE TABLE units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      to_base_factor REAL NOT NULL
    );
    CREATE TABLE ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ingredient_group_id INTEGER REFERENCES ingredient_groups(id),
      default_unit_id INTEGER REFERENCES units(id)
    );
    CREATE TABLE ingredient_items (
      id TEXT PRIMARY KEY,
      ingredient_id TEXT REFERENCES ingredients(id),
      quantity REAL NOT NULL,
      unit_id INTEGER REFERENCES units(id),
      expiration_date TEXT
    );
  `);
  return db;
}

Deno.test('SubstitutionService - getSubstitutions - ranks same category higher than same nutrient type', async () => {
  const db = createTestDB();
  setDB(db);

  // Nutrient groups
  db.exec("INSERT INTO nutrient_groups (id, name) VALUES (1, 'Protein');");
  // Ingredient groups
  db.exec(
    "INSERT INTO ingredient_groups (id, name, nutrient_group_id) VALUES (1, 'Dairy & Eggs', 1), (2, 'Meat & Seafood', 1);",
  );
  // Units
  db.exec("INSERT INTO units (id, name, to_base_factor) VALUES (1, 'gram', 1.0);");
  // Ingredients
  db.exec(
    "INSERT INTO ingredients (id, name, ingredient_group_id, default_unit_id) VALUES ('ing1', 'Cheddar Cheese', 1, 1), ('ing2', 'Parmesan Cheese', 1, 1), ('ing3', 'Chicken Breast', 2, 1);",
  );
  // Stock items
  db.exec(
    "INSERT INTO ingredient_items (id, ingredient_id, quantity, unit_id, expiration_date) VALUES ('item1', 'ing2', 200, 1, '2099-01-01'), ('item2', 'ing3', 500, 1, '2099-01-01');",
  );

  const substitutions = await substitutionService.getSubstitutions('ing1');
  assertEquals(substitutions.length, 2);
  // Parmesan Cheese should be first (same_category)
  assertEquals(substitutions[0].ingredient.name, 'Parmesan Cheese');
  assertEquals(substitutions[0].matchLevel, 'same_category');
  // Chicken Breast should be second (same_nutrient_type)
  assertEquals(substitutions[1].ingredient.name, 'Chicken Breast');
  assertEquals(substitutions[1].matchLevel, 'same_nutrient_type');

  db.close();
});
