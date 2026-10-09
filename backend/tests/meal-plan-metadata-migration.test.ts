import { assertEquals, assertThrows } from '@std/assert';
import { Database } from '@db/sqlite';

Deno.test('Meal plan metadata migration preserves records, indexes, and foreign keys', () => {
  const db = new Database(':memory:');
  try {
    db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE kitchens (id TEXT PRIMARY KEY);
      CREATE TABLE users (id TEXT PRIMARY KEY);
      CREATE TABLE recipes (id TEXT PRIMARY KEY);
      CREATE TABLE meal_plans (
        id TEXT PRIMARY KEY, day TEXT NOT NULL, meal_type TEXT NOT NULL,
        recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
        recipe_name TEXT NOT NULL,
        prep_time_minutes INTEGER NOT NULL DEFAULT 15,
        calories INTEGER NOT NULL DEFAULT 400, servings INTEGER NOT NULL DEFAULT 2,
        cooked INTEGER NOT NULL DEFAULT 0, missing_ingredients TEXT, tags TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX idx_meal_plans_day ON meal_plans(day);
      CREATE INDEX idx_meal_plans_recipe_id ON meal_plans(recipe_id);
      CREATE INDEX idx_meal_plans_kitchen_id ON meal_plans(kitchen_id);
      INSERT INTO kitchens VALUES ('kitchen');
      INSERT INTO users VALUES ('user');
      INSERT INTO recipes VALUES ('recipe');
      INSERT INTO meal_plans VALUES (
        'historical', 'Monday', 'Dinner', 'recipe', 'Historical recipe',
        15, 400, 2, 1, '["Salt"]', '["Quick"]', '2026-01-01',
        'kitchen', 'user', 'user'
      );
    `);
    const historical = db.prepare('SELECT * FROM meal_plans').get();
    const insertUnknown = db.prepare(`
      INSERT INTO meal_plans (id, day, meal_type, recipe_name, kitchen_id,
        prep_time_minutes, calories, servings)
      VALUES (?, 'Monday', 'Dinner', 'Unknown recipe', ?, NULL, NULL, NULL)
    `);
    assertThrows(() => insertUnknown.run('unknown', 'kitchen'));

    db.exec('BEGIN');
    db.exec(Deno.readTextFileSync('migrations/0018_allow_unknown_meal_plan_metadata.sql'));
    db.exec('COMMIT');
    assertEquals(db.prepare('SELECT * FROM meal_plans WHERE id = ?').get('historical'), historical);
    db.prepare(`
      INSERT INTO meal_plans (id, day, meal_type, recipe_name, kitchen_id)
      VALUES ('unknown', 'Tuesday', 'Lunch', 'Unknown recipe', 'kitchen')
    `).run();
    assertEquals(
      db.prepare(`
      SELECT prep_time_minutes, calories, servings FROM meal_plans WHERE id = 'unknown'
    `).get(),
      { prep_time_minutes: null, calories: null, servings: null },
    );
    assertEquals(
      db.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_meal_plans_%' ORDER BY name",
      ).all(),
      [
        { name: 'idx_meal_plans_day' },
        { name: 'idx_meal_plans_kitchen_id' },
        { name: 'idx_meal_plans_recipe_id' },
      ],
    );
    assertEquals(db.prepare('PRAGMA foreign_key_check').all(), []);
    assertThrows(() =>
      db.prepare(`
      INSERT INTO meal_plans (id, day, meal_type, recipe_name, kitchen_id)
      VALUES ('invalid', 'Tuesday', 'Lunch', 'Invalid kitchen', 'missing')
    `).run()
    );
    db.prepare('DELETE FROM recipes WHERE id = ?').run('recipe');
    assertEquals(db.prepare("SELECT recipe_id FROM meal_plans WHERE id = 'historical'").get(), {
      recipe_id: null,
    });
    db.prepare('DELETE FROM users WHERE id = ?').run('user');
    assertEquals(
      db.prepare("SELECT created_by, updated_by FROM meal_plans WHERE id = 'historical'").get(),
      { created_by: null, updated_by: null },
    );
    db.prepare('DELETE FROM kitchens WHERE id = ?').run('kitchen');
    assertEquals(db.prepare('SELECT * FROM meal_plans').all(), []);
  } finally {
    db.close();
  }
});
