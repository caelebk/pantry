-- Migration 0012: Add Audit Columns and Primary Kitchen

PRAGMA foreign_keys = ON;

-- 1. Add primary_kitchen_id to users table (GAP-12)
ALTER TABLE users ADD COLUMN primary_kitchen_id TEXT REFERENCES kitchens(id) ON DELETE SET NULL;

-- 2. Add created_by and updated_by to mutable data tables (GAP-04)
ALTER TABLE ingredient_items ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ingredient_items ADD COLUMN updated_by TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE recipes ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE recipes ADD COLUMN updated_by TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE shopping_list_items ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE shopping_list_items ADD COLUMN updated_by TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE meal_plans ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE meal_plans ADD COLUMN updated_by TEXT REFERENCES users(id) ON DELETE SET NULL;

-- 3. Add kitchen_id to ingredients and ingredient_groups (GAP-07)
ALTER TABLE ingredients ADD COLUMN kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000';
ALTER TABLE ingredient_groups ADD COLUMN kitchen_id TEXT DEFAULT 'ktc_00000000-0000-4000-8000-000000000000';

ALTER TABLE ingredients ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ingredients ADD COLUMN updated_by TEXT REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE ingredient_groups ADD COLUMN created_by TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ingredient_groups ADD COLUMN updated_by TEXT REFERENCES users(id) ON DELETE SET NULL;

-- 4. Data Backfill
UPDATE ingredients SET kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000' WHERE kitchen_id IS NULL;
UPDATE ingredient_groups SET kitchen_id = 'ktc_00000000-0000-4000-8000-000000000000' WHERE kitchen_id IS NULL;
