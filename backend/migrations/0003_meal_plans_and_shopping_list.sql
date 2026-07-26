-- Migration: Add Meal Plans and Shopping List Items tables

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
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  checked INTEGER NOT NULL DEFAULT 0,
  estimated_price REAL DEFAULT 0,
  store_name TEXT DEFAULT '',
  source TEXT DEFAULT 'manual',
  recipe_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
