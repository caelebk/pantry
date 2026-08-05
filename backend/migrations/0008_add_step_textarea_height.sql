-- Add textarea_height column to recipe_steps table
ALTER TABLE recipe_steps ADD COLUMN textarea_height INTEGER DEFAULT NULL;
