-- Migration 0004: Redesign Ingredient Hierarchy & Terminology Alignment
-- Nutrient Types -> Nutrient Groups
-- Categories -> Ingredient Groups
-- Items -> Ingredient Items

-- 1. Drop existing indexes and triggers associated with old table/column names
DROP INDEX IF EXISTS idx_categories_nutrient_type_id;
DROP INDEX IF EXISTS idx_ingredients_category_id;
DROP INDEX IF EXISTS idx_items_ingredient_id;
DROP INDEX IF EXISTS idx_items_location_id;
DROP INDEX IF EXISTS idx_items_unit_id;
DROP TRIGGER IF EXISTS update_items_updated_at;

-- 2. Rename tables
ALTER TABLE nutrient_types RENAME TO nutrient_groups;
ALTER TABLE categories RENAME TO ingredient_groups;
ALTER TABLE items RENAME TO ingredient_items;

-- 3. Rename columns
ALTER TABLE ingredient_groups RENAME COLUMN nutrient_type_id TO nutrient_group_id;
ALTER TABLE ingredients RENAME COLUMN category_id TO ingredient_group_id;

-- 4. Create updated indexes
CREATE INDEX IF NOT EXISTS idx_ingredient_groups_nutrient_group_id ON ingredient_groups(nutrient_group_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_ingredient_group_id ON ingredients(ingredient_group_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_items_ingredient_id ON ingredient_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_items_location_id ON ingredient_items(location_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_items_unit_id ON ingredient_items(unit_id);

-- 5. Create updated trigger for ingredient_items
CREATE TRIGGER IF NOT EXISTS update_ingredient_items_updated_at
    AFTER UPDATE ON ingredient_items
    FOR EACH ROW
BEGIN
    UPDATE ingredient_items SET updated_at = datetime('now') WHERE id = OLD.id;
END;
