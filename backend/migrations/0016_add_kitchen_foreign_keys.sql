-- 0016: Enforce tenant integrity — foreign keys on kitchen_id
--
-- Migrations 0011/0012 added `kitchen_id` columns without REFERENCES clauses,
-- leaving orphaned-tenant rows possible. SQLite cannot ALTER TABLE ADD
-- CONSTRAINT, so the affected tables are rebuilt (same technique as 0006).
--
-- Safety notes:
--   * The migration runner wraps this file in a transaction, and SQLite ignores
--     `PRAGMA foreign_keys` inside a transaction — so FK enforcement remains ON
--     throughout. Statement ordering below guarantees every intermediate state
--     is FK-valid.
--   * `recipes` is referenced by recipe_ingredients / recipe_steps / meal_plans
--     with ON DELETE CASCADE. Dropping it directly would cascade-delete child
--     rows. Therefore recipes is rebuilt under a temp name first, children are
--     repointed at the temp table, and only then is the old table dropped; the
--     final RENAME rewrites child references automatically.
--   * Pre-auth rows still on the magic default kitchen ('ktc_00000000-…') are
--     reassigned to their creator's primary kitchen before any copy. Rows whose
--     creator has no primary kitchen remain on the default kitchen, which is a
--     real row in kitchens(), so they stay FK-valid.

-- ============================================================
-- 0. Data fix: reassign legacy default-kitchen rows
-- ============================================================

UPDATE recipes
SET kitchen_id = (
  SELECT u.primary_kitchen_id FROM users u WHERE u.id = recipes.created_by
)
WHERE kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000'
  AND created_by IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = recipes.created_by AND u.primary_kitchen_id IS NOT NULL
  );

UPDATE ingredient_items
SET kitchen_id = (
  SELECT u.primary_kitchen_id FROM users u WHERE u.id = ingredient_items.created_by
)
WHERE kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000'
  AND created_by IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = ingredient_items.created_by AND u.primary_kitchen_id IS NOT NULL
  );

UPDATE shopping_list_items
SET kitchen_id = (
  SELECT u.primary_kitchen_id FROM users u WHERE u.id = shopping_list_items.created_by
)
WHERE kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000'
  AND created_by IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = shopping_list_items.created_by AND u.primary_kitchen_id IS NOT NULL
  );

UPDATE meal_plans
SET kitchen_id = (
  SELECT u.primary_kitchen_id FROM users u WHERE u.id = meal_plans.created_by
)
WHERE kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000'
  AND created_by IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = meal_plans.created_by AND u.primary_kitchen_id IS NOT NULL
  );

-- ============================================================
-- 1. Rebuild recipes under temp name
-- ============================================================

CREATE TABLE recipes_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    description TEXT,
    difficulty_id INTEGER REFERENCES difficulties(id) ON DELETE RESTRICT,
    servings REAL,
    prep_time REAL,
    cook_time REAL,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO recipes_new (
  id, name, description, difficulty_id, servings, prep_time, cook_time,
  image_url, created_at, updated_at, kitchen_id, created_by, updated_by
)
SELECT
  id, name, description, difficulty_id, servings, prep_time, cook_time,
  image_url, created_at, updated_at, kitchen_id, created_by, updated_by
FROM recipes;

-- ============================================================
-- 2. Repoint recipe_ingredients at recipes_new
-- ============================================================

CREATE TABLE recipe_ingredients_new (
    recipe_id TEXT REFERENCES recipes_new(id) ON DELETE CASCADE,
    ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity REAL NOT NULL,
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    ingredient_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (recipe_id, ingredient_id)
);

INSERT INTO recipe_ingredients_new (
  recipe_id, ingredient_id, quantity, unit_id, created_at, updated_at, ingredient_order
)
SELECT
  recipe_id, ingredient_id, quantity, unit_id, created_at, updated_at, ingredient_order
FROM recipe_ingredients;

DROP TABLE recipe_ingredients;
ALTER TABLE recipe_ingredients_new RENAME TO recipe_ingredients;

CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_recipe_ingredients_unit_id ON recipe_ingredients(unit_id);
CREATE INDEX idx_recipe_ingredients_order ON recipe_ingredients(ingredient_order);

CREATE TRIGGER update_recipe_ingredients_updated_at
    AFTER UPDATE ON recipe_ingredients
    FOR EACH ROW
BEGIN
    UPDATE recipe_ingredients SET updated_at = datetime('now')
    WHERE recipe_id = OLD.recipe_id AND ingredient_id = OLD.ingredient_id;
END;

-- ============================================================
-- 3. Repoint recipe_steps at recipes_new
-- ============================================================

CREATE TABLE recipe_steps_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    recipe_id TEXT REFERENCES recipes_new(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction_text TEXT NOT NULL,
    image_url TEXT,
    timer_seconds INTEGER,
    textarea_height INTEGER DEFAULT NULL
);

INSERT INTO recipe_steps_new (
  id, recipe_id, step_number, instruction_text, image_url, timer_seconds, textarea_height
)
SELECT
  id, recipe_id, step_number, instruction_text, image_url, timer_seconds, textarea_height
FROM recipe_steps;

DROP TABLE recipe_steps;
ALTER TABLE recipe_steps_new RENAME TO recipe_steps;

CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX idx_recipe_steps_step_number ON recipe_steps(step_number);

-- ============================================================
-- 4. Repoint meal_plans at recipes_new
-- ============================================================

CREATE TABLE meal_plans_new (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id TEXT REFERENCES recipes_new(id) ON DELETE SET NULL,
  recipe_name TEXT NOT NULL,
  prep_time_minutes INTEGER NOT NULL DEFAULT 15,
  calories INTEGER NOT NULL DEFAULT 400,
  servings INTEGER NOT NULL DEFAULT 2,
  cooked INTEGER NOT NULL DEFAULT 0,
  missing_ingredients TEXT,
  tags TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO meal_plans_new (
  id, day, meal_type, recipe_id, recipe_name, prep_time_minutes, calories,
  servings, cooked, missing_ingredients, tags, created_at,
  kitchen_id, created_by, updated_by
)
SELECT
  id, day, meal_type, recipe_id, recipe_name, prep_time_minutes, calories,
  servings, cooked, missing_ingredients, tags, created_at,
  kitchen_id, created_by, updated_by
FROM meal_plans;

DROP TABLE meal_plans;
ALTER TABLE meal_plans_new RENAME TO meal_plans;

CREATE INDEX idx_meal_plans_day ON meal_plans(day);
CREATE INDEX idx_meal_plans_recipe_id ON meal_plans(recipe_id);
CREATE INDEX idx_meal_plans_kitchen_id ON meal_plans(kitchen_id);

-- ============================================================
-- 5. Nothing references old `recipes` anymore — swap it out
-- ============================================================

DROP TABLE recipes;
ALTER TABLE recipes_new RENAME TO recipes;

CREATE INDEX idx_recipes_difficulty_id ON recipes(difficulty_id);
CREATE INDEX idx_recipes_kitchen_id ON recipes(kitchen_id);

CREATE TRIGGER update_recipes_updated_at
    AFTER UPDATE ON recipes
    FOR EACH ROW
BEGIN
    UPDATE recipes SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- ============================================================
-- 6. Rebuild ingredient_items (independent subtree)
-- ============================================================

CREATE TABLE ingredient_items_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    ingredient_id TEXT REFERENCES ingredients(id) ON DELETE SET NULL,
    label TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    expiration_date TEXT,
    opened_date TEXT,
    purchase_date TEXT NOT NULL,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    updated_by TEXT REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO ingredient_items_new (
  id, ingredient_id, label, quantity, unit_id, expiration_date, opened_date,
  purchase_date, location_id, notes, created_at, updated_at,
  kitchen_id, created_by, updated_by
)
SELECT
  id, ingredient_id, label, quantity, unit_id, expiration_date, opened_date,
  purchase_date, location_id, notes, created_at, updated_at,
  kitchen_id, created_by, updated_by
FROM ingredient_items;

DROP TABLE ingredient_items;
ALTER TABLE ingredient_items_new RENAME TO ingredient_items;

CREATE INDEX idx_ingredient_items_ingredient_id ON ingredient_items(ingredient_id);
CREATE INDEX idx_ingredient_items_location_id ON ingredient_items(location_id);
CREATE INDEX idx_ingredient_items_unit_id ON ingredient_items(unit_id);
CREATE INDEX idx_ingredient_items_expiration ON ingredient_items(expiration_date);
CREATE INDEX idx_ingredient_items_avail ON ingredient_items(ingredient_id, expiration_date);
CREATE INDEX idx_ingredient_items_kitchen_avail ON ingredient_items(kitchen_id, ingredient_id, expiration_date);

CREATE TRIGGER update_ingredient_items_updated_at
    AFTER UPDATE ON ingredient_items
    FOR EACH ROW
BEGIN
    UPDATE ingredient_items SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- ============================================================
-- 7. Rebuild shopping_list_items (independent subtree)
-- ============================================================

CREATE TABLE shopping_list_items_new (
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
  created_at TEXT DEFAULT (datetime('now')),
  kitchen_id TEXT NOT NULL REFERENCES kitchens(id) ON DELETE CASCADE,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ingredient_id TEXT REFERENCES ingredients(id) ON DELETE SET NULL,
  store_id TEXT REFERENCES stores(id) ON DELETE SET NULL,
  updated_at TEXT
);

INSERT INTO shopping_list_items_new (
  id, name, category, quantity, unit, checked, estimated_price, store_name,
  source, recipe_name, created_at, kitchen_id, created_by, updated_by,
  ingredient_id, store_id, updated_at
)
SELECT
  id, name, category, quantity, unit, checked, estimated_price, store_name,
  source, recipe_name, created_at, kitchen_id, created_by, updated_by,
  ingredient_id, store_id, updated_at
FROM shopping_list_items;

DROP TABLE shopping_list_items;
ALTER TABLE shopping_list_items_new RENAME TO shopping_list_items;

CREATE INDEX idx_shopping_list_checked ON shopping_list_items(checked);
CREATE INDEX idx_shopping_list_category ON shopping_list_items(category);
CREATE INDEX idx_shopping_list_items_kitchen_id ON shopping_list_items(kitchen_id);
CREATE INDEX idx_shopping_list_ingredient ON shopping_list_items(kitchen_id, ingredient_id);
CREATE UNIQUE INDEX idx_shopping_list_one_active_ingredient
  ON shopping_list_items(kitchen_id, ingredient_id)
  WHERE ingredient_id IS NOT NULL;

CREATE TRIGGER update_shopping_list_items_updated_at
    AFTER UPDATE ON shopping_list_items
    FOR EACH ROW
BEGIN
    UPDATE shopping_list_items SET updated_at = datetime('now') WHERE id = OLD.id;
END;
