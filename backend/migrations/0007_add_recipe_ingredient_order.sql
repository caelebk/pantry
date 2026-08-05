-- Add ingredient_order column to recipe_ingredients to preserve ingredient sequence
ALTER TABLE recipe_ingredients ADD COLUMN ingredient_order INTEGER NOT NULL DEFAULT 0;
