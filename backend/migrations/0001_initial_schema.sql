-- Initial database schema for Pantry app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Location Table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Category Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS difficulties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Unit Table
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL, -- volume vs weight
    to_base_factor FLOAT NOT NULL
);

-- Ingredient Table
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE RESTRICT,
    default_unit_id INTEGER REFERENCES units(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Item Table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
    label VARCHAR(255) NOT NULL,
    quantity FLOAT NOT NULL,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    expiration_date TIMESTAMP NOT NULL,
    opened_date TIMESTAMP,
    purchase_date TIMESTAMP NOT NULL,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recipe Table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty INTEGER REFERENCES difficulties(id) ON DELETE RESTRICT,
    servings FLOAT,
    prep_time FLOAT,
    cook_time FLOAT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recipe Ingredient Table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity FLOAT NOT NULL,
    unit_id INTEGER REFERENCES units(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE OR REPLACE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recipe Step Table
CREATE TABLE IF NOT EXISTS recipe_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty_id ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_unit_id ON recipe_ingredients(unit_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_step_number ON recipe_steps(step_number);
-- Seed Data

-- Locations
INSERT INTO locations (name) VALUES
    ('Pantry'),
    ('Fridge'),
    ('Freezer'),
    ('Shelf');

-- Categories
INSERT INTO categories (name) VALUES
    ('Produce'),
    ('Meat & Seafood'),
    ('Dairy & Eggs'),
    ('Bakery & Grains'),
    ('Pantry Staples'),
    ('Canned Goods'),
    ('Oils & Condiments'),
    ('Spices & Seasonings'),
    ('Snacks'),
    ('Frozen Foods'),
    ('Beverages'),
    ('Breakfast'),
    ('Ready-to-Eat'),
    ('Baking');

-- Units
INSERT INTO units (name, type, to_base_factor) VALUES
    ('piece', 'count', 1),
    ('g', 'weight', 1),
    ('kg', 'weight', 1000),
    ('oz', 'weight', 28.3495),
    ('lb', 'weight', 453.592),
    ('ml', 'volume', 1),
    ('l', 'volume', 1000),
    ('cup', 'volume', 236.588),
    ('tbsp', 'volume', 14.7868),
    ('tsp', 'volume', 4.92892),
    ('clove', 'count', 1),
    ('pinch', 'count', 1),
    ('can', 'count', 1);

-- Difficulties
INSERT INTO difficulties (name) VALUES
    ('Easy'),
    ('Medium'),
    ('Hard');