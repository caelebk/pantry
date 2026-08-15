import { assertEquals, assertNotEquals } from '@std/assert';
import { Database } from '@db/sqlite';
import { seedBareNecessities, seedDatabase } from '../scripts/seed_db.ts';

function createFullSchema(db: Database) {
  // Apply all schema definitions corresponding to migrations 0001-0013
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ingredient_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      email_normalized TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending_verification')),
      global_role TEXT NOT NULL DEFAULT 'user' CHECK (global_role IN ('user', 'admin')),
      primary_kitchen_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      avatar_url TEXT,
      theme_preference TEXT NOT NULL DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
      locale TEXT NOT NULL DEFAULT 'en',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('password', 'google_oauth', 'passkey')),
      identifier TEXT NOT NULL,
      secret_hash TEXT NOT NULL,
      last_used_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, type),
      UNIQUE(type, identifier)
    );

    CREATE TABLE IF NOT EXISTS kitchens (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kitchen_memberships (
      id TEXT PRIMARY KEY,
      kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited')),
      joined_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(kitchen_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token_hash TEXT NOT NULL UNIQUE,
      user_agent TEXT,
      ip_address TEXT,
      expires_at TEXT NOT NULL,
      revoked_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS auth_rate_limits (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 1,
      first_attempt_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      locked_until TEXT
    );

    CREATE TABLE IF NOT EXISTS ingredient_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ingredient_category_id INTEGER REFERENCES ingredient_categories(id),
      created_at TEXT DEFAULT (datetime('now')),
      kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      type TEXT NOT NULL,
      to_base_factor REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS difficulties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ingredient_group_id INTEGER REFERENCES ingredient_groups(id),
      default_unit_id INTEGER REFERENCES units(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ingredient_items (
      id TEXT PRIMARY KEY,
      ingredient_id TEXT REFERENCES ingredients(id) ON DELETE SET NULL,
      label TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_id INTEGER NOT NULL REFERENCES units(id),
      expiration_date TEXT,
      opened_date TEXT,
      purchase_date TEXT NOT NULL,
      location_id INTEGER NOT NULL REFERENCES locations(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      difficulty_id INTEGER REFERENCES difficulties(id),
      servings REAL,
      prep_time REAL,
      cook_time REAL,
      image_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
      ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
      quantity REAL NOT NULL,
      unit_id INTEGER REFERENCES units(id),
      ingredient_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (recipe_id, ingredient_id)
    );

    CREATE TABLE IF NOT EXISTS recipe_steps (
      id TEXT PRIMARY KEY,
      recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
      step_number INTEGER NOT NULL,
      instruction_text TEXT NOT NULL,
      image_url TEXT,
      timer_seconds INTEGER,
      textarea_height INTEGER DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      day TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id TEXT REFERENCES recipes(id) ON DELETE SET NULL,
      recipe_name TEXT NOT NULL,
      prep_time_minutes INTEGER NOT NULL DEFAULT 15,
      calories INTEGER NOT NULL DEFAULT 400,
      servings INTEGER NOT NULL DEFAULT 2,
      cooked INTEGER NOT NULL DEFAULT 0,
      missing_ingredients TEXT,
      tags TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS stores (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_normalized TEXT NOT NULL,
      kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(kitchen_id, name_normalized)
    );

    CREATE TABLE IF NOT EXISTS shopping_list_items (
      id TEXT PRIMARY KEY,
      ingredient_id TEXT REFERENCES ingredients(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      quantity REAL NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT 'pcs',
      checked INTEGER NOT NULL DEFAULT 0,
      estimated_price REAL DEFAULT 0,
      store_name TEXT DEFAULT '',
      store_id TEXT REFERENCES stores(id) ON DELETE SET NULL,
      source TEXT DEFAULT 'manual',
      recipe_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );
  `);
}

Deno.test('Seed - seedBareNecessities populates taxonomy and default kitchen', () => {
  const db = new Database(':memory:');
  createFullSchema(db);

  const res = seedBareNecessities(db);

  assertEquals(res.locationIds.size, 3);
  assertEquals(res.ingredientCategoryIds.size, 9);
  assertEquals(res.categoryIds.size, 33);

  const dairy = db.prepare('SELECT * FROM ingredient_categories WHERE name = ?').get('Dairy') as {
    id: number;
  };
  assertNotEquals(dairy, undefined);
  const dairyGroups = db.prepare(
    'SELECT name FROM ingredient_groups WHERE ingredient_category_id = ? ORDER BY name',
  ).all(dairy.id) as Array<{ name: string }>;
  assertEquals(dairyGroups.map((group) => group.name), [
    'Butter',
    'Cheese',
    'Milk & Cream',
    'Yogurt & Cultured Dairy',
  ]);
  assertEquals(res.unitIds.size, 13);
  assertEquals(res.difficultyIds.size, 3);

  const kitchen = db.prepare(
    "SELECT * FROM kitchens WHERE id = 'ktc_00000000-0000-4000-8000-000000000000'",
  ).get() as { id: string; name: string };
  assertEquals(kitchen.name, 'Main Kitchen');

  db.close();
});

Deno.test('Seed - seedDatabase populates all new schemas with valid FKs and data', async () => {
  const db = new Database(':memory:');
  createFullSchema(db);

  await seedDatabase(db, { isProduction: false });

  // 1. Check demo user, profile, credentials, and membership
  const user = db.prepare("SELECT * FROM users WHERE email = 'chef@pantry.app'").get() as {
    id: string;
    global_role: string;
    primary_kitchen_id: string;
  };
  assertNotEquals(user, undefined);
  assertEquals(user.global_role, 'admin');
  assertEquals(user.primary_kitchen_id, 'ktc_00000000-0000-4000-8000-000000000000');

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id) as {
    full_name: string;
  };
  assertEquals(profile.full_name, 'Head Chef');

  const cred = db.prepare('SELECT * FROM credentials WHERE user_id = ?').get(user.id) as {
    type: string;
    identifier: string;
  };
  assertEquals(cred.type, 'password');
  assertEquals(cred.identifier, 'chef@pantry.app');

  const membership = db.prepare(
    'SELECT * FROM kitchen_memberships WHERE user_id = ? AND kitchen_id = ?',
  ).get(user.id, user.primary_kitchen_id) as { role: string };
  assertEquals(membership.role, 'owner');

  // 2. Check ingredients and items with kitchen scoping & audit
  const ingredientCount = (db.prepare('SELECT count(*) as c FROM ingredients').get() as {
    c: number;
  }).c;
  assertEquals(ingredientCount > 0, true);

  const itemCount = (db.prepare('SELECT count(*) as c FROM ingredient_items').get() as {
    c: number;
  }).c;
  assertEquals(itemCount > 0, true);

  // 3. Check recipes and recipe_ingredients ordering
  const recipeIngredient = db.prepare(
    'SELECT * FROM recipe_ingredients ORDER BY ingredient_order ASC LIMIT 1',
  ).get() as { ingredient_order: number };
  assertEquals(recipeIngredient.ingredient_order >= 1, true);

  // 4. Check meal plans have recipe_id linked
  const mealPlanWithRecipe = db.prepare(
    "SELECT * FROM meal_plans WHERE recipe_name = 'Classic Pancakes'",
  ).get() as { recipe_id: string | null };
  assertNotEquals(mealPlanWithRecipe.recipe_id, null);

  // 5. Check stores and shopping list items
  const storeCount = (db.prepare('SELECT count(*) as c FROM stores').get() as { c: number }).c;
  assertEquals(storeCount >= 4, true);

  const shoppingItemWithStore = db.prepare(
    "SELECT * FROM shopping_list_items WHERE store_name = 'Trader Joe''s' LIMIT 1",
  ).get() as { store_id: string | null; ingredient_id: string | null };
  assertNotEquals(shoppingItemWithStore.store_id, null);
  assertNotEquals(shoppingItemWithStore.ingredient_id, null);

  db.close();
});
