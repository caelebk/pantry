-- Migration: Add missing performance indexes for high-frequency queries
-- Description: Indexes for meal plan dates/recipes, ingredient search, shopping list categories, and pantry availability lookups.

-- Index for meal plan day and recipe FK queries
CREATE INDEX IF NOT EXISTS idx_meal_plans_day ON meal_plans(day);
CREATE INDEX IF NOT EXISTS idx_meal_plans_recipe_id ON meal_plans(recipe_id);

-- Index for ingredient name searching & auto-completion
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

-- Index for shopping list category grouping
CREATE INDEX IF NOT EXISTS idx_shopping_list_category ON shopping_list_items(category);

-- Compound index for non-expired pantry availability calculation
CREATE INDEX IF NOT EXISTS idx_ingredient_items_avail ON ingredient_items(ingredient_id, expiration_date);

-- Compound index for recipe ingredients ordering
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_order ON recipe_ingredients(recipe_id, ingredient_order);
