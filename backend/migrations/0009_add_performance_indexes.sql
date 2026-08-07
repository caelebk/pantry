-- Migration 0009: Add performance indexes for foreign keys and query filters
CREATE INDEX IF NOT EXISTS idx_ingredient_items_ingredient_id ON ingredient_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_items_expiration ON ingredient_items(expiration_date);
CREATE INDEX IF NOT EXISTS idx_ingredient_items_location ON ingredient_items(location_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_checked ON shopping_list_items(checked);
