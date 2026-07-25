-- Initial database schema for Pantry app (SQLite)

-- Location Table
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

-- Category Table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS difficulties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

-- Unit Table
CREATE TABLE IF NOT EXISTS units (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    type TEXT NOT NULL,
    to_base_factor REAL NOT NULL
);

-- Ingredient Table
CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    default_unit_id INTEGER REFERENCES units(id) ON DELETE RESTRICT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Trigger for ingredients updated_at
CREATE TRIGGER IF NOT EXISTS update_ingredients_updated_at
    AFTER UPDATE ON ingredients
    FOR EACH ROW
BEGIN
    UPDATE ingredients SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Item Table
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    ingredient_id TEXT REFERENCES ingredients(id) ON DELETE SET NULL,
    label TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    expiration_date TEXT NOT NULL,
    opened_date TEXT,
    purchase_date TEXT NOT NULL,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Trigger for items updated_at
CREATE TRIGGER IF NOT EXISTS update_items_updated_at
    AFTER UPDATE ON items
    FOR EACH ROW
BEGIN
    UPDATE items SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Recipe Table
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    name TEXT NOT NULL,
    description TEXT,
    difficulty_id INTEGER REFERENCES difficulties(id) ON DELETE RESTRICT,
    servings REAL,
    prep_time REAL,
    cook_time REAL,
    image_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Trigger for recipes updated_at
CREATE TRIGGER IF NOT EXISTS update_recipes_updated_at
    AFTER UPDATE ON recipes
    FOR EACH ROW
BEGIN
    UPDATE recipes SET updated_at = datetime('now') WHERE id = OLD.id;
END;

-- Recipe Ingredient Table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id TEXT REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity REAL NOT NULL,
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- Trigger for recipe_ingredients updated_at
CREATE TRIGGER IF NOT EXISTS update_recipe_ingredients_updated_at
    AFTER UPDATE ON recipe_ingredients
    FOR EACH ROW
BEGIN
    UPDATE recipe_ingredients SET updated_at = datetime('now')
    WHERE recipe_id = OLD.recipe_id AND ingredient_id = OLD.ingredient_id;
END;

-- Recipe Step Table
CREATE TABLE IF NOT EXISTS recipe_steps (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    recipe_id TEXT REFERENCES recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction_text TEXT NOT NULL,
    image_url TEXT,
    timer_seconds INTEGER
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_ingredient_id ON items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_items_location_id ON items(location_id);
CREATE INDEX IF NOT EXISTS idx_items_unit_id ON items(unit_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category_id ON ingredients(category_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_default_unit_id ON ingredients(default_unit_id);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty_id ON recipes(difficulty_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_unit_id ON recipe_ingredients(unit_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_step_number ON recipe_steps(step_number);
