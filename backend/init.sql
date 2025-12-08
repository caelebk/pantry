-- Initial database schema for Pantry app

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    expiration_date TIMESTAMP,
    purchase_date TIMESTAMP,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prep_time INTEGER,
    cook_time INTEGER,
    servings INTEGER,
    instructions JSONB NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipe ingredients table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_expiration_date ON items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_item_id ON recipe_ingredients(item_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO items (name, category, quantity, unit, expiration_date, location) VALUES
    ('Milk', 'Dairy', 1, 'gallon', CURRENT_TIMESTAMP + INTERVAL '5 days', 'Refrigerator'),
    ('Eggs', 'Dairy', 12, 'count', CURRENT_TIMESTAMP + INTERVAL '14 days', 'Refrigerator'),
    ('Chicken Breast', 'Meat', 2, 'lbs', CURRENT_TIMESTAMP + INTERVAL '3 days', 'Freezer'),
    ('Rice', 'Grains', 5, 'lbs', CURRENT_TIMESTAMP + INTERVAL '365 days', 'Pantry'),
    ('Tomato Sauce', 'Canned Goods', 3, 'cans', CURRENT_TIMESTAMP + INTERVAL '180 days', 'Pantry');

INSERT INTO recipes (name, description, prep_time, cook_time, servings, instructions, tags) VALUES
    ('Scrambled Eggs', 'Simple and delicious scrambled eggs', 5, 5, 2, 
     '["Crack eggs into bowl", "Whisk eggs with salt and pepper", "Heat pan over medium heat", "Pour eggs and stir until cooked"]'::jsonb,
     ARRAY['breakfast', 'quick', 'easy']),
    ('Grilled Chicken', 'Juicy grilled chicken breast', 10, 15, 4,
     '["Season chicken with salt and pepper", "Preheat grill to medium-high", "Grill chicken 6-7 minutes per side", "Let rest before serving"]'::jsonb,
     ARRAY['dinner', 'protein', 'healthy']);
