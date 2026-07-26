-- Migration 0005: Rename Nutrient Groups to Ingredient Categories
-- nutrient_groups -> ingredient_categories
-- ingredient_groups.nutrient_group_id -> ingredient_groups.ingredient_category_id

-- 1. Drop old index
DROP INDEX IF EXISTS idx_ingredient_groups_nutrient_group_id;

-- 2. Rename table
ALTER TABLE nutrient_groups RENAME TO ingredient_categories;

-- 3. Rename column in ingredient_groups
ALTER TABLE ingredient_groups RENAME COLUMN nutrient_group_id TO ingredient_category_id;

-- 4. Create new index
CREATE INDEX IF NOT EXISTS idx_ingredient_groups_ingredient_category_id ON ingredient_groups(ingredient_category_id);
